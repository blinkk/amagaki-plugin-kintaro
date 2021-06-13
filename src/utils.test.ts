import * as utils from './utils';

import {ExecutionContext} from 'ava';
import test from 'ava';

test('isDeepDocument', (t: ExecutionContext) => {
  t.true(
    utils.isDeepDocument({
      collection_id: 'a',
      document_id: '123',
      document_content: {
        title: 'Hello World',
      },
      repo_id: 'b',
    })
  );
  t.false(
    utils.isDeepDocument({
      foo: 'bar',
    })
  );
});
