import test from "node:test";
import assert from "node:assert/strict";
import Victor from "victor";
import BossEnemy from "../src/boss_enemy.js";
import { setupPixiMock, createAppMock } from "./helpers.js";

setupPixiMock();

test("boss behavior keeps attack timers finite when maxLife is zero", () => {
  const app = createAppMock();
  const boss = new BossEnemy({
    app,
    container: new PIXI.Container(),
    enemyBullets: [],
    enemyRadius: 20,
    speed: 0.5,
    color: 0xffc0cb,
    life: 0,
    value: 10,
    typeId: "boss_guardiao",
  });
  const playerSprite = new PIXI.Sprite();
  playerSprite.width = 20;
  playerSprite.position.set(100, 100);

  boss.updateBossBehavior({ player: playerSprite });

  assert.equal(Number.isFinite(boss.attackTimers.burst), true);
});

test("boss attack helpers create the expected projectile counts", () => {
  const originalWindow = global.window;
  global.window = {
    EnemyBulletClass: class {
      constructor(options) {
        this.options = options;
      }
    },
  };

  try {
    const app = createAppMock();
    const enemyBullets = [];
    const boss = new BossEnemy({
      app,
      container: new PIXI.Container(),
      enemyBullets,
      enemyRadius: 20,
      speed: 0.5,
      color: 0xffc0cb,
      life: 10,
      value: 10,
      typeId: "boss_apocalipse",
    });
    boss.enemy.position.set(0, 0);
    const playerPosition = new Victor(100, 0);

    boss.fireBurst(playerPosition, 3);
    boss.fireArc(playerPosition, 5);
    boss.fireCross();
    boss.fireSpin();

    assert.equal(enemyBullets.length, 20);
    assert.equal(enemyBullets[0].options.position.x, 0);
    assert.equal(enemyBullets[0].options.position.y, 0);
    assert.equal(enemyBullets[0].options.color, 0xffc0cb);
  } finally {
    global.window = originalWindow;
  }
});

test("boss constructor seeds attack timers for each boss type", () => {
  const app = createAppMock();
  const makeBoss = (typeId) => new BossEnemy({
    app,
    container: new PIXI.Container(),
    enemyBullets: [],
    enemyRadius: 20,
    speed: 0.5,
    color: 0xffc0cb,
    life: 10,
    value: 10,
    typeId,
  });

  assert.equal(makeBoss("boss_guardiao").attackTimers.burst, 180);
  assert.equal(makeBoss("boss_destruidor").attackTimers.spin, 480);
  assert.equal(makeBoss("boss_colosso").attackTimers.cross, 150);
  assert.equal(makeBoss("boss_supremo").attackTimers.arc, 200);
  assert.equal(makeBoss("boss_predador").attackTimers.spin, 350);
  assert.equal(makeBoss("boss_apocalipse").attackTimers.cross, 110);
});

test("boss behavior handles knockback branch before attacks", () => {
  const app = createAppMock();
  const boss = new BossEnemy({
    app,
    container: new PIXI.Container(),
    enemyBullets: [],
    enemyRadius: 20,
    speed: 0.5,
    color: 0xffc0cb,
    life: 10,
    value: 10,
    typeId: "boss_guardiao",
  });
  const playerSprite = new PIXI.Sprite();
  playerSprite.width = 20;
  playerSprite.position.set(100, 100);
  boss.enemy.position.set(0, 0);
  boss.knockbackVelocity = { x: 10, y: 0 };

  boss.updateBossBehavior({ player: playerSprite });

  assert.equal(boss.enemy.position.x, 10);
  assert.ok(boss.knockbackVelocity.x < 10);
});

test("boss behavior triggers attack patterns for non-guard bosses", () => {
  const app = createAppMock();
  const boss = new BossEnemy({
    app,
    container: new PIXI.Container(),
    enemyBullets: [],
    enemyRadius: 20,
    speed: 0.5,
    color: 0xffc0cb,
    life: 10,
    value: 10,
    typeId: "boss_apocalipse",
  });
  const playerSprite = new PIXI.Sprite();
  playerSprite.width = 20;
  playerSprite.position.set(100, 0);
  boss.enemy.position.set(0, 0);
  boss.attackTimers = { burst: 0, arc: 0, spin: 0, cross: 0 };
  const calls = [];
  boss.fireBurst = (target, count) => calls.push(["burst", count]);
  boss.fireArc = (target, count) => calls.push(["arc", count]);
  boss.fireSpin = () => calls.push(["spin"]);
  boss.fireCross = () => calls.push(["cross"]);

  boss.updateBossBehavior({ player: playerSprite });

  assert.deepEqual(calls, [
    ["burst", 7],
    ["arc", 9],
    ["spin"],
    ["cross"],
  ]);
});

test("boss createBullet safely returns when no bullet class is available", () => {
  const originalWindow = global.window;
  global.window = {};

  try {
    const app = createAppMock();
    const enemyBullets = [];
    const boss = new BossEnemy({
      app,
      container: new PIXI.Container(),
      enemyBullets,
      enemyRadius: 20,
      speed: 0.5,
      color: 0xffc0cb,
      life: 10,
      value: 10,
      typeId: "boss_guardiao",
    });

    boss.createBullet(new Victor(10, 0));

    assert.equal(enemyBullets.length, 0);
  } finally {
    global.window = originalWindow;
  }
});

test("boss update handles frozen branch and melee collision", () => {
  const app = createAppMock();
  const boss = new BossEnemy({
    app,
    container: new PIXI.Container(),
    enemyBullets: [],
    enemyRadius: 20,
    speed: 0.5,
    color: 0xffc0cb,
    life: 10,
    value: 10,
    typeId: "boss_guardiao",
  });
  const playerSprite = new PIXI.Sprite();
  playerSprite.width = 40;
  playerSprite.position.set(0, 0);
  boss.enemy.position.set(0, 0);
  boss.frozen = true;
  boss.freezeTimer = 1;
  let removed = 0;
  boss.removePlayerLife = () => { removed += 1; };
  boss.updateBossBehavior = () => {};

  boss.update({ player: playerSprite }, { spawns: [boss] });

  assert.equal(boss.frozen, false);
  assert.equal(removed, 1);
});

test("boss behavior resets tiny knockback velocity to zero", () => {
  const app = createAppMock();
  const boss = new BossEnemy({
    app,
    container: new PIXI.Container(),
    enemyBullets: [],
    enemyRadius: 20,
    speed: 0.5,
    color: 0xffc0cb,
    life: 10,
    value: 10,
    typeId: "boss_guardiao",
  });
  const playerSprite = new PIXI.Sprite();
  playerSprite.width = 20;
  playerSprite.position.set(100, 100);
  boss.knockbackVelocity = { x: 0.05, y: 0.05 };

  boss.updateBossBehavior({ player: playerSprite });

  assert.equal(boss.knockbackVelocity.x, 0);
  assert.equal(boss.knockbackVelocity.y, 0);
});

test("boss behavior triggers and resets timers for all named patterns", () => {
  const cases = [
    {
      typeId: "boss_guardiao",
      expectedCalls: [["burst", 3]],
      expectedTimers: { burst: 180 },
    },
    {
      typeId: "boss_destruidor",
      expectedCalls: [["arc", 5], ["spin"]],
      expectedTimers: { arc: 180, spin: 480 },
    },
    {
      typeId: "boss_colosso",
      expectedCalls: [["cross"], ["arc", 3]],
      expectedTimers: { cross: 150, arc: 240 },
    },
    {
      typeId: "boss_supremo",
      expectedCalls: [["burst", 3], ["arc", 5], ["spin"]],
      expectedTimers: { burst: 120, arc: 200, spin: 400 },
    },
    {
      typeId: "boss_predador",
      expectedCalls: [["burst", 5], ["arc", 7], ["spin"]],
      expectedTimers: { burst: 90, arc: 150, spin: 350 },
    },
  ];

  for (const { typeId, expectedCalls, expectedTimers } of cases) {
    const app = createAppMock();
    const boss = new BossEnemy({
      app,
      container: new PIXI.Container(),
      enemyBullets: [],
      enemyRadius: 20,
      speed: 0.5,
      color: 0xffc0cb,
      life: 10,
      value: 10,
      typeId,
    });
    const playerSprite = new PIXI.Sprite();
    playerSprite.width = 20;
    playerSprite.position.set(100, 0);
    boss.enemy.position.set(0, 0);
    boss.attackTimers = { burst: 0, arc: 0, spin: 0, cross: 0 };
    const calls = [];

    boss.fireBurst = (target, count) => calls.push(["burst", count]);
    boss.fireArc = (target, count) => calls.push(["arc", count]);
    boss.fireSpin = () => calls.push(["spin"]);
    boss.fireCross = () => calls.push(["cross"]);

    boss.updateBossBehavior({ player: playerSprite });

    assert.deepEqual(calls, expectedCalls);
    Object.entries(expectedTimers).forEach(([timerName, expectedValue]) => {
      assert.equal(boss.attackTimers[timerName], expectedValue);
    });
  }
});

test("boss update returns early when destroyed or still frozen", () => {
  const app = createAppMock();
  const boss = new BossEnemy({
    app,
    container: new PIXI.Container(),
    enemyBullets: [],
    enemyRadius: 20,
    speed: 0.5,
    color: 0xffc0cb,
    life: 10,
    value: 10,
    typeId: "boss_guardiao",
  });
  const playerSprite = new PIXI.Sprite();
  playerSprite.width = 40;
  playerSprite.position.set(0, 0);

  let behaviorCalls = 0;
  let meleeCalls = 0;
  boss.updateBossBehavior = () => { behaviorCalls += 1; };
  boss.removePlayerLife = () => { meleeCalls += 1; };

  boss.enemy.destroyed = true;
  boss.update({ player: playerSprite }, { spawns: [boss] });

  boss.enemy.destroyed = false;
  boss.frozen = true;
  boss.freezeTimer = 2;
  boss.update({ player: playerSprite }, { spawns: [boss] });

  assert.equal(behaviorCalls, 0);
  assert.equal(meleeCalls, 0);
  assert.equal(boss.frozen, true);
});
