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

test('retaliation pulse animate ticker does not throw when ring is destroyed mid-animation', () => {
  const { app: localApp, game: localGame } = createGameHarness('pulse-crash');

  // Capture the animate fn added by _triggerRetaliationPulse (not the main tick)
  let capturedAnimate = null;
  const originalAdd = localApp.ticker.add.bind(localApp.ticker);
  localApp.ticker.add = (fn) => {
    capturedAnimate = fn;
    return originalAdd(fn);
  };

  // Give the upgrade state a retaliation pulse effect
  localGame.upgradeState._cachedEffects.retaliationPulseRadius = 200;
  localGame.upgradeState._cachedEffects.retaliationPulseDamage = 2;
  localGame.upgradeState._cachedEffects.retaliationPulseStunMs = 200;

  localGame._triggerRetaliationPulse();

  assert.ok(capturedAnimate, 'animate fn should have been added to ticker');

  // Simulate game teardown destroying the effects container (e.g. player dies)
  localGame.effects.effectsContainer.destroy({ children: true });

  // Calling the animate fn after ring destruction must not throw
  assert.doesNotThrow(() => capturedAnimate());

  // And the animate fn must have removed itself from the ticker
  assert.equal(localApp.ticker.removedFn, capturedAnimate);
});

// ── Render hierarchy ─────────────────────────────────────────────────────────

function stageIndex(app, container) {
  return app.stage.children.indexOf(container);
}

test('render hierarchy: game world is below HUD at startup', () => {
  const { app: localApp, game: localGame } = createGameHarness('hierarchy-init');

  const hudIdx      = stageIndex(localApp, localGame.hud.hudContainer);
  const bgIdx       = stageIndex(localApp, localGame.effects.backgroundContainer);
  const effectsIdx  = stageIndex(localApp, localGame.effects.effectsContainer);
  const playerIdx   = stageIndex(localApp, localGame.player.playerContainer);
  const bulletsIdx  = stageIndex(localApp, localGame.player.shooting.shootingContainer);
  const enemiesIdx  = stageIndex(localApp, localGame.enemySpawner.spawnerContainer);
  const droneIdx    = stageIndex(localApp, localGame.droneSystem.container);

  assert.ok(hudIdx !== -1, 'hudContainer must be on stage');

  // Background is the bottommost layer
  assert.ok(bgIdx < effectsIdx,  'background must be below effects');
  assert.ok(bgIdx < playerIdx,   'background must be below player');
  assert.ok(bgIdx < enemiesIdx,  'background must be below enemies');

  // Game world entities are below HUD
  assert.ok(effectsIdx  < hudIdx, 'effects must be below HUD');
  assert.ok(playerIdx   < hudIdx, 'player must be below HUD');
  assert.ok(bulletsIdx  < hudIdx, 'player bullets must be below HUD');
  assert.ok(enemiesIdx  < hudIdx, 'enemies must be below HUD');
  assert.ok(droneIdx    < hudIdx, 'drones must be below HUD');

  localGame.clear();
});

test('render hierarchy: settings screen is above HUD when open', () => {
  const { app: localApp, game: localGame } = createGameHarness('hierarchy-settings');

  // Open settings via the pause button (same as the existing settings test)
  localGame.hud.pauseSettingsBtn.bg.eventHandlers.pointerdown();

  // HUD is removed from stage while settings is open
  assert.equal(stageIndex(localApp, localGame.hud.hudContainer), -1, 'HUD should be off stage while settings is open');

  // Settings container is the topmost child
  const settingsContainer = localApp.stage.children.at(-1);
  assert.ok(settingsContainer !== localGame.hud.hudContainer, 'topmost layer should not be HUD');
  assert.ok(stageIndex(localApp, localGame.effects.backgroundContainer) < localApp.stage.children.length - 1, 'background is below settings');

  localGame.clear();
});

test('render hierarchy: HUD is restored above game world after settings closes', () => {
  const { app: localApp, game: localGame } = createGameHarness('hierarchy-settings-close');

  localGame.hud.pauseSettingsBtn.bg.eventHandlers.pointerdown();
  localGame.handleSystemKeys({ key: 'Escape' }); // close settings

  const hudIdx     = stageIndex(localApp, localGame.hud.hudContainer);
  const playerIdx  = stageIndex(localApp, localGame.player.playerContainer);
  const enemiesIdx = stageIndex(localApp, localGame.enemySpawner.spawnerContainer);

  assert.ok(hudIdx !== -1, 'HUD must be back on stage after settings close');
  assert.ok(playerIdx  < hudIdx, 'player must be below HUD after settings close');
  assert.ok(enemiesIdx < hudIdx, 'enemies must be below HUD after settings close');

  localGame.clear();
});

test('render hierarchy: upgrade screen is above HUD and game world when shown', () => {
  const { app: localApp, game: localGame } = createGameHarness('hierarchy-upgrade');

  // Manually invoke _build to show the upgrade screen without triggering animation teardown
  localGame.upgradeScreen._build(
    localGame.upgradeState.getCardsToShow(),
    () => {},
  );

  const upgradeIdx  = stageIndex(localApp, localGame.upgradeScreen.container);
  const hudIdx      = stageIndex(localApp, localGame.hud.hudContainer);
  const playerIdx   = stageIndex(localApp, localGame.player.playerContainer);
  const bulletsIdx  = stageIndex(localApp, localGame.player.shooting.shootingContainer);
  const droneIdx    = stageIndex(localApp, localGame.droneSystem.container);

  assert.ok(upgradeIdx !== -1, 'upgrade screen must be on stage');
  assert.ok(upgradeIdx > hudIdx,     'upgrade screen must be above HUD');
  assert.ok(upgradeIdx > playerIdx,  'upgrade screen must be above player');
  assert.ok(upgradeIdx > bulletsIdx, 'upgrade screen must be above player bullets');
  assert.ok(upgradeIdx > droneIdx,   'upgrade screen must be above drones');

  localGame.clear();
});

test('render hierarchy: player bullets stay below HUD after shooting', () => {
  const { app: localApp, game: localGame } = createGameHarness('hierarchy-shooting');

  // Simulate several shots
  const keys = {};
  localGame.player.shooting.update(true, localGame.enemySpawner, localGame.player);
  localGame.player.shooting.update(true, localGame.enemySpawner, localGame.player);

  const bulletsIdx = stageIndex(localApp, localGame.player.shooting.shootingContainer);
  const hudIdx     = stageIndex(localApp, localGame.hud.hudContainer);

  assert.ok(bulletsIdx < hudIdx, 'player bullets must remain below HUD after shooting');

  localGame.clear();
});
