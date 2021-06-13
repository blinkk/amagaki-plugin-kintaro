import * as flat from 'flat';
// eslint-disable-next-line node/no-unpublished-import
import * as kintaroPlugin from '../dist';

import {Pod} from '@amagaki/amagaki';

interface KintaroModified {
  created_by: string;
  created_on_millis: string;
  updated_on_millis: string;
}

interface KintaroCollection {
  collection_id: string;
  db_id: string;
  mod_info: KintaroModified;
  published_document_count: 1;
  repo_id: string;
  schema_id: string;
  total_document_count: string;
}

interface KintaroDocument {
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

export default async (pod: Pod) => {
  const kintaro = kintaroPlugin.register(pod, {
    keyFile: 'key.json',
  });
  const client = await kintaro.getClient();

  const items = await client.collections.listCollections({
    repo_id: 'bracket-gmail',
    project_id: 'bracket-gmail',
    use_json: true,
  });

  const collectionIds = items.data.collections.map(item => {
    return item.collection_id;
  });

  console.log(`Processing ${collectionIds.length} collections`);

  for (const collectionId of collectionIds) {
    console.log(`Processing ${collectionId}`);
    const subItems = await client.documents.listDocuments({
      repo_id: 'bracket-gmail',
      project_id: 'bracket-gmail',
      use_json: true,
      collection_id: collectionId,
    });
    if (!subItems.data.documents) {
      continue;
    }
    console.log(`Processing ${subItems.data.documents.length} docs`);
    const documentIds = subItems.data.documents.map(item => {
      return item.document_id;
    });

    for (const documentId of documentIds) {
      const resp = await client.documents.getDocument({
        repo_id: 'bracket-gmail',
        project_id: 'bracket-gmail',
        use_json: true,
        document_id: documentId,
        collection_id: collectionId,
      });
      const data = resp.data as KintaroDocument;
      const baseContent = flat.flatten(JSON.parse(data.content_json));

      const keysToLocales = {};
      for (const [key, val] of Object.entries(baseContent)) {
        keysToLocales[key] = {
          en: val,
        };
      }

      const locales = data.snapshot_locales;
      const resps = await Promise.all(
        locales.map(locale => {
          return client.documents.getDocument({
            repo_id: 'bracket-gmail',
            project_id: 'bracket-gmail',
            use_json: true,
            document_id: documentId,
            collection_id: collectionId,
            locale: locale,
          });
        })
      );

      for (const resp of resps) {
        const data = resp.data as KintaroDocument;
        const localizedContent = flat.flatten(JSON.parse(data.content_json));
        for (const [key, val] of Object.entries(localizedContent)) {
          if (keysToLocales[key]) {
            keysToLocales[key][data.locale] = val;
          } else {
            console.log(`${key} not found.`);
          }
        }
      }

      const patterns = [
        '.label$',
        '.text$',
        '_label$',
        '^headline$',
        '^next$',
        '^previous$',
        '.title$',
      ];

      const isTranslationString = key => {
        return key.match(new RegExp(patterns.join('|')));
      };

      const keysToLocalesToStrings = {};
      for (const [key, val] of Object.entries(keysToLocales)) {
        if (isTranslationString(key)) {
          keysToLocalesToStrings[key] = val;
        } else {
          console.log(`Skipped key -> ${key} (${Object.values(val)[0]})`);
        }
      }

      await kintaroPlugin.saveLocales(pod, keysToLocalesToStrings);
    }
  }
};
