import test from 'node:test';
import assert from 'node:assert/strict';
import Shooting from '../src/shooting.js';
import { setupPixiMock, createAppMock } from './helpers.js';
import Player from '../src/player.js';

setupPixiMock();
const app = createAppMock();
const keys = {};
const player = new PIXI.Sprite();
player.position = { x: 0, y: 0, set(x, y) { this.x = x; this.y = y; } };
player.rotation = 0;

const shooting = new Shooting({ app, player, playerSize: 20, keys });

test('fire creates a bullet', () => {
  shooting.fire();
  assert.strictEqual(shooting.bullets.length, 1);
});
