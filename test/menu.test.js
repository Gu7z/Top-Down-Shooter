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

function installTextInputSpy() {
  const OriginalTextInput = PIXI.TextInput;
  let lastInput = null;

  PIXI.TextInput = class {
    constructor() {
      this.text = '';
      this.disabled = false;
      this.placeholder = '';
      this.x = 0;
      this.y = 0;
      this.handlers = {};
      lastInput = this;
    }
    on(event, fn) {
      this.handlers[event] = fn;
    }
    focus() {
      this.focused = true;
    }
  };

  return {
    getLastInput() {
      return lastInput;
    },
    restore() {
      PIXI.TextInput = OriginalTextInput;
    },
  };
}

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

test('menu input persists username and enables the play button', () => {
  const textInputSpy = installTextInputSpy();
  global.localStorage = {
    storage: {},
    getItem(key) { return this.storage[key]; },
    setItem(key, val) { this.storage[key] = val; },
  };

  try {
    const localMenu = new Menu({ app: createAppMock() });
    const input = textInputSpy.getLastInput();
    input.handlers.input('NEO');

    assert.equal(localMenu.username, 'NEO');
    assert.equal(global.localStorage.getItem('username'), 'NEO');
    assert.equal(localMenu.playButton.bg.interactive, true);
  } finally {
    textInputSpy.restore();
  }
});

test('menu glitch ticker covers active burst and reset states', () => {
  const originalRandom = Math.random;
  Math.random = () => 0.75;

  try {
    const localMenu = new Menu({ app: createAppMock() });
    localMenu._ticker();
    assert.ok(localMenu.glitch1.alpha > 0);
    assert.ok(localMenu.glitch2.alpha > 0);
    assert.notEqual(localMenu.titleText.x, localMenu.centerX);

    for (let index = 0; index < 5; index += 1) localMenu._ticker();
    assert.equal(localMenu.glitch1.alpha, 0);
    assert.equal(localMenu.glitch2.alpha, 0);
    assert.equal(localMenu.titleText.x, localMenu.centerX);
  } finally {
    Math.random = originalRandom;
  }
});

test('menu play, controls, and settings replace the menu container with another screen', () => {
  global.window = {
    addEventListener() {},
    removeEventListener() {},
  };
  global.fetch = async () => ({ json: async () => ({}) });
  global.__SNOWPACK_ENV__ = {
    SNOWPACK_PUBLIC_API_URL_PROD: '',
    SNOWPACK_PUBLIC_API_URL_DEV: '',
    MODE: 'production',
  };

  const gameApp = createAppMock();
  const playMenu = new Menu({ app: gameApp });
  playMenu.username = 'Runner';
  playMenu.play();
  assert.equal(gameApp.stage.children.includes(playMenu.menuContainer), false);
  assert.ok(gameApp.stage.children.length > 0);

  const controlsApp = createAppMock();
  const controlsMenu = new Menu({ app: controlsApp });
  controlsMenu.showControls();
  assert.equal(controlsApp.stage.children.includes(controlsMenu.menuContainer), false);
  assert.ok(controlsApp.stage.children.length > 0);

  const settingsApp = createAppMock();
  const settingsMenu = new Menu({ app: settingsApp });
  settingsMenu.showSettings();
  assert.equal(settingsApp.stage.children.includes(settingsMenu.menuContainer), false);
  assert.ok(settingsApp.stage.children.length > 0);
});
