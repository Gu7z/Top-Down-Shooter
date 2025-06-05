import test from 'node:test';
import assert from 'node:assert/strict';
import Buff from '../src/buff.js';
import { setupPixiMock, createAppMock } from './helpers.js';

setupPixiMock();

const app = createAppMock();
const hud = { dead: false };
const buff = new Buff({ app, hud });
const player = {
  player: new PIXI.Sprite(),
  shooting: { setFireVelocity: 1 },
};
player.player.width = 40;
player.player.height = 40;
player.player.getBounds = () => ({ x: 0, y: 0, width: 40, height: 40 });
buff.buff.getBounds = () => ({ x: 0, y: 0, width: 40, height: 40 });

test('buff creates sprite and container', () => {
  assert.ok(buff.buffContainer);
  assert.ok(buff.buff);
});

buff.destroy();

test('destroy marks buff as destroyed', () => {
  assert.ok(buff.buff.destroyed);
});

test('buff collision updates player', () => {
  buff.createBuff({ app });
  buff.buff.getBounds = () => ({ x: 0, y: 0, width: 40, height: 40 });
  buff.update(player);
  assert.strictEqual(player.shooting.setFireVelocity, 2);
});

test('timers trigger destroy', () => {
  const cbs = [];
  const appImmediate = {
    ...createAppMock(),
    setInterval(fn) { cbs.push(fn); return { clear() {} }; },
    setTimeout(fn) { fn(); return { clear() {} }; }
  };
  const b = new Buff({ app: appImmediate, hud });
  cbs[0]();
  assert.ok(b.buff.destroyed);
});
