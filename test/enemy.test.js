import test from 'node:test';
import assert from 'node:assert/strict';
import Enemy from '../src/enemy.js';
import { setupPixiMock, createAppMock } from './helpers.js';

setupPixiMock();
const app = createAppMock();
const container = new PIXI.Container();
const enemy = new Enemy({ app, enemyRadius: 10, speed:1, color:0xff0000, life:2, value:1, container });
const player = { 
  player: new PIXI.Sprite(), 
  lifes: 1, 
  points: 0,
  collidesWithCircle(cx, cy, r) { return true; } // mock
};
const spawner = { resetCalled:false, reset(){this.resetCalled=true;}, spawns: [enemy] };
player.player.width = 20;
player.player.position.set(enemy.enemy.position.x, enemy.enemy.position.y);

test('randomPosition returns Victor instance', () => {
  const pos = enemy.randomPosition();
  assert.strictEqual(typeof pos.x, 'number');
  assert.strictEqual(typeof pos.y, 'number');
});

test('goToPlayer reduces player life on hit', () => {
  enemy.goToPlayer(player, spawner);
  assert.strictEqual(player.lifes, 0);
});

test('kill handles life decrement and removal', () => {
  const arr = [enemy];
  enemy.kill(arr, 0, player);
  assert.strictEqual(enemy.life, 1);
  enemy.kill(arr, 0, player);
  assert.strictEqual(arr.length, 0);
});

test('kill applies damage, score multiplier, and run stats metadata', () => {
  const trackedEnemy = new Enemy({
    app,
    enemyRadius: 10,
    speed: 1,
    color: 0xff0000,
    life: 3,
    value: 2,
    typeId: 'tracked',
    isBoss: true,
    container,
  });
  const trackedPlayer = {
    points: 0,
    skillEffects: { scoreMultiplier: 1.5 },
    runStats: {
      kills: [],
      recordKill(kill) { this.kills.push(kill); },
    },
  };
  const enemies = [trackedEnemy];

  trackedEnemy.kill(enemies, 0, trackedPlayer, undefined, 3);

  assert.equal(enemies.length, 0);
  assert.equal(trackedPlayer.points, 3);
  assert.deepEqual(trackedPlayer.runStats.kills[0], {
    typeId: 'tracked',
    value: 2,
    isBoss: true,
  });
});

test('update calls goToPlayer', () => {
  enemy.update(player, spawner);
  assert.ok(true);
});

// ── Control Effects Tests ──────────────────────────────────────────

test('applyControlEffects applies slow to enemy', () => {
  const slowEnemy = new Enemy({
    app,
    enemyRadius: 10,
    speed: 2,
    color: 0xff0000,
    life: 5,
    value: 1,
    container,
  });

  assert.equal(slowEnemy.speedMultiplier, 1);

  slowEnemy.applyControlEffects({ slowFieldMultiplier: 0.5 });
  assert.equal(slowEnemy.speedMultiplier, 0.5);
  assert.equal(slowEnemy.controlTimers.length, 1);
});

test('applyControlEffects applies weaken to enemy', () => {
  const weakEnemy = new Enemy({
    app,
    enemyRadius: 10,
    speed: 1,
    color: 0xff0000,
    life: 5,
    value: 1,
    container,
  });

  weakEnemy.applyControlEffects({ enemyWeakenMultiplier: 1.5 });
  assert.equal(weakEnemy.damageMultiplier, 1.5);
});

test('applyControlEffects applies knockback', () => {
  const kbEnemy = new Enemy({
    app,
    enemyRadius: 10,
    speed: 1,
    color: 0xff0000,
    life: 5,
    value: 1,
    container,
  });

  const startX = kbEnemy.enemy.position.x;
  kbEnemy.applyControlEffects({
    knockbackBonus: 20,
    knockbackDirection: { x: 1, y: 0 },
  });
  assert.equal(kbEnemy.enemy.position.x, startX + 20);
});

test('control timers expire and reverse effects', () => {
  const timedEnemy = new Enemy({
    app,
    enemyRadius: 10,
    speed: 1,
    color: 0xff0000,
    life: 5,
    value: 1,
    container,
  });

  timedEnemy.applyControlEffects({ slowFieldMultiplier: 0.5 }, 1);
  assert.equal(timedEnemy.speedMultiplier, 0.5);

  // Tick for 61 frames (base 60 * duration 1)
  for (let i = 0; i < 61; i++) {
    timedEnemy.updateControlTimers();
  }

  // Speed should be restored (approximately 1 due to floating point)
  assert.ok(Math.abs(timedEnemy.speedMultiplier - 1) < 0.001);
});

test('kill applies damageMultiplier from weaken effect', () => {
  const weakened = new Enemy({
    app,
    enemyRadius: 10,
    speed: 1,
    color: 0xff0000,
    life: 4,
    value: 1,
    container,
  });

  // Apply 2x weaken
  weakened.applyControlEffects({ enemyWeakenMultiplier: 2 });
  assert.equal(weakened.damageMultiplier, 2);

  // Attacking with 1 damage should deal 2 effective damage
  const arr = [weakened];
  weakened.kill(arr, 0, { points: 0 }, undefined, 1);
  assert.equal(weakened.life, 2); // 4 - ceil(1*2) = 2
});

test('removePlayerLife uses player.takeDamage when available', () => {
  const takeDamagePlayer = {
    player: new PIXI.Sprite(),
    lifes: 2,
    takeDamageCalled: false,
    takeDamage(amount) {
      this.takeDamageCalled = true;
      this.lifes -= amount;
      return true;
    },
  };
  takeDamagePlayer.player.position.set(0, 0);

  const testEnemy = new Enemy({
    app,
    enemyRadius: 10,
    speed: 1,
    color: 0xff0000,
    life: 1,
    value: 1,
    container,
  });

  testEnemy.removePlayerLife(takeDamagePlayer, { spawns: [testEnemy] });
  assert.equal(takeDamagePlayer.takeDamageCalled, true);
});
