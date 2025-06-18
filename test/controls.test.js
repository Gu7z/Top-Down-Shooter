import test from 'node:test';
import assert from 'node:assert/strict';
import Controls from '../src/controls.js';
import { setupPixiMock, createAppMock } from './helpers.js';

setupPixiMock();
const app = createAppMock();
const menu = { show: () => {}, hide: () => {} };
const controls = new Controls({ app, menu });

test('controls container has children', () => {
  assert.ok(controls.controlsContainer.children.length > 0);
});

test('addText adds text object', () => {
  const count = controls.controlsContainer.children.length;
  controls.addText('t', 0, 0);
  assert.strictEqual(controls.controlsContainer.children.length, count + 1);
});
