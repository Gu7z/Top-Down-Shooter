import test from 'node:test';
import assert from 'node:assert/strict';
import bulletHit from '../src/utils/bullet_hit.js';
import { setupPixiMock } from './helpers.js';

setupPixiMock();

const bullet = {
  position: { x: 0, y: 0 },
  visible: true,
  destroy() { this.destroyed = true; }
};

const enemy = {
  enemy: { position: { x: 0, y: 0 } },
  enemyRadius: 5,
  killCalled: false,
  kill() { this.killCalled = true; }
};

const player = { points: 0 };

bulletHit(bullet, [enemy], 5, player);

test('bulletHit destroys bullet on impact', () => {
  assert.ok(bullet.destroyed);
  assert.strictEqual(enemy.killCalled, true);
});

test('bulletHit records hit stats and forwards bullet damage', () => {
  const trackedBullet = {
    position: { x: 0, y: 0 },
    damage: 3,
    destroy() { this.destroyed = true; },
  };
  let forwardedDamage = 0;
  const trackedEnemy = {
    enemy: { position: { x: 0, y: 0 } },
    enemyRadius: 5,
    kill(enemies, index, hitPlayer, effects, damage) {
      forwardedDamage = damage;
    },
  };
  const trackedPlayer = {
    runStats: { hits: 0, recordShotHit() { this.hits += 1; } },
  };

  bulletHit(trackedBullet, [trackedEnemy], 5, trackedPlayer);

  assert.equal(trackedPlayer.runStats.hits, 1);
  assert.equal(forwardedDamage, 3);
});

test('bulletHit applies control effects to enemy on hit', () => {
  let controlApplied = false;
  let appliedEffects = null;
  const controlBullet = {
    position: { x: 0, y: 0 },
    damage: 1,
    controlEffects: { slowFieldMultiplier: 0.8, knockbackBonus: 10 },
    controlDurationMultiplier: 1.2,
    destroy() { this.destroyed = true; },
  };
  const controlEnemy = {
    enemy: { position: { x: 5, y: 0 } },
    enemyRadius: 10,
    applyControlEffects(effects, duration) {
      controlApplied = true;
      appliedEffects = { effects, duration };
    },
    kill() {},
  };

  bulletHit(controlBullet, [controlEnemy], 5, { points: 0 });

  assert.equal(controlApplied, true);
  assert.equal(appliedEffects.effects.slowFieldMultiplier, 0.8);
  assert.equal(appliedEffects.duration, 1.2);
  // Knockback direction should be calculated
  assert.ok(appliedEffects.effects.knockbackDirection);
});

test('bulletHit chain pulse applies control to nearby enemies', () => {
  const chainApplied = [];
  const makePulseEnemy = (x, y) => ({
    enemy: { position: { x, y }, destroyed: false },
    enemyRadius: 5,
    applyControlEffects(effects) {
      chainApplied.push({ x, y, effects });
    },
    kill() {},
  });

  const chainBullet = {
    position: { x: 0, y: 0 },
    damage: 1,
    controlEffects: { slowFieldMultiplier: 0.9, knockbackBonus: 0 },
    chainPulseRadius: 50,
    controlDurationMultiplier: 1,
    destroy() { this.destroyed = true; },
  };

  const hitEnemy = makePulseEnemy(0, 0);
  const nearEnemy = makePulseEnemy(30, 0); // within 50 radius
  const farEnemy = makePulseEnemy(200, 0);  // outside radius

  bulletHit(chainBullet, [hitEnemy, nearEnemy, farEnemy], 5, { points: 0 });

  // hitEnemy gets direct control effects
  assert.equal(chainApplied.length, 2); // hit + near (not far)
  // Near enemy should get chain control (no knockback)
  const nearResult = chainApplied.find(e => e.x === 30);
  assert.ok(nearResult);
  assert.equal(nearResult.effects.slowFieldMultiplier, 0.9);
  assert.equal(nearResult.effects.knockbackBonus, undefined);
});
