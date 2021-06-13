import * as googleAuthPlugin from './google-auth';

import {Builder, Pod} from '@amagaki/amagaki';
import {google, sheets_v4} from 'googleapis';

import {GoogleAuthPluginOptions} from './google-auth';
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

export type GoogleSheetsValuesReponse = string[][];

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
    // const authClient = this.authPlugin.authClient;
    // return google.sheets({version: 'v4', auth: authClient});
  }

  fomatGoogleSheetsUrl(
    params: sheets_v4.Params$Resource$Spreadsheets$Values$Get
  ) {
    return `https://docs.google.com/spreadsheets/d/${params.spreadsheetId}/edit#range=${params.range}`;
  }

  async getValuesResponse(
    params: sheets_v4.Params$Resource$Spreadsheets$Values$Get
  ) {
    console.log(
      `Fetching Google Sheet -> ${this.fomatGoogleSheetsUrl(params)}`
    );
    // const sheets = this.getClient();
    return [];
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

  async saveFile(options: SaveFileOptions) {
    // const podPath = options.podPath;
    const responseValues = await this.getValuesResponse({
      spreadsheetId: options.spreadsheetId,
      range: options.range,
    });
    if (!responseValues) {
      throw new Error(
        `Nothing found in sheet -> ${options.spreadsheetId} with range "${options.range}"`
      );
    }
    // const values = await transform(this.pod, responseValues, options.transform);
    // await this.saveFileInternal(podPath, values);
  }

  async bindCollection(options: BindCollectionOptions) {
    const realPath = this.pod.getAbsoluteFilePath(options.collectionPath);
    // `ensureDirectoryExists` is actually `ensureDirectoryExistsForFile`.
    Builder.ensureDirectoryExists(fsPath.join(realPath, '_collection.yaml'));
    fs.readdirSync(realPath).filter(path => {
      return !path.startsWith('_');
    });
    // const newFiles: string[] = [];
    // const sheets = this.getClient();
    // const valueRanges: string[] = [];
    // if (!valueRanges) {
    //   throw new Error(
    //     `Nothing found from sheets for ${
    //       options.spreadsheetId
    //     } with ranges: ${options.ranges.join(', ')}`
    //   );
    // }
    // for (const valueRange of valueRanges) {
    //   if (!valueRange.range || !valueRange.values) {
    //     continue;
    //   }
    //   // Range can be formatted like: `homepage!A1:Z999`
    //   const basename = `${valueRange.range
    //     .split('!')[0]
    //     .replace(/'/gi, '')
    //     .replace(/ /gi, '-')}.yaml`;
    //   const podPath = fsPath.join(options.collectionPath, basename);
    //   const values = await transform(
    //     this.pod,
    //     valueRange.values,
    //     options.transform
    //   );
    //   newFiles.push(basename);
    //   await this.saveFileInternal(podPath, values);
    // }
    // const diff = existingFiles.filter(basename => !newFiles.includes(basename));
    // for (const basename of diff) {
    //   const absPath = fsPath.join(realPath, basename);
    //   const podPath = fsPath.join(options.collectionPath, basename);
    //   fs.unlinkSync(absPath);
    //   console.log(`Deleted -> ${podPath}`);
    // }
  }
}

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

export const register = (
  pod: Pod,
  authPluginOptions: GoogleAuthPluginOptions
) => {
  return new KintaroPlugin(pod, authPluginOptions);
};
