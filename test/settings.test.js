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

test('settings destroy removes drag listeners without calling back callback', () => {
  const localApp = createAppMock();
  let localBackCalled = false;
  const localSettings = new Settings({
    app: localApp,
    onBack: () => { localBackCalled = true; },
  });

  localSettings.sliderThumb.eventHandlers.pointerdown({
    global: { x: localSettings._track.x + localSettings._track.w / 2 },
  });
  assert.equal(typeof localApp.stage._events.pointermove, 'function');
  assert.equal(typeof localApp.stage._events.pointerup, 'function');

  localSettings.destroy();

  assert.equal(localApp.stage._events.pointermove, undefined);
  assert.equal(localApp.stage._events.pointerup, undefined);
  assert.equal(localBackCalled, false);
});

test('settings drag handlers update volume while dragging and clean up on drop', () => {
  const localApp = createAppMock();
  const localSettings = new Settings({
    app: localApp,
    onBack: () => {},
  });

  localSettings.sliderThumb.eventHandlers.pointerdown({
    global: { x: localSettings._track.x },
  });
  localApp.stage._events.pointermove({
    global: { x: localSettings._track.x + localSettings._track.w },
  });

  assert.equal(localSettings.volValue.text, '100');
  assert.equal(localSettings._dragging, true);

  localApp.stage._events.pointerup();

  assert.equal(localSettings._dragging, false);
  assert.equal(localApp.stage._events.pointermove, undefined);
  assert.equal(localApp.stage._events.pointerup, undefined);
});
