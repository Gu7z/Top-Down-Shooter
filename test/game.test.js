import test from 'node:test';
import assert from 'node:assert/strict';
import Game from '../src/game.js';
import { setupPixiMock, createAppMock } from './helpers.js';

setupPixiMock();
const app = createAppMock();
global.window = { addEventListener() {}, removeEventListener() {} };
const game = new Game({ app, username: 'player' });

test('game creates ticker handler', () => {
  assert.ok(game.ticker !== undefined);
});
