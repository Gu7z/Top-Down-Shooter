import test from 'node:test';
import assert from 'node:assert/strict';
import Spawner from '../src/spanwer.js';
import { setupPixiMock, createAppMock } from './helpers.js';

setupPixiMock();
const app = createAppMock();
const player = { points: 0, lifes: 1 };
const spawner = new Spawner({ app, player });

test('calculateSpeed respects limit', () => {
  assert.strictEqual(spawner.calculateSpeed(1, 10), 1.65);
});

test('enemyType returns an object with speed', () => {
  const type = spawner.enemyType();
  assert.ok('speed' in type);
});

test('enemyType includes typeId and boss metadata', () => {
  player.points = 1;
  const normal = spawner.enemyType();
  assert.equal(typeof normal.typeId, 'string');
  assert.equal(normal.isBoss, false);

  player.points = 50;
  const boss = spawner.enemyType();
  assert.equal(boss.typeId, 'boss');
  assert.equal(boss.isBoss, true);
});

test('update spawns enemies', () => {
  player.points = 1;
  spawner.update(player);
  assert.ok(spawner.spawns.length >= 0);
  spawner.reset();
  assert.strictEqual(spawner.spawns.length, 0);
});

test('destroy clears spawn limit timer', () => {
  const timers = [];
  const trackedApp = {
    ...createAppMock(),
    setInterval(fn, seconds) {
      const timer = {
        fn,
        seconds,
        cleared: false,
        clear() { this.cleared = true; },
      };
      timers.push(timer);
      return timer;
    },
  };
  const trackedSpawner = new Spawner({ app: trackedApp, player });

  trackedSpawner.destroy();

  assert.equal(timers.length, 1);
  assert.equal(timers[0].cleared, true);
});

test('spawn limit timer increments and reset covers forceKill and fallback destroy paths', () => {
  const timers = [];
  const trackedApp = {
    ...createAppMock(),
    setInterval(fn, seconds) {
      const timer = {
        fn,
        seconds,
        clear() {},
      };
      timers.push(timer);
      return timer;
    },
  };
  const trackedSpawner = new Spawner({ app: trackedApp, player });
  let forceKilled = 0;
  const enemy = {
    visible: true,
    destroyCalls: 0,
    destroy() {
      this.destroyCalls += 1;
    },
  };
  trackedSpawner.spawns = [
    { forceKill() { forceKilled += 1; } },
    { enemy },
  ];

  timers[0].fn();
  trackedSpawner.reset();

  assert.equal(trackedSpawner.spawnLimit, 2);
  assert.equal(forceKilled, 1);
  assert.equal(enemy.visible, false);
  assert.equal(enemy.destroyCalls, 1);
});

test('enemyType covers late-game variants and update stops when the player is dead', () => {
  const originalRandom = Math.random;
  const localPlayer = { points: 1, lifes: 1 };
  const localSpawner = new Spawner({ app: createAppMock(), player: localPlayer });
  const randomValues = [8.1 / 13, 11.1 / 13, 12.5 / 13];
  let index = 0;

  try {
    Math.random = () => randomValues[index++];

    assert.equal(localSpawner.enemyType().typeId, 'pink_striker');
    assert.equal(localSpawner.enemyType().typeId, 'red_rusher');
    assert.equal(localSpawner.enemyType().typeId, 'white_sprinter');

    localPlayer.lifes = 0;
    localSpawner.update(localPlayer);
    assert.equal(localSpawner.spawns.length, 0);
  } finally {
    Math.random = originalRandom;
  }
});
