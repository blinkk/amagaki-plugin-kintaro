import * as flat from 'flat';

import {KintaroApiClient, KintaroDocument} from './kintaro';

import {KeysToLocalesToStrings} from './utils';
import {Pod} from '@amagaki/amagaki';

export type FlattenedKintaroDocument = Record<string, string>;

export interface ImportTranslationsOptions {
  stringKeyPatterns: string[];
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

export const processCollection = async (
  pod: Pod,
  client: KintaroApiClient,
  options: ProcessCollectionOptions
) => {
  console.log(`Processing ${options.collectionId}`);
  const subItems = await client.documents.listDocuments({
    repo_id: options.repoId,
    project_id: options.projectId,
    use_json: true,
    collection_id: options.collectionId,
  });
  if (!subItems.data.documents) {
    return;
  }
  console.log(`Processing ${subItems.data.documents.length} docs`);
  const documentIds = subItems.data.documents.map((item: KintaroDocument) => {
    return item.document_id;
  });

  return await Promise.all(
    documentIds.map((documentId: string) => {
      return processDocument(pod, client, {
        collectionId: options.collectionId,
        documentId: documentId,
        importOptions: options.importOptions,
        projectId: options.projectId,
        repoId: options.repoId,
      });
    })
  );
};

export const processDocument = async (
  pod: Pod,
  client: KintaroApiClient,
  options: ProcessDocumentOptions
) => {
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
  const resps = await Promise.all(
    locales.map(locale => {
      return client.documents.getDocument({
        repo_id: options.repoId,
        project_id: options.projectId,
        use_json: true,
        document_id: options.documentId,
        collection_id: options.collectionId,
        locale: locale,
      });
    })
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
    return key.match(
      new RegExp(options.importOptions.stringKeyPatterns.join('|'))
    );
  };

  const keysToLocalesToStrings: KeysToLocalesToStrings = {};
  for (const [key, val] of Object.entries(keysToLocales)) {
    if (isTranslationString(key)) {
      keysToLocalesToStrings[key] = val;
    } else {
      console.log(`Skipped key -> ${key} (${Object.values(val)[0]})`);
    }
  }

  return keysToLocalesToStrings;
};
