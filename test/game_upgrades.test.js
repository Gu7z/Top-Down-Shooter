import test from "node:test";
import assert from "node:assert/strict";
import Game from "../src/game.js";
import Enemy from "../src/enemy.js";
import { UPGRADE_REGISTRY } from "../src/run_upgrades/run_upgrade_data.js";
import { setupPixiMock, createAppMock } from "./helpers.js";

setupPixiMock();

function createWindowHarness() {
  const eventMap = {};
  return {
    window: {
      addEventListener(eventName, handler) {
        if (!eventMap[eventName]) eventMap[eventName] = [];
        eventMap[eventName].push(handler);
      },
      removeEventListener(eventName, handler) {
        eventMap[eventName] = (eventMap[eventName] || []).filter((fn) => fn !== handler);
      },
    },
  };
}

function createGameHarness(username = "player") {
  const app = {
    ...createAppMock(),
    render() {},
    start() {},
    stop() {},
  };
  const windowHarness = createWindowHarness();

  global.window = windowHarness.window;
  global.localStorage = {
    storage: {},
    getItem(key) { return this.storage[key] || null; },
    setItem(key, value) { this.storage[key] = value; },
  };
  global.__SNOWPACK_ENV__ = {
    SNOWPACK_PUBLIC_API_URL_PROD: "",
    SNOWPACK_PUBLIC_API_URL_DEV: "",
    MODE: "production",
  };
  global.fetch = async () => ({ json: async () => ({}) });

  const game = new Game({ app, username });
  game.player.player.getBounds = () => ({ x: 0, y: 0, width: 40, height: 40 });
  return { app, game };
}

function createGameHarnessWithShootTimers(username = "player") {
  const timers = [];
  const app = {
    ...createAppMock(),
    render() {},
    start() {},
    stop() {},
    setInterval(fn, seconds) {
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
    },
  };
  const windowHarness = createWindowHarness();

  global.window = windowHarness.window;
  global.localStorage = {
    storage: {},
    getItem(key) { return this.storage[key] || null; },
    setItem(key, value) { this.storage[key] = value; },
  };
  global.__SNOWPACK_ENV__ = {
    SNOWPACK_PUBLIC_API_URL_PROD: "",
    SNOWPACK_PUBLIC_API_URL_DEV: "",
    MODE: "production",
  };
  global.fetch = async () => ({ json: async () => ({}) });

  const game = new Game({ app, username });
  game.player.player.getBounds = () => ({ x: 0, y: 0, width: 40, height: 40 });
  return { app, game, timers };
}

function findUpgradeCardBackgrounds(container) {
  return container.children
    .filter((child) => child.children?.some((nested) => nested.eventHandlers?.pointerdown))
    .map((child) => child.children.find((nested) => nested.eventHandlers?.pointerdown));
}

test("game upgrade flow shows the overlay, applies the chosen card, and resumes the main tick", () => {
  const { app, game } = createGameHarness("upgrade-flow");
  const chosenEffects = [];

  game.upgradeState.active = [
    UPGRADE_REGISTRY.find((upgrade) => upgrade.id === "boss_hunter"),
    UPGRADE_REGISTRY.find((upgrade) => upgrade.id === "viral_core"),
  ];
  game.upgradeState.levels = [0, 0];
  game.upgradeState._cachedEffects = game.upgradeState._computeEffects();
  game.player.setRunUpgradeEffects = (effects) => {
    chosenEffects.push(effects);
  };

  game._showUpgradeScreen();

  assert.equal(app.ticker.callbacks.includes(game.tick), false);
  assert.ok(game.upgradeScreen.container);

  app.ticker.stepFrames(40);
  const [firstCardBg] = findUpgradeCardBackgrounds(game.upgradeScreen.container);
  const overlayContainer = game.upgradeScreen.container;

  firstCardBg.eventHandlers.pointerdown();
  app.ticker.stepFrames(40);

  assert.equal(game.upgradeState.levels[0], 1);
  assert.equal(chosenEffects.at(-1).bossDamageMultiplier, 1.25);
  assert.equal(app.ticker.callbacks.includes(game.tick), true);
  assert.equal(game.upgradeScreen.container, null);
  assert.equal(app.stage.children.includes(overlayContainer), false);
});

test("game upgrade screen does not open when the run already ended, the player is dead, or upgrades are exhausted", () => {
  const { app, game } = createGameHarness("upgrade-guards");
  let showCalls = 0;
  game.upgradeScreen.show = () => {
    showCalls += 1;
  };

  game.runFinished = true;
  game._showUpgradeScreen();
  assert.equal(showCalls, 0);
  assert.equal(app.ticker.callbacks.includes(game.tick), true);

  game.runFinished = false;
  game.player.lifes = 0;
  game._showUpgradeScreen();
  assert.equal(showCalls, 0);
  assert.equal(app.ticker.callbacks.includes(game.tick), true);

  game.player.lifes = 3;
  game.upgradeState.shouldShow = () => false;
  game._showUpgradeScreen();
  assert.equal(showCalls, 0);
  assert.equal(app.ticker.callbacks.includes(game.tick), true);
});

test("game upgrade screen clears held-fire state so the shot loop does not continue under the overlay", () => {
  const { game, timers } = createGameHarnessWithShootTimers("upgrade-held-fire");
  let fireCalls = 0;

  game.player.shooting.fire = () => {
    fireCalls += 1;
  };

  game.handlePointerDown();
  game.player.shooting.update(true, game.enemySpawner, game.player);

  game._showUpgradeScreen();
  timers[0].fn();

  assert.equal(game.player.shooting.shooting, false);
  assert.equal(fireCalls, 0);
});

test("game viral core clouds slow enemies, deal damage over time, and expire cleanly", () => {
  const { game } = createGameHarness("viral-core");
  game.hud.update = () => {};
  game.player.update = () => {};
  game.waveManager.update = () => {};
  game.player.shooting.update = () => {};
  game.droneSystem.update = () => {};

  game.upgradeState._cachedEffects = {
    ...game.upgradeState.getActiveEffects(),
    viralCoreRadius: 60,
    viralCoreDamagePerTick: 1,
    viralCoreDuration: 2,
    viralCoreSlow: 0.3,
  };

  let nearKills = 0;
  const nearSpawn = {
    enemy: {
      position: { x: 100, y: 110 },
      destroyed: false,
      baseSpeed: 10,
      speed: 10,
    },
    kill(spawns, index, player, effects, damage) {
      nearKills += 1;
      assert.equal(spawns, game.enemySpawner.spawns);
      assert.equal(index, 0);
      assert.equal(player, game.player);
      assert.equal(effects, game.effects);
      assert.equal(damage, 1);
    },
  };
  const farSpawn = {
    enemy: {
      position: { x: 300, y: 300 },
      destroyed: false,
      baseSpeed: 12,
      speed: 12,
    },
    kill() {
      throw new Error("far enemy should not be hit by viral core");
    },
  };
  game.enemySpawner.spawns = [nearSpawn, farSpawn];

  game.player.onEnemyKilledAt(100, 100);
  game.viralClouds[0].tickTimer = 1;

  game.tick();

  assert.equal(nearKills, 1);
  assert.equal(nearSpawn.enemy.speed, 7);
  assert.equal(farSpawn.enemy.speed, 12);

  game.tick();

  assert.equal(game.viralClouds.length, 0);
  assert.equal(nearSpawn.enemy.speed, 10);
});

test("game tick keeps enemy life text synced in the same frame a player bullet lands", () => {
  const { game } = createGameHarness("boss-life-sync");
  game.hud.update = () => {};
  game.player.update = () => {};
  game.waveManager.update = () => {};
  game.droneSystem.update = () => {};

  const bossEnemy = new Enemy({
    app: game.app,
    enemyRadius: 10,
    speed: 0,
    color: 0xff0000,
    life: 5,
    value: 1,
    isBoss: true,
    container: game.enemySpawner.spawnerContainer,
  });
  bossEnemy.enemy.position.set(game.player.player.position.x + 24, game.player.player.position.y);
  bossEnemy.enemyLifeText.position.set(game.player.player.position.x + 24, game.player.player.position.y);
  bossEnemy.enemyLifeText.text = 5;
  game.enemySpawner.spawns = [bossEnemy];

  const bullet = new PIXI.Graphics();
  bullet.position.set(game.player.player.position.x + 20, game.player.player.position.y);
  bullet.velocity = { x: 4, y: 0 };
  bullet.damage = 2;
  bullet.isCrit = false;
  bullet.destroy = function destroy() {
    this.destroyed = true;
  };
  game.player.shooting.bullets = [bullet];

  game.tick();

  assert.equal(bossEnemy.life, 3);
  assert.equal(bossEnemy.enemyLifeText.text, 3);
});

test("game retaliation pulse damages nearby enemies, stuns survivors, and clears nearby bullets", () => {
  const { app, game } = createGameHarness("retaliation");
  game.hud.update = () => {};
  game.player.update = () => {};
  game.waveManager.update = () => {};
  game.player.shooting.update = () => {};
  game.droneSystem.update = () => {};

  game.upgradeState._cachedEffects = {
    ...game.upgradeState.getActiveEffects(),
    retaliationPulseRadius: 80,
    retaliationPulseDamage: 3,
    retaliationPulseStunMs: 200,
  };

  const nearSpawn = {
    enemy: {
      position: { x: game.player.player.position.x + 20, y: game.player.player.position.y + 10 },
      destroyed: false,
    },
    frozen: false,
    freezeTimer: 0,
    killCalls: 0,
    kill(spawns, index, player, effects, damage) {
      this.killCalls += 1;
      assert.equal(spawns, game.enemySpawner.spawns);
      assert.equal(index, 0);
      assert.equal(player, game.player);
      assert.equal(effects, game.effects);
      assert.equal(damage, 3);
    },
  };
  const farSpawn = {
    enemy: {
      position: { x: game.player.player.position.x + 200, y: game.player.player.position.y + 200 },
      destroyed: false,
    },
    killCalls: 0,
    kill() {
      this.killCalls += 1;
    },
  };
  game.enemySpawner.spawns = [nearSpawn, farSpawn];

  function makeBullet(x, y) {
    return {
      bullet: {
        position: { x, y },
      },
      radius: 4,
      destroyed: false,
      update() {},
      isOutOfBounds() { return false; },
      destroy() {
        this.destroyed = true;
      },
    };
  }

  const triggerBullet = makeBullet(5, 5);
  const pulseHitBullet = makeBullet(game.player.player.position.x + 15, game.player.player.position.y + 10);
  const farBullet = makeBullet(game.player.player.position.x + 200, game.player.player.position.y + 200);
  game.enemyBullets = [triggerBullet, pulseHitBullet, farBullet];

  game.player.collidesWithCircle = (x, y) => x === 5 && y === 5;
  game.player.takeDamage = () => true;
  const tickerCallbacksBeforePulse = [...app.ticker.callbacks];

  game.tick();

  const pulseAnimate = app.ticker.callbacks.find((callback) => !tickerCallbacksBeforePulse.includes(callback));
  for (let i = 0; i < 10; i += 1) pulseAnimate();

  assert.equal(nearSpawn.killCalls, 1);
  assert.equal(nearSpawn.frozen, true);
  assert.equal(nearSpawn.freezeTimer, 12);
  assert.equal(farSpawn.killCalls, 0);
  assert.equal(game.enemyBullets.includes(pulseHitBullet), false);
  assert.equal(game.enemyBullets.includes(farBullet), true);
});

test("game full-screen retaliation pulse reaches all enemies and clears bullets anywhere on screen", () => {
  const { app, game } = createGameHarness("retaliation-fullscreen");
  game.hud.update = () => {};
  game.player.update = () => {};
  game.waveManager.update = () => {};
  game.player.shooting.update = () => {};
  game.droneSystem.update = () => {};

  game.upgradeState._cachedEffects = {
    ...game.upgradeState.getActiveEffects(),
    retaliationPulseRadius: -1,
    retaliationPulseDamage: 9,
    retaliationPulseStunMs: 1500,
  };

  const spawns = [
    {
      enemy: { position: { x: 40, y: 50 }, destroyed: false },
      frozen: false,
      freezeTimer: 0,
      killCalls: 0,
      kill() { this.killCalls += 1; },
    },
    {
      enemy: { position: { x: 760, y: 560 }, destroyed: false },
      frozen: false,
      freezeTimer: 0,
      killCalls: 0,
      kill() { this.killCalls += 1; },
    },
  ];
  game.enemySpawner.spawns = spawns;
  game.enemyBullets = [
    {
      bullet: { position: { x: 30, y: 40 } },
      radius: 4,
      destroyed: false,
      update() {},
      isOutOfBounds() { return false; },
      destroy() { this.destroyed = true; },
    },
    {
      bullet: { position: { x: 700, y: 520 } },
      radius: 4,
      destroyed: false,
      update() {},
      isOutOfBounds() { return false; },
      destroy() { this.destroyed = true; },
    },
  ];

  game._triggerRetaliationPulse();

  const pulseAnimate = app.ticker.callbacks.find((callback) => callback !== game.tick);
  app.ticker.stepFrames(60);

  assert.ok(pulseAnimate);
  assert.deepEqual(spawns.map((spawn) => spawn.killCalls), [1, 1]);
  assert.deepEqual(spawns.map((spawn) => spawn.freezeTimer), [90, 90]);
  assert.equal(game.enemyBullets.length, 0);
});
