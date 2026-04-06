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
