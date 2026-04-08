import test from "node:test";
import assert from "node:assert/strict";
import EnemyBullet from "../src/enemy_bullet.js";
import { setupPixiMock, createAppMock } from "./helpers.js";

setupPixiMock();

test("enemy bullet supports custom speed while preserving direction", () => {
  const app = createAppMock();
  const enemyBullet = new EnemyBullet({
    app,
    position: { x: 10, y: 10 },
    targetPosition: { x: 30, y: 10 },
    color: 0xff0000,
    speed: 3.8,
  });

  enemyBullet.update();

  assert.equal(enemyBullet.bullet.position.x, 13.8);
  assert.equal(enemyBullet.bullet.position.y, 10);
});
