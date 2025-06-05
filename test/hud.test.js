import test from 'node:test';
import assert from 'node:assert/strict';
import Hud from '../src/hud.js';
import { setupPixiMock, createAppMock } from './helpers.js';

setupPixiMock();
const app = createAppMock();
const player = { points: 0, lifes: 1, username: 'u' };
const hud = new Hud({ app, player });

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
