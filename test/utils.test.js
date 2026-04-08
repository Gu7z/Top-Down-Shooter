import test from 'node:test';
import assert from 'node:assert/strict';
import generateRandom from '../src/utils/generate_random.js';

import getUrl from '../src/utils/get_url.js';
import sendScore from '../src/utils/send_score.js';

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

test('getUrl returns dev when MODE is not production', () => {
  assert.strictEqual(getUrl({
    SNOWPACK_PUBLIC_API_URL_PROD: 'prod-url',
    SNOWPACK_PUBLIC_API_URL_DEV: 'dev-url',
    MODE: 'development',
  }), 'dev-url');
});

test('getUrl handles missing global env by returning undefined', () => {
  const previousEnv = global.__SNOWPACK_ENV__;
  delete global.__SNOWPACK_ENV__;

  try {
    assert.equal(getUrl(), undefined);
  } finally {
    global.__SNOWPACK_ENV__ = previousEnv;
  }
});

test('sendScore performs fetch', async () => {
  let called = false;
  global.fetch = async () => { called = true; return { json: async () => ({}) } };
  await sendScore({ points:1 });
  assert.ok(called);
});
