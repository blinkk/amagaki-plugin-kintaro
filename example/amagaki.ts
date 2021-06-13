// eslint-disable-next-line node/no-unpublished-import
import {KintaroPlugin} from '../dist';
import {Pod} from '@amagaki/amagaki';

export default async (pod: Pod) => {
  const kintaro = KintaroPlugin.register(pod, {
    keyFile: 'key.json',
    repoId: 'bracket-gmail',
    projectId: 'bracket-gmail',
  });
  await kintaro.importTranslations({
    stringKeyPatterns: [
      '_label$',
      '.label$',
      '.text$',
      '.title$',
      '^description$',
      '^headline$',
      '^next$',
      '^previous$',
      '^site_name$',
      '^title$',
      '^cta_text_alt$',
    ],
  });
};
