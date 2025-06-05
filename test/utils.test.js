import test from 'node:test';
import assert from 'node:assert/strict';
import generateRandom from '../src/utils/generate_random.js';

import getUrl from '../src/utils/get_url.js';

global.__SNOWPACK_ENV__ = {
  SNOWPACK_PUBLIC_API_URL_PROD: 'prod-url',
  SNOWPACK_PUBLIC_API_URL_DEV: 'dev-url',
  MODE: 'production'
};

test('generateRandom returns integer within range', () => {
  const val = generateRandom(0, 10);
  assert.ok(val >= 0 && val <= 10);
});

test('getUrl returns prod when MODE=production', () => {
  assert.strictEqual(getUrl(), 'prod-url');
});
