import {CloudBuildClient} from '@google-cloud/cloudbuild';
import {Datastore} from '@google-cloud/datastore';
import {KintaroPlugin} from '.';
import {ModInfo} from '.';
import {Pod} from '@amagaki/amagaki';
import functions from '@google-cloud/functions-framework';
import e from 'express';

export interface WebhookSimulatorOptions {
  branchName?: string;
  gcpProject?: string;
  kintaroProjectId?: string;
  kintaroRepoId: string;
  buildTriggerId: string;
}

export class WebhookSimulator {
  branchName: string;
  gcpProject: string | undefined;
  kintaroProjectId: string | undefined;
  kintaroRepoId: string;
  buildTriggerId: string;

  constructor(options: WebhookSimulatorOptions) {
    this.branchName = options.branchName ?? 'main';
    this.gcpProject = options.gcpProject ?? process.env.GCP_PROJECT;
    this.kintaroProjectId = options.kintaroProjectId ?? undefined;
    this.kintaroRepoId = options.kintaroRepoId;
    this.buildTriggerId = options.buildTriggerId;
  }

  static getCloudFunction(options: WebhookSimulatorOptions) {
    const simulator = new WebhookSimulator(options);
    return simulator.syncKintaroRepoStatus.bind(simulator);
  }

  async syncKintaroRepoStatus(req: functions.Request, res: functions.Response) {
    const pod = new Pod('.');
    const plugin = KintaroPlugin.register(pod, {
      repoId: this.kintaroRepoId!,
      projectId: this.kintaroProjectId,
    });
    const client = await plugin.getClient();
    const resp = await client.repos.getRepo({
      repo_id: plugin.repoId,
    });
    const publishModInfo = resp.data.publish_mod_info as ModInfo;
    console.log('Successfully fetched repo from Kintaro.');

    let projectModInfo;
    if (this.kintaroProjectId) {
      const projectResp = await client.projects.getProject({
        project_id: plugin.projectId,
        repo_id: plugin.repoId,
      });
      projectModInfo = projectResp.data.mod_info as ModInfo;
      console.log('Successfully fetched project from Kintaro.');
    }

    const datastore = new Datastore({
      projectId: this.gcpProject,
    });
    const key = datastore.key(['KintaroRepoStatus', plugin.repoId]);
    const [ent] = await datastore.get(key);

    if (
      !ent ||
      ent?.publishModInfo.updated_on_millis >=
        publishModInfo.updated_on_millis ||
      (projectModInfo &&
        ent?.projectModInfo?.updated_on_millis >=
          projectModInfo?.updated_on_millis)
    ) {
      let message;
      if (projectModInfo) {
        message = `No changes; last update was: ${publishModInfo.updated_on_millis} (publish) and ${projectModInfo?.updated_on_millis} (project).`;
      } else {
        message = `No changes; last update was: ${publishModInfo.updated_on_millis}.`;
      }
      console.log(message);
      res.send(message);
      return;
    }

    // Submit build.
    const cb = new CloudBuildClient();
    await cb.runBuildTrigger({
      projectId: this.gcpProject,
      triggerId: this.buildTriggerId,
      source: {
        projectId: this.gcpProject,
        dir: './',
        branchName: this.branchName,
      },
    });
    console.log('Changes found, build started.');

    await datastore.save({
      key: key,
      data: {
        publishModInfo: publishModInfo,
        projectModInfo: projectModInfo,
      },
    });

    console.log(
      `Saved publishModInfo, last update was: ${publishModInfo.updated_on_millis}.`
    );
    res.send(
      `Build started. Saved publishModInfo, last update was: ${publishModInfo.updated_on_millis}.`
    );
  }
}
