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

test('wheel scrolling updates the controls list position when content overflows', () => {
  const localApp = createAppMock();
  const localControls = new Controls({ app: localApp, menu: { show() {}, hide() {} } });
  const listContainer = localControls.controlsContainer.children.find((child) => Array.isArray(child.children));
  const initialY = listContainer.y ?? 0;

  localApp.view.eventListeners.wheel({ deltaY: 120 });

  assert.notEqual(listContainer.y, initialY);
});
