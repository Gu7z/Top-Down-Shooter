import test from 'node:test';
import assert from 'node:assert/strict';
import Game from '../src/game.js';
import { setupPixiMock, createAppMock } from './helpers.js';

setupPixiMock();
const app = { ...createAppMock(), render() {} };
const events = {};
global.window = {
  addEventListener: (e, fn) => { events[e] = fn; },
  removeEventListener() {},
};
global.localStorage = { getItem(){}, setItem(){} };
global.__SNOWPACK_ENV__ = { SNOWPACK_PUBLIC_API_URL_PROD:'', SNOWPACK_PUBLIC_API_URL_DEV:'', MODE:'production' };
global.fetch = async () => ({ json: async () => ({}) });
const game = new Game({ app, username: 'player' });
game.player.player.getBounds = () => ({ x:0, y:0, width:40, height:40 });
game.buff.buff.getBounds = () => ({ x:0, y:0, width:40, height:40 });

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
  app.ticker.fn();
  game.player.lifes = 0;
  app.ticker.fn();
  const back = game.hud.hudContainer.children.find(c => c.eventHandlers);
  back.eventHandlers.click();
  assert.ok(true);
});
