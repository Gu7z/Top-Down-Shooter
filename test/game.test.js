import test from 'node:test';
import assert from 'node:assert/strict';
import Game from '../src/game.js';
import { setupPixiMock, createAppMock } from './helpers.js';

setupPixiMock();
const app = { ...createAppMock(), render() {} };
const events = {};
const addEvent = (eventName, handler) => {
  if (!events[eventName]) events[eventName] = [];
  events[eventName].push(handler);
};
const removeEvent = (eventName, handler) => {
  events[eventName] = (events[eventName] || []).filter((h) => h !== handler);
};
const triggerEvent = (eventName, payload) => {
  (events[eventName] || []).forEach((handler) => handler(payload));
};

global.window = {
  addEventListener: addEvent,
  removeEventListener: removeEvent,
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
  triggerEvent('pointerdown');
  triggerEvent('pointerup');
  triggerEvent('keydown', { key: 'w' });
  triggerEvent('keyup', { key: 'w' });
  triggerEvent('keydown', { key: 'Escape' });
  triggerEvent('keydown', { key: 'm' });
  app.renderer.view.onmousemove({ clientX: 1, clientY: 2 });
  app.ticker.fn();
  game.player.lifes = 0;
  app.ticker.fn();
  const back = game.hud.hudContainer.children.find(c => c.eventHandlers);
  back.eventHandlers.click();
  assert.ok(true);
});

test('clear remove ticker and listeners', () => {
  const anotherGame = new Game({ app, username: 'player-2' });
  const keydownListenersBefore = events.keydown.length;
  anotherGame.clear();

  assert.equal(app.ticker.removedFn, anotherGame.tick);
  assert.equal(app.renderer.view.onmousemove, null);
  assert.equal(events.keydown.length, keydownListenersBefore - 2);
  assert.equal(events.keyup.length, 0);
  assert.equal(events.pointerdown.length, 0);
  assert.equal(events.pointerup.length, 0);
});
