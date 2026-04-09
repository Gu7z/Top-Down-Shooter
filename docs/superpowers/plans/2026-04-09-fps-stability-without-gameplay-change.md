# FPS Stability Without Gameplay Change Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the FPS collapse sources in combat visuals while preserving gameplay and visuals frame-for-frame.

**Architecture:** Keep the simulation frame-based. Replace per-trail timers in `EnemyBullet` with a centralized frame-driven trail updater inside the bullet itself, and refactor `Effects` to reuse graphics and compact hot arrays in place. Add one repeatable stress probe script so the structural load before/after can be compared with real numbers, not impressions.

**Tech Stack:** JavaScript ESM, PixiJS, Victor, Node test runner, c8 coverage, local PIXI mocks.

---

## File Map

- `scripts/profile_visual_hotspots.mjs`
  Runs a deterministic stress probe against `EnemyBullet` and `Effects`, printing JSON metrics that can be captured as baseline/final artifacts.

- `src/enemy_bullet.js`
  Owns enemy bullet movement plus the full lifecycle of its trail visuals. This file will stop creating one timer per trail node and will update trail nodes in-frame.

- `src/effects.js`
  Owns explosions, chain lightning, pulses, shake, and screen pulse. This file will gain reusable graphics pools and in-place compaction for hot arrays.

- `test/enemy_bullet.test.js`
  Verifies trail cadence, fade/scale behavior, stress fan-out, and the absence of per-trail timer creation.

- `test/effects.test.js`
  Verifies pooling/reuse, in-place updates, and preservation of current effect behavior.

- `docs/superpowers/artifacts/2026-04-09-fps-hotspots-baseline.json`
  Captured output of the current stress probe before implementation.

- `docs/superpowers/artifacts/2026-04-09-fps-hotspots-final.json`
  Captured output of the same stress probe after implementation.

---

### Task 1: Capture a Repeatable Baseline Probe

**Files:**
- Create: `scripts/profile_visual_hotspots.mjs`
- Create: `docs/superpowers/artifacts/2026-04-09-fps-hotspots-baseline.json`

- [ ] **Step 1: Write the stress probe script**

```js
import { setupPixiMock, createAppMock } from "../test/helpers.js";
import EnemyBullet from "../src/enemy_bullet.js";
import Effects from "../src/effects.js";

setupPixiMock();

const app = createAppMock();
app.stage.position = {
  x: 0,
  y: 0,
  set(x, y) {
    this.x = x;
    this.y = y;
  },
};

const intervals = [];
app.setInterval = (fn, seconds) => {
  const timer = {
    fn,
    seconds,
    cleared: false,
    clear() {
      this.cleared = true;
    },
  };
  intervals.push(timer);
  return timer;
};

const bullets = [];
for (let i = 0; i < 40; i += 1) {
  bullets.push(new EnemyBullet({
    app,
    position: { x: 10, y: 10 + i },
    targetPosition: { x: 220, y: 10 + i },
    color: 0xff0000,
  }));
}

for (let frame = 0; frame < 60; frame += 1) {
  for (const bullet of bullets) bullet.update();
}

const effects = new Effects({ app });
effects.explosion(50, 50, 0xff0000, 24);
effects.explosion(90, 70, 0x00ffff, 16);
effects.chainLightning(10, 10, [
  { x: 120, y: 40 },
  { x: 160, y: 80 },
  { x: 220, y: 120 },
]);

console.log(JSON.stringify({
  enemyBullet: {
    bullets: bullets.length,
    framesSimulated: 60,
    timersCreated: intervals.length,
    activeTrailTimers: bullets.reduce((sum, bullet) => sum + (bullet.trailTimers?.size || 0), 0),
    trailGraphics: bullets.reduce((sum, bullet) => sum + bullet.trailContainer.children.length, 0),
  },
  effects: {
    particles: effects.particles.length,
    pulses: effects.pulses.length,
    effectChildren: effects.effectsContainer.children.length,
  },
}, null, 2));
```

- [ ] **Step 2: Run the probe and capture the baseline artifact**

Run: `node scripts/profile_visual_hotspots.mjs > docs/superpowers/artifacts/2026-04-09-fps-hotspots-baseline.json`

Expected: command exits `0` and the JSON shows non-zero `enemyBullet.timersCreated`, large `activeTrailTimers`, and populated `trailGraphics` / `effects` counts.

- [ ] **Step 3: Verify the baseline artifact contains the expected fields**

Run: `cat docs/superpowers/artifacts/2026-04-09-fps-hotspots-baseline.json`

Expected: JSON contains:
- `enemyBullet.timersCreated`
- `enemyBullet.activeTrailTimers`
- `enemyBullet.trailGraphics`
- `effects.particles`
- `effects.effectChildren`

- [ ] **Step 4: Commit the probe**

```bash
git add scripts/profile_visual_hotspots.mjs docs/superpowers/artifacts/2026-04-09-fps-hotspots-baseline.json
git commit -m "test: add visual hotspot baseline probe"
```

### Task 2: Replace Per-Trail Timers with Frame-Driven Trail Nodes

**Files:**
- Modify: `test/enemy_bullet.test.js`
- Modify: `src/enemy_bullet.js`

- [ ] **Step 1: Write the failing trail regression tests**

Add these tests to `test/enemy_bullet.test.js`:

```js
test("enemy bullet trail stays frame-driven without per-trail intervals", () => {
  const { app, intervals } = createTimerApp();
  const enemyBullet = new EnemyBullet({
    app,
    position: { x: 10, y: 10 },
    targetPosition: { x: 20, y: 10 },
    color: 0xff0000,
  });

  enemyBullet.framesCount = 2;
  enemyBullet.updateTrail();

  assert.equal(intervals.length, 0);
  assert.equal(enemyBullet.trailNodes.length, 1);
  assert.equal(enemyBullet.trailContainer.children.length, 1);
  assert.equal(enemyBullet.trailContainer.children[0].alpha, enemyBullet.trailAlpha);

  enemyBullet.updateTrail();

  assert.equal(enemyBullet.trailContainer.children[0].alpha, enemyBullet.trailAlpha - 0.05);
  assert.equal(enemyBullet.trailContainer.children[0].scale.x, 0.9);
  assert.equal(enemyBullet.trailContainer.children[0].scale.y, 0.9);
});

test("enemy bullet stress burst does not fan out trail timers", () => {
  const { app, intervals } = createTimerApp();
  const bullets = [];
  for (let i = 0; i < 40; i += 1) {
    bullets.push(new EnemyBullet({
      app,
      position: { x: 10, y: 10 + i },
      targetPosition: { x: 200, y: 10 + i },
      color: 0xff0000,
    }));
  }

  for (let frame = 0; frame < 60; frame += 1) {
    for (const bullet of bullets) bullet.update();
  }

  assert.equal(intervals.length, 0);
});
```

- [ ] **Step 2: Run the enemy bullet tests to verify they fail**

Run: `node --test --experimental-specifier-resolution=node test/enemy_bullet.test.js`

Expected: FAIL because the current implementation creates one `setInterval` per trail node and has no `trailNodes` state.

- [ ] **Step 3: Implement centralized trail-node updates in `src/enemy_bullet.js`**

Replace the timer-per-node logic with frame-driven trail state:

```js
this.framesCount = 0;
this.trailNodes = [];
```

```js
_spawnTrailNode() {
  const trail = new PIXI.Graphics();
  trail.beginFill(this.trailColor, 1);
  trail.drawCircle(0, 0, this.radius * this.trailScale);
  trail.endFill();
  trail.alpha = this.trailAlpha;
  trail.position.set(this.bullet.position.x, this.bullet.position.y);
  this.trailContainer.addChild(trail);

  this.trailNodes.push({
    sprite: trail,
    alpha: this.trailAlpha,
    scale: 1,
  });
}
```

```js
_updateTrailNodes() {
  let write = 0;

  for (let i = 0; i < this.trailNodes.length; i += 1) {
    const node = this.trailNodes[i];
    if (node.sprite.destroyed) continue;

    node.alpha -= 0.05;
    node.scale *= 0.9;
    node.sprite.alpha = node.alpha;
    node.sprite.scale.set(node.scale, node.scale);

    if (node.alpha <= 0) {
      node.sprite.destroy();
      continue;
    }

    this.trailNodes[write] = node;
    write += 1;
  }

  this.trailNodes.length = write;
}
```

```js
updateTrail() {
  this.framesCount += 1;

  if (this.framesCount % 3 === 0) {
    this._spawnTrailNode();
  }

  this._updateTrailNodes();
}
```

```js
destroy() {
  if (this.destroyed) return;
  this.destroyed = true;
  this.bullet.visible = false;
  this.bullet.parent?.removeChild?.(this.bullet);
  this.bullet.destroy({ children: true });
  this.trailNodes.forEach((node) => node.sprite.destroy());
  this.trailNodes.length = 0;
  if (!this.trailContainer.destroyed) {
    this.trailContainer.destroy({ children: true });
  }
}
```

- [ ] **Step 4: Run the enemy bullet tests to verify they pass**

Run: `node --test --experimental-specifier-resolution=node test/enemy_bullet.test.js`

Expected: PASS, with no trail timers being created and the same fade/scale behavior preserved.

- [ ] **Step 5: Commit the trail refactor**

```bash
git add src/enemy_bullet.js test/enemy_bullet.test.js
git commit -m "refactor: make enemy bullet trails frame-driven"
```

### Task 3: Reuse Effect Graphics and Compact Hot Arrays In Place

**Files:**
- Modify: `test/effects.test.js`
- Modify: `src/effects.js`

- [ ] **Step 1: Write the failing effect-structure tests**

Add these tests to `test/effects.test.js`:

```js
test("effects reuses an explosion particle graphic after expiry", () => {
  const app = createEffectsApp();
  const effects = new Effects({ app });

  effects.explosion(10, 20, 0xff0000, 1);
  const firstSprite = effects.particles[0].sprite;
  effects.particles[0].life = 1;
  effects.updateParticles();

  effects.explosion(10, 20, 0xff0000, 1);

  assert.equal(effects.particles[0].sprite, firstSprite);
});

test("effects updateParticles compacts in place instead of replacing the array", () => {
  const app = createEffectsApp();
  const effects = new Effects({ app });

  effects.explosion(10, 20, 0xff0000, 2);
  const sameArray = effects.particles;
  effects.particles[0].life = 1;

  effects.updateParticles();

  assert.equal(effects.particles, sameArray);
  assert.equal(effects.particles.length, 1);
});

test("effects reuses a chain lightning bolt graphic after expiry", () => {
  const app = createEffectsApp();
  const effects = new Effects({ app });

  effects.chainLightning(10, 20, [{ x: 40, y: 50 }]);
  const firstBolt = effects.particles[0].sprite;
  effects.particles[0].life = 1;
  effects.updateParticles();

  effects.chainLightning(10, 20, [{ x: 40, y: 50 }]);

  assert.equal(effects.particles[0].sprite, firstBolt);
});
```

- [ ] **Step 2: Run the effects tests to verify they fail**

Run: `node --test --experimental-specifier-resolution=node test/effects.test.js`

Expected: FAIL because the current implementation always allocates new `Graphics` and replaces `effects.particles` with `filter(...)`.

- [ ] **Step 3: Implement graphics reuse and in-place compaction in `src/effects.js`**

Add reusable pools in the constructor:

```js
this.circleParticlePool = [];
this.boltPool = [];
```

Add graphic acquisition helpers:

```js
_acquireCircleParticle() {
  const sprite = this.circleParticlePool.pop() || new PIXI.Graphics();
  sprite.clear();
  sprite.alpha = 1;
  sprite.visible = true;
  sprite.scale.set(1, 1);
  return sprite;
}

_acquireBoltGraphic() {
  const sprite = this.boltPool.pop() || new PIXI.Graphics();
  sprite.clear();
  sprite.alpha = 1;
  sprite.visible = true;
  sprite.scale.set(1, 1);
  return sprite;
}
```

Add release helpers:

```js
_releaseCircleParticle(sprite) {
  sprite.clear();
  sprite.parent?.removeChild?.(sprite);
  this.circleParticlePool.push(sprite);
}

_releaseBoltGraphic(sprite) {
  sprite.clear();
  sprite.parent?.removeChild?.(sprite);
  this.boltPool.push(sprite);
}
```

Refactor `explosion()` to reuse pooled sprites and store `maxLife` explicitly:

```js
const particle = this._acquireCircleParticle();
particle.beginFill(color, 1);
particle.drawCircle(0, 0, radius);
particle.endFill();
particle.position.set(x, y);
this.effectsContainer.addChild(particle);
this.particles.push({
  sprite: particle,
  kind: "circle",
  vx: Math.cos(angle) * speed,
  vy: Math.sin(angle) * speed,
  life: 30,
  maxLife: 30,
  gravity: 0.05,
});
```

Refactor `chainLightning()` to reuse pooled bolt sprites:

```js
const bolt = this._acquireBoltGraphic();
// redraw the same bolt paths as today
this.effectsContainer.addChild(bolt);
this.particles.push({
  sprite: bolt,
  kind: "bolt",
  vx: 0,
  vy: 0,
  life: 35,
  maxLife: 35,
  gravity: 0,
});
```

Replace `updateParticles()` with in-place compaction:

```js
updateParticles() {
  let write = 0;

  for (let i = 0; i < this.particles.length; i += 1) {
    const particle = this.particles[i];
    particle.vy += particle.gravity;
    particle.sprite.position.x += particle.vx;
    particle.sprite.position.y += particle.vy;
    particle.life -= 1;
    particle.sprite.alpha = Math.max(0, particle.life / particle.maxLife);

    if (particle.life <= 0) {
      if (particle.kind === "bolt") this._releaseBoltGraphic(particle.sprite);
      else this._releaseCircleParticle(particle.sprite);
      continue;
    }

    this.particles[write] = particle;
    write += 1;
  }

  this.particles.length = write;
}
```

Replace `updatePulses()` with the same compaction strategy:

```js
updatePulses() {
  let write = 0;

  for (let i = 0; i < this.pulses.length; i += 1) {
    const pulse = this.pulses[i];
    if (pulse.displayObject.destroyed) continue;

    const progress = pulse.current / pulse.duration;
    pulse.displayObject.tint = progress > 0.5 ? pulse.color : pulse.originalTint;
    pulse.current -= 1;

    if (pulse.current <= 0) {
      pulse.displayObject.tint = pulse.originalTint;
      continue;
    }

    this.pulses[write] = pulse;
    write += 1;
  }

  this.pulses.length = write;
}
```

- [ ] **Step 4: Run the effects tests to verify they pass**

Run: `node --test --experimental-specifier-resolution=node test/effects.test.js`

Expected: PASS, with graphic reuse and stable array identity confirmed.

- [ ] **Step 5: Commit the effects refactor**

```bash
git add src/effects.js test/effects.test.js
git commit -m "refactor: reuse effect graphics and compact hot arrays"
```

### Task 4: Re-run the Probe, Compare Metrics, and Verify the Whole Game

**Files:**
- Create: `docs/superpowers/artifacts/2026-04-09-fps-hotspots-final.json`

- [ ] **Step 1: Re-run the stress probe after the refactors**

Run: `node scripts/profile_visual_hotspots.mjs > docs/superpowers/artifacts/2026-04-09-fps-hotspots-final.json`

Expected: command exits `0` and the final JSON shows:
- `enemyBullet.timersCreated === 0`
- `enemyBullet.activeTrailTimers === 0`
- lower structural load than the baseline for trail/timer metrics

- [ ] **Step 2: Compare baseline and final artifacts**

Run: `diff -u docs/superpowers/artifacts/2026-04-09-fps-hotspots-baseline.json docs/superpowers/artifacts/2026-04-09-fps-hotspots-final.json`

Expected: diff shows the trail timer counts dropping to zero and lower redundant visual load under the same probe.

- [ ] **Step 3: Run targeted regressions for the touched systems**

Run: `node --test --experimental-specifier-resolution=node test/enemy_bullet.test.js test/effects.test.js`

Expected: PASS

- [ ] **Step 4: Run the full project verification**

Run: `npm test`

Expected: PASS with zero failing tests.

- [ ] **Step 5: Commit the verification artifacts**

```bash
git add docs/superpowers/artifacts/2026-04-09-fps-hotspots-final.json
git commit -m "test: capture final visual hotspot metrics"
```
