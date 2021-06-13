import * as googleAuthPlugin from './google-auth';

import {Builder, Pod} from '@amagaki/amagaki';

import {GoogleAuthPluginOptions} from './google-auth';
import fs from 'fs';
import fsPath from 'path';
import {google} from 'googleapis';
import yaml from 'js-yaml';

export * from './utils';

export interface SaveFileOptions {
  podPath: string;
  spreadsheetId: string;
  range: string;
}

export interface BindCollectionOptions {
  collectionPath: string;
  spreadsheetId: string;
  ranges: string[];
}

const DISCOVERY_URL =
  'https://kintaro-content-server.appspot.com/_ah/api/discovery/v1/apis/content/v1/rest';

class KintaroPlugin {
  pod: Pod;
  authPlugin: googleAuthPlugin.GoogleAuthPlugin;

  constructor(pod: Pod, authPluginOptions: GoogleAuthPluginOptions) {
    this.pod = pod;
    this.authPlugin =
      (pod.plugins.get(
        'GoogleAuthPlugin'
      ) as googleAuthPlugin.GoogleAuthPlugin) ||
      googleAuthPlugin.register(pod, authPluginOptions);
    if (!this.authPlugin) {
      throw new Error('Unable to find GoogleAuthPlugin');
    }
  }

  async getClient() {
    return await google.discoverAPI(DISCOVERY_URL, {
      auth: this.authPlugin.authClient,
    });
  }

  async saveFileInternal(podPath: string, content: object) {
    let rawContent: string;
    if (podPath.endsWith('.json')) {
      rawContent = JSON.stringify(content);
    } else if (podPath.endsWith('.yaml')) {
      rawContent = yaml.dump(content);
    } else {
      throw new Error(
        `Cannot save file due to unsupported extenson -> ${podPath}`
      );
    }
    const realPath = this.pod.getAbsoluteFilePath(podPath);
    await this.pod.builder.writeFileAsync(realPath, rawContent);
    console.log(`Saved -> ${podPath}`);
  }

  async bindCollection(options: BindCollectionOptions) {
    const realPath = this.pod.getAbsoluteFilePath(options.collectionPath);
    // `ensureDirectoryExists` is actually `ensureDirectoryExistsForFile`.
    Builder.ensureDirectoryExists(fsPath.join(realPath, '_collection.yaml'));
    fs.readdirSync(realPath).filter(path => {
      return !path.startsWith('_');
    });
  }
}

export type KeysToStrings = Record<string, string>;
export type KeysToLocalesToStrings = Record<string, KeysToStrings>;

export const register = (
  pod: Pod,
  authPluginOptions: GoogleAuthPluginOptions
) => {
  return new KintaroPlugin(pod, authPluginOptions);
};
