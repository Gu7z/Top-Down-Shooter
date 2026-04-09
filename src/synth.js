// src/synth.js
// Game sound playback using PIXI.sound + Kenney CC0 assets
// https://kenney.nl/assets/sci-fi-sounds
// https://kenney.nl/assets/interface-sounds

const SOUND_FILES = {
  shot:          'sound/shot.ogg',
  lightning:     'sound/lightning.ogg',
  enemy_death:   'sound/enemy_death.ogg',
  shield_hit:    'sound/shield_hit.ogg',
  player_hit:    'sound/player_hit.ogg',
  death:         'sound/death.ogg',
  wave_complete: 'sound/wave_complete.ogg',
  boss_spawn:    'sound/boss_spawn.ogg',
  card_select:   'sound/card_select.ogg',
  victory:       'sound/victory.ogg',
};

const _cache = {};

// Throttle: sons que não devem empilhar quando disparados em rajada
const _throttleMs = {
  enemy_death: 80,
};
const _lastPlayed = {};

function getSound(name) {
  if (!_cache[name] && SOUND_FILES[name]) {
    _cache[name] = PIXI.sound.Sound.from(SOUND_FILES[name]);
  }
  return _cache[name];
}

export function playSound(name) {
  const minInterval = _throttleMs[name];
  if (minInterval) {
    const now = Date.now();
    if (now - (_lastPlayed[name] ?? 0) < minInterval) return;
    _lastPlayed[name] = now;
  }
  try { getSound(name)?.play(); } catch (_) {}
}

export function setSynthVolume(_v) {
  // Volume controlled globally via PIXI.sound.volumeAll in audio.js
}
