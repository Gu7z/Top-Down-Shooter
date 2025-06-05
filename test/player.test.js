import test from 'node:test';
import assert from 'node:assert/strict';
import Player from '../src/player.js';
import { setupPixiMock, createAppMock } from './helpers.js';

setupPixiMock();

const app = createAppMock();
const keys = {};

const player = new Player({ app, username: 'test', keys });

test('player initializes with zero points and one life', () => {
  assert.strictEqual(player.points, 0);
  assert.strictEqual(player.lifes, 1);
});

test('outOfBounds detects bounds correctly', () => {
  player.player.position.set(0, 0);
  player.player.width = 10;
  player.player.height = 10;
  assert.ok(player.outOfBounds('a')); // too far left
  assert.ok(player.outOfBounds('w')); // too far up
});

test('movePlayer responds to key presses', () => {
  const startX = player.player.x;
  player.movePlayer({ d: true });
  assert.strictEqual(player.player.x, startX + player.velocity);
});

test('player shooting adds bullets', () => {
  const count = player.shooting.bullets.length;
  player.shooting.fire();
  assert.strictEqual(player.shooting.bullets.length, count + 1);
});
