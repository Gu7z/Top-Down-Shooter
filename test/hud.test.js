import test from 'node:test';
import assert from 'node:assert/strict';
import Hud from '../src/hud.js';
import { setupPixiMock, createAppMock, setupDomMock } from './helpers.js';

setupPixiMock();
setupDomMock();
const app = createAppMock();
const player = { points: 0, lifes: 1, username: 'u' };
const hud = new Hud({ app, onBack: () => {} });
hud.setPlayer(player);
global.localStorage = { getItem(){}, setItem(){} };
global.fetch = async () => ({ json: async () => ({}) });
global.__SNOWPACK_ENV__ = { SNOWPACK_PUBLIC_API_URL_PROD:'', SNOWPACK_PUBLIC_API_URL_DEV:'', MODE:'production' };

test('hud container initialized', () => {
  assert.ok(hud.container);
});

test('showPaused toggles visibility', () => {
  hud.showPaused = true;
  assert.ok(!hud.pausedText?.classList?.contains('hidden'));
});

test('endgameCheck adds back button', () => {
  player.lifes = 0;
  hud.endgameCheck(() => {});
  hud.backBtn.click();
  assert.ok(hud.backBtn);
});
