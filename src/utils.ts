import * as yaml from 'js-yaml';

import {DataType, LocalizableData, Pod} from '@amagaki/amagaki';

export type KeysToStrings = Record<string, string>;
export type KeysToLocalesToStrings = Record<string, KeysToStrings>;
export type KeysToLocalizableData = Record<string, LocalizableData>;

export interface SaveLocalesOptions {
  localeAliases?: Record<string, string>;
}

/**
 * Updates the pod's locale files with translations retrieved from the sheet.
 */
export async function saveLocales(
  pod: Pod,
  keysToLocales: KeysToLocalesToStrings,
  options?: SaveLocalesOptions
) {
  type Catalog = Record<string, string>;
  type LocalesToCatalogs = Record<string, Catalog>;
  const catalogsToMerge: LocalesToCatalogs = {};
  for (const localesToStrings of Object.values(keysToLocales)) {
    const baseString = localesToStrings[pod.defaultLocale.id];
    // No source translation found, skip it.
    if (!baseString) {
      continue;
    }
    for (const [externalLocale, translatedString] of Object.entries(
      localesToStrings
    )) {
      let locale = externalLocale;
      // Convert Kintaro locales to internal locales.
      if (options?.localeAliases && options.localeAliases[locale]) {
        locale = options.localeAliases[locale];
      }
      if (!catalogsToMerge[locale]) {
        catalogsToMerge[locale] = {};
      }
      catalogsToMerge[locale][baseString] = translatedString;
    }
  }
  if (!Object.keys(catalogsToMerge).length) {
    return;
  }
  // TODO: Replace this code once the locale catalog format within Amagaki is
  // stable, and there are built-in methods for updating catalogs and writing
  // translations.
  for (const [localeId, catalog] of Object.entries(catalogsToMerge)) {
    const locale = pod.locale(localeId);
    let contentToWrite;
    if (!pod.fileExists(locale.podPath)) {
      contentToWrite = yaml.dump(
        {translations: catalog},
        {
          schema: pod.yamlSchema,
        }
      );
    } else {
      const existingContent = pod.readYaml(locale.podPath);
      Object.assign(existingContent['translations'], catalog);
      const content = yaml.dump(existingContent, {
        schema: pod.yamlSchema,
      });
      contentToWrite = content;
    }
    await pod.builder.writeFileAsync(
      pod.getAbsoluteFilePath(locale.podPath),
      contentToWrite
    );
  }

  console.log(
    `Saved -> /locales/{${Object.keys(catalogsToMerge).sort().join('|')}}.yaml`
  );
}

export const isDeepDocument = (data: any) => {
  return Boolean(
    data.collection_id &&
      data.document_content &&
      data.document_id &&
      data.repo_id
  );
};

export function resolveDepth(data: any): any {
  if (!data) {
    return data;
  }

  if (DataType.isObject(data)) {
    if (isDeepDocument(data)) {
      return data.document_content;
    }
    const newData: any = {};
    for (const key of Object.keys(data)) {
      newData[key] = resolveDepth(data[key]);
    }
    return newData;
  }

  if (DataType.isArray(data)) {
    const newData = [];
    for (const item of data) {
      newData.push(resolveDepth(item));
    }
    return newData;
  }

  return data;
}
