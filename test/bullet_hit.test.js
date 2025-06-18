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
