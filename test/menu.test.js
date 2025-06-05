import test from 'node:test';
import assert from 'node:assert/strict';
import Menu from '../src/menu.js';
import { setupPixiMock, createAppMock } from './helpers.js';

setupPixiMock();

global.localStorage = {
  storage: {},
  getItem(key) { return this.storage[key]; },
  setItem(key, val) { this.storage[key] = val; }
};

const app = createAppMock();

const menu = new Menu({ app });

test('menu container created', () => {
  assert.ok(menu.menuContainer.children.length > 0);
});
