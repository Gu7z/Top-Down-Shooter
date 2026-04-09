import test from 'node:test';
import assert from 'node:assert/strict';
import { setupPixiMock, createAppMock } from './helpers.js';
import {
  pickNumberStyle,
  initCombatFeedback,
  spawnDamageNumber as spawn,
  spawnDeathEffect,
} from '../src/combat_feedback.js';

setupPixiMock();

// --- pickNumberStyle ---

test('damage 1-3: small gray number', () => {
  const s = pickNumberStyle(2, false);
  assert.strictEqual(s.text, '2');
  assert.strictEqual(s.fontSize, 14);
  assert.strictEqual(s.color, 0x888888);
});

test('damage 4-7: medium cyan number', () => {
  const s = pickNumberStyle(6, false);
  assert.strictEqual(s.text, '6');
  assert.strictEqual(s.fontSize, 18);
  assert.strictEqual(s.color, 0x00FFFF);
});

test('damage 8-14: large orange number', () => {
  const s = pickNumberStyle(10, false);
  assert.strictEqual(s.text, '10');
  assert.strictEqual(s.fontSize, 22);
  assert.strictEqual(s.color, 0xFF9900);
});

test('damage 15+: XL magenta number', () => {
  const s = pickNumberStyle(20, false);
  assert.strictEqual(s.text, '20');
  assert.strictEqual(s.fontSize, 28);
  assert.strictEqual(s.color, 0xFF00FF);
});

test('crit: CRIT prefix, +6px size, magenta', () => {
  const s = pickNumberStyle(6, true);
  assert.strictEqual(s.text, 'CRIT 6');
  assert.strictEqual(s.fontSize, 24); // 18 + 6
  assert.strictEqual(s.color, 0xFF00FF);
});

test('crit always magenta regardless of damage tier', () => {
  const low = pickNumberStyle(2, true);
  const high = pickNumberStyle(30, true);
  assert.strictEqual(low.color, 0xFF00FF);
  assert.strictEqual(high.color, 0xFF00FF);
});

test('damage 3: boundary of small tier', () => {
  const s = pickNumberStyle(3, false);
  assert.strictEqual(s.fontSize, 14);
  assert.strictEqual(s.color, 0x888888);
});

test('damage 4: boundary of medium tier', () => {
  const s = pickNumberStyle(4, false);
  assert.strictEqual(s.fontSize, 18);
  assert.strictEqual(s.color, 0x00FFFF);
});

test('damage 14: boundary of large tier', () => {
  const s = pickNumberStyle(14, false);
  assert.strictEqual(s.fontSize, 22);
  assert.strictEqual(s.color, 0xFF9900);
});

test('damage 15: boundary of XL tier', () => {
  const s = pickNumberStyle(15, false);
  assert.strictEqual(s.fontSize, 28);
  assert.strictEqual(s.color, 0xFF00FF);
});
