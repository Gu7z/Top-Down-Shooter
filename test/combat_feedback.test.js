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
  assert.strictEqual(s.fontSize, 20);
  assert.strictEqual(s.color, 0x888888);
});

test('damage 4-7: medium cyan number', () => {
  const s = pickNumberStyle(6, false);
  assert.strictEqual(s.text, '6');
  assert.strictEqual(s.fontSize, 26);
  assert.strictEqual(s.color, 0x00FFFF);
});

test('damage 8-14: large orange number', () => {
  const s = pickNumberStyle(10, false);
  assert.strictEqual(s.text, '10');
  assert.strictEqual(s.fontSize, 32);
  assert.strictEqual(s.color, 0xFF9900);
});

test('damage 15+: XL magenta number', () => {
  const s = pickNumberStyle(20, false);
  assert.strictEqual(s.text, '20');
  assert.strictEqual(s.fontSize, 40);
  assert.strictEqual(s.color, 0xFF00FF);
});

test('crit: CRIT prefix, +6px size, magenta', () => {
  const s = pickNumberStyle(6, true);
  assert.strictEqual(s.text, 'CRIT 6');
  assert.strictEqual(s.fontSize, 34); // 18 + 6
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
  assert.strictEqual(s.fontSize, 20);
  assert.strictEqual(s.color, 0x888888);
});

test('damage 4: boundary of medium tier', () => {
  const s = pickNumberStyle(4, false);
  assert.strictEqual(s.fontSize, 26);
  assert.strictEqual(s.color, 0x00FFFF);
});

test('damage 14: boundary of large tier', () => {
  const s = pickNumberStyle(14, false);
  assert.strictEqual(s.fontSize, 32);
  assert.strictEqual(s.color, 0xFF9900);
});

test('damage 15: boundary of XL tier', () => {
  const s = pickNumberStyle(15, false);
  assert.strictEqual(s.fontSize, 40);
  assert.strictEqual(s.color, 0xFF00FF);
});

// --- Pool setup ---

test('constructor adds 16 containers to stage', () => {
  const app = createAppMock();
  initCombatFeedback(app);
  const containers = app.stage.children.filter(c => c.constructor === PIXI.Container);
  assert.strictEqual(containers.length, 16);
});

test('all pool slots start invisible', () => {
  const app = createAppMock();
  initCombatFeedback(app);
  const containers = app.stage.children.filter(c => c.constructor === PIXI.Container);
  containers.forEach(c => assert.strictEqual(c.visible, false));
});

// --- spawnDamageNumber ---

test('spawnDamageNumber makes a slot visible with correct text', () => {
  const app = createAppMock();
  initCombatFeedback(app);
  spawn(100, 200, 10, false);
  const visible = app.stage.children
    .filter(c => c.constructor === PIXI.Container && c.visible);
  assert.strictEqual(visible.length, 1);
  const text = visible[0].children[0];
  assert.strictEqual(text.text, '10');
});

test('spawnDamageNumber sets position on the container', () => {
  const app = createAppMock();
  initCombatFeedback(app);
  spawn(120, 240, 5, false);
  const active = app.stage.children.find(
    c => c.constructor === PIXI.Container && c.visible
  );
  assert.strictEqual(active.position.x, 120);
  assert.strictEqual(active.position.y, 240);
});

test('crit spawn sets CRIT prefix text', () => {
  const app = createAppMock();
  initCombatFeedback(app);
  spawn(0, 0, 8, true);
  const active = app.stage.children.find(
    c => c.constructor === PIXI.Container && c.visible
  );
  assert.ok(active.children[0].text.startsWith('CRIT'));
});

test('spawning 17 numbers recycles oldest (max 16 visible)', () => {
  const app = createAppMock();
  initCombatFeedback(app);
  for (let i = 0; i < 17; i++) spawn(i, 0, 5, false);
  const visible = app.stage.children.filter(
    c => c.constructor === PIXI.Container && c.visible
  );
  assert.strictEqual(visible.length, 16);
});

// --- Animation lifecycle ---

test('slot returns to inactive after 200 frames', () => {
  const app = createAppMock();
  initCombatFeedback(app);
  spawn(0, 0, 5, false);
  app.ticker.stepFrames(200);
  const visible = app.stage.children.filter(
    c => c.constructor === PIXI.Container && c.visible
  );
  assert.strictEqual(visible.length, 0);
});

test('container floats upward during frames 32-152', () => {
  const app = createAppMock();
  initCombatFeedback(app);
  spawn(100, 200, 5, false);
  app.ticker.stepFrames(32);
  const slot = app.stage.children.find(
    c => c.constructor === PIXI.Container && c.visible
  );
  const yAfterPopIn = slot.position.y;
  app.ticker.stepFrames(10);
  assert.ok(slot.position.y < yAfterPopIn, 'container should have moved upward');
});

// --- spawnDeathEffect ---

test('spawnDeathEffect adds a Graphics ring to stage', () => {
  const app = createAppMock();
  initCombatFeedback(app);
  const before = app.stage.children.length;
  spawnDeathEffect(200, 200, 0xFF3366, false);
  assert.ok(app.stage.children.length > before);
});

test('boss death adds two rings', () => {
  const app = createAppMock();
  initCombatFeedback(app);
  const before = app.stage.children.length;
  spawnDeathEffect(200, 200, 0xFF00FF, true);
  assert.strictEqual(app.stage.children.length, before + 2);
});

test('nova ring removes itself from stage after 100 frames', () => {
  const app = createAppMock();
  initCombatFeedback(app);
  spawnDeathEffect(100, 100, 0xFF3366, false);
  const ringsBefore = app.stage.children.filter(
    c => c.constructor === PIXI.Graphics
  ).length;
  app.ticker.stepFrames(101);
  const ringsAfter = app.stage.children.filter(
    c => c.constructor === PIXI.Graphics
  ).length;
  assert.ok(ringsAfter < ringsBefore, 'ring should be removed after animation');
});
