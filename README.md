# amagaki-plugin-kintaro

[![NPM Version][npm-image]][npm-url]
[![GitHub Actions][github-image]][github-url]
[![TypeScript Style Guide][gts-image]][gts-url]

An Amagaki plugin for integration with Kintaro, a headless CMS service.

Features include:

- **Dynamic routing**: Create Amagaki routes from Kintaro collections
- **Translation importing**: Import Kintaro translations to Amagaki locales

## Usage

1. Install the plugin.

```shell
npm install --save @amagaki/amagaki-plugin-kintaro
```

2. Acquire a service account key file. You can do this interactively, from the
   IAM section of the Google Cloud Console, or you can do this via the `gcloud`
   CLI (see below for an example).

```shell
PROJECT=<Google Cloud Project ID>

# Create a service account named `amagaki`.
gcloud --project=$PROJECT \
  iam service-accounts create \
  amagaki

# Create a JSON key and download it to `key.json`.
gcloud --project=$PROJECT \
  iam service-accounts keys create \
  --iam-account amagaki@$PROJECT.iam.gserviceaccount.com \
  key.json
```

2. Ensure the Kintaro site is shared with the service account.

3. Ensure `key.json` is added to your `.gitignore`.

[github-image]: https://github.com/blinkk/amagaki-plugin-kintaro/workflows/Run%20tests/badge.svg
[github-url]: https://github.com/blinkk/amagaki-plugin-kintaro/actions
[npm-image]: https://img.shields.io/npm/v/@amagaki/amagaki-plugin-kintaro.svg
[npm-url]: https://npmjs.org/package/@amagaki/amagaki-plugin-kintaro
[gts-image]: https://img.shields.io/badge/code%20style-google-blueviolet.svg
[gts-url]: https://github.com/google/gts