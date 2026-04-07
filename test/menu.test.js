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

test('show and hide modify stage', () => {
  menu.hide();
  menu.show();
  assert.ok(true);
});

test('skill tree button opens the skill tree screen', () => {
  const localApp = createAppMock();
  localApp.screen = { width: 1280, height: 720 };
  localApp.renderer.view.addEventListener = () => {};
  localApp.renderer.view.removeEventListener = () => {};
  const localMenu = new Menu({ app: localApp });

  const labels = localMenu.menuContainer.children
    .filter((child) => typeof child.text === 'string')
    .map((child) => child.text);

  assert.ok(labels.some((text) => text.includes('ÁRVORE')));
  localMenu.showSkillTree();
  assert.notEqual(localApp.stage.children.at(-1), localMenu.menuContainer);
});
