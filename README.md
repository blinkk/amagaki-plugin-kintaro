# amagaki-plugin-kintaro

[![NPM Version][npm-image]][npm-url]
[![GitHub Actions][github-image]][github-url]
[![TypeScript Style Guide][gts-image]][gts-url]

An experimental Amagaki plugin for integration with Kintaro, a headless CMS.

Features include:

- **Dynamic routing**: Create Amagaki routes from Kintaro collections.
- **Translation importing**: Import Kintaro translations to Amagaki locales.

## Usage

1. Install the plugin.

```shell
npm install --save @amagaki/amagaki-plugin-kintaro
```

2. Authenticate. See [authentication](#authentication) for details.

3. Access the plugin in `amagaki.ts`:

```typescript
import {BuilderPlugin, Pod, ServerPlugin} from '@amagaki/amagaki';
import {KintaroPlugin} from '@amagaki/amagaki-plugin-kintaro';

export default (pod: Pod) => {
  const kintaro = KintaroPlugin.register(pod, {
    repoId: '<Kintaro Repo ID>',
    projectId: '<Kintaro Project ID>',
  });

  // Download and bind kintaro collections
  const serverPlugin = pod.plugins.get('ServerPlugin') as ServerPlugin;
  serverPlugin.register(async () => {
    try {
      await kintaro.bindCollection({
        collectionPath: '/content/kintaro/',
      });
    } catch (err) {
      console.warn(`[Kintaro Plugin] Unable to download; ${err}`);
    }
  });

  // Create Amagaki routes from a Kintaro collection.
  const setup = async () => {
    await kintaro.addRouteProvider({
      collectionId: '<Kintaro Collection ID>',
      path: '/posts/${doc.basename}/${doc.fields.slug}/',
      view: '/views/base.njk',
    });
  };

  const builder = pod.plugins.get('BuilderPlugin') as BuilderPlugin;
  builder.addBeforeBuildStep(async () => {
    await setup();
  });

  const server = pod.plugins.get('ServerPlugin') as ServerPlugin;
  server.register(async () => {
    await setup();
  });

  // Import translations to your Amagaki project.
  await kintaro.importTranslations({
    stringKeyPatterns: [
      '_label$',
      '.label$',
      '.text$',
      '.title$',
      '^cta_text_alt$',
      '^description$',
      '^headline$',
      '^next$',
      '^previous$',
      '^site_name$',
      '^title$',
    ],
  });
};
```

[github-image]: https://github.com/blinkk/amagaki-plugin-kintaro/workflows/Run%20tests/badge.svg
[github-url]: https://github.com/blinkk/amagaki-plugin-kintaro/actions
[npm-image]: https://img.shields.io/npm/v/@amagaki/amagaki-plugin-kintaro.svg
[npm-url]: https://npmjs.org/package/@amagaki/amagaki-plugin-kintaro
[gts-image]: https://img.shields.io/badge/code%20style-google-blueviolet.svg
[gts-url]: https://github.com/google/gts

## Features

### Dynamic routing

(To be documented)

- Similar to other tools that integrate with Kintaro, you may use the `?flush`
  query parameter to reset the cache. Add `?flush` to reload Kintaro content
  without restarting the server.

### Translation importing

(To be documented)

## Authentication

There are two ways to authenticate. We recommend using the application default
identity (option 1), but using a service account key file is acceptable as well.

### Option 1: Using application default credentials

1. Install the `gcloud SDK`. [See instructions](https://cloud.google.com/sdk/docs/downloads-interactive).
2. Login and set the application default credentials. Ensure you provide the required scopes.

```bash
gcloud auth application-default login \
  --scopes=openid,https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/kintaro
```

3. That's it! Now, Amagaki will use the signed in Google Account to fetch content.

### Option 2: Using a service account key file

1. Acquire a service account key file. You can do this interactively, from the IAM section of the Google Cloud Console, or you can do this via the `gcloud` CLI (see below for an example).

```
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

2. Ensure `key.json` is added to your `.gitignore`.
3. Ensure Kintaro (workspace) is shared with the service account. Service
   accounts that have never accessed Kintaro before must be whitelisted.
4. Pass `keyFile` to the plugin.

```typescript
KintaroPlugin.register(pod, {
  keyFile: 'key.json',
  repoId: '<Kintaro Repo ID>',
  projectId: '<Kintaro Project ID>',
});
```

## Simulate webhooks

Kintaro does not support webhooks – as a result there is no inbuilt way to run
builds when a workspace is published. As a workaround, you can deploy a Google
Cloud Function to poll Kintaro for the last time a workspace was published. When
a publish event is observed via the polling mechanism, a new cloud build is
submitted.

### Configuration

Ensure the following permissions are configured:

1. The Cloud Function must be able to:
   1. Read Kintaro
   2. Read/write Cloud Datastore
   3. Submit Cloud Builds
2. The Cloud Build must be able to:
   1. Read Kintaro
3. The Cloud Scheduler task must be able to:
   1. Invoke the Cloud Function

### Usage

1. Create a `apps/kintaro-webhook-simulator/index.js`:

```javascript
import {WebhookSimulator} from '@amagaki/amagaki-plugin-kintaro';
import functions from '@google-cloud/functions-framework';

functions.http('syncKintaroRepoStatus', WebhookSimulator.getCloudFunction({
  branchName: '<string>';
  gcpProject: '<string | undefined>';
  kintaroProjectId: '<string | undefined>';
  kintaroRepoId: '<string>';
  buildTriggerId: '<string>';
})
```

2. Create a `apps/kintaro-webhook-simulator/package.json`:

```
{
  "main": "index.js",
  "type": "module",
  "dependencies": {
    "@amagaki/amagaki-plugin-kintaro": "^1.8.1",
    "@google-cloud/functions-framework": "^3.0.0",
  }
}
```

3. Deploy the Cloud Function using the `gcloud` CLI:

```
gcloud functions deploy \
  syncKintaroRepoStatus \
  --runtime nodejs16 \
  --trigger-http
```

4. Create a Cloud Scheduler task that runs the function every minute.

Use the following configuration:

- **Frequency:** `* * * * *`
- **Target type:** `http`
- **URL:** `https://us-central1-<GCP PROJECT ID>.cloudfunctions.net/syncKintaroRepoStatus`
- **HTTP method:** `GET`
- **Auth header:** `Add OIDC token`
