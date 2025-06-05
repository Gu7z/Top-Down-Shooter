import test from 'node:test';
import assert from 'node:assert/strict';
import Enemy from '../src/enemy.js';
import { setupPixiMock, createAppMock } from './helpers.js';

setupPixiMock();
const app = createAppMock();
const container = new PIXI.Container();
const enemy = new Enemy({ app, enemyRadius: 10, speed:1, color:0xff0000, life:1, value:1, container });

test('randomPosition returns Victor instance', () => {
  const pos = enemy.randomPosition();
  assert.strictEqual(typeof pos.x, 'number');
  assert.strictEqual(typeof pos.y, 'number');
});
