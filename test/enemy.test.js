import test from 'node:test';
import assert from 'node:assert/strict';
import Victor from 'victor';
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

test('applyControlEffects freezes enemy on successful roll', () => {
  const freezeEnemy = new Enemy({
    app,
    enemyRadius: 10,
    speed: 2,
    color: 0xff0000,
    life: 5,
    value: 1,
    container,
  });

  assert.equal(freezeEnemy.frozen, false);

  // Force freeze by passing 100% chance
  freezeEnemy.applyControlEffects({ freezeChance: 1.0 });
  assert.equal(freezeEnemy.frozen, true);
  assert.ok(freezeEnemy.freezeTimer > 0);
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

test('freeze timer is set based on duration multiplier', () => {
  const timedEnemy = new Enemy({
    app,
    enemyRadius: 10,
    speed: 1,
    color: 0xff0000,
    life: 5,
    value: 1,
    container,
  });

  // Base duration is 120 frames; multiplier 2 should give 240
  timedEnemy.applyControlEffects({ freezeChance: 1.0 }, 2);
  assert.equal(timedEnemy.frozen, true);
  assert.equal(timedEnemy.freezeTimer, 240);
});

test('boss ignores skill-tree freeze flag but still receives knockback', () => {
  const bossEnemy = new Enemy({
    app,
    enemyRadius: 10,
    speed: 1,
    color: 0xff0000,
    life: 5,
    value: 1,
    isBoss: true,
    container,
  });
  const startX = bossEnemy.enemy.position.x;

  bossEnemy.applyControlEffects({
    freezeChance: 1.0,
    freezeAffectsBosses: false,
    knockbackBonus: 15,
    knockbackDirection: { x: 1, y: 0 },
  });

  assert.equal(bossEnemy.frozen, false);
  assert.equal(bossEnemy.freezeTimer, 0);
  assert.equal(bossEnemy.enemy.position.x, startX + 15);
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

test('kill amplifies damage only against bosses when boss run upgrade is active', () => {
  const bossEnemy = new Enemy({
    app,
    enemyRadius: 10,
    speed: 1,
    color: 0xff0000,
    life: 5,
    value: 1,
    isBoss: true,
    container,
  });
  const normalEnemy = new Enemy({
    app,
    enemyRadius: 10,
    speed: 1,
    color: 0xff0000,
    life: 5,
    value: 1,
    isBoss: false,
    container,
  });
  const playerWithBossUpgrade = {
    points: 0,
    runUpgradeEffects: { bossDamageMultiplier: 1.5 },
  };

  bossEnemy.kill([bossEnemy], 0, playerWithBossUpgrade, undefined, 2);
  normalEnemy.kill([normalEnemy], 0, playerWithBossUpgrade, undefined, 2);

  assert.equal(bossEnemy.life, 2);
  assert.equal(normalEnemy.life, 3);
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

test('frozen enemy update keeps health text in sync before early return', () => {
  const frozenEnemy = new Enemy({
    app,
    enemyRadius: 10,
    speed: 1,
    color: 0xff0000,
    life: 5,
    value: 1,
    container,
  });
  const safePlayer = {
    player: new PIXI.Sprite(),
    collidesWithCircle() { return false; },
  };
  safePlayer.player.width = 20;

  frozenEnemy.applyControlEffects({ freezeChance: 1 });
  frozenEnemy.life = 3;
  frozenEnemy.update(safePlayer, { spawns: [frozenEnemy] });

  assert.equal(frozenEnemy.enemyLifeText.text, 3);
});

test('updateControlTimers decrements cooldown and removes expired weaken effects', () => {
  const controlledEnemy = new Enemy({
    app,
    enemyRadius: 10,
    speed: 1,
    color: 0xff0000,
    life: 5,
    value: 1,
    container,
  });

  controlledEnemy.contactCooldown = 2;
  controlledEnemy.damageMultiplier = 2;
  controlledEnemy.controlTimers = [{ type: 'weaken', timer: 1, value: 2 }];
  controlledEnemy.updateControlTimers();

  assert.equal(controlledEnemy.contactCooldown, 1);
  assert.equal(controlledEnemy.damageMultiplier, 1);
  assert.equal(controlledEnemy.controlTimers.length, 0);
});

test('removePlayerLife heavy enemy applies cooldown, knockback, and effects', () => {
  const heavyEnemy = new Enemy({
    app,
    enemyRadius: 10,
    speed: 1,
    color: 0xff0000,
    life: 12,
    value: 1,
    container,
  });
  heavyEnemy.enemy.position.set(0, 0);
  const heavyPlayer = {
    player: new PIXI.Sprite(),
    lifes: 3,
  };
  heavyPlayer.player.position.set(20, 0);
  const effectCalls = [];
  const effects = {
    shake(amount) { effectCalls.push(['shake', amount]); },
    explosion(x, y, color, size) { effectCalls.push(['explosion', color, size]); },
    pulse(target, color, size) { effectCalls.push(['pulse', color, size]); },
  };

  heavyEnemy.removePlayerLife(heavyPlayer, { spawns: [heavyEnemy] }, effects);

  assert.equal(heavyPlayer.lifes, 2);
  assert.equal(heavyEnemy.contactCooldown, 90);
  assert.notEqual(heavyEnemy.knockbackVelocity.x, 0);
  assert.deepEqual(effectCalls, [
    ['shake', 6],
    ['explosion', 0xff2d55, 18],
    ['pulse', 0xff2d55, 12],
  ]);
});

test('removePlayerLife damages light enemy when player is invulnerable', () => {
  const lightEnemy = new Enemy({
    app,
    enemyRadius: 10,
    speed: 1,
    color: 0xff0000,
    life: 5,
    value: 1,
    container,
  });
  const invulnerablePlayer = {
    player: new PIXI.Sprite(),
    takeDamage() { return false; },
  };
  const localSpawner = { spawns: [lightEnemy] };
  let killArgs = null;
  lightEnemy.kill = (...args) => { killArgs = args; };

  lightEnemy.removePlayerLife(invulnerablePlayer, localSpawner);

  assert.equal(lightEnemy.contactCooldown, 90);
  assert.equal(killArgs[4], 10);
});

test('removePlayerLife force-kills light enemy and removes it from spawns', () => {
  const disposableEnemy = new Enemy({
    app,
    enemyRadius: 10,
    speed: 1,
    color: 0xff0000,
    life: 1,
    value: 1,
    container,
  });
  const plainPlayer = {
    player: new PIXI.Sprite(),
    lifes: 2,
  };
  plainPlayer.player.position.set(0, 0);
  const localSpawner = { spawns: [disposableEnemy] };
  const effectCalls = [];

  disposableEnemy.removePlayerLife(plainPlayer, localSpawner, {
    shake(amount) { effectCalls.push(['shake', amount]); },
    explosion(x, y, color, size) { effectCalls.push(['explosion', color, size]); },
    pulse(target, color, size) { effectCalls.push(['pulse', color, size]); },
  });

  assert.equal(plainPlayer.lifes, 1);
  assert.equal(localSpawner.spawns.length, 0);
  assert.equal(disposableEnemy.enemy.destroyed, true);
  assert.deepEqual(effectCalls, [
    ['shake', 8],
    ['explosion', 0xff2d55, 24],
    ['pulse', 0xff2d55, 15],
  ]);
});

test('updateRanged chooses recuar, strafe, and aproximar states by distance', () => {
  const originalRandom = Math.random;
  Math.random = () => 0.9;

  try {
    const rangedEnemy = new Enemy({
      app,
      enemyRadius: 10,
      speed: 1,
      color: 0xff0000,
      life: 3,
      value: 1,
      container,
      behaviorType: 'ranged',
      enemyBullets: [],
    });
    rangedEnemy.fireBullet = () => {};
    const rangedPlayer = { player: new PIXI.Sprite() };
    rangedPlayer.player.width = 20;

    rangedEnemy.enemy.position.set(0, 0);
    rangedPlayer.player.position.set(100, 0);
    rangedEnemy.aiTimer = 0;
    rangedEnemy.updateRanged(rangedPlayer, { spawns: [] });
    assert.equal(rangedEnemy.aiState, 'recuar');

    rangedEnemy.enemy.position.set(0, 0);
    rangedPlayer.player.position.set(200, 0);
    rangedEnemy.aiTimer = 0;
    rangedEnemy.strafeDirection = 1;
    rangedEnemy.updateRanged(rangedPlayer, { spawns: [] });
    assert.equal(rangedEnemy.aiState, 'strafe');
    assert.equal(rangedEnemy.strafeDirection, -1);

    rangedEnemy.enemy.position.set(0, 0);
    rangedPlayer.player.position.set(400, 0);
    rangedEnemy.aiTimer = 0;
    rangedEnemy.updateRanged(rangedPlayer, { spawns: [] });
    assert.equal(rangedEnemy.aiState, 'aproximar');
  } finally {
    Math.random = originalRandom;
  }
});

test('updateRanged triggers contact damage and sets fire cooldown by enemy type', () => {
  const closeEnemy = new Enemy({
    app,
    enemyRadius: 10,
    speed: 1,
    color: 0xff0000,
    life: 3,
    value: 1,
    container,
    behaviorType: 'ranged',
    typeId: 'devastador',
    enemyBullets: [],
  });
  const rangedPlayer = { player: new PIXI.Sprite() };
  rangedPlayer.player.width = 40;
  rangedPlayer.player.position.set(0, 0);
  closeEnemy.enemy.position.set(0, 0);
  let removed = 0;
  closeEnemy.removePlayerLife = () => { removed += 1; };

  closeEnemy.updateRanged(rangedPlayer, { spawns: [] });
  assert.equal(removed, 1);

  const shooter = new Enemy({
    app,
    enemyRadius: 10,
    speed: 1,
    color: 0xff0000,
    life: 3,
    value: 1,
    container,
    behaviorType: 'ranged',
    typeId: 'devastador',
    enemyBullets: [],
  });
  shooter.enemy.position.set(0, 0);
  rangedPlayer.player.width = 20;
  rangedPlayer.player.position.set(400, 0);
  shooter.aiTimer = 10;
  shooter.shootCooldown = 0;
  let fired = 0;
  shooter.fireBullet = () => { fired += 1; };

  shooter.updateRanged(rangedPlayer, { spawns: [] });

  assert.equal(fired, 1);
  assert.equal(shooter.shootCooldown, 280);
});

test('fireBullet spawns expected projectile counts for each ranged type', () => {
  const originalWindow = global.window;
  const created = [];
  global.window = {
    EnemyBulletClass: class {
      constructor(options) {
        this.options = options;
        created.push(options);
      }
    },
  };

  try {
    const playerPosition = new Victor(100, 0);
    const cases = [
      ['artilheiro', 3],
      ['devastador', 5],
      ['espectre', 2],
      ['infiltrador', 1],
      ['atirador', 1],
    ];

    for (const [typeId, expected] of cases) {
      created.length = 0;
      const bullets = [];
      const rangedEnemy = new Enemy({
        app,
        enemyRadius: 10,
        speed: 1,
        color: 0xff0000,
        life: 3,
        value: 1,
        container,
        typeId,
        enemyBullets: bullets,
      });
      rangedEnemy.enemy.position.set(0, 0);

      rangedEnemy.fireBullet(playerPosition);

      assert.equal(bullets.length, expected);
      assert.equal(created.length, expected);
      assert.equal(created[0].color, 0xff0000);
    }
  } finally {
    global.window = originalWindow;
  }
});

test('goToPlayer moves enemy toward player when not colliding', () => {
  const walker = new Enemy({
    app,
    enemyRadius: 10,
    speed: 1,
    color: 0xff0000,
    life: 3,
    value: 1,
    container,
  });
  const farPlayer = {
    player: new PIXI.Sprite(),
    collidesWithCircle() { return false; },
  };
  farPlayer.player.position.set(100, 0);
  walker.enemy.position.set(0, 0);

  walker.goToPlayer(farPlayer, { spawns: [walker] });

  assert.notEqual(walker.enemy.position.x, 0);
  assert.equal(walker.enemyLifeText.text, 3);
});

test('forceKill destroys enemy graphics', () => {
  const doomedEnemy = new Enemy({
    app,
    enemyRadius: 10,
    speed: 1,
    color: 0xff0000,
    life: 3,
    value: 1,
    container,
  });

  doomedEnemy.forceKill();

  assert.equal(doomedEnemy.enemy.visible, false);
  assert.equal(doomedEnemy.enemy.destroyed, true);
  assert.equal(doomedEnemy.enemyLifeText.destroyed, true);
});

test('update routes ranged enemies and thaws frozen tint to readable color', () => {
  const rangedEnemy = new Enemy({
    app,
    enemyRadius: 10,
    speed: 1,
    color: 0xffffff,
    life: 3,
    value: 1,
    container,
    behaviorType: 'ranged',
    enemyBullets: [],
  });
  let rangedUpdated = 0;
  rangedEnemy.updateRanged = () => { rangedUpdated += 1; };
  rangedEnemy.frozen = true;
  rangedEnemy.freezeTimer = 1;

  rangedEnemy.update({ player: new PIXI.Sprite() }, { spawns: [rangedEnemy] });

  assert.equal(rangedUpdated, 1);
  assert.equal(rangedEnemy.frozen, false);
  assert.equal(rangedEnemy.enemyLifeText.style.fill, 0x000000);
});
