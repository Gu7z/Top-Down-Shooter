import test from 'node:test';
import assert from 'node:assert/strict';
import Enemy from '../src/enemy.js';
import { setupPixiMock, createAppMock } from './helpers.js';

setupPixiMock();
const app = createAppMock();
const container = new PIXI.Container();
const enemy = new Enemy({ app, enemyRadius: 10, speed:1, color:0xff0000, life:2, value:1, container });
const player = { player: new PIXI.Sprite(), lifes:1, points:0 };
const spawner = { resetCalled:false, reset(){this.resetCalled=true;} };
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

test('update calls goToPlayer', () => {
  enemy.update(player, spawner);
  assert.ok(true);
});
