import express = require('express');

import * as googleAuthPlugin from './google-auth';
import * as translations from './translations';
import * as utils from './utils';

import {KintaroRouteProvider, KintaroRouteProviderOptions} from './router';
import {Pod, ServerPlugin} from '@amagaki/amagaki';

import {Common} from 'googleapis';
import {ImportTranslationsOptions} from './translations';
import {KintaroApiClient} from './interfaces';
import async from 'async';

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
  localeAliases?: Record<string, string>;
}

export class KintaroPlugin {
  authPlugin: googleAuthPlugin.GoogleAuthPlugin;
  pod: Pod;
  projectId?: string;
  repoId: string;
  localeAliases?: Record<string, string>;

  static NUM_CONCURRENT_REQUESTS = 20;

  constructor(pod: Pod, options: KintaroPluginOptions) {
    this.pod = pod;
    this.repoId = options.repoId;
    this.projectId = options.projectId;
    this.authPlugin = googleAuthPlugin.register(pod, {
      keyFile: options.keyFile,
    });
    this.localeAliases = options.localeAliases;
  }

  static register = (pod: Pod, options: KintaroPluginOptions) => {
    // Mimic `?flush` behavior from other tools that integrate with Kintaro.
    const server = pod.plugins.get('ServerPlugin') as ServerPlugin;
    server.register(async (app: express.Express) => {
      app.use('*', async (req, res, next) => {
        if ('flush' in req.query) {
          pod.cache.reset();
        }
        next();
      });
    });
    return new KintaroPlugin(pod, options);
  };

  async getClient(): Promise<KintaroApiClient> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const schema = require('./kintaro-content-v1-rest.json');
    const ep = new Common.Endpoint({
      auth: this.authPlugin.authClient,
    });
    ep.applySchema(ep, schema, schema, ep);
    return (ep as unknown) as KintaroApiClient;
  }

  async addRouteProvider(options: KintaroRouteProviderOptions) {
    const client = await this.getClient();
    const provider = new KintaroRouteProvider(this.pod.router, client, {
      collectionId: options.collectionId,
      depth: options.depth,
      path: options.path,
      projectId: this.projectId,
      repoId: this.repoId,
      view: options.view,
    });
    this.pod.router.addProvider(provider);
    return provider;
  }

  async importTranslations(options?: ImportTranslationsOptions) {
    const client = await this.getClient();
    let collectionIds;

    const stringKeyPatterns = options?.stringKeyPatterns || [];

    if (options?.collectionIds) {
      collectionIds = options?.collectionIds;
    } else {
      const items = await client.collections.listCollections({
        project_id: this.projectId,
        repo_id: this.repoId,
        use_json: true,
        requestBody: {
          include_schema: true,
        },
      });
      collectionIds = items.data.collections.map((item: KintaroCollection) => {
        return item.collection_id;
      });
      // Determine fields to translate from schema.
      if (!options?.stringKeyPatterns) {
        for (const collection of items.data.collections) {
          for (const field of collection.schema.schema_fields) {
            const pattern = `^${field.name}$`;
            if (field.translatable && !stringKeyPatterns.includes(pattern)) {
              stringKeyPatterns.push(pattern);
            }
          }
        }
      }
    }

    console.log(stringKeyPatterns);

    console.log(`Processing ${collectionIds.length} collections`);
    const importedKeysToDocumentResults: translations.ProcessDocumentResult[][] = [];
    await async.mapLimit(
      collectionIds,
      KintaroPlugin.NUM_CONCURRENT_REQUESTS,
      async (collectionId: string) => {
        const result = await translations.processCollection(this.pod, client, {
          repoId: this.repoId,
          projectId: this.projectId,
          collectionId: collectionId,
          importOptions: {
            stringKeyPatterns: stringKeyPatterns,
            collectionPath: options?.collectionPath,
          },
        });
        result && importedKeysToDocumentResults.push(result);
      }
    );

    for (const collectionKeysToDocumentResults of importedKeysToDocumentResults) {
      for (const documentKeysToDocumentResults of collectionKeysToDocumentResults) {
        const keysToLocalesToStrings =
          documentKeysToDocumentResults.keysToLocalesToStrings;
        await utils.saveLocales(this.pod, keysToLocalesToStrings, {
          localeAliases: this.localeAliases,
        });
        if (
          options?.collectionPath &&
          documentKeysToDocumentResults.keysToLocalizableData
        ) {
          const podPath = `${options?.collectionPath}/${documentKeysToDocumentResults.collectionId}/${documentKeysToDocumentResults.documentId}.yaml`;
          await this.saveFileInternal(
            this.pod,
            podPath,
            documentKeysToDocumentResults.keysToLocalizableData
          );
        }
      }
    }
  }

  async saveFileInternal(pod: Pod, podPath: string, content: object) {
    const rawContent = pod.dumpYaml(content);
    const realPath = this.pod.getAbsoluteFilePath(podPath);
    await this.pod.builder.writeFileAsync(realPath, rawContent);
    console.log(`Saved -> ${podPath}`);
  }
}
