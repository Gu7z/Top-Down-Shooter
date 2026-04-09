import test from 'node:test';
import assert from 'node:assert/strict';
import bulletHit from '../src/utils/bullet_hit.js';
import { setupPixiMock } from './helpers.js';
import { initCombatFeedback } from '../src/combat_feedback.js';
import { createAppMock } from './helpers.js';

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

test('bulletHit displays the effective damage returned by kill', () => {
  const app = createAppMock();
  initCombatFeedback(app);

  const trackedBullet = {
    position: { x: 40, y: 50 },
    damage: 3,
    destroy() { this.destroyed = true; },
  };
  const trackedEnemy = {
    enemy: { position: { x: 40, y: 50 } },
    enemyRadius: 5,
    kill() {
      return 9;
    },
  };

  bulletHit(trackedBullet, [trackedEnemy], 5, { points: 0 });

  const activeNumber = app.stage.children.find(
    (child) => child.constructor === PIXI.Container && child.visible,
  );
  assert.equal(activeNumber.children[0].text, '9');
});

test('bulletHit displays only the remaining life when the hit overkills the enemy', () => {
  const app = createAppMock();
  initCombatFeedback(app);

  const trackedBullet = {
    position: { x: 20, y: 30 },
    damage: 2,
    destroy() { this.destroyed = true; },
  };
  const trackedEnemy = {
    enemy: { position: { x: 20, y: 30 } },
    enemyRadius: 5,
    kill() {
      return 1;
    },
  };

  bulletHit(trackedBullet, [trackedEnemy], 5, { points: 0 });

  const activeNumber = app.stage.children.find(
    (child) => child.constructor === PIXI.Container && child.visible,
  );
  assert.equal(activeNumber.children[0].text, '1');
});

test('bulletHit applies control effects to enemy on hit', () => {
  let controlApplied = false;
  let appliedEffects = null;
  const controlBullet = {
    position: { x: 0, y: 0 },
    damage: 1,
    controlEffects: { freezeChance: 0.8, knockbackBonus: 10 },
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
  assert.equal(appliedEffects.effects.freezeChance, 0.8);
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
    controlEffects: { freezeChance: 0.9, knockbackBonus: 0 },
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
  assert.equal(nearResult.effects.freezeChance, 0.9);
  assert.equal(nearResult.effects.knockbackBonus, undefined);
});

test('bulletHit stops after one hit when kill mutates enemies array', () => {
  const mutationBullet = {
    position: { x: 0, y: 0 },
    destroy() { this.destroyed = true; },
  };
  const killed = [];
  const firstEnemy = {
    enemy: { position: { x: 0, y: 0 } },
    enemyRadius: 5,
    kill(enemies, index) {
      killed.push('first');
      enemies.splice(index, 1);
    },
  };
  const secondEnemy = {
    enemy: { position: { x: 0, y: 0 } },
    enemyRadius: 5,
    kill() {
      killed.push('second');
    },
  };
  const enemies = [firstEnemy, secondEnemy];

  bulletHit(mutationBullet, enemies, 5, { points: 1 });

  assert.deepEqual(killed, ['first']);
  assert.deepEqual(enemies, [secondEnemy]);
});

test('bulletHit applies visual effects and drone bounty bonus', () => {
  const effectCalls = [];
  const droneBullet = {
    position: { x: 0, y: 0 },
    source: 'drone',
    isCrit: true,
    damage: 2,
    destroy() { this.destroyed = true; },
  };
  const bountyEnemy = {
    enemy: { position: { x: 0, y: 0 } },
    enemyRadius: 5,
    value: 3,
    kill(enemies, index, hitPlayer, effects, damage) {
      this.forwardedDamage = damage;
    },
  };
  const playerWithBounty = {
    points: 1,
    skillEffects: { droneBountyBonus: true },
  };
  const effects = {
    pulse(target, color, duration) { effectCalls.push(['pulse', color, duration]); },
    explosion(x, y, color, amount) { effectCalls.push(['explosion', color, amount]); },
    shake(amount) { effectCalls.push(['shake', amount]); },
  };

  bulletHit(droneBullet, [bountyEnemy], 5, playerWithBounty, effects);

  assert.equal(playerWithBounty.points, 4);
  assert.equal(bountyEnemy.forwardedDamage, 2);
  assert.deepEqual(effectCalls, [
    ['pulse', 0xff4d4d, 6],
    ['explosion', 0xff2d55, 16],
    ['shake', 4.0],
  ]);
});

test('bulletHit triggers chain lightning when proc succeeds', () => {
  const chainHit = [];
  const sourceBullet = {
    position: { x: 0, y: 0 },
    damage: 1,
    destroy() { this.destroyed = true; },
  };
  const hitEnemy = {
    enemy: { position: { x: 0, y: 0 }, destroyed: false },
    enemyRadius: 5,
    kill() {},
  };
  const nearEnemy = {
    enemy: { position: { x: 80, y: 0 }, destroyed: false },
    enemyRadius: 5,
    kill(enemies, idx, player, effects, damage) { chainHit.push(damage); },
  };
  const farEnemy = {
    enemy: { position: { x: 300, y: 0 }, destroyed: false },
    enemyRadius: 5,
    kill() {},
  };
  const playerWithUpgrade = {
    points: 0,
    runUpgradeEffects: {
      chainLightningChance: 1.0,
      chainLightningTargets: 2,
      chainLightningRange: 100,
      chainLightningDamage: 2,
    },
  };
  const mockEffects = {
    pulse() {}, explosion() {}, shake() {}, chainLightning() {},
  };

  bulletHit(sourceBullet, [hitEnemy, nearEnemy, farEnemy], 5, playerWithUpgrade, mockEffects);

  assert.equal(chainHit.length, 1, 'only nearEnemy is in range');
  assert.equal(chainHit[0], 2, 'chain damage = chainLightningDamage');
});

test('bulletHit does not trigger chain lightning when chance fails', () => {
  let chainCalled = false;
  const bullet = {
    position: { x: 0, y: 0 },
    damage: 1,
    destroy() { this.destroyed = true; },
  };
  const hitEnemy = {
    enemy: { position: { x: 0, y: 0 } },
    enemyRadius: 5,
    kill() {},
  };
  const nearEnemy = {
    enemy: { position: { x: 50, y: 0 }, destroyed: false },
    enemyRadius: 5,
    kill() { chainCalled = true; },
  };
  const player = {
    points: 0,
    runUpgradeEffects: {
      chainLightningChance: 0.0,
      chainLightningTargets: 2,
      chainLightningRange: 100,
      chainLightningDamage: 1,
    },
  };
  bulletHit(bullet, [hitEnemy, nearEnemy], 5, player, { pulse() {}, explosion() {}, shake() {}, chainLightning() {} });
  assert.equal(chainCalled, false);
});
