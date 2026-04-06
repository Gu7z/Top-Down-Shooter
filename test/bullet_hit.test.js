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
