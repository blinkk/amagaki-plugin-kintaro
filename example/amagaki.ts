// eslint-disable-next-line node/no-unpublished-import
import * as kintaroPlugin from '../dist';

import {Pod} from '@amagaki/amagaki';

export default async (pod: Pod) => {
  const kintaro = kintaroPlugin.register(pod, {
    keyFile: 'key.json',
  });
  const client = await kintaro.getClient();
  // @ts-ignore
  const resp = await client.documents.getDocument({
    repo_id: 'bracket-gmail',
    project_id: 'bracket-gmail',
    use_json: true,
    document_id: '6189338546143232',
    collection_id: 'CarouselContent',
    locale: 'ja_ALL',
  });
  console.log(resp);
  // console.log(JSON.parse(resp.body));
};
