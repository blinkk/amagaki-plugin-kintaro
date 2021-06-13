import * as yaml from 'js-yaml';

import {Pod} from '@amagaki/amagaki';

export type KeysToStrings = Record<string, string>;
export type KeysToLocalesToStrings = Record<string, KeysToStrings>;

/**
 * Updates the pod's locale files with translations retrieved from the sheet.
 */
export async function saveLocales(
  pod: Pod,
  keysToLocales: KeysToLocalesToStrings
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
    for (const [locale, translatedString] of Object.entries(localesToStrings)) {
      if (!catalogsToMerge[locale]) {
        catalogsToMerge[locale] = {};
      }
      catalogsToMerge[locale][baseString] = translatedString;
    }
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
    console.log(`Saved -> ${locale.podPath}`);
  }
}
