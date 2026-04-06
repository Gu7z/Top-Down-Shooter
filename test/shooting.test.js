import test from 'node:test';
import assert from 'node:assert/strict';
import Shooting from '../src/shooting.js';
import { setupPixiMock, createAppMock } from './helpers.js';
import Player from '../src/player.js';

setupPixiMock();
const app = createAppMock();
const keys = {};
const player = new PIXI.Sprite();
player.position = { x: 0, y: 0, set(x, y) { this.x = x; this.y = y; } };
player.rotation = 0;

const shooting = new Shooting({ app, player, playerSize: 20, keys });

test('fire creates a bullet', () => {
  shooting.fire();
  assert.strictEqual(shooting.bullets.length, 1);
});

test('update moves bullets', () => {
  const enemySpawner = { spawns: [], update() {} };
  shooting.fire();
  const bullet = shooting.bullets[0];
  const startX = bullet.position.x;
  shooting.update(true, enemySpawner, { player: {} });
  assert.notStrictEqual(bullet.position.x, startX);
});

test('shooting applies firepower effects and records shots', () => {
  const runStats = { shots: 0, recordShotFired() { this.shots += 1; } };
  const boostedShooting = new Shooting({
    app,
    player,
    playerSize: 20,
    keys: {},
    skillEffects: {
      bulletSpeedBonus: 1,
      bulletDamageBonus: 1,
      extraProjectiles: 1,
      spreadRadians: 0.2,
    },
    runStats,
  });

  boostedShooting.fire();

  assert.equal(boostedShooting.bullets.length, 2);
  assert.equal(boostedShooting.bullets[0].damage, 2);
  assert.equal(boostedShooting.bullets[0].velocity.x, 5);
  assert.equal(runStats.shots, 2);
});
