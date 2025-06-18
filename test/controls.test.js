import test from 'node:test';
import assert from 'node:assert/strict';
import Controls from '../src/controls.js';
import { setupPixiMock, createAppMock, setupDomMock } from './helpers.js';

setupPixiMock();
setupDomMock();
const app = createAppMock();
const controls = new Controls({ onBack: () => {} });

test('controls container created', () => {
  assert.ok(controls.container);
});

test('createButton returns element', () => {
  const btn = controls.createButton('t', () => {});
  assert.ok(btn.textContent === 't');
});
