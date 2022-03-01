import {CloudBuildClient} from '@google-cloud/cloudbuild';
import {Datastore} from '@google-cloud/datastore';
import {KintaroPlugin} from '.';
import {ModInfo} from '.';
import {Pod} from '@amagaki/amagaki';
import functions from '@google-cloud/functions-framework';

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
    return simulator.syncKintaroRepoStatus;
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
    console.log('Successfully fetched from Kintaro.');

    const datastore = new Datastore({
      projectId: this.gcpProject,
    });
    const key = datastore.key(['KintaroRepoStatus', plugin.repoId]);
    const [ent] = await datastore.get(key);

    if (
      ent?.publishModInfo.updated_on_millis >= publishModInfo.updated_on_millis
    ) {
      const message = `No changes; last update was: ${publishModInfo.updated_on_millis}.`;
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
