import test from 'node:test';
import assert from 'node:assert/strict';
import { setupPixiMock, createAppMock } from './helpers.js';

setupPixiMock();

global.localStorage = {
  storage: { volume: '0.7', muted: 'false' },
  getItem(key) { return this.storage[key] ?? null; },
  setItem(key, val) { this.storage[key] = String(val); },
};

const { audio } = await import('../src/audio.js');
audio.load();

const app = createAppMock();
let backCalled = false;
let renderCount = 0;
app.render = () => { renderCount += 1; };

const { default: Settings } = await import('../src/settings.js');
const settings = new Settings({ app, onBack: () => { backCalled = true; } });

test('settings container is added to stage', () => {
  assert.ok(app.stage.children.length > 0);
});

test('settings container has children (card, labels, slider, buttons)', () => {
  const container = app.stage.children[app.stage.children.length - 1];
  assert.ok(container.children.length > 0);
});

test('settings renders after slider and mute interactions', () => {
  const beforeSlider = renderCount;
  settings._updateFromPointer({ global: { x: settings._track.x + settings._track.w / 2 } });
  assert.ok(renderCount > beforeSlider);

  const beforeMute = renderCount;
  settings.toggleMute();
  assert.ok(renderCount > beforeMute);
});

test('settings back button callback is called on close', () => {
  settings.close();
  assert.equal(backCalled, true);
});
