import test from 'node:test';
import assert from 'node:assert/strict';
import Controls from '../src/controls.js';
import { setupPixiMock, createAppMock } from './helpers.js';

setupPixiMock();
const app = createAppMock();
let menuShown = false;
const menu = { show: () => { menuShown = true; }, hide: () => {} };
const controls = new Controls({ app, menu });

test('controls container has children', () => {
  assert.ok(controls.controlsContainer.children.length > 0);
});

test('back button returns to menu', () => {
  const buttons = controls.controlsContainer.children.filter(c => c.eventHandlers?.pointerdown);
  const back = buttons[buttons.length - 1];
  back.eventHandlers.pointerdown();
  assert.strictEqual(menuShown, true);
});
