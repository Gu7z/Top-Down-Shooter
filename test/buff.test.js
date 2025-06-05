import test from 'node:test';
import assert from 'node:assert/strict';
import Buff from '../src/buff.js';
import { setupPixiMock, createAppMock } from './helpers.js';

setupPixiMock();

const app = createAppMock();
const hud = { dead: false };
const buff = new Buff({ app, hud });

test('buff creates sprite and container', () => {
  assert.ok(buff.buffContainer);
  assert.ok(buff.buff);
});

buff.destroy();

test('destroy marks buff as destroyed', () => {
  assert.ok(buff.buff.destroyed);
});
