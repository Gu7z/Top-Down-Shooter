import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('../snowpack.config.cjs');

test('snowpack disables sourcemaps in this project to avoid dev-server map crashes', () => {
  assert.equal(config.buildOptions?.sourcemap, false);
  assert.equal(config.optimize?.sourcemap, false);
});
