import test from "node:test";
import assert from "node:assert/strict";
import EnemyBullet from "../src/enemy_bullet.js";
import { setupPixiMock, createAppMock } from "./helpers.js";

setupPixiMock();

function createTimerApp() {
  const app = createAppMock();
  const intervals = [];

  app.setInterval = (fn, seconds) => {
    const timer = {
      fn,
      seconds,
      cleared: false,
      clear() {
        this.cleared = true;
      },
    };
    intervals.push(timer);
    return timer;
  };

  return { app, intervals };
}

test("enemy bullet trail stays frame-driven without per-trail intervals", () => {
  const { app, intervals } = createTimerApp();
  const enemyBullet = new EnemyBullet({
    app,
    position: { x: 10, y: 10 },
    targetPosition: { x: 20, y: 10 },
    color: 0xff0000,
  });

  enemyBullet.framesCount = 2;
  enemyBullet.updateTrail();

  assert.equal(intervals.length, 0);
  assert.equal(enemyBullet.trailNodes.length, 1);
  assert.equal(enemyBullet.trailContainer.children.length, 1);
  assert.equal(enemyBullet.trailContainer.children[0].alpha, enemyBullet.trailAlpha);

  enemyBullet.updateTrail();

  assert.equal(enemyBullet.trailNodes.length, 1);
  assert.equal(enemyBullet.trailContainer.children.length, 1);
  assert.equal(enemyBullet.trailContainer.children[0].alpha, enemyBullet.trailAlpha);
  assert.equal(enemyBullet.trailContainer.children[0].scale.x, 1);
  assert.equal(enemyBullet.trailContainer.children[0].scale.y, 1);

  enemyBullet.updateTrail();

  assert.equal(enemyBullet.trailNodes.length, 1);
  assert.equal(enemyBullet.trailContainer.children.length, 1);
  assert.equal(enemyBullet.trailContainer.children[0].alpha, enemyBullet.trailAlpha - 0.05);
  assert.equal(enemyBullet.trailContainer.children[0].scale.x, 0.9);
  assert.equal(enemyBullet.trailContainer.children[0].scale.y, 0.9);
});

test("enemy bullet trail nodes detach from the container on expiration", () => {
  const { app } = createTimerApp();
  const enemyBullet = new EnemyBullet({
    app,
    position: { x: 10, y: 10 },
    targetPosition: { x: 20, y: 10 },
    color: 0xff0000,
  });

  enemyBullet.framesCount = 2;
  enemyBullet.updateTrail();

  assert.equal(enemyBullet.trailNodes.length, 1);
  assert.equal(enemyBullet.trailContainer.children.length, 1);

  for (let i = 0; i < 18; i += 1) {
    enemyBullet._updateTrailNodes();
  }

  assert.equal(enemyBullet.trailNodes.length, 0);
  assert.equal(enemyBullet.trailContainer.children.length, 0);
});

test("enemy bullet removes stale destroyed trail sprites from the container", () => {
  const { app } = createTimerApp();
  const enemyBullet = new EnemyBullet({
    app,
    position: { x: 10, y: 10 },
    targetPosition: { x: 20, y: 10 },
    color: 0xff0000,
  });

  enemyBullet.framesCount = 2;
  enemyBullet.updateTrail();

  const trail = enemyBullet.trailContainer.children[0];
  trail.destroy();

  enemyBullet._updateTrailNodes();

  assert.equal(enemyBullet.trailNodes.length, 0);
  assert.equal(enemyBullet.trailContainer.children.length, 0);
});

test("enemy bullet spawns trail nodes on the third and sixth updates", () => {
  const { app } = createTimerApp();
  const enemyBullet = new EnemyBullet({
    app,
    position: { x: 10, y: 10 },
    targetPosition: { x: 20, y: 10 },
    color: 0xff0000,
  });

  enemyBullet.update();
  enemyBullet.update();
  assert.equal(enemyBullet.trailContainer.children.length, 0);

  enemyBullet.update();
  assert.equal(enemyBullet.trailContainer.children.length, 1);

  enemyBullet.update();
  enemyBullet.update();
  assert.equal(enemyBullet.trailContainer.children.length, 1);

  enemyBullet.update();
  assert.equal(enemyBullet.trailContainer.children.length, 2);
});

test("enemy bullet updates position and reports out-of-bounds", () => {
  const { app } = createTimerApp();
  app.screen = { width: 100, height: 100 };
  const enemyBullet = new EnemyBullet({
    app,
    position: { x: 10, y: 10 },
    targetPosition: { x: 20, y: 10 },
    color: 0xff0000,
  });

  enemyBullet.update();

  assert.equal(enemyBullet.bullet.position.x, 11.4);
  assert.equal(enemyBullet.bullet.position.y, 10);
  assert.equal(enemyBullet.isOutOfBounds(), false);

  enemyBullet.bullet.position.set(105, 10);
  assert.equal(enemyBullet.isOutOfBounds(), true);
});

test("enemy bullet stress burst does not fan out trail timers", () => {
  const { app, intervals } = createTimerApp();
  const bullets = [];
  for (let i = 0; i < 40; i += 1) {
    bullets.push(new EnemyBullet({
      app,
      position: { x: 10, y: 10 + i },
      targetPosition: { x: 200, y: 10 + i },
      color: 0xff0000,
    }));
  }

  for (let frame = 0; frame < 60; frame += 1) {
    for (const bullet of bullets) bullet.update();
  }

  assert.equal(intervals.length, 0);
});

test("enemy bullet destroy clears trail nodes", () => {
  const { app } = createTimerApp();
  const enemyBullet = new EnemyBullet({
    app,
    position: { x: 10, y: 10 },
    targetPosition: { x: 20, y: 10 },
    color: 0xff0000,
  });

  enemyBullet.framesCount = 2;
  enemyBullet.updateTrail();

  enemyBullet.destroy();

  assert.equal(enemyBullet.trailNodes.length, 0);
  assert.equal(enemyBullet.trailContainer.parent, null);
  assert.equal(app.stage.children.includes(enemyBullet.trailContainer), false);
  assert.equal(enemyBullet.trailContainer.children.length, 0);
  assert.equal(enemyBullet.trailContainer.destroyed, true);
});

test("enemy bullet update and destroy are no-ops after destruction", () => {
  const { app } = createTimerApp();
  const enemyBullet = new EnemyBullet({
    app,
    position: { x: 10, y: 10 },
    targetPosition: { x: 20, y: 10 },
    color: 0xff0000,
  });
  const startX = enemyBullet.bullet.position.x;

  enemyBullet.destroy();
  enemyBullet.destroy();
  enemyBullet.update();

  assert.equal(enemyBullet.bullet.position.x, startX);
  assert.equal(enemyBullet.trailContainer.destroyed, true);
});

test("enemy bullet supports layered contrast styling and brighter trails", () => {
  const { app } = createTimerApp();
  const enemyBullet = new EnemyBullet({
    app,
    position: { x: 10, y: 10 },
    targetPosition: { x: 20, y: 10 },
    color: 0x7a6cff,
    coreColor: 0xffffff,
    fillAlpha: 1,
    ringColor: 0xff66ff,
    ringWidth: 2,
    ringAlpha: 1,
    glowColor: 0xff66ff,
    glowAlpha: 0.35,
    glowScale: 1.9,
    trailColor: 0xf0d8ff,
    trailAlpha: 0.55,
    trailScale: 1.05,
  });

  enemyBullet.framesCount = 2;
  enemyBullet.updateTrail();

  assert.equal(enemyBullet.bullet.children.length, 2);
  assert.equal(enemyBullet.trailContainer.children.length, 1);
  assert.equal(enemyBullet.trailContainer.children[0].alpha, 0.55);
});
