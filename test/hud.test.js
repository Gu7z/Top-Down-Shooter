import test from 'node:test';
import assert from 'node:assert/strict';
import Hud from '../src/hud.js';
import { setupPixiMock, createAppMock } from './helpers.js';

setupPixiMock();
const app = createAppMock();
const player = { points: 0, lifes: 1, username: 'u' };
const hud = new Hud({ app, player });
global.localStorage = { getItem(){}, setItem(){} };
global.fetch = async () => ({ json: async () => ({}) });
global.__SNOWPACK_ENV__ = { SNOWPACK_PUBLIC_API_URL_PROD:'', SNOWPACK_PUBLIC_API_URL_DEV:'', MODE:'production' };

test('hud container initialized', () => {
  assert.ok(hud.hudContainer);
});

test('pause and end glow layers start hidden', () => {
  assert.strictEqual(hud.textPaused.visible, false);
  assert.strictEqual(hud.textPaused.glowHalo.visible, false);
  assert.strictEqual(hud.textEnd.visible, false);
  assert.strictEqual(hud.textEnd.glowHalo.visible, false);
});

test('showPaused toggles visibility', () => {
  hud.showPaused = true;
  assert.strictEqual(hud.textPaused.visible, true);
  assert.strictEqual(hud.textPaused.glowHalo.visible, true);
  assert.strictEqual(hud.pauseSettingsBtn.bg.visible, true);
  assert.strictEqual(hud.pauseEndRunBtn.bg.visible, true);
  hud.showPaused = false;
  assert.strictEqual(hud.textPaused.visible, false);
  assert.strictEqual(hud.textPaused.glowHalo.visible, false);
  assert.strictEqual(hud.pauseSettingsBtn.bg.visible, false);
  assert.strictEqual(hud.pauseEndRunBtn.bg.visible, false);
});

test('pause end run button calls configured callback', () => {
  let ended = false;
  hud.endRun = () => { ended = true; };
  hud.pauseEndRunBtn.bg.eventHandlers.pointerdown();
  assert.strictEqual(ended, true);
});

test('endgameCheck adds back button', () => {
  player.lifes = 0;
  hud.endgameCheck(() => {});
  const buttons = hud.hudContainer.children.filter(c => c.eventHandlers?.pointerdown);
  const back = buttons[buttons.length - 1];
  back.eventHandlers.pointerdown();
  assert.ok(back);
});

test('endgameCheck delegates to run-ended callback when configured', () => {
  const localApp = createAppMock();
  const localPlayer = { points: 0, lifes: 0, username: 'u' };
  const localHud = new Hud({ app: localApp, player: localPlayer });
  let reason = null;
  localHud.onRunEnded = (payload) => { reason = payload.reason; };

  localHud.endgameCheck(() => {});

  assert.equal(reason, 'death');
});

test('endRun setter ignores non-function values', () => {
  const localHud = new Hud({
    app: createAppMock(),
    player: { points: 0, lifes: 1, username: 'u' },
  });

  localHud.endRun = undefined;

  assert.doesNotThrow(() => localHud.pauseEndRunBtn.bg.eventHandlers.pointerdown());
});

test('resume, settings, and controls callbacks are wired to pause buttons', () => {
  const localHud = new Hud({
    app: createAppMock(),
    player: { points: 0, lifes: 1, username: 'u' },
  });
  let resumed = 0;
  let settingsOpened = 0;
  let controlsOpened = 0;

  localHud.resume = () => { resumed += 1; };
  localHud.openSettings = () => { settingsOpened += 1; };
  localHud.openControls = () => { controlsOpened += 1; };
  localHud.showPaused = true;

  localHud.pauseContinueBtn.bg.eventHandlers.pointerdown();
  localHud.pauseSettingsBtn.bg.eventHandlers.pointerdown();
  localHud.pauseControlsBtn.bg.eventHandlers.pointerdown();

  assert.equal(resumed, 1);
  assert.equal(settingsOpened, 1);
  assert.equal(controlsOpened, 1);
});

test('hud builds shield UI and updates shield regen arc when shield exists', () => {
  const localApp = createAppMock();
  const shieldPlayer = {
    points: 0,
    lifes: 1,
    shield: 0,
    shieldRegenCooldown: 10,
    shieldRegenTimer: 5,
    skillEffects: { maxShield: 2 },
    username: 'u',
  };
  const localHud = new Hud({ app: localApp, player: shieldPlayer });

  localHud.update(() => {});

  assert.ok(localHud.textShield);
  assert.equal(localHud.textShield.text, '0');
});

test('updateBossBar toggles boss hud visibility and label', () => {
  const localHud = new Hud({
    app: createAppMock(),
    player: { points: 0, lifes: 1, username: 'u' },
  });

  localHud.updateBossBar({}, 5, 10, 0xff0000, 'TESTE');
  assert.equal(localHud.bossBarContainer.visible, true);
  assert.equal(localHud.bossNameObj.text, 'TESTE');

  localHud.updateBossBar(null);
  assert.equal(localHud.bossBarContainer.visible, false);
});

test('banner transitions through hold and out states', () => {
  const localHud = new Hud({
    app: createAppMock(),
    player: { points: 0, lifes: 1, username: 'u' },
  });

  localHud.showBanner('TESTE', false);
  for (let i = 0; i < 25; i += 1) localHud.updateBanner();
  assert.equal(localHud.bannerState, 'HOLD');

  for (let i = 0; i < 121; i += 1) localHud.updateBanner();
  assert.equal(localHud.bannerState, 'OUT');

  for (let i = 0; i < 40; i += 1) localHud.updateBanner();
  assert.equal(localHud.bannerState, 'IDLE');
  assert.equal(localHud.bannerText.alpha, 0);
});

test('persistent banner keeps full alpha without entering hold', () => {
  const localHud = new Hud({
    app: createAppMock(),
    player: { points: 0, lifes: 1, username: 'u' },
  });

  localHud.showBanner('PERSISTE', true);
  for (let i = 0; i < 25; i += 1) localHud.updateBanner();

  assert.equal(localHud.bannerState, 'IN');
  assert.equal(localHud.bannerText.alpha, 1);
});

test('endRun falls back to menu reset when no run-ended callback exists', () => {
  global.localStorage = { getItem(){ return null; }, setItem(){} };
  const localApp = createAppMock();
  let started = 0;
  localApp.start = () => { started += 1; };
  const localHud = new Hud({
    app: localApp,
    player: { points: 0, lifes: 1, username: 'u' },
  });
  let ended = 0;
  localHud.endRun = () => { ended += 1; };

  localHud.pauseEndRunBtn.bg.eventHandlers.pointerdown();

  assert.equal(ended, 1);
  assert.equal(started, 1);
  assert.equal(localApp.stage.children.length > 0, true);
});

test('hud short-circuits repeated death handling and shield regen early returns safely', () => {
  const localApp = createAppMock();
  let stopCalls = 0;
  localApp.stop = () => { stopCalls += 1; };
  const localHud = new Hud({
    app: localApp,
    player: { points: 0, lifes: 0, username: 'u' },
  });
  localHud.dead = true;

  localHud.endgameCheck(() => {});
  localHud._updateShieldRegenArc();

  assert.equal(stopCalls, 0);

  const shieldHud = new Hud({
    app: createAppMock(),
    player: {
      points: 0,
      lifes: 1,
      username: 'u',
      shield: 0,
      shieldRegenCooldown: 0,
      shieldRegenTimer: 0,
      skillEffects: { maxShield: 1 },
    },
  });
  let clearCalls = 0;
  shieldHud.shieldRegenArc.clear = () => { clearCalls += 1; };

  shieldHud._updateShieldRegenArc();
  shieldHud.player.skillEffects.maxShield = 0;
  shieldHud._updateShieldRegenArc();

  assert.equal(clearCalls, 2);
});
