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

test("enemy bullet trail uses tracked app timers and clears them on destroy", () => {
  const { app, intervals } = createTimerApp();
  const enemyBullet = new EnemyBullet({
    app,
    position: { x: 10, y: 10 },
    targetPosition: { x: 20, y: 10 },
    color: 0xff0000,
  });

  enemyBullet.framesCount = 2;
  enemyBullet.updateTrail();

  assert.equal(intervals.length, 1);
  assert.equal(intervals[0].seconds, 0.03);

  enemyBullet.destroy();

  assert.equal(intervals[0].cleared, true);
  assert.equal(enemyBullet.trailTimers.size, 0);
  assert.equal(enemyBullet.trailContainer.destroyed, true);
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

test("enemy bullet trail timer fades and destroys trail graphics", () => {
  const { app, intervals } = createTimerApp();
  const enemyBullet = new EnemyBullet({
    app,
    position: { x: 10, y: 10 },
    targetPosition: { x: 20, y: 10 },
    color: 0xff0000,
  });

  enemyBullet.framesCount = 2;
  enemyBullet.updateTrail();
  const timer = intervals[0];
  const trail = enemyBullet.trailContainer.children[0];
  trail.alpha = 0.04;

  timer.fn();

  assert.equal(trail.destroyed, true);
  assert.equal(timer.cleared, true);
  assert.equal(enemyBullet.trailTimers.size, 0);
});

test("enemy bullet clears a trail timer when the trail graphic was already destroyed", () => {
  const { app, intervals } = createTimerApp();
  const enemyBullet = new EnemyBullet({
    app,
    position: { x: 10, y: 10 },
    targetPosition: { x: 20, y: 10 },
    color: 0xff0000,
  });

  enemyBullet.framesCount = 2;
  enemyBullet.updateTrail();
  const timer = intervals[0];
  const trail = enemyBullet.trailContainer.children[0];
  trail.destroy();

  timer.fn();

  assert.equal(timer.cleared, true);
  assert.equal(enemyBullet.trailTimers.size, 0);
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
