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
  const timeouts = [];
  const appTimed = {
    ...createAppMock(),
    setTimeout(fn, seconds) {
      const timer = {
        fn,
        seconds,
        cleared: false,
        clear() { this.cleared = true; },
      };
      timeouts.push(timer);
      return timer;
    }
  };
  const b = new Buff({ app: appTimed, hud });
  const firstBuff = b.buff;

  assert.equal(timeouts[0].seconds, 7);
  assert.equal(timeouts[1].seconds, 20);

  timeouts[0].fn();
  assert.ok(firstBuff.destroyed);

  timeouts[1].fn();
  assert.notEqual(b.buff, firstBuff);
  assert.equal(timeouts.length, 4);
});

test('dispose clears pending buff timers', () => {
  const timers = [];
  const appTimed = {
    ...createAppMock(),
    setTimeout(fn, seconds) {
      const timer = {
        fn,
        seconds,
        cleared: false,
        clear() { this.cleared = true; },
      };
      timers.push(timer);
      return timer;
    }
  };
  const b = new Buff({ app: appTimed, hud });

  b.dispose();

  assert.equal(timers.every((timer) => timer.cleared), true);
});

test('buff applies nearest scaling and resets fire velocity after the timed bonus', () => {
  const originalTextureFrom = PIXI.Texture.from;
  const timeouts = [];
  const appTimed = {
    ...createAppMock(),
    setTimeout(fn, seconds) {
      const timer = {
        fn,
        seconds,
        cleared: false,
        clear() { this.cleared = true; },
      };
      timeouts.push(timer);
      return timer;
    }
  };
  PIXI.Texture.from = () => ({ baseTexture: {} });

  try {
    const localBuff = new Buff({ app: appTimed, hud });
    const localPlayer = {
      shooting: { setFireVelocity: 0 },
    };

    assert.equal(localBuff.buff.texture.baseTexture.scaleMode, PIXI.SCALE_MODES.NEAREST);

    localBuff.get(localPlayer);
    assert.equal(localPlayer.shooting.setFireVelocity, 2);
    assert.equal(timeouts.at(-1).seconds, 4);

    timeouts.at(-1).fn();
    assert.equal(localPlayer.shooting.setFireVelocity, 1);
  } finally {
    PIXI.Texture.from = originalTextureFrom;
  }
});
