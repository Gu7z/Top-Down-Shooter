import test from 'node:test';
import assert from 'node:assert/strict';

global.PIXI = { sound: { volumeAll: 1 } };

global.localStorage = {
  storage: {},
  getItem(key) { return this.storage[key] ?? null; },
  setItem(key, val) { this.storage[key] = String(val); },
};

const { audio } = await import('../src/audio.js');

test('load() uses defaults when localStorage is empty', () => {
  localStorage.storage = {};
  audio.load();
  assert.strictEqual(audio.volume, 0.7);
  assert.strictEqual(audio.muted, false);
});

test('load() restores saved volume', () => {
  localStorage.storage = { volume: '0.4', muted: 'false' };
  audio.load();
  assert.strictEqual(audio.volume, 0.4);
});

test('load() restores muted state', () => {
  localStorage.storage = { volume: '0.5', muted: 'true' };
  audio.load();
  assert.strictEqual(audio.muted, true);
});

test('apply() sets PIXI.sound.volumeAll to volume when not muted', () => {
  audio.volume = 0.6;
  audio.muted = false;
  audio.apply();
  assert.strictEqual(PIXI.sound.volumeAll, 0.6);
});

test('apply() sets PIXI.sound.volumeAll to 0 when muted', () => {
  audio.volume = 0.6;
  audio.muted = true;
  audio.apply();
  assert.strictEqual(PIXI.sound.volumeAll, 0);
});

test('setVolume() clamps to [0, 1]', () => {
  audio.setVolume(1.5);
  assert.strictEqual(audio.volume, 1);
  audio.setVolume(-0.3);
  assert.strictEqual(audio.volume, 0);
});

test('setVolume() saves to localStorage', () => {
  localStorage.storage = {};
  audio.setVolume(0.8);
  assert.strictEqual(localStorage.storage.volume, '0.8');
});

test('toggleMute() flips muted and saves to localStorage', () => {
  audio.muted = false;
  audio.toggleMute();
  assert.strictEqual(audio.muted, true);
  assert.strictEqual(localStorage.storage.muted, 'true');
  audio.toggleMute();
  assert.strictEqual(audio.muted, false);
});

test('toggleMute() restores saved volume on unmute', () => {
  audio.volume = 0.5;
  audio.muted = false;
  PIXI.sound.volumeAll = 0;
  audio.toggleMute();
  audio.toggleMute();
  assert.strictEqual(PIXI.sound.volumeAll, 0.5);
});
