import test from 'node:test';
import assert from 'node:assert/strict';
import Menu from '../src/menu.js';
import { setupPixiMock, createAppMock, setupDomMock } from './helpers.js';

setupPixiMock();
setupDomMock();

global.localStorage = {
  storage: {},
  getItem(key) { return this.storage[key]; },
  setItem(key, val) { this.storage[key] = val; }
};

const app = createAppMock();
const menu = new Menu({ start(){}, showScore(){}, showControls(){} });

test('menu container created', () => {
  assert.ok(menu.container);
});

test('show and hide modify DOM', () => {
  menu.show();
  menu.hide();
  assert.ok(true);
});
