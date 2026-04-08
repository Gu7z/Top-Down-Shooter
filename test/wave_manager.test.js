import test from "node:test";
import assert from "node:assert/strict";
import WaveManager from "../src/wave_manager.js";
import { setupPixiMock, createAppMock } from "./helpers.js";

setupPixiMock();

function createWaveManagerApp() {
  const app = createAppMock();
  const timeouts = [];
  app.setTimeout = (fn, seconds) => {
    const timer = {
      fn,
      seconds,
      cleared: false,
      clear() { this.cleared = true; },
    };
    timeouts.push(timer);
    return timer;
  };
  return { app, timeouts };
}

function createManager({ finishGame = () => {} } = {}) {
  const { app, timeouts } = createWaveManagerApp();
  const banners = [];
  const manager = new WaveManager({
    app,
    spawnerContainer: new PIXI.Container(),
    enemyBullets: [],
    renderBanner: (text, persist) => banners.push({ text, persist }),
    updateBossHud: () => {},
    finishGame,
  });

  return { app, manager, banners, timeouts };
}

test("procedural waves are capped to avoid unbounded enemy queues", () => {
  const { manager } = createManager();

  manager.startWave(1000);

  assert.equal(manager.enemiesToSpawn.length, 90);
});

test("final victory uses tracked app timeout", () => {
  let finishReason = null;
  const { manager, timeouts } = createManager({
    finishGame: (reason) => { finishReason = reason; },
  });
  const player = {
    points: 0,
    runStats: { recordWaveCompleted() {} },
  };
  const spawner = { spawns: [] };

  manager.currentWave = 30;
  manager.state = "CLEARING";
  manager.enemiesToSpawn = [];

  manager.update(player, spawner);

  assert.equal(player.points, 1000);
  assert.equal(manager.state, "ENDGAME");
  assert.equal(timeouts.length, 1);
  assert.equal(timeouts[0].seconds, 4);
  assert.equal(finishReason, null);

  timeouts[0].fn();
  assert.equal(finishReason, "victory");
});

test("destroy clears pending final victory timeout", () => {
  const { manager, timeouts } = createManager();
  const player = {
    points: 0,
    runStats: { recordWaveCompleted() {} },
  };

  manager.currentWave = 30;
  manager.state = "CLEARING";
  manager.enemiesToSpawn = [];
  manager.update(player, { spawns: [] });
  manager.destroy();

  assert.equal(timeouts[0].cleared, true);
});

test("startWave handles authored normal and boss waves", () => {
  const { manager, banners } = createManager();

  manager.startWave(1);
  assert.equal(manager.enemiesToSpawn.length, 3);
  assert.equal(banners.at(-1).text, 'W A V E  1');

  manager.startWave(5);
  assert.equal(manager.enemiesToSpawn.length, 1);
  assert.equal(manager.enemiesToSpawn[0].isBoss, true);
  assert.equal(banners.at(-1).text, 'B O S S  W A V E');
});

test("spawnSingleEnemy creates boss and normal spawns", () => {
  const { manager } = createManager();
  const spawner = { spawns: [] };

  manager.startWave(5);
  manager.spawnSingleEnemy(spawner);
  assert.equal(spawner.spawns.length, 1);
  assert.equal(manager.activeBoss, spawner.spawns[0]);

  manager.startWave(1);
  manager.spawnSingleEnemy(spawner);
  assert.equal(spawner.spawns.length, 2);
});

test("update handles starting, boss hud updates, interwave, spawning cap, and clearing", () => {
  const bossHudCalls = [];
  const { app, timeouts } = createWaveManagerApp();
  const banners = [];
  const manager = new WaveManager({
    app,
    spawnerContainer: new PIXI.Container(),
    enemyBullets: [],
    renderBanner: (text, persist) => banners.push({ text, persist }),
    updateBossHud: (...args) => bossHudCalls.push(args),
    finishGame: () => {},
  });
  const player = {
    points: 0,
    runStats: {
      recorded: [],
      recordWaveCompleted(wave) { this.recorded.push(wave); },
    },
  };

  manager.state = 'STARTING';
  manager.update(player, { spawns: [{ update() { player.points += 0; } }] });
  assert.equal(bossHudCalls.length, 0);

  manager.state = 'SPAWNING';
  manager.activeBoss = {
    enemy: { destroyed: false },
    life: 10,
    typeId: 'boss_guardiao',
    color: 0xff00ff,
  };
  manager.update(player, { spawns: [] });
  assert.equal(bossHudCalls.at(-1)[4], 'GUARDIAO');

  manager.activeBoss = { enemy: { destroyed: true }, life: 0 };
  manager.update(player, { spawns: [] });
  assert.equal(bossHudCalls.at(-1)[0], null);

  let startedWave = null;
  manager.startWave = (wave) => { startedWave = wave; };
  manager.state = 'INTERWAVE';
  manager.currentWave = 2;
  manager.interWaveTimer = 1;
  manager.update(player, { spawns: [] });
  assert.equal(startedWave, 3);

  let spawned = 0;
  manager.startWave = WaveManager.prototype.startWave.bind(manager);
  manager.state = 'SPAWNING';
  manager.spawnSingleEnemy = () => { spawned += 1; };
  manager.enemiesToSpawn = [{}];
  manager.spawnTimer = 0;
  manager.update(player, { spawns: new Array(25).fill({ update() {} }) });
  assert.equal(spawned, 0);

  manager.update(player, { spawns: [] });
  assert.equal(spawned, 1);
  assert.equal(manager.spawnTimer, manager.spawnRate);

  manager.state = 'CLEARING';
  manager.currentWave = 5;
  manager.update(player, { spawns: [] });
  assert.equal(manager.state, 'INTERWAVE');
  assert.equal(manager.interWaveTimer, 300);
  assert.equal(player.runStats.recorded.at(-1), 5);
  assert.equal(banners.at(-1).text, 'WAVE 5 COMPLETA');
  assert.equal(timeouts.length, 0);
});

test("wave manager handles empty queues and regular-wave clearing branches", () => {
  const { manager } = createManager();
  const player = {
    points: 0,
    runStats: {
      recorded: [],
      recordWaveCompleted(wave) { this.recorded.push(wave); },
    },
  };

  manager.spawnSingleEnemy({ spawns: [] });
  assert.equal(manager.activeBoss, null);

  manager.state = "SPAWNING";
  manager.enemiesToSpawn = [];
  manager.update(player, { spawns: [{ update() {} }] });
  assert.equal(manager.state, "CLEARING");

  manager.currentWave = 1;
  manager.update(player, { spawns: [] });
  assert.equal(manager.state, "INTERWAVE");
  assert.equal(manager.interWaveTimer, 240);
  assert.equal(player.runStats.recorded.at(-1), 1);
});
