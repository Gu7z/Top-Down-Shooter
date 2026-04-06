# Settings Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a settings screen with volume slider + mute toggle, accessible from the main menu and the in-game pause screen, with state persisted in localStorage.

**Architecture:** A pure-JS `audio.js` singleton owns all audio state and persists it to localStorage. A new `Settings` PixiJS screen accepts an `onBack` callback so it works from both the menu and the pause overlay without managing navigation itself. `game.js` delegates the `M` key to `audio.toggleMute()` instead of manipulating `PIXI.sound` directly.

**Tech Stack:** PixiJS (PIXI.Graphics interactive slider), Node built-in test runner (`node:test`), localStorage, Snowpack

---

## File Map

| Status | File | Responsibility |
|--------|------|----------------|
| **Create** | `src/audio.js` | Volume + mute singleton, localStorage persistence |
| **Create** | `src/settings.js` | Settings screen (PixiJS), slider, toggle, back button |
| **Create** | `test/audio.test.js` | Unit tests for audio singleton |
| **Create** | `test/settings.test.js` | Smoke test for Settings instantiation |
| **Modify** | `test/helpers.js` | Add missing Graphics methods + stage event mock |
| **Modify** | `public/index.js` | Call `audio.load()` before `new Menu()` |
| **Modify** | `src/menu.js` | Add 4th button + expand card height |
| **Modify** | `src/game.js` | Replace inline mute with `audio.toggleMute()` |
| **Modify** | `src/hud.js` | Settings button in pause; `openSettings` setter |

---

## Task 1: Extend test helpers for new code

**Files:**
- Modify: `test/helpers.js`

- [ ] **Step 1: Add missing methods to `PIXI.Graphics` mock and stage event support**

Open `test/helpers.js`. Replace the `Graphics` class and `createAppMock` with:

```js
// In setupPixiMock(), replace Graphics class:
Graphics: class {
  constructor() {
    this.alpha = 1;
    this.visible = true;
    this.interactive = false;
    this.cursor = null;
    this.position = { x: 0, y: 0, set(x, y) { this.x = x; this.y = y; } };
    this.eventHandlers = {};
  }
  beginFill()  { return this; }
  endFill()    { return this; }
  lineStyle()  { return this; }
  moveTo()     { return this; }
  lineTo()     { return this; }
  closePath()  { return this; }
  drawRect()   { return this; }
  drawEllipse(){ return this; }
  clear()      { return this; }
  on(event, fn)  { this.eventHandlers[event] = fn; return this; }
  off(event, fn) { delete this.eventHandlers[event]; return this; }
  destroy()    { this.destroyed = true; }
},
```

Also update `createAppMock` to support stage events (needed by the slider drag):

```js
export function createAppMock() {
  return {
    stage: {
      children: [],
      addChild(child)    { this.children.push(child); },
      removeChild(child) { this.children = this.children.filter(c => c !== child); },
      removeChildren()   { this.children = []; },
      _events: {},
      on(ev, fn)  { this._events[ev] = fn; },
      off(ev, fn) { delete this._events[ev]; },
    },
    ticker: {
      fn: null, removedFn: null,
      add(fn)    { this.fn = fn; return {}; },
      remove(fn) { this.removedFn = fn; },
    },
    screen: { width: 800, height: 600 },
    setInterval() { return { clear() {} }; },
    setTimeout()  { return { clear() {} }; },
    renderer: { view: { onmousemove: null } },
    start() {},
    stop()  {},
  };
}
```

- [ ] **Step 2: Verify existing tests still pass**

```bash
node --test --experimental-specifier-resolution=node 2>&1 | tail -20
```

Expected: all tests pass (same as before).

- [ ] **Step 3: Commit**

```bash
git add test/helpers.js
git commit -m "test: extend PIXI mocks for Graphics methods and stage events"
```

---

## Task 2: `src/audio.js` — audio singleton

**Files:**
- Create: `src/audio.js`
- Create: `test/audio.test.js`

- [ ] **Step 1: Write failing tests**

Create `test/audio.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';

// Minimal PIXI mock — only what audio.js needs
global.PIXI = { sound: { volumeAll: 1 } };

global.localStorage = {
  storage: {},
  getItem(key)       { return this.storage[key] ?? null; },
  setItem(key, val)  { this.storage[key] = String(val); },
};

// Import after mocks are set up
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
  audio.muted  = false;
  audio.apply();
  assert.strictEqual(PIXI.sound.volumeAll, 0.6);
});

test('apply() sets PIXI.sound.volumeAll to 0 when muted', () => {
  audio.volume = 0.6;
  audio.muted  = true;
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
  assert.strictEqual(localStorage.storage['volume'], '0.8');
});

test('toggleMute() flips muted and saves to localStorage', () => {
  audio.muted = false;
  audio.toggleMute();
  assert.strictEqual(audio.muted, true);
  assert.strictEqual(localStorage.storage['muted'], 'true');
  audio.toggleMute();
  assert.strictEqual(audio.muted, false);
});

test('toggleMute() restores saved volume on unmute', () => {
  audio.volume = 0.5;
  audio.muted  = false;
  PIXI.sound.volumeAll = 0;
  audio.toggleMute();          // mute  → volumeAll = 0
  audio.toggleMute();          // unmute → volumeAll = 0.5
  assert.strictEqual(PIXI.sound.volumeAll, 0.5);
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
node --test --experimental-specifier-resolution=node test/audio.test.js 2>&1 | tail -15
```

Expected: `ERR_MODULE_NOT_FOUND` or similar — `src/audio.js` doesn't exist yet.

- [ ] **Step 3: Create `src/audio.js`**

```js
// src/audio.js — audio state singleton
export const audio = {
  volume: 0.7,
  muted:  false,

  load() {
    const v = localStorage.getItem('volume');
    const m = localStorage.getItem('muted');
    this.volume = v !== null ? parseFloat(v) : 0.7;
    this.muted  = m === 'true';
    this.apply();
  },

  apply() {
    PIXI.sound.volumeAll = this.muted ? 0 : this.volume;
  },

  setVolume(v) {
    this.volume = Math.min(1, Math.max(0, v));
    localStorage.setItem('volume', String(this.volume));
    this.apply();
  },

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('muted', String(this.muted));
    this.apply();
  },
};
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
node --test --experimental-specifier-resolution=node test/audio.test.js 2>&1 | tail -15
```

Expected: all 9 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/audio.js test/audio.test.js
git commit -m "feat: add audio singleton with volume/mute and localStorage persistence"
```

---

## Task 3: `src/settings.js` — settings screen

**Files:**
- Create: `src/settings.js`
- Create: `test/settings.test.js`

- [ ] **Step 1: Write failing smoke test**

Create `test/settings.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { setupPixiMock, createAppMock } from './helpers.js';

setupPixiMock();

global.localStorage = {
  storage: { volume: '0.7', muted: 'false' },
  getItem(key)      { return this.storage[key] ?? null; },
  setItem(key, val) { this.storage[key] = String(val); },
};

const { audio } = await import('../src/audio.js');
audio.load();

const app = createAppMock();
let backCalled = false;

const { default: Settings } = await import('../src/settings.js');
const settings = new Settings({ app, onBack: () => { backCalled = true; } });

test('settings container is added to stage', () => {
  assert.ok(app.stage.children.length > 0);
});

test('settings container has children (card, labels, slider, buttons)', () => {
  const container = app.stage.children[app.stage.children.length - 1];
  assert.ok(container.children.length > 0);
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
node --test --experimental-specifier-resolution=node test/settings.test.js 2>&1 | tail -10
```

Expected: `ERR_MODULE_NOT_FOUND` — `src/settings.js` doesn't exist.

- [ ] **Step 3: Create `src/settings.js`**

```js
import { audio } from './audio.js';
import {
  UISkin,
  createCard,
  createLabel,
  createPillButton,
} from './ui_system.js';

export default class Settings {
  constructor({ app, onBack }) {
    this.app    = app;
    this.onBack = onBack;
    this.container = new PIXI.Container();
    this._dragging = false;

    // Dims whatever is already on stage behind settings
    this.backdrop = new PIXI.Sprite(PIXI.Texture.WHITE);
    this.backdrop.tint  = 0x000000;
    this.backdrop.alpha = 0.55;
    this.backdrop.width  = app.screen.width;
    this.backdrop.height = app.screen.height;
    this.container.addChild(this.backdrop);

    this.cx = app.screen.width  / 2;
    this.cy = app.screen.height / 2;

    createCard({
      container:   this.container,
      x:           this.cx,
      y:           this.cy,
      width:       460,
      height:      320,
      chamfer:     14,
      bracketSize: 18,
    });

    createLabel({
      container:    this.container,
      text:         '⚙  CONFIGURAÇÕES',
      x:            this.cx,
      y:            this.cy - 128,
      fontSize:     26,
      color:        UISkin.palette.accent,
      bold:         true,
      letterSpacing: 5,
    });

    createLabel({
      container:    this.container,
      text:         '▸  AJUSTES DE ÁUDIO  ◂',
      x:            this.cx,
      y:            this.cy - 94,
      fontSize:     12,
      color:        UISkin.palette.textSecondary,
      mono:         true,
      letterSpacing: 3,
    });

    this.buildSlider();
    this.buildMuteToggle();
    this.buildBackButton();

    app.stage.addChild(this.container);
  }

  // ── Volume slider ──────────────────────────────────────────────
  buildSlider() {
    const { cx, cy } = this;
    const trackW = 380, trackH = 6;
    const trackX = cx - trackW / 2;
    const trackY = cy - 34;

    // Labels
    this.volLabel = createLabel({
      container:    this.container,
      text:         'VOLUME',
      x:            cx - trackW / 2,
      y:            trackY - 22,
      fontSize:     13,
      color:        UISkin.palette.accent,
      bold:         true,
      letterSpacing: 3,
      anchor:       0,
    });

    this.volValue = createLabel({
      container:    this.container,
      text:         String(Math.round(audio.volume * 100)),
      x:            cx + trackW / 2,
      y:            trackY - 22,
      fontSize:     18,
      color:        UISkin.palette.accent,
      bold:         true,
      letterSpacing: 2,
      anchor:       1,
    });

    // Track background
    const track = new PIXI.Graphics();
    track.beginFill(UISkin.palette.disabled, 1);
    track.drawRect(trackX, trackY, trackW, trackH);
    track.endFill();
    track.interactive = true;
    track.cursor = 'pointer';
    this.container.addChild(track);

    // Filled portion (redrawn on change)
    this.sliderFill = new PIXI.Graphics();
    this.container.addChild(this.sliderFill);

    // Thumb
    this.sliderThumb = new PIXI.Graphics();
    this.sliderThumb.interactive = true;
    this.sliderThumb.cursor = 'pointer';
    this.container.addChild(this.sliderThumb);

    // Store track geometry for hit-test math
    this._track = { x: trackX, y: trackY, w: trackW, h: trackH };

    this.redrawSlider(audio.volume);

    // Pointer events
    const startDrag = (e) => {
      this._dragging = true;
      this._updateFromPointer(e);
      this.app.stage.on('pointermove', this._onDrag);
      this.app.stage.on('pointerup',   this._onDrop);
    };
    this._onDrag = (e) => { if (this._dragging) this._updateFromPointer(e); };
    this._onDrop = ()  => {
      this._dragging = false;
      this.app.stage.off('pointermove', this._onDrag);
      this.app.stage.off('pointerup',   this._onDrop);
    };

    track.on('pointerdown',            startDrag);
    this.sliderThumb.on('pointerdown', startDrag);
  }

  _updateFromPointer(e) {
    const { x, w } = this._track;
    const localX = (e.global?.x ?? e.data?.global?.x ?? 0) - x;
    const v = Math.min(1, Math.max(0, localX / w));
    audio.setVolume(v);
    this.redrawSlider(v);
  }

  redrawSlider(v) {
    const { x, y, w, h } = this._track;
    const fillW    = Math.max(0, v * w);
    const thumbX   = x + fillW;
    const thumbSize = 16;

    this.sliderFill.clear();
    this.sliderFill.beginFill(UISkin.palette.accent, 1);
    this.sliderFill.drawRect(x, y, fillW, h);
    this.sliderFill.endFill();

    this.sliderThumb.clear();
    this.sliderThumb.beginFill(UISkin.palette.accent, 1);
    this.sliderThumb.lineStyle(2, UISkin.palette.ink, 1);
    this.sliderThumb.drawRect(
      thumbX - thumbSize / 2,
      y + h / 2 - thumbSize / 2,
      thumbSize,
      thumbSize,
    );
    this.sliderThumb.endFill();

    this.volValue.text = String(Math.round(v * 100));
  }

  // ── Mute toggle ────────────────────────────────────────────────
  buildMuteToggle() {
    const { cx, cy } = this;

    createLabel({
      container:    this.container,
      text:         'MUDO',
      x:            cx - 190,
      y:            cy + 30,
      fontSize:     13,
      color:        UISkin.palette.textPrimary,
      bold:         true,
      letterSpacing: 3,
      anchor:       0,
    });

    createLabel({
      container:    this.container,
      text:         'tecla M também alterna',
      x:            cx - 190,
      y:            cy + 50,
      fontSize:     11,
      color:        UISkin.palette.textSecondary,
      mono:         true,
      letterSpacing: 1,
      anchor:       0,
    });

    this.muteBtn = createPillButton({
      container: this.container,
      x:         cx + 150,
      y:         cy + 38,
      width:     80,
      height:    32,
      primary:   audio.muted,
      text:      audio.muted ? 'ON' : 'OFF',
      onClick:   () => this.toggleMute(),
    });
  }

  toggleMute() {
    audio.toggleMute();
    const on = audio.muted;
    // Redraw button to reflect new state
    this.container.removeChild(this.muteBtn.bg);
    this.container.removeChild(this.muteBtn.label);

    this.muteBtn = createPillButton({
      container: this.container,
      x:         this.cx + 150,
      y:         this.cy + 38,
      width:     80,
      height:    32,
      primary:   on,
      text:      on ? 'ON' : 'OFF',
      onClick:   () => this.toggleMute(),
    });
  }

  // ── Back button ────────────────────────────────────────────────
  buildBackButton() {
    createPillButton({
      container: this.container,
      x:         this.cx,
      y:         this.cy + 120,
      width:     360,
      height:    52,
      text:      '↩   VOLTAR',
      onClick:   () => this.close(),
    });
  }

  close() {
    this.app.stage.off('pointermove', this._onDrag);
    this.app.stage.off('pointerup',   this._onDrop);
    this.app.stage.removeChild(this.container);
    this.onBack();
  }
}
```

- [ ] **Step 4: Run settings test — verify it passes**

```bash
node --test --experimental-specifier-resolution=node test/settings.test.js 2>&1 | tail -10
```

Expected: 2 tests pass.

- [ ] **Step 5: Run full test suite**

```bash
node --test --experimental-specifier-resolution=node 2>&1 | tail -20
```

Expected: all previous tests still pass.

- [ ] **Step 6: Commit**

```bash
git add src/settings.js test/settings.test.js
git commit -m "feat: add Settings screen with volume slider and mute toggle"
```

---

## Task 4: Wire audio into startup and `game.js`

**Files:**
- Modify: `public/index.js`
- Modify: `src/game.js`

- [ ] **Step 1: Update `public/index.js` to load audio state on boot**

Open `public/index.js`. Add the import and `audio.load()` call:

```js
import Menu from "../src/menu";
import { audio } from "../src/audio.js";
import { timeout, interval } from "./lib/pixi-timeout.js";

const canvas = document.getElementById("mycanvas");
const app = new PIXI.Application({
  view:            canvas,
  width:           1280,
  height:          720,
  backgroundColor: 0x0A0A0F,
});
timeout(app);
interval(app);

document.fonts.ready.then(() => {
  audio.load();   // apply saved volume before first frame
  new Menu({ app });
});
```

- [ ] **Step 2: Update `src/game.js` — replace inline mute with `audio.toggleMute()`**

Open `src/game.js`. Add import at the top:

```js
import { audio } from './audio.js';
```

Remove the `let muted = false;` variable declaration.

Replace the `"m"` case inside `handleSystemKeys`:

```js
case "m":
  audio.toggleMute();
  break;
```

The full updated `handleSystemKeys` should look like:

```js
this.handleSystemKeys = (e) => {
  const usedKeys = ["Escape", "m"];
  if (!usedKeys.includes(e.key)) return;

  switch (e.key) {
    case "Escape":
      this.hud.showPaused = !paused;
      this.player.shooting.update();
      app.render();

      if (paused) {
        app.start();
      } else {
        app.stop();
      }

      paused = !paused;
      break;

    case "m":
      audio.toggleMute();
      break;

    default:
      break;
  }
};
```

- [ ] **Step 3: Run game tests to confirm no regressions**

```bash
node --test --experimental-specifier-resolution=node test/game.test.js 2>&1 | tail -15
```

Expected: all game tests pass.

- [ ] **Step 4: Commit**

```bash
git add public/index.js src/game.js
git commit -m "feat: wire audio singleton into startup and game mute key"
```

---

## Task 5: Add settings button to main menu

**Files:**
- Modify: `src/menu.js`

- [ ] **Step 1: Update `src/menu.js`**

Add import at the top of the file:

```js
import Settings from "./settings.js";
```

In `buildButtons()`, add the fourth button. Change `y` of the existing buttons to make room, and increase the card height.

The card call in `buildScene()` — change `height: 572` → `height: 640`:

```js
createCard({
  container:   this.menuContainer,
  x:           cx,
  y:           cy,
  width:       780,
  height:      640,   // was 572
  chamfer:     16,
  bracketSize: 22,
});
```

In `buildButtons()`, add after the CONTROLES button:

```js
createPillButton({
  container: this.menuContainer,
  x: cx, y: cy + 264,
  text:   "⚙  CONFIGURAÇÕES",
  width:  340,
  height: 56,
  onClick: () => {
    this.hide();
    new Settings({
      app: this.app,
      onBack: () => { new Menu({ app: this.app }); },
    });
  },
});
```

- [ ] **Step 2: Run menu tests**

```bash
node --test --experimental-specifier-resolution=node test/menu.test.js 2>&1 | tail -10
```

Expected: all menu tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/menu.js
git commit -m "feat: add settings button to main menu"
```

---

## Task 6: Add settings access from pause screen

**Files:**
- Modify: `src/hud.js`

- [ ] **Step 1: Update `src/hud.js`**

Add import at the top:

```js
import Settings from "./settings.js";
```

In `buildOverlayTexts()`, create the settings button alongside `textPaused` (hidden by default):

```js
buildOverlayTexts() {
  const cx = this.app.screen.width  / 2;
  const cy = this.app.screen.height / 2;

  this.textPaused = createLabel({
    container:    this.hudContainer,
    text:         "//  PAUSED  //",
    x:            cx,
    y:            cy - 40,          // shifted up to make room for button
    fontSize:     58,
    color:        UISkin.palette.accentAlt,
    bold:         true,
    letterSpacing: 6,
    glow:         true,
  });
  this.textPaused.visible = false;

  this.pauseSettingsBtn = createPillButton({
    container: this.hudContainer,
    x:         cx,
    y:         cy + 50,
    text:      "⚙  CONFIGURAÇÕES",
    width:     280,
    height:    52,
    onClick:   () => {
      if (this._openSettings) this._openSettings();
    },
  });
  this.pauseSettingsBtn.bg.visible    = false;
  this.pauseSettingsBtn.label.visible = false;

  this.textEnd = createLabel({
    container:    this.hudContainer,
    text:         "RUN  TERMINATED",
    x:            cx,
    y:            cy - 94,
    fontSize:     50,
    color:        UISkin.palette.danger,
    bold:         true,
    letterSpacing: 4,
    glow:         true,
  });
  this.textEnd.visible = false;
}
```

Add the `openSettings` setter and update `showPaused`:

```js
set openSettings(fn) {
  this._openSettings = fn;
}

set showPaused(val) {
  this.textPaused.visible              = val;
  this.pauseSettingsBtn.bg.visible     = val;
  this.pauseSettingsBtn.label.visible  = val;
}
```

- [ ] **Step 2: Update `src/game.js` to inject the settings callback into hud**

After `this.hud = new Hud(...)`, add:

```js
this.hud.openSettings = () => {
  this.app.stage.removeChild(this.hud.hudContainer);
  new Settings({
    app: this.app,
    onBack: () => {
      this.app.stage.addChild(this.hud.hudContainer);
    },
  });
};
```

Also add the Settings import at top of `game.js` (if not already there):

```js
import Settings from './settings.js';
```

- [ ] **Step 3: Run hud tests**

```bash
node --test --experimental-specifier-resolution=node test/hud.test.js 2>&1 | tail -15
```

Expected: all hud tests pass.

- [ ] **Step 4: Run full test suite**

```bash
node --test --experimental-specifier-resolution=node 2>&1 | tail -25
```

Expected: all tests pass.

- [ ] **Step 5: Build to confirm no bundler errors**

```bash
npm run build 2>&1 | tail -10
```

Expected: `▶ Build Complete!`

- [ ] **Step 6: Final commit**

```bash
git add src/hud.js src/game.js
git commit -m "feat: add settings access from pause screen"
```
