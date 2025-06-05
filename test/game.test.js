import test from 'node:test';
import assert from 'node:assert/strict';
import Game from '../src/game.js';
import { setupPixiMock, createAppMock } from './helpers.js';

setupPixiMock();
const app = createAppMock();
const events = {};
global.window = {
  addEventListener: (e, fn) => { events[e] = fn; },
  removeEventListener() {},
};
const game = new Game({ app, username: 'player' });

test('game creates ticker handler', () => {
  assert.ok(game.ticker !== undefined);
});

test('game event handlers work', () => {
  events.pointerdown();
  events.pointerup();
  events.keydown({ key: 'w' });
  events.keyup({ key: 'w' });
  events.keydown({ key: 'Escape' });
  events.keydown({ key: 'm' });
  app.renderer.view.onmousemove({ clientX: 1, clientY: 2 });
  game.ticker.fn();
  game.player.lifes = 0;
  game.ticker.fn();
  const back = game.hud.hudContainer.children.find(c => c.eventHandlers);
  back.eventHandlers.click();
  assert.ok(true);
});
