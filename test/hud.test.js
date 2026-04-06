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

test('pause and end glow layers start hidden', () => {
  assert.strictEqual(hud.textPaused.visible, false);
  assert.strictEqual(hud.textPaused.glowHalo.visible, false);
  assert.strictEqual(hud.textEnd.visible, false);
  assert.strictEqual(hud.textEnd.glowHalo.visible, false);
});

test('showPaused toggles visibility', () => {
  hud.showPaused = true;
  assert.strictEqual(hud.textPaused.visible, true);
  assert.strictEqual(hud.textPaused.glowHalo.visible, true);
  assert.strictEqual(hud.pauseSettingsBtn.bg.visible, true);
  assert.strictEqual(hud.pauseEndRunBtn.bg.visible, true);
  hud.showPaused = false;
  assert.strictEqual(hud.textPaused.visible, false);
  assert.strictEqual(hud.textPaused.glowHalo.visible, false);
  assert.strictEqual(hud.pauseSettingsBtn.bg.visible, false);
  assert.strictEqual(hud.pauseEndRunBtn.bg.visible, false);
});

test('pause end run button calls configured callback', () => {
  let ended = false;
  hud.endRun = () => { ended = true; };
  hud.pauseEndRunBtn.bg.eventHandlers.pointerdown();
  assert.strictEqual(ended, true);
});

test('endgameCheck adds back button', () => {
  player.lifes = 0;
  hud.endgameCheck(() => {});
  const buttons = hud.hudContainer.children.filter(c => c.eventHandlers?.pointerdown);
  const back = buttons[buttons.length - 1];
  back.eventHandlers.pointerdown();
  assert.ok(back);
});
