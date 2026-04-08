import test from 'node:test';
import assert from 'node:assert/strict';
import Game from '../src/game.js';
import { audio } from '../src/audio.js';
import { setupPixiMock, createAppMock } from './helpers.js';

setupPixiMock();
const app = { ...createAppMock(), render() {} };
const events = {};
const addEvent = (eventName, handler) => {
  if (!events[eventName]) events[eventName] = [];
  events[eventName].push(handler);
};
const removeEvent = (eventName, handler) => {
  events[eventName] = (events[eventName] || []).filter((h) => h !== handler);
};
const triggerEvent = (eventName, payload) => {
  (events[eventName] || []).forEach((handler) => handler(payload));
};

global.window = {
  addEventListener: addEvent,
  removeEventListener: removeEvent,
};
global.localStorage = {
  storage: {},
  getItem(key) { return this.storage[key] || null; },
  setItem(key, value) { this.storage[key] = value; },
};
global.__SNOWPACK_ENV__ = { SNOWPACK_PUBLIC_API_URL_PROD:'', SNOWPACK_PUBLIC_API_URL_DEV:'', MODE:'production' };
global.fetch = async () => ({ json: async () => ({}) });
const game = new Game({ app, username: 'player' });
game.player.player.getBounds = () => ({ x:0, y:0, width:40, height:40 });

test('game creates ticker handler', () => {
  assert.ok(game.ticker !== undefined);
});

test('game initializes progression without live buff pickup', () => {
  assert.equal('buff' in game, false);
  assert.ok(game.runStats);
  assert.ok(game.skillEffects);
  assert.ok(game.skillState);
});

test('game event handlers work', () => {
  triggerEvent('pointerdown');
  triggerEvent('pointerup');
  triggerEvent('keydown', { key: 'w' });
  triggerEvent('keyup', { key: 'w' });
  triggerEvent('keydown', { key: 'Escape' });
  triggerEvent('keydown', { key: 'm' });
  assert.ok(app.stage.children.includes(game.hud.hudContainer));
  app.renderer.view.onmousemove({ clientX: 1, clientY: 2 });
  app.ticker.fn();
  assert.ok(app.stage.children.includes(game.hud.hudContainer));
  game.player.lifes = 0;
  app.ticker.fn();
  const labels = game.hud.hudContainer
    .children
    .filter(c => typeof c.text === 'string')
    .map(c => c.text);
  assert.ok(labels.includes('SISTEMA DESCONECTADO'));
});

test('clear remove ticker and listeners', () => {
  const anotherGame = new Game({ app, username: 'player-2' });
  const keydownListenersBefore = events.keydown.length;
  const keyupListenersBefore = events.keyup?.length || 0;
  const pointerdownListenersBefore = events.pointerdown?.length || 0;
  const pointerupListenersBefore = events.pointerup?.length || 0;
  
  anotherGame.clear();

  assert.equal(app.ticker.removedFn, anotherGame.tick);
  assert.equal(app.renderer.view.onmousemove, null);
  assert.equal(events.keydown.length, keydownListenersBefore - 2);
  assert.equal(events.keyup.length, keyupListenersBefore - 1);
  assert.equal(events.pointerdown.length, pointerdownListenersBefore - 1);
  assert.equal(events.pointerup.length, pointerupListenersBefore - 1);
});

function createWindowHarness() {
  const eventMap = {};
  return {
    window: {
      addEventListener(eventName, handler) {
        if (!eventMap[eventName]) eventMap[eventName] = [];
        eventMap[eventName].push(handler);
      },
      removeEventListener(eventName, handler) {
        eventMap[eventName] = (eventMap[eventName] || []).filter((fn) => fn !== handler);
      },
    },
    trigger(eventName, payload) {
      (eventMap[eventName] || []).forEach((handler) => handler(payload));
    },
    count(eventName) {
      return (eventMap[eventName] || []).length;
    },
  };
}

function createGameHarness(username = 'player') {
  const appMock = {
    ...createAppMock(),
    render() {},
    start() {},
    stop() {},
  };
  const windowHarness = createWindowHarness();

  global.window = windowHarness.window;
  global.localStorage = {
    storage: {},
    getItem(key) { return this.storage[key] || null; },
    setItem(key, value) { this.storage[key] = value; },
  };
  global.__SNOWPACK_ENV__ = {
    SNOWPACK_PUBLIC_API_URL_PROD: '',
    SNOWPACK_PUBLIC_API_URL_DEV: '',
    MODE: 'production',
  };
  global.fetch = async () => ({ json: async () => ({}) });

  const localGame = new Game({ app: appMock, username });
  localGame.player.player.getBounds = () => ({ x: 0, y: 0, width: 40, height: 40 });
  return { app: appMock, game: localGame, windowHarness };
}

test('game opens settings and controls, then handles pause, resume, mute, and dash system keys', () => {
  const { app: localApp, game: localGame } = createGameHarness('systems');
  let startCalls = 0;
  let stopCalls = 0;
  let shootingUpdates = 0;
  let dashKeys = null;
  let muteCalls = 0;
  const originalToggleMute = audio.toggleMute;

  localApp.start = () => { startCalls += 1; };
  localApp.stop = () => { stopCalls += 1; };
  localGame.player.shooting.update = () => { shootingUpdates += 1; };
  localGame.player.tryDash = (keysState) => { dashKeys = { ...keysState }; };
  audio.toggleMute = () => { muteCalls += 1; };

  try {
    localGame.hud.pauseSettingsBtn.bg.eventHandlers.pointerdown();
    assert.equal(localApp.stage.children.includes(localGame.hud.hudContainer), false);

    localGame.handleSystemKeys({ key: 'Escape' });
    assert.equal(localApp.stage.children.includes(localGame.hud.hudContainer), true);

    localGame.hud.pauseControlsBtn.bg.eventHandlers.pointerdown();
    const controlsContainer = localApp.stage.children.at(-1);
    const controlsBackButton = controlsContainer.children.find((child) => child.eventHandlers?.pointerdown);
    controlsBackButton.eventHandlers.pointerdown();
    assert.equal(localApp.stage.children.includes(localGame.hud.hudContainer), true);

    localGame.handleSystemKeys({ key: 'Escape' });
    assert.equal(stopCalls, 1);
    assert.equal(localGame.hud.textPaused.visible, true);

    localGame.handleSystemKeys({ key: 'Escape' });
    assert.equal(startCalls, 1);

    localGame.handleSystemKeys({ key: 'Escape' });
    localGame.hud.pauseContinueBtn.bg.eventHandlers.pointerdown();
    localGame.hud.pauseContinueBtn.bg.eventHandlers.pointerdown();
    assert.equal(startCalls, 2);
    assert.equal(localGame.hud.textPaused.visible, false);

    localGame.handleSystemKeys({ key: 'm' });
    localGame.handleSystemKeys({ key: 'Shift' });
    assert.equal(muteCalls, 1);
    assert.deepEqual(dashKeys, {});
    assert.ok(shootingUpdates >= 4);
  } finally {
    audio.toggleMute = originalToggleMute;
    localGame.clear();
  }
});

test('game finishRun is idempotent and the summary back button rebuilds the menu', () => {
  const { app: localApp, game: localGame } = createGameHarness('finisher');
  let clearCalls = 0;
  const originalClear = localGame.clear;
  localGame.clear = () => {
    clearCalls += 1;
    return originalClear();
  };

  localGame.finishRun({ reason: 'manual' });
  const summaryContainer = localApp.stage.children.at(-1);
  const stageCountAfterFirstFinish = localApp.stage.children.length;

  localGame.finishRun({ reason: 'manual' });

  assert.equal(clearCalls, 1);
  assert.equal(localApp.stage.children.length, stageCountAfterFirstFinish);

  const backButton = summaryContainer.children.find((child) => child.eventHandlers?.pointerdown);
  backButton.eventHandlers.pointerdown();

  assert.notEqual(localApp.stage.children.at(-1), summaryContainer);
  assert.ok(localApp.stage.children.length > 0);
});

test('game tick removes out-of-bounds, colliding, and destroyed enemy bullets', () => {
  const { game: localGame } = createGameHarness('bullets');
  localGame.hud.update = () => {};
  localGame.player.update = () => {};
  localGame.waveManager.update = () => {};
  localGame.player.shooting.update = () => {};
  localGame.droneSystem.update = () => {};

  let damageTaken = 0;
  localGame.player.collidesWithCircle = (x, y) => x === 5 && y === 5;
  localGame.player.takeDamage = (damage, effects) => {
    damageTaken += damage;
    assert.equal(effects, localGame.effects);
  };

  function makeBullet({ x, y, outOfBounds = false, destroyed = false }) {
    return {
      bullet: { position: { x, y } },
      radius: 1,
      destroyed,
      updateCalls: 0,
      destroyCalls: 0,
      update() {
        this.updateCalls += 1;
      },
      isOutOfBounds() {
        return outOfBounds;
      },
      destroy() {
        this.destroyed = true;
        this.destroyCalls += 1;
      },
    };
  }

  const outOfBoundsBullet = makeBullet({ x: 0, y: 0, outOfBounds: true });
  const collidingBullet = makeBullet({ x: 5, y: 5 });
  const destroyedBullet = makeBullet({ x: 50, y: 50, destroyed: true });
  localGame.enemyBullets = [outOfBoundsBullet, collidingBullet, destroyedBullet];

  localGame.tick();

  assert.equal(damageTaken, 1);
  assert.equal(localGame.enemyBullets.length, 0);
  assert.equal(outOfBoundsBullet.updateCalls, 1);
  assert.equal(collidingBullet.updateCalls, 1);
  assert.equal(destroyedBullet.updateCalls, 1);
  assert.equal(outOfBoundsBullet.destroyCalls, 1);
  assert.equal(collidingBullet.destroyCalls, 1);
  assert.equal(destroyedBullet.destroyCalls, 0);
});
