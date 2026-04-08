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

// ── Critical Hit Tests ──────────────────────────────────────────

test('bullets carry crit metadata with critChance = 0 (no crits)', () => {
  const noCritShooting = new Shooting({
    app,
    player,
    playerSize: 20,
    keys: {},
    skillEffects: { critChance: 0, critMultiplier: 2 },
  });

  noCritShooting.fire();
  const bullet = noCritShooting.bullets[0];
  assert.equal(bullet.isCrit, false);
  assert.equal(bullet.damage, 1);
});

test('bullets with critChance = 1 always crit and apply multiplier', () => {
  const alwaysCritShooting = new Shooting({
    app,
    player,
    playerSize: 20,
    keys: {},
    skillEffects: { critChance: 1, critMultiplier: 3, bulletDamageBonus: 1 },
  });

  alwaysCritShooting.fire();
  const bullet = alwaysCritShooting.bullets[0];
  assert.equal(bullet.isCrit, true);
  assert.equal(bullet.damage, 6); // ceil((1+1) * 3)
});

// ── Control Effects Pass-through ──────────────────────────────────

test('bullets do not freeze enemies when no freeze skill is active', () => {
  const noControlShooting = new Shooting({
    app,
    player,
    playerSize: 20,
    keys: {},
    skillEffects: { freezeChance: 0 },
  });

  noControlShooting.fire();
  const bullet = noControlShooting.bullets[0];

  assert.equal(bullet.controlEffects.freezeChance, 0);
});

test('bullets carry control effects and chain pulse radius', () => {
  const controlShooting = new Shooting({
    app,
    player,
    playerSize: 20,
    keys: {},
    skillEffects: {
      knockbackBonus: 20,
      enemyWeakenMultiplier: 1.5,
      freezeChance: 0.25,
      chainPulseRadius: 100,
      controlDurationMultiplier: 1.3,
    },
  });

  controlShooting.fire();
  const bullet = controlShooting.bullets[0];

  assert.equal(bullet.controlEffects.knockbackBonus, 20);
  assert.equal(bullet.controlEffects.enemyWeakenMultiplier, 1.5);
  assert.equal(bullet.controlEffects.freezeChance, 0.25);
  assert.equal(bullet.chainPulseRadius, 100);
  assert.equal(bullet.controlDurationMultiplier, 1.3);
});

test('constructor effects are available for the first fired shot', () => {
  const effects = {
    explosions: 0,
    shakes: 0,
    explosion() { this.explosions += 1; },
    shake() { this.shakes += 1; },
  };
  const shootingWithEffects = new Shooting({
    app,
    player,
    playerSize: 20,
    keys: {},
    effects,
  });

  shootingWithEffects.fire();

  assert.equal(effects.explosions, 1);
  assert.equal(effects.shakes, 1);
});

test('shoot timer recursively reschedules and setter updates fire velocity', () => {
  const timerApp = createAppMock();
  const timers = [];
  timerApp.setInterval = (fn, seconds) => {
    const timer = {
      fn,
      seconds,
      cleared: false,
      clear() {
        this.cleared = true;
      },
    };
    timers.push(timer);
    return timer;
  };

  const timedShooting = new Shooting({
    app: timerApp,
    player,
    playerSize: 20,
    keys: { ' ': true },
  });
  let fireCalls = 0;
  timedShooting.fire = () => { fireCalls += 1; };

  timers[0].fn();
  timedShooting.setFireVelocity = 2;

  assert.equal(fireCalls, 1);
  assert.equal(timers[0].cleared, true);
  assert.equal(timers.length, 2);
  assert.equal(timedShooting.fireVelocity, 2);
});

test('shootingContainer is on stage before any shot is fired', () => {
  const freshApp = createAppMock();
  const freshShooting = new Shooting({ app: freshApp, player, playerSize: 20, keys: {} });

  assert.ok(
    freshApp.stage.children.includes(freshShooting.shootingContainer),
    'shootingContainer must be added to stage in constructor, not deferred to first fire()',
  );
  assert.equal(freshShooting.bullets.length, 0, 'no bullets should exist before fire()');
});
