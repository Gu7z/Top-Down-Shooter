import test from 'node:test';
import assert from 'node:assert/strict';
import Hud from '../src/hud.js';
import { setupPixiMock, createAppMock } from './helpers.js';

setupPixiMock();
const app = createAppMock();
const player = { points: 0, lifes: 1, username: 'u' };
const hud = new Hud({ app, player });
global.localStorage = { getItem(){}, setItem(){} };
global.fetch = async () => ({ json: async () => ({}) });
global.__SNOWPACK_ENV__ = { SNOWPACK_PUBLIC_API_URL_PROD:'', SNOWPACK_PUBLIC_API_URL_DEV:'', MODE:'production' };

test('hud container initialized', () => {
  assert.ok(hud.hudContainer);
});

test('showPaused toggles visibility', () => {
  hud.showPaused = true;
  assert.strictEqual(hud.textPaused.visible, true);
});

test('endgameCheck adds back button', () => {
  player.lifes = 0;
  hud.endgameCheck(() => {});
  const back = hud.hudContainer.children.find(c => c.eventHandlers);
  back.eventHandlers.click();
  assert.ok(back);
});
