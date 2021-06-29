import * as async from 'async';

import {KeysToLocalesToStrings, KeysToLocalizableData} from './utils';
import {KintaroDocument, KintaroPlugin} from './kintaro';
import {LocalizableData, Pod} from '@amagaki/amagaki';

import {KintaroApiClient} from './interfaces';
import flat from 'flat';

export type FlattenedKintaroDocument = Record<string, string>;

export interface ImportTranslationsOptions {
  collectionPath?: string;
  collectionIds?: string[];
  stringKeyPatterns?: string[];
}

export interface ProcessCollectionOptions {
  repoId: string;
  projectId?: string;
  collectionId: string;
  importOptions: ImportTranslationsOptions;
}

export interface ProcessDocumentOptions {
  repoId: string;
  projectId?: string;
  collectionId: string;
  documentId: string;
  importOptions: ImportTranslationsOptions;
}

export interface ProcessDocumentResult {
  collectionId: string;
  documentId: string;
  keysToLocalesToStrings: KeysToLocalesToStrings;
  keysToLocalizableData: Record<string, LocalizableData>;
}

export const processCollection = async (
  pod: Pod,
  client: KintaroApiClient,
  options: ProcessCollectionOptions
) => {
  console.log(`Processing ${options.collectionId}`);
  const subItems = await client.documents.listDocumentSummaries({
    collection_id: options.collectionId,
    project_id: options.projectId,
    repo_id: options.repoId,
    use_json: true,
  });
  if (!subItems.data.documents) {
    return;
  }
  console.log(`Processing ${subItems.data.documents.length} docs`);
  const documentIds = subItems.data.documents.map((item: KintaroDocument) => {
    return item.document_id;
  });

  const results: ProcessDocumentResult[] = [];
  await async.mapLimit(
    documentIds,
    KintaroPlugin.NUM_CONCURRENT_REQUESTS,
    async (documentId: string) => {
      results.push(
        await processDocument(pod, client, {
          collectionId: options.collectionId,
          documentId: documentId,
          importOptions: options.importOptions,
          projectId: options.projectId,
          repoId: options.repoId,
        })
      );
    }
  );
  return results;
};

export const processDocument = async (
  pod: Pod,
  client: KintaroApiClient,
  options: ProcessDocumentOptions
): Promise<ProcessDocumentResult> => {
  const resp = await client.documents.getDocument({
    repo_id: options.repoId,
    project_id: options.projectId,
    use_json: true,
    document_id: options.documentId,
    collection_id: options.collectionId,
  });
  const data = resp.data as KintaroDocument;
  const baseContent = flat.flatten(
    JSON.parse(data.content_json)
  ) as FlattenedKintaroDocument;

  const keysToLocales: KeysToLocalesToStrings = {};
  for (const [key, val] of Object.entries(baseContent)) {
    keysToLocales[key] = {
      en: val,
    };
  }

  const locales = data.snapshot_locales;

  const resps: any = [];
  await async.mapLimit(
    locales,
    KintaroPlugin.NUM_CONCURRENT_REQUESTS,
    async (locale: string) => {
      resps.push(
        await client.documents.getDocument({
          repo_id: options.repoId,
          project_id: options.projectId,
          use_json: true,
          document_id: options.documentId,
          collection_id: options.collectionId,
          locale: locale,
        })
      );
    }
  );

  for (const resp of resps) {
    const data = resp.data as KintaroDocument;
    const localizedContent = flat.flatten(
      JSON.parse(data.content_json)
    ) as FlattenedKintaroDocument;
    for (const [key, val] of Object.entries(localizedContent)) {
      if (keysToLocales[key]) {
        keysToLocales[key][data.locale] = val;
      } else {
        console.log(`${key} not found.`);
      }
    }
  }

  const isTranslationString = (key: string) => {
    if (options.importOptions.stringKeyPatterns) {
      return key.match(
        new RegExp(options.importOptions.stringKeyPatterns.join('|'))
      );
    }
    return false;
  };

  const keysToLocalesToStrings: KeysToLocalesToStrings = {};
  const keysToLocalizableData: KeysToLocalizableData = {};
  for (const [key, val] of Object.entries(keysToLocales)) {
    if (isTranslationString(key)) {
      keysToLocalesToStrings[key] = val;
    } else {
      if (options.collectionId) {
        const localizableData = new LocalizableData(pod, val);
        keysToLocalizableData[key] = localizableData;
      } else {
        console.log(`Skipped key -> ${key} (${Object.values(val)[0]})`);
      }
    }
  }

  return {
    documentId: options.documentId,
    collectionId: options.collectionId,
    keysToLocalesToStrings: keysToLocalesToStrings,
    keysToLocalizableData: keysToLocalizableData,
  };
};
