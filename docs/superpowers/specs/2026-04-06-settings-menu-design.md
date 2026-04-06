# Settings Menu — Design Spec
**Date:** 2026-04-06  
**Project:** NEON HUNT — Top-Down Shooter  
**Status:** Approved

---

## Overview

Add a settings screen where the player can adjust sound volume and toggle mute. The screen must be accessible from two entry points: the main menu and the in-game pause screen. All state persists via `localStorage`.

---

## Files

### New
| File | Purpose |
|------|---------|
| `src/audio.js` | Singleton that owns volume + mute state, persists to localStorage, applies to `PIXI.sound` |
| `src/settings.js` | Full settings screen built with PixiJS, accepts `{ app, onBack }` callback |

### Modified
| File | Change |
|------|--------|
| `src/menu.js` | Add "⚙ CONFIGURAÇÕES" button after "CONTROLES" |
| `src/hud.js` | Show "⚙ CONFIGURAÇÕES" button when game is paused; expose `openSettings` setter |
| `src/game.js` | Replace inline mute logic with `audio.toggleMute()`; inject settings callback into hud |
| `public/index.js` | Call `audio.load()` before `new Menu()` to apply saved volume on startup |

---

## `src/audio.js`

Exported singleton object. No class needed — single instance used across all screens.

```
audio.volume  — float 0.0–1.0, default 0.7
audio.muted   — boolean, default false
```

**Methods:**

- `audio.load()` — reads `localStorage` (`'volume'`, `'muted'`), calls `apply()`
- `audio.setVolume(v)` — clamps v to [0, 1], saves to localStorage, calls `apply()`
- `audio.toggleMute()` — flips `muted`, saves to localStorage, calls `apply()`
- `audio.apply()` — sets `PIXI.sound.volumeAll = muted ? 0 : volume`

**Why a singleton instead of passing state:** The `M` key handler lives inside `game.js` closures and has no prop-drilling path. A module-level singleton is the minimal change that avoids refactoring the existing event system.

**Bug fixed:** Current `game.js` mute logic sets `PIXI.sound.volumeAll` to `1` on unmute, overriding any custom volume. `audio.apply()` restores the saved volume instead.

---

## `src/settings.js`

Constructor: `new Settings({ app, onBack })`

- `onBack` — called when "VOLTAR" is clicked. Caller decides what happens (show menu, keep paused, etc.)
- Settings does **not** manage navigation — it just calls `onBack` and removes its own container.

**Layout (1280×720 canvas):**

```
Backdrop — PIXI.Sprite full-screen, black at 55% alpha (dims whatever is behind)
Card     — chamfered, 460×320px, centred, UISkin.palette.card fill
  visor line (top accent)
  corner brackets (4 corners)
  Title:    "⚙  CONFIGURAÇÕES"  — Orbitron, cyan
  Subtitle: "▸  AJUSTES DE ÁUDIO  ◂"  — JetBrains Mono, textSecondary

  [VOLUME SLIDER]
    Label "VOLUME" left, numeric value right (e.g. "70")
    Track: PIXI.Graphics rect, 380px wide, 6px tall
    Fill:  inner rect, width proportional to volume, gradient cyan→accentGreen
    Thumb: 16×16 square, cyan fill, glow shadow via stroke
    Interaction: pointerdown on track or thumb starts drag;
                 pointermove (on stage) updates volume;
                 pointerup ends drag.

  [MUTE TOGGLE]
    Row: label "MUDO" left, hint "tecla M também alterna" below label
    Button right: chamfered, 80×32px
      — ON  state: cyan fill,  "ON"  text in dark
      — OFF state: dark fill, "OFF" text in textSecondary, magenta border

  [BACK BUTTON]
    "↩   VOLTAR", full width, magenta border (secondary style)
```

**Volume display:** `Math.round(audio.volume * 100)` shown as integer 0–100.

**Slider interaction detail:**
```
pointerdown on [track | thumb]:
  dragging = true
  app.stage.on('pointermove', onDrag)
  app.stage.on('pointerup',   onDrop)

onDrag(e):
  local x = e.global.x - track.getGlobalPosition().x
  v = clamp(local x / trackWidth, 0, 1)
  audio.setVolume(v)
  redrawSlider(v)

onDrop():
  dragging = false
  app.stage.off('pointermove', onDrag)
  app.stage.off('pointerup',   onDrop)
```

All graphics in a single `settingsContainer` added to `app.stage`. `onBack` removes the container and cleans up stage listeners.

---

## Entry Points

### From main menu (`src/menu.js`)

Add button after "CONTROLES":

```
createPillButton({
  text: "⚙  CONFIGURAÇÕES",
  y: cy + 264,           // below CONTROLES button
  onClick: () => {
    this.hide();
    new Settings({ app, onBack: () => { new Menu({ app }); } });
  }
})
```

Card height increases from 572 → 640px to accommodate the 4th button.

### From pause screen (`src/hud.js`)

`Hud` gains a public setter `set openSettings(fn)`. `game.js` calls it after constructing Hud:

```js
// game.js
this.hud.openSettings = () => {
  app.stage.removeChild(this.hud.hudContainer); // hide HUD temporarily
  new Settings({
    app,
    onBack: () => {
      app.stage.addChild(this.hud.hudContainer); // restore HUD
    },
  });
};
```

In `hud.js`, the settings button is created alongside `textPaused` but only `visible = false` by default. When `showPaused = true`, both the pause text and the settings button become visible. When `showPaused = false`, both hide.

Settings button position: centred horizontally, `cy + 80` (below "// PAUSED //" text).

---

## State Persistence

| Key | Type | Default | Notes |
|-----|------|---------|-------|
| `'volume'` | `string` (float) | `'0.7'` | `parseFloat` on read |
| `'muted'` | `string` (bool) | `'false'` | compare `=== 'true'` on read |

Saved on every `setVolume()` and `toggleMute()` call.

---

## `game.js` change

Replace:
```js
case "m":
  PIXI.sound.volumeAll = muted ? 1 : 0;
  muted = !muted;
  break;
```

With:
```js
case "m":
  audio.toggleMute();
  break;
```

Remove local `muted` variable — state lives in `audio.js`.

---

## Out of Scope

- Additional settings (graphics, controls remapping) — not in this spec
- Volume for individual sound effects vs music — all sounds share `volumeAll`
- Accessibility (keyboard-controlled slider) — future enhancement
