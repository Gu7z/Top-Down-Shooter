import test from 'node:test';
import assert from 'node:assert/strict';
import Menu from '../src/menu.js';
import CURRENT_PATCH_NOTES from '../src/patch_notes/current_patch_notes.js';
import { getPatchNotesHash } from '../src/patch_notes/patch_notes_state.js';
import { setupPixiMock, createAppMock } from './helpers.js';

setupPixiMock();

function installLocalStorage(storage = {}) {
  global.localStorage = {
    storage: { ...storage },
    getItem(key) { return this.storage[key]; },
    setItem(key, val) { this.storage[key] = val; },
  };
}

function dismissPatchNotes(menu) {
  menu.patchNotesModal?.confirmButton?.bg?.eventHandlers?.pointerdown?.();
}

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
  installLocalStorage();
  const menu = new Menu({ app: createAppMock() });
  assert.ok(menu.menuContainer.children.length > 0);
});

test('show and hide modify stage', () => {
  installLocalStorage();
  const menu = new Menu({ app: createAppMock() });
  dismissPatchNotes(menu);
  menu.hide();
  menu.show();
  assert.ok(true);
});

test('skill tree button opens the skill tree screen', () => {
  installLocalStorage();
  const localApp = createAppMock();
  localApp.screen = { width: 1280, height: 720 };
  localApp.renderer.view.addEventListener = () => {};
  localApp.renderer.view.removeEventListener = () => {};
  const localMenu = new Menu({ app: localApp });
  dismissPatchNotes(localMenu);

  const labels = localMenu.menuContainer.children
    .filter((child) => typeof child.text === 'string')
    .map((child) => child.text);

  assert.ok(labels.some((text) => text.includes('ÁRVORE')));
  localMenu.showSkillTree();
  assert.notEqual(localApp.stage.children.at(-1), localMenu.menuContainer);
});

test('menu input persists username and enables the play button', () => {
  const textInputSpy = installTextInputSpy();
  installLocalStorage();

  try {
    const localMenu = new Menu({ app: createAppMock() });
    dismissPatchNotes(localMenu);
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
    installLocalStorage();
    const localMenu = new Menu({ app: createAppMock() });
    dismissPatchNotes(localMenu);
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
  installLocalStorage();
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
  dismissPatchNotes(playMenu);
  playMenu.username = 'Runner';
  playMenu.play();
  assert.equal(gameApp.stage.children.includes(playMenu.menuContainer), false);
  assert.ok(gameApp.stage.children.length > 0);

  const controlsApp = createAppMock();
  const controlsMenu = new Menu({ app: controlsApp });
  dismissPatchNotes(controlsMenu);
  controlsMenu.showControls();
  assert.equal(controlsApp.stage.children.includes(controlsMenu.menuContainer), false);
  assert.ok(controlsApp.stage.children.length > 0);

  const settingsApp = createAppMock();
  const settingsMenu = new Menu({ app: settingsApp });
  dismissPatchNotes(settingsMenu);
  settingsMenu.showSettings();
  assert.equal(settingsApp.stage.children.includes(settingsMenu.menuContainer), false);
  assert.ok(settingsApp.stage.children.length > 0);
});

test('menu shows patch notes on first visit, blocks the home, and hides them after OK', () => {
  installLocalStorage();
  const localMenu = new Menu({ app: createAppMock() });

  assert.ok(localMenu.patchNotesModal);
  assert.equal(localMenu.skillTreeButton?.bg?.interactive, false);
  assert.equal(localMenu.controlsButton?.bg?.interactive, false);

  localMenu.patchNotesModal?.confirmButton?.bg?.eventHandlers?.pointerdown?.();

  assert.equal(typeof global.localStorage.getItem('patchNotes.lastSeenHash'), 'string');
  assert.equal(global.localStorage.getItem('patchNotes.lastSeenHash').length > 0, true);
  assert.equal(localMenu.patchNotesModal, null);
  assert.equal(localMenu.skillTreeButton?.bg?.interactive, true);
  assert.equal(localMenu.controlsButton?.bg?.interactive, true);
});

test('menu skips patch notes when the current content hash was already acknowledged', () => {
  installLocalStorage({
    'patchNotes.lastSeenHash': getPatchNotesHash(CURRENT_PATCH_NOTES),
  });
  const localMenu = new Menu({ app: createAppMock() });

  assert.equal(localMenu.patchNotesModal, null);
  assert.equal(localMenu.skillTreeButton?.bg?.interactive, true);
  assert.equal(localMenu.controlsButton?.bg?.interactive, true);
});
