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
  assert.equal(makeBoss("boss_sniper").attackTimers.snipe, 120);
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
  playerSprite.position.set(180, 80);
  boss.enemy.position.set(80, 80);
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

test("boss enters the screen before using combat behavior", () => {
  const app = createAppMock();
  const boss = new BossEnemy({
    app,
    container: new PIXI.Container(),
    enemyBullets: [],
    enemyRadius: 20,
    speed: 1,
    color: 0xffc0cb,
    life: 10,
    value: 10,
    typeId: "boss_guardiao",
  });
  const playerSprite = new PIXI.Sprite();
  playerSprite.width = 20;
  playerSprite.position.set(400, 300);
  boss.enemy.position.set(-40, 280);
  boss.enemyLifeText.position.set(-40, 280);
  boss.attackTimers.burst = 0;
  let burstCalls = 0;
  boss.fireBurst = () => { burstCalls += 1; };

  boss.updateBossBehavior({ player: playerSprite });

  assert.ok(boss.enemy.position.x > -40);
  assert.ok(Math.abs(boss.enemy.position.y - 280) < 0.2);
  assert.equal(burstCalls, 0);
});

test("guardiao prefers orbital movement at standoff range", () => {
  const app = createAppMock();
  const boss = new BossEnemy({
    app,
    container: new PIXI.Container(),
    enemyBullets: [],
    enemyRadius: 20,
    speed: 1,
    color: 0xffc0cb,
    life: 10,
    value: 10,
    typeId: "boss_guardiao",
  });
  const playerSprite = new PIXI.Sprite();
  playerSprite.width = 20;
  playerSprite.position.set(340, 120);
  boss.enemy.position.set(120, 120);
  boss.orbitDirection = 1;
  const startX = boss.enemy.position.x;
  const startY = boss.enemy.position.y;

  boss.updateBossBehavior({ player: playerSprite });

  const deltaX = boss.enemy.position.x - startX;
  const deltaY = boss.enemy.position.y - startY;
  assert.ok(Math.abs(deltaY) > 0.2);
  assert.ok(Math.abs(deltaY) > Math.abs(deltaX));
});

test("active boss movement stays inside visible screen bounds", () => {
  const app = createAppMock();
  const boss = new BossEnemy({
    app,
    container: new PIXI.Container(),
    enemyBullets: [],
    enemyRadius: 20,
    speed: 40,
    color: 0xffc0cb,
    life: 10,
    value: 10,
    typeId: "boss_guardiao",
  });
  const playerSprite = new PIXI.Sprite();
  playerSprite.width = 20;
  playerSprite.position.set(60, 25);
  boss.enemy.position.set(25, 25);
  boss.enemyLifeText.position.set(25, 25);

  boss.updateBossBehavior({ player: playerSprite });

  assert.ok(boss.enemy.position.x >= boss.enemyRadius);
  assert.ok(boss.enemy.position.y >= boss.enemyRadius);
  assert.ok(boss.enemy.position.x <= app.screen.width - boss.enemyRadius);
  assert.ok(boss.enemy.position.y <= app.screen.height - boss.enemyRadius);
});

test("sniper retreats to widen distance from the player", () => {
  const app = createAppMock();
  const boss = new BossEnemy({
    app,
    container: new PIXI.Container(),
    enemyBullets: [],
    enemyRadius: 20,
    speed: 1,
    color: 0xffc0cb,
    life: 10,
    value: 10,
    typeId: "boss_sniper",
  });
  const playerSprite = new PIXI.Sprite();
  playerSprite.width = 20;
  playerSprite.position.set(360, 140);
  boss.enemy.position.set(500, 140);
  boss.enemyLifeText.position.set(500, 140);
  const startDistance = Math.hypot(
    boss.enemy.position.x - playerSprite.position.x,
    boss.enemy.position.y - playerSprite.position.y,
  );

  boss.updateBossBehavior({ player: playerSprite });

  const endDistance = Math.hypot(
    boss.enemy.position.x - playerSprite.position.x,
    boss.enemy.position.y - playerSprite.position.y,
  );
  const xDelta = boss.enemy.position.x - 500;
  const yDelta = boss.enemy.position.y - 140;
  assert.ok(endDistance > startDistance);
  assert.ok(xDelta > 1.4);
  assert.ok(Math.abs(yDelta) < 0.2);
});

test("sniper burst reposition favors opening distance over strafing when pressured", () => {
  const app = createAppMock();
  const boss = new BossEnemy({
    app,
    container: new PIXI.Container(),
    enemyBullets: [],
    enemyRadius: 20,
    speed: 1,
    color: 0xffc0cb,
    life: 10,
    value: 10,
    typeId: "boss_sniper",
  });
  const playerSprite = new PIXI.Sprite();
  playerSprite.width = 20;
  playerSprite.position.set(360, 140);
  boss.enemy.position.set(500, 140);
  boss.enemyLifeText.position.set(500, 140);
  boss.orbitDirection = 1;
  boss.burstCooldown = 0;
  const startX = boss.enemy.position.x;
  const startY = boss.enemy.position.y;

  boss.updateBossBehavior({ player: playerSprite });

  const xDelta = boss.enemy.position.x - startX;
  const yDelta = boss.enemy.position.y - startY;
  const moved = Math.hypot(xDelta, yDelta);
  assert.ok(moved > boss.speed * 2.7);
  assert.ok(xDelta > 2.5);
  assert.ok(Math.abs(yDelta) < 0.25);
});

test("sniper closes distance when the player is too far away", () => {
  const app = createAppMock();
  const boss = new BossEnemy({
    app,
    container: new PIXI.Container(),
    enemyBullets: [],
    enemyRadius: 20,
    speed: 1,
    color: 0xffc0cb,
    life: 10,
    value: 10,
    typeId: "boss_sniper",
  });
  const playerSprite = new PIXI.Sprite();
  playerSprite.width = 20;
  playerSprite.position.set(120, 140);
  boss.enemy.position.set(680, 140);
  boss.enemyLifeText.position.set(680, 140);
  const startDistance = Math.hypot(
    boss.enemy.position.x - playerSprite.position.x,
    boss.enemy.position.y - playerSprite.position.y,
  );

  boss.updateBossBehavior({ player: playerSprite });

  const endDistance = Math.hypot(
    boss.enemy.position.x - playerSprite.position.x,
    boss.enemy.position.y - playerSprite.position.y,
  );
  const xDelta = boss.enemy.position.x - 680;
  const yDelta = boss.enemy.position.y - 140;
  assert.ok(endDistance < startDistance);
  assert.ok(xDelta < -1.1);
  assert.ok(Math.abs(yDelta) < 0.5);
});

test("sniper fires a predictive shot using the current sniper bullet speed", () => {
  const app = createAppMock();
  const boss = new BossEnemy({
    app,
    container: new PIXI.Container(),
    enemyBullets: [],
    enemyRadius: 20,
    speed: 1,
    color: 0xffc0cb,
    life: 10,
    value: 10,
    typeId: "boss_sniper",
  });
  boss.enemy.position.set(620, 180);
  boss.enemyLifeText.position.set(620, 180);
  boss.playerVelocityEstimate = new Victor(30, 0);
  const shots = [];
  boss.createBullet = (targetPos, options) => {
    shots.push({ targetPos, options });
  };

  boss.fireSniperShot(new Victor(250, 180));

  assert.equal(shots.length, 1);
  assert.ok(Math.abs(shots[0].targetPos.x - 370) < 0.001);
  assert.equal(shots[0].targetPos.y, 180);
  assert.equal(shots[0].options.speed, 6.0);
  assert.equal(shots[0].options.coreColor, 0xffffff);
  assert.equal(shots[0].options.ringColor, 0xff66ff);
  assert.equal(shots[0].options.glowColor, 0xff66ff);
  assert.equal(shots[0].options.trailColor, 0xf0d8ff);
});

test("sniper predictive shot clamps extreme lead to the visible screen", () => {
  const app = createAppMock();
  const boss = new BossEnemy({
    app,
    container: new PIXI.Container(),
    enemyBullets: [],
    enemyRadius: 20,
    speed: 1,
    color: 0xffc0cb,
    life: 10,
    value: 10,
    typeId: "boss_sniper",
  });
  boss.enemy.position.set(120, 180);
  boss.enemyLifeText.position.set(120, 180);
  boss.playerVelocityEstimate = new Victor(5, 0);
  const shots = [];
  boss.createBullet = (targetPos, options) => {
    shots.push({ targetPos, options });
  };

  boss.fireSniperShot(new Victor(760, 180));

  assert.equal(shots.length, 1);
  assert.equal(shots[0].targetPos.x, app.screen.width);
  assert.equal(shots[0].targetPos.y, 180);
  assert.equal(shots[0].options.speed, 6.0);
});

test("colosso closes space on a diagonal instead of charging in a straight line", () => {
  const app = createAppMock();
  const boss = new BossEnemy({
    app,
    container: new PIXI.Container(),
    enemyBullets: [],
    enemyRadius: 20,
    speed: 1,
    color: 0xffc0cb,
    life: 10,
    value: 10,
    typeId: "boss_colosso",
  });
  const playerSprite = new PIXI.Sprite();
  playerSprite.width = 20;
  playerSprite.position.set(360, 120);
  boss.enemy.position.set(120, 120);
  boss.orbitDirection = 1;
  const startX = boss.enemy.position.x;
  const startY = boss.enemy.position.y;

  boss.updateBossBehavior({ player: playerSprite });

  assert.ok((boss.enemy.position.x - startX) > 0.2);
  assert.ok(Math.abs(boss.enemy.position.y - startY) > 0.05);
});

test("predador burst reposition exceeds base speed and flanks the player", () => {
  const app = createAppMock();
  const boss = new BossEnemy({
    app,
    container: new PIXI.Container(),
    enemyBullets: [],
    enemyRadius: 20,
    speed: 1,
    color: 0xffc0cb,
    life: 10,
    value: 10,
    typeId: "boss_predador",
  });
  const playerSprite = new PIXI.Sprite();
  playerSprite.width = 20;
  playerSprite.position.set(260, 120);
  boss.enemy.position.set(120, 120);
  boss.orbitDirection = 1;
  boss.burstCooldown = 0;
  const startX = boss.enemy.position.x;
  const startY = boss.enemy.position.y;

  boss.updateBossBehavior({ player: playerSprite });

  const moved = Math.hypot(boss.enemy.position.x - startX, boss.enemy.position.y - startY);
  assert.ok(moved > boss.speed * 1.5);
  assert.ok(Math.abs(boss.enemy.position.y - startY) > 0.05);
});

test("boss behavior triggers and resets timers for all named patterns", () => {
  const cases = [
    {
      typeId: "boss_guardiao",
      expectedCalls: [["burst", 3]],
      expectedTimers: { burst: 180 },
    },
    {
      typeId: "boss_sniper",
      expectedCalls: [["snipe"]],
      expectedTimers: { snipe: 120 },
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
    playerSprite.position.set(180, 80);
    boss.enemy.position.set(80, 80);
    boss.attackTimers = { burst: 0, arc: 0, spin: 0, cross: 0, snipe: 0 };
    const calls = [];

    boss.fireBurst = (target, count) => calls.push(["burst", count]);
    boss.fireArc = (target, count) => calls.push(["arc", count]);
    boss.fireSpin = () => calls.push(["spin"]);
    boss.fireCross = () => calls.push(["cross"]);
    boss.fireSniperShot = () => calls.push(["snipe"]);

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
