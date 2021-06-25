import * as _colors from 'colors';

import {BuilderPlugin, Pod, Route, ServerPlugin} from '@amagaki/amagaki';

// eslint-disable-next-line node/no-unpublished-import
import {KintaroPlugin} from '../dist';

const setupKintaro = async (pod, kintaro) => {
  await kintaro.addRouteProvider({
    collectionId: 'Post',
    path: '/posts/${doc.basename}/${doc.fields.slug}/',
    view: '/views/base.njk',
  });
  const routes = await pod.router.routes();
  console.log('\nRoutes: '.blue);
  routes
    .filter((route: Route) => {
      return route.contentType.startsWith('text');
    })
    .forEach((route: Route) => {
      console.log(`  ${route.urlPath}`);
    });
  console.log('');
};

export default async (pod: Pod) => {
  const kintaro = KintaroPlugin.register(pod, {
    keyFile: 'key.json',
    repoId: 'x-blog',
    projectId: 'x-blog-draft',
  });

  const server = pod.plugins.get('ServerPlugin') as ServerPlugin;
  server.register(async () => {
    await setupKintaro(pod, kintaro);
  });

  const builder = pod.plugins.get('BuilderPlugin') as BuilderPlugin;
  builder.addBeforeBuildStep(async () => {
    await setupKintaro(pod, kintaro);
  });

  // await kintaro.importTranslations({
  //   collectionPath: '/content/kintaro',
  //   stringKeyPatterns: [
  //     '_label$',
  //     '.label$',
  //     '.text$',
  //     '.title$',
  //     '^description$',
  //     '^headline$',
  //     '^next$',
  //     '^previous$',
  //     '^site_name$',
  //     '^title$',
  //     '^cta_text_alt$',
  //   ],
  // });
};
