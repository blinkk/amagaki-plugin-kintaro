import * as googleAuthPlugin from './google-auth';
import * as translations from './translations';
import * as utils from './utils';

import {Builder, Pod} from '@amagaki/amagaki';
import {Common, google} from 'googleapis';

import {ImportTranslationsOptions} from './translations';
import {KeysToLocalesToStrings} from './utils';
import fs from 'fs';
import fsPath from 'path';
import yaml from 'js-yaml';

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

export interface KintaroModified {
  created_by: string;
  created_on_millis: string;
  updated_on_millis: string;
}

export interface KintaroCollection {
  collection_id: string;
  db_id: string;
  mod_info: KintaroModified;
  published_document_count: 1;
  repo_id: string;
  schema_id: string;
  total_document_count: string;
}

export interface KintaroDocument {
  collection_id: string;
  content_json: string;
  document_id: string;
  document_state: string;
  locale: string;
  metadata_json: string;
  mod_info: KintaroModified;
  nested_metadata_json: string;
  never_published: boolean;
  project_id: string;
  repo_id: string;
  schema_id: string;
  snapshot_locales: string[];
  translation_locales: string[];
  translation_readiness: string;
  translations_up_to_date: boolean;
}

export interface KintaroPluginOptions {
  keyFile?: string;
  repoId: string;
  projectId?: string;
}

export interface KintaroApiClient extends Readonly<Common.Endpoint> {
  collections: any;
  documents: any;
}

export class KintaroPlugin {
  authPlugin: googleAuthPlugin.GoogleAuthPlugin;
  pod: Pod;
  projectId?: string;
  repoId: string;

  static DISCOVERY_URL =
    'https://kintaro-content-server.appspot.com/_ah/api/discovery/v1/apis/content/v1/rest';

  constructor(pod: Pod, options: KintaroPluginOptions) {
    this.pod = pod;
    this.repoId = options.repoId;
    this.projectId = options.repoId;
    this.authPlugin = googleAuthPlugin.register(pod, {
      keyFile: options.keyFile,
    });
  }

  static register = (pod: Pod, options: KintaroPluginOptions) => {
    return new KintaroPlugin(pod, options);
  };

  async getClient(): Promise<KintaroApiClient> {
    return await google.discoverAPI(KintaroPlugin.DISCOVERY_URL, {
      auth: this.authPlugin.authClient,
    });
  }

  async importTranslations(options: ImportTranslationsOptions) {
    const client = await this.getClient();
    const items = await client.collections.listCollections({
      repo_id: this.repoId,
      project_id: this.projectId,
      use_json: true,
    });
    const collectionIds = items.data.collections.map(
      (item: KintaroCollection) => {
        return item.collection_id;
      }
    );

    console.log(`Processing ${collectionIds.length} collections`);
    const importedKeysToLocalesToStrings: KeysToLocalesToStrings[][] = await Promise.all(
      collectionIds.map((collectionId: string) => {
        return translations.processCollection(this.pod, client, {
          repoId: this.repoId,
          projectId: this.projectId,
          collectionId: collectionId,
          importOptions: {
            stringKeyPatterns: options.stringKeyPatterns,
          },
        });
      })
    );

    for (const collectionKeysToLocalesToStrings of importedKeysToLocalesToStrings) {
      for (const documentKeysToLocalesToStrings of collectionKeysToLocalesToStrings) {
        await utils.saveLocales(this.pod, documentKeysToLocalesToStrings);
      }
    }
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
