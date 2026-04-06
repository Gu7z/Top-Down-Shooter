# Skill Tree Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace temporary in-run buffs with a permanent performance-funded skill tree, run-summary stats, and a progressive Pixi constellation UI.

**Architecture:** Keep gameplay logic data-driven: skill definitions live in one progression data module, purchase/refund/persistence logic lives in one state module, and run stats/credit calculation lives in one stats module. Pixi screens consume those modules instead of hardcoding progression rules in rendering code.

**Tech Stack:** JavaScript ESM, PixiJS, Snowpack, Node `node:test`, `localStorage`, Playwright screenshots for visual QA.

---

## User Constraint

The user explicitly said not to commit. Every task uses a `git status --short` checkpoint instead of `git commit`.

## Scope Check

The spec touches progression, UI, gameplay effects, run summary, and balance. These systems are coupled through one player loop, so this plan keeps them together but orders tasks so each slice is independently testable.

## File Structure

- Create `src/progression/skill_tree_data.js`: canonical `CORE + 39` upgrade definitions, branch metadata, costs, prerequisite ids, effects, and world coordinates.
- Create `src/progression/skill_tree_state.js`: localStorage load/save, credit balance, purchased ids, purchase/refund cascade, reveal rules, and camera framing helpers.
- Create `src/progression/skill_effects.js`: converts purchased skill ids into a normalized runtime effects object.
- Create `src/progression/run_stats.js`: run-local stats, accuracy, achievements, and credit formula.
- Create `src/skill_tree.js`: Pixi screen for the progressive constellation, pan/zoom, hover tooltip, left-click unlock, right-click cascade refund.
- Create `src/run_summary.js`: Pixi run-summary/achievement screen shown after death or manual end-run.
- Modify `src/menu.js`: add `SKILL TREE` button and navigation.
- Modify `src/game.js`: remove the live buff pickup, initialize stats/effects, pass effects into player/shooting/spawner, and open run summary on run end.
- Modify `src/player.js`: apply movement/life/shield/dash/control effects.
- Modify `src/shooting.js`: apply firepower/tech effects, record shots, support damage and multishot.
- Modify `src/enemy.js`: track enemy type metadata, apply score effects, record kills, support damage and control effects.
- Modify `src/spanwer.js`: classify enemy types, pass metadata, and tune early spawn pressure after permanent upgrades.
- Modify `src/utils/bullet_hit.js`: record hits and pass bullet damage/control metadata to enemies.
- Modify `test/helpers.js`: extend Pixi mocks enough for the new screen tests.
- Create tests under `test/progression/` plus focused tests for menu, game, HUD/run summary, player, shooting, enemy, spawner, and skill tree rendering helpers.
- Leave `src/buff.js` in the repository for historical tests during the transition, but remove it from the live `Game` loop. Delete it only if all buff tests are intentionally replaced.

## Skill Data Contract

Every skill definition must match this shape:

```js
{
  id: "fire_rate_1",
  name: "Rapid Capacitor",
  branch: "firepower",
  type: "base",
  cost: 45,
  description: "+15% fire velocity.",
  effects: { fireVelocityMultiplier: 1.15 },
  prereqs: ["core"],
  position: { x: 0, y: -260 },
  reveal: { distance: 1 }
}
```

Initial branches and positions:

```js
export const SKILL_BRANCHES = [
  { id: "firepower", label: "Firepower", color: 0xff3366, angle: -90 },
  { id: "mobility", label: "Mobility", color: 0x00ffff, angle: -30 },
  { id: "survival", label: "Survival", color: 0x00ff88, angle: 30 },
  { id: "economy", label: "Economy", color: 0xfff275, angle: 90 },
  { id: "tech", label: "Tech", color: 0x9b5cff, angle: 150 },
  { id: "control", label: "Control", color: 0x5cc8ff, angle: 210 },
];
```

Initial skill ids:

```js
[
  "core",
  "fire_rate_1", "bullet_speed_1", "bullet_damage_1", "multishot_1", "overheat_1",
  "move_speed_1", "dash_unlock", "dash_cooldown_1", "dash_iframe_1", "strafe_control_1",
  "max_hp_1", "shield_1", "shield_regen_1", "hit_guard_1", "emergency_shield_1",
  "credit_gain_1", "score_bonus_1", "streak_reward_1", "boss_bounty_1", "discount_protocol_1",
  "drone_unlock", "drone_fire_rate_1", "drone_targeting_1", "magnet_scan_1", "drone_overclock_1",
  "slow_field_1", "knockback_1", "enemy_weaken_1", "chain_pulse_1", "control_duration_1",
  "fusion_firepower_mobility", "fusion_mobility_survival", "fusion_survival_economy",
  "fusion_economy_tech", "fusion_tech_control", "fusion_control_firepower",
  "capstone_overdrive_matrix", "capstone_adaptive_reactor", "capstone_synapse_swarm",
]
```

Minimum concrete costs:

```js
const COSTS = {
  tier1: 45,
  tier2: 70,
  tier3: 100,
  tier4: 135,
  tier5: 175,
  fusion: 240,
  capstone: 420,
};
```

## Task 1: Skill Tree Data

**Files:**
- Create: `src/progression/skill_tree_data.js`
- Create: `test/progression/skill_tree_data.test.js`

- [ ] **Step 1: Write the failing data integrity tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { SKILL_TREE, SKILL_BRANCHES, getSkillById } from "../../src/progression/skill_tree_data.js";

test("skill tree contains core plus thirty-nine upgrade nodes", () => {
  assert.equal(SKILL_TREE.length, 40);
  assert.equal(SKILL_TREE.filter((skill) => skill.type === "core").length, 1);
  assert.equal(SKILL_TREE.filter((skill) => skill.type === "base").length, 30);
  assert.equal(SKILL_TREE.filter((skill) => skill.type === "fusion").length, 6);
  assert.equal(SKILL_TREE.filter((skill) => skill.type === "capstone").length, 3);
});

test("all skill ids are unique and prereqs point at existing skills", () => {
  const ids = new Set(SKILL_TREE.map((skill) => skill.id));
  assert.equal(ids.size, SKILL_TREE.length);
  for (const skill of SKILL_TREE) {
    for (const prereq of skill.prereqs) assert.ok(ids.has(prereq), `${skill.id} missing prereq ${prereq}`);
  }
});

test("six branches are in the approved order", () => {
  assert.deepEqual(SKILL_BRANCHES.map((branch) => branch.id), [
    "firepower", "mobility", "survival", "economy", "tech", "control",
  ]);
});

test("node positions keep a safe world-space gap", () => {
  for (let i = 0; i < SKILL_TREE.length; i++) {
    for (let j = i + 1; j < SKILL_TREE.length; j++) {
      const a = SKILL_TREE[i];
      const b = SKILL_TREE[j];
      const dx = a.position.x - b.position.x;
      const dy = a.position.y - b.position.y;
      const distance = Math.hypot(dx, dy);
      assert.ok(distance >= 130, `${a.id} and ${b.id} are too close: ${distance}`);
    }
  }
});

test("getSkillById returns the exact skill", () => {
  assert.equal(getSkillById("core").name, "Core");
  assert.equal(getSkillById("missing"), undefined);
});
```

- [ ] **Step 2: Run the focused failing test**

Run: `npm test -- --test-name-pattern "skill tree"`

Expected: FAIL because `src/progression/skill_tree_data.js` does not exist.

- [ ] **Step 3: Implement `skill_tree_data.js`**

Use the approved ids above. Concrete branch prerequisites:

```js
const branchChains = {
  firepower: ["core", "fire_rate_1", "bullet_speed_1", "bullet_damage_1", "multishot_1", "overheat_1"],
  mobility: ["core", "move_speed_1", "dash_unlock", "dash_cooldown_1", "dash_iframe_1", "strafe_control_1"],
  survival: ["core", "max_hp_1", "shield_1", "shield_regen_1", "hit_guard_1", "emergency_shield_1"],
  economy: ["core", "credit_gain_1", "score_bonus_1", "streak_reward_1", "boss_bounty_1", "discount_protocol_1"],
  tech: ["core", "drone_unlock", "drone_fire_rate_1", "drone_targeting_1", "magnet_scan_1", "drone_overclock_1"],
  control: ["core", "slow_field_1", "knockback_1", "enemy_weaken_1", "chain_pulse_1", "control_duration_1"],
};
```

Fusion prerequisites:

```js
{
  fusion_firepower_mobility: ["bullet_damage_1", "dash_cooldown_1"],
  fusion_mobility_survival: ["dash_iframe_1", "shield_regen_1"],
  fusion_survival_economy: ["hit_guard_1", "boss_bounty_1"],
  fusion_economy_tech: ["discount_protocol_1", "drone_targeting_1"],
  fusion_tech_control: ["drone_overclock_1", "enemy_weaken_1"],
  fusion_control_firepower: ["control_duration_1", "multishot_1"],
}
```

Capstone prerequisites:

```js
{
  capstone_overdrive_matrix: ["overheat_1", "fusion_firepower_mobility", "fusion_control_firepower"],
  capstone_adaptive_reactor: ["emergency_shield_1", "fusion_mobility_survival", "fusion_survival_economy"],
  capstone_synapse_swarm: ["drone_overclock_1", "fusion_economy_tech", "fusion_tech_control"],
}
```

World positions use six radial branches with radii `[260, 430, 600, 780, 980]`, fusion nodes at radius `650` between neighboring branch angles, and capstones at radius `1260`.

- [ ] **Step 4: Run the focused passing test**

Run: `npm test -- --test-name-pattern "skill tree"`

Expected: PASS for data integrity tests.

- [ ] **Step 5: Checkpoint without commit**

Run: `git status --short`

Expected: `src/progression/skill_tree_data.js` and `test/progression/skill_tree_data.test.js` appear as intended changes.

## Task 2: Skill State, Persistence, Unlocks, And Cascade Refund

**Files:**
- Create: `src/progression/skill_tree_state.js`
- Create: `test/progression/skill_tree_state.test.js`

- [ ] **Step 1: Write the failing state tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createSkillTreeState, SKILL_TREE_STORAGE_KEY } from "../../src/progression/skill_tree_state.js";

function memoryStorage(initial = {}) {
  return {
    storage: { ...initial },
    getItem(key) { return this.storage[key] || null; },
    setItem(key, value) { this.storage[key] = value; },
  };
}

test("new state starts with credits and only core purchased", () => {
  const state = createSkillTreeState({ storage: memoryStorage(), initialCredits: 100 });
  assert.equal(state.getCredits(), 100);
  assert.deepEqual(state.getPurchasedIds(), ["core"]);
});

test("purchase requires credits and prerequisites", () => {
  const state = createSkillTreeState({ storage: memoryStorage(), initialCredits: 200 });
  assert.equal(state.purchase("bullet_speed_1").ok, false);
  assert.equal(state.purchase("fire_rate_1").ok, true);
  assert.equal(state.has("fire_rate_1"), true);
  assert.equal(state.getCredits(), 155);
});

test("state saves and loads from localStorage", () => {
  const storage = memoryStorage();
  const state = createSkillTreeState({ storage, initialCredits: 100 });
  state.purchase("fire_rate_1");
  const loaded = createSkillTreeState({ storage });
  assert.equal(loaded.has("fire_rate_1"), true);
  assert.equal(loaded.getCredits(), 55);
  assert.ok(storage.getItem(SKILL_TREE_STORAGE_KEY).includes("fire_rate_1"));
});

test("right-click refund removes dependents in cascade with full refund", () => {
  const state = createSkillTreeState({ storage: memoryStorage(), initialCredits: 1000 });
  state.purchase("fire_rate_1");
  state.purchase("bullet_speed_1");
  state.purchase("bullet_damage_1");
  const creditsBeforeRefund = state.getCredits();
  const result = state.refundCascade("fire_rate_1");
  assert.equal(result.ok, true);
  assert.deepEqual(result.removedIds, ["bullet_damage_1", "bullet_speed_1", "fire_rate_1"]);
  assert.equal(state.has("fire_rate_1"), false);
  assert.equal(state.getCredits(), creditsBeforeRefund + 45 + 70 + 100);
});

test("progressive reveal exposes purchased, available, and direct child signals", () => {
  const state = createSkillTreeState({ storage: memoryStorage(), initialCredits: 100 });
  assert.ok(state.getVisibleSkillIds().includes("core"));
  assert.ok(state.getVisibleSkillIds().includes("fire_rate_1"));
  assert.equal(state.getInitialFrameIds().join(","), "core");
});
```

- [ ] **Step 2: Run the focused failing test**

Run: `npm test -- --test-name-pattern "state"`

Expected: FAIL because `skill_tree_state.js` does not exist.

- [ ] **Step 3: Implement the state module**

Required exported API:

```js
export const SKILL_TREE_STORAGE_KEY = "neonHunt.skillTree.v1";

export function createSkillTreeState({ storage = localStorage, initialCredits = 0 } = {}) {
  return {
    getCredits,
    setCredits,
    addCredits,
    getPurchasedIds,
    has,
    canPurchase,
    purchase,
    refundCascade,
    getVisibleSkillIds,
    getInitialFrameIds,
    save,
  };
}
```

Implementation rules:

```js
// Persist this exact payload shape.
{
  credits: 0,
  purchasedIds: ["core"],
  spentBySkillId: {}
}
```

Purchase rules:

```js
const missingPrereqs = skill.prereqs.filter((id) => !purchased.has(id));
const cost = getDiscountedCost(skill, purchased);
if (missingPrereqs.length) return { ok: false, reason: "missing_prereqs", missingPrereqs };
if (credits < cost) return { ok: false, reason: "not_enough_credits", cost, credits };
```

Refund cascade rules:

```js
// Remove every purchased skill whose prereq chain reaches the clicked skill.
// Sort deepest dependents first, then remove the clicked skill last.
// Refund the exact amount from spentBySkillId for each removed skill.
```

Reveal rules:

```js
// Visible ids = core + purchased ids + any skill whose prereqs are all purchased + direct children of purchased ids.
// Initial camera frame ids = purchased ids excluding available-but-unpurchased ids.
// If only core exists, return ["core"].
```

- [ ] **Step 4: Run the focused passing test**

Run: `npm test -- --test-name-pattern "state"`

Expected: PASS for state tests.

- [ ] **Step 5: Checkpoint without commit**

Run: `git status --short`

Expected: state module and tests appear as intended changes.

## Task 3: Run Stats, Achievements, And Credits

**Files:**
- Create: `src/progression/run_stats.js`
- Create: `test/progression/run_stats.test.js`

- [ ] **Step 1: Write the failing run-stats tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createRunStats, calculateCredits, createRunSummary } from "../../src/progression/run_stats.js";

test("run stats records shots, hits, kills, boss kills, and time", () => {
  const stats = createRunStats({ now: () => 1000 });
  stats.recordShotFired();
  stats.recordShotFired();
  stats.recordShotHit();
  stats.recordKill({ typeId: "runner", value: 1, isBoss: false });
  stats.recordKill({ typeId: "boss", value: 10, isBoss: true });
  const summary = stats.snapshot({ score: 55, now: 31000 });
  assert.equal(summary.shotsFired, 2);
  assert.equal(summary.shotsHit, 1);
  assert.equal(summary.accuracyPercent, 50);
  assert.equal(summary.timeSurvivedSeconds, 30);
  assert.equal(summary.killsByType.runner, 1);
  assert.equal(summary.bossKills, 1);
});

test("credit calculation is explainable and affected by economy effects", () => {
  const credits = calculateCredits({
    score: 120,
    timeSurvivedSeconds: 75,
    shotsFired: 10,
    shotsHit: 8,
    killsByType: { chaser: 12 },
    bossKills: 1,
  }, { creditMultiplier: 1.1, bossCreditBonus: 15 });

  assert.equal(credits.total, 121);
  assert.deepEqual(credits.breakdown.map((row) => row.label), [
    "Score", "Kills", "Accuracy", "Boss bounty", "Survival", "Economy multiplier",
  ]);
});

test("summary includes achievement-style highlights", () => {
  const summary = createRunSummary({
    score: 120,
    timeSurvivedSeconds: 90,
    shotsFired: 10,
    shotsHit: 9,
    killsByType: { chaser: 20 },
    bossKills: 1,
  }, { creditMultiplier: 1 });

  assert.ok(summary.highlights.includes("HIGH ACCURACY"));
  assert.ok(summary.highlights.includes("BOSS DOWN"));
  assert.equal(summary.credits.total > 0, true);
});
```

- [ ] **Step 2: Run the focused failing test**

Run: `npm test -- --test-name-pattern "run stats"`

Expected: FAIL because `run_stats.js` does not exist.

- [ ] **Step 3: Implement credit formula**

Use this exact first-pass formula:

```js
const scoreCredits = Math.floor(score / 5);
const killCredits = Object.values(killsByType).reduce((sum, count) => sum + count, 0) * 2;
const accuracyCredits = shotsFired >= 10 && accuracyPercent >= 75 ? 12 : 0;
const bossCredits = bossKills * (20 + bossCreditBonus);
const survivalCredits = Math.floor(timeSurvivedSeconds / 15) * 3;
const preMultiplier = scoreCredits + killCredits + accuracyCredits + bossCredits + survivalCredits;
const total = Math.floor(preMultiplier * creditMultiplier);
```

Required highlights:

```js
if (accuracyPercent >= 75 && shotsFired >= 10) highlights.push("HIGH ACCURACY");
if (timeSurvivedSeconds >= 90) highlights.push("LONG SURVIVAL");
if (bossKills > 0) highlights.push("BOSS DOWN");
if (totalKills >= 20) highlights.push("CROWD BREAKER");
if (score >= 100) highlights.push("SCORE SPIKE");
```

- [ ] **Step 4: Run the focused passing test**

Run: `npm test -- --test-name-pattern "run stats"`

Expected: PASS for run stats tests.

- [ ] **Step 5: Checkpoint without commit**

Run: `git status --short`

Expected: run stats module and tests appear as intended changes.

## Task 4: Runtime Skill Effects

**Files:**
- Create: `src/progression/skill_effects.js`
- Create: `test/progression/skill_effects.test.js`
- Modify: `src/player.js`
- Modify: `src/shooting.js`
- Modify: `src/enemy.js`
- Modify: `src/utils/bullet_hit.js`

- [ ] **Step 1: Write failing effect aggregation tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultSkillEffects, deriveSkillEffects } from "../../src/progression/skill_effects.js";

test("default effects are safe no-upgrade values", () => {
  assert.deepEqual(createDefaultSkillEffects(), {
    fireVelocityMultiplier: 1,
    bulletSpeedBonus: 0,
    bulletDamageBonus: 0,
    extraProjectiles: 0,
    spreadRadians: 0,
    critChance: 0,
    critMultiplier: 1,
    moveSpeedBonus: 0,
    dashEnabled: false,
    dashCooldownMultiplier: 1,
    dashInvulnerabilityMs: 0,
    maxLifeBonus: 0,
    maxShield: 0,
    shieldRegenSeconds: 0,
    postHitGuardMs: 0,
    emergencyShield: false,
    creditMultiplier: 1,
    scoreMultiplier: 1,
    streakCreditBonus: 0,
    bossCreditBonus: 0,
    discountMultiplier: 1,
    droneCount: 0,
    droneFireVelocityMultiplier: 1,
    droneTargeting: false,
    magnetRadiusBonus: 0,
    droneOverclockMultiplier: 1,
    slowFieldMultiplier: 1,
    knockbackBonus: 0,
    enemyWeakenMultiplier: 1,
    chainPulseRadius: 0,
    controlDurationMultiplier: 1,
  });
});

test("deriveSkillEffects combines purchased skills", () => {
  const effects = deriveSkillEffects(["core", "fire_rate_1", "bullet_speed_1", "credit_gain_1"]);
  assert.equal(effects.fireVelocityMultiplier, 1.15);
  assert.equal(effects.bulletSpeedBonus, 0.4);
  assert.equal(effects.creditMultiplier, 1.1);
});
```

- [ ] **Step 2: Run focused failing tests**

Run: `npm test -- --test-name-pattern "effects"`

Expected: FAIL because `skill_effects.js` does not exist.

- [ ] **Step 3: Implement aggregation**

Aggregate numeric multipliers by multiplication, additive bonuses by addition, and boolean unlocks with OR:

```js
if (typeof value === "number" && key.endsWith("Multiplier")) effects[key] *= value;
else if (typeof value === "number") effects[key] += value;
else if (typeof value === "boolean") effects[key] = effects[key] || value;
```

- [ ] **Step 4: Add gameplay integration tests**

Add focused assertions:

```js
// test/player.test.js
test("player applies life and movement skill effects", () => {
  const boosted = new Player({ app: createAppMock(), username: "test", keys: {}, skillEffects: { moveSpeedBonus: 0.5, maxLifeBonus: 1 } });
  assert.equal(boosted.velocity, 2.5);
  assert.equal(boosted.lifes, 2);
});

// test/shooting.test.js
test("shooting applies firepower effects and records shots", () => {
  const runStats = { shots: 0, recordShotFired() { this.shots += 1; } };
  const shooting = new Shooting({ app, player, playerSize: 20, keys: {}, skillEffects: { bulletSpeedBonus: 1, bulletDamageBonus: 1, extraProjectiles: 1, spreadRadians: 0.2 }, runStats });
  shooting.fire();
  assert.equal(shooting.bullets.length, 2);
  assert.equal(shooting.bullets[0].damage, 2);
  assert.equal(runStats.shots, 2);
});
```

- [ ] **Step 5: Implement gameplay effect hooks**

Rules:

```js
// Player
this.skillEffects = { ...createDefaultSkillEffects(), ...skillEffects };
this.lifes = 1 + this.skillEffects.maxLifeBonus;
this.velocity = 2 + this.skillEffects.moveSpeedBonus;

// Shooting
this.bulletSpeed = 4 + skillEffects.bulletSpeedBonus;
this.fireVelocity = skillEffects.fireVelocityMultiplier;
this.bulletDamage = 1 + skillEffects.bulletDamageBonus;
this.extraProjectiles = skillEffects.extraProjectiles;
this.spreadRadians = skillEffects.spreadRadians;
```

Bullet metadata:

```js
bullet.damage = this.bulletDamage;
bullet.controlEffects = {
  knockbackBonus: this.skillEffects.knockbackBonus,
  enemyWeakenMultiplier: this.skillEffects.enemyWeakenMultiplier,
  slowFieldMultiplier: this.skillEffects.slowFieldMultiplier,
};
```

Enemy kill signature:

```js
kill(enemies, indexEnemy, player, effects, damage = 1)
```

Enemy point award:

```js
const scoreMultiplier = (player.skillEffects && player.skillEffects.scoreMultiplier) || 1;
player.points += Math.ceil(this.value * scoreMultiplier);
player.runStats?.recordKill({ typeId: this.typeId, value: this.value, isBoss: this.isBoss });
```

- [ ] **Step 6: Run focused passing tests**

Run: `npm test -- --test-name-pattern "effects|player|shooting|enemy|bulletHit"`

Expected: PASS for effect integration tests.

- [ ] **Step 7: Checkpoint without commit**

Run: `git status --short`

Expected: effect module and gameplay files appear as intended changes.

## Task 5: Remove Live Buff And Integrate Run Summary Flow

**Files:**
- Create: `src/run_summary.js`
- Create: `test/run_summary.test.js`
- Modify: `src/game.js`
- Modify: `src/hud.js`
- Modify: `test/game.test.js`
- Modify: `test/hud.test.js`

- [ ] **Step 1: Write failing run-summary tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import RunSummary from "../src/run_summary.js";
import { setupPixiMock, createAppMock } from "./helpers.js";

setupPixiMock();

test("run summary renders stats and returns to menu", () => {
  let returned = false;
  const app = createAppMock();
  const screen = new RunSummary({
    app,
    username: "player",
    summary: {
      score: 100,
      credits: { total: 42, breakdown: [{ label: "Score", amount: 20 }] },
      accuracyPercent: 80,
      shotsFired: 10,
      shotsHit: 8,
      timeSurvivedSeconds: 60,
      killsByType: { chaser: 5 },
      bossKills: 1,
      highlights: ["HIGH ACCURACY"],
    },
    onBackToMenu: () => { returned = true; },
  });

  assert.ok(screen.container.children.length > 0);
  const buttons = screen.container.children.filter((child) => child.eventHandlers?.pointerdown);
  buttons.at(-1).eventHandlers.pointerdown();
  assert.equal(returned, true);
});
```

- [ ] **Step 2: Run focused failing tests**

Run: `npm test -- --test-name-pattern "run summary"`

Expected: FAIL because `src/run_summary.js` does not exist.

- [ ] **Step 3: Implement `RunSummary`**

Use `createBackdrop`, `addScreenCorners`, `createCard`, `createLabel`, and `createPillButton`. Required visible labels:

```js
"RUN SUMMARY"
`SCORE FINAL: ${summary.score}`
`CREDITOS GANHOS: ${summary.credits.total}`
`PRECISAO: ${summary.accuracyPercent}%`
`TIROS: ${summary.shotsHit}/${summary.shotsFired}`
`TEMPO: ${summary.timeSurvivedSeconds}s`
`BOSSES: ${summary.bossKills}`
```

Render kill rows from `Object.entries(summary.killsByType)` and highlight pills from `summary.highlights`.

- [ ] **Step 4: Modify `Hud` to delegate run end**

Replace direct game-over modal creation with a callback:

```js
set onRunEnded(fn) {
  this._onRunEnded = fn;
}
```

When `player.lifes < 1`, call:

```js
this._onRunEnded?.({ reason: "death" });
```

Keep `textEnd.visible = true` for immediate feedback before the summary screen replaces the HUD.

- [ ] **Step 5: Modify `Game` to remove `Buff` from the live loop**

Remove:

```js
import Buff from "./buff.js";
this.buff = new Buff({ app, hud: this.hud });
this.buff.update(this.player);
app.stage.removeChild(this.buff.buffContainer);
```

Add:

```js
this.skillState = createSkillTreeState();
this.skillEffects = deriveSkillEffects(this.skillState.getPurchasedIds());
this.runStats = createRunStats();
this.player = new Player({ app, username, keys, skillEffects: this.skillEffects, runStats: this.runStats });
```

Run-end flow:

```js
this.finishRun = ({ reason }) => {
  const summary = createRunSummary(this.runStats.snapshot({
    score: this.player.points,
    now: Date.now(),
  }), this.skillEffects);
  this.skillState.addCredits(summary.credits.total);
  this.clear();
  this.app.stage.removeChildren();
  this.app.start();
  new RunSummary({
    app: this.app,
    username: this.player.username,
    summary,
    reason,
    onBackToMenu: () => {
      this.app.stage.removeChildren();
      new Menu({ app: this.app });
    },
  });
};
this.hud.onRunEnded = this.finishRun;
```

- [ ] **Step 6: Update tests for no live buff dependency**

Replace `game.buff.buff.getBounds` setup with run-stats assertions:

```js
assert.equal("buff" in game, false);
assert.ok(game.runStats);
assert.ok(game.skillEffects);
```

- [ ] **Step 7: Run focused passing tests**

Run: `npm test -- --test-name-pattern "run summary|game|hud"`

Expected: PASS for run summary and game integration tests.

- [ ] **Step 8: Checkpoint without commit**

Run: `git status --short`

Expected: `src/buff.js` is not used by `src/game.js`; run summary files appear as intended changes.

## Task 6: Skill Tree Pixi Screen

**Files:**
- Create: `src/skill_tree.js`
- Create: `test/skill_tree.test.js`
- Modify: `test/helpers.js`

- [ ] **Step 1: Write failing skill tree screen tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import SkillTree from "../src/skill_tree.js";
import { setupPixiMock, createAppMock } from "./helpers.js";

setupPixiMock();

function createStateStub() {
  return {
    credits: 500,
    purchased: new Set(["core"]),
    getCredits() { return this.credits; },
    has(id) { return this.purchased.has(id); },
    getPurchasedIds() { return [...this.purchased]; },
    getVisibleSkillIds() { return ["core", "fire_rate_1"]; },
    getInitialFrameIds() { return ["core"]; },
    canPurchase(id) { return id === "fire_rate_1" ? { ok: true, cost: 45 } : { ok: false, reason: "blocked" }; },
    purchase(id) { this.purchased.add(id); return { ok: true, purchasedId: id, cost: 45 }; },
    refundCascade(id) { this.purchased.delete(id); return { ok: true, removedIds: [id], refunded: 45 }; },
  };
}

test("skill tree builds progressive visible nodes and tooltip layer", () => {
  const app = createAppMock();
  const screen = new SkillTree({ app, skillState: createStateStub(), onBack: () => {} });
  assert.ok(screen.container.children.length > 0);
  assert.ok(screen.nodeViews.get("core"));
  assert.ok(screen.nodeViews.get("fire_rate_1"));
  assert.equal(screen.nodeViews.has("bullet_speed_1"), false);
});

test("left click purchases and right click refunds cascade", () => {
  const screen = new SkillTree({ app: createAppMock(), skillState: createStateStub(), onBack: () => {} });
  screen.handleNodePrimary("fire_rate_1");
  assert.equal(screen.skillState.has("fire_rate_1"), true);
  screen.handleNodeSecondary("fire_rate_1");
  assert.equal(screen.skillState.has("fire_rate_1"), false);
});

test("tooltip clamps inside 1280 by 720 and avoids hovered node center", () => {
  const screen = new SkillTree({ app: createAppMock(), skillState: createStateStub(), onBack: () => {} });
  const rect = screen.computeTooltipPosition({ x: 1240, y: 700 }, { width: 260, height: 120 });
  assert.equal(rect.x <= 1012, true);
  assert.equal(rect.y <= 592, true);
  assert.equal(rect.x < 1240 - 20, true);
});
```

- [ ] **Step 2: Run focused failing test**

Run: `npm test -- --test-name-pattern "skill tree builds|left click purchases|tooltip clamps"`

Expected: FAIL because `src/skill_tree.js` does not exist.

- [ ] **Step 3: Extend Pixi mocks**

Add to `test/helpers.js` mock classes:

```js
Container.prototype.scale = { x: 1, y: 1, set(x, y = x) { this.x = x; this.y = y; } };
Container.prototype.position = { x: 0, y: 0, set(x, y) { this.x = x; this.y = y; } };
Graphics.prototype.hitArea = null;
Graphics.prototype.zIndex = 0;
```

If prototypes are not convenient with the existing class literals, add `scale`, `position`, `hitArea`, and `zIndex` directly in constructors.

- [ ] **Step 4: Implement `SkillTree` structure**

Required containers:

```js
this.container = new PIXI.Container();
this.world = new PIXI.Container();
this.connectionLayer = new PIXI.Container();
this.nodeLayer = new PIXI.Container();
this.tooltipLayer = new PIXI.Container();
this.hudLayer = new PIXI.Container();
this.nodeViews = new Map();
```

Required methods:

```js
build();
buildHud();
renderWorld();
drawConnections(visibleIds);
drawNode(skill);
handleNodePrimary(skillId);
handleNodeSecondary(skillId);
showTooltip(skillId, globalPoint);
hideTooltip();
computeTooltipPosition(anchor, size);
frameInitialPurchasedNodes();
fitSkillIds(skillIds, padding = 180);
bindCameraControls();
destroy();
```

Visual rules:

```js
// normal: cyan star circle, 6px core glow, 13px outer glow for purchased
// fusion: magenta diamond, slightly larger than normal
// capstone: gold hex/star, larger than fusion
// locked visible signal: low-alpha hollow node
// available: pulsing cyan/magenta outline
// purchased: bright filled node with glow
```

Camera rules:

```js
// frameInitialPurchasedNodes uses skillState.getInitialFrameIds()
// fitSkillIds computes bounds from skill.position only for those ids
// scale clamps between 0.45 and 1.8
// no purchased except core frames only the core position
```

Tooltip rules:

```js
// size: max width 280, height based on text lines
// preferred side: right and below the pointer
// if it would leave the canvas, flip to left/up
// keep 20px gap from hovered node center
// clamp to 12px screen margin
```

- [ ] **Step 5: Add pan and zoom**

Events:

```js
this.container.interactive = true;
this.container.on("pointerdown", this.onPanStart);
this.container.on("pointermove", this.onPanMove);
this.container.on("pointerup", this.onPanEnd);
this.container.on("pointerupoutside", this.onPanEnd);
this.app.renderer.view.addEventListener?.("wheel", this.onWheel, { passive: false });
```

Zoom behavior:

```js
const nextScale = clamp(this.world.scale.x * (event.deltaY > 0 ? 0.9 : 1.1), 0.45, 1.8);
// zoom around the mouse point by preserving world coordinate under cursor
```

- [ ] **Step 6: Run focused passing tests**

Run: `npm test -- --test-name-pattern "skill tree builds|left click purchases|tooltip clamps"`

Expected: PASS for skill tree screen tests.

- [ ] **Step 7: Checkpoint without commit**

Run: `git status --short`

Expected: skill tree screen and tests appear as intended changes.

## Task 7: Main Menu Navigation

**Files:**
- Modify: `src/menu.js`
- Modify: `test/menu.test.js`

- [ ] **Step 1: Write failing menu navigation test**

```js
test("skill tree button opens the skill tree screen", () => {
  const app = createAppMock();
  const menu = new Menu({ app });
  const labels = menu.menuContainer.children.filter((child) => typeof child.text === "string").map((child) => child.text);
  assert.ok(labels.some((text) => text.includes("SKILL TREE")));
  menu.showSkillTree();
  assert.equal(app.stage.children.at(-1).constructor.name, "Container");
});
```

- [ ] **Step 2: Run focused failing test**

Run: `npm test -- --test-name-pattern "skill tree button"`

Expected: FAIL because `showSkillTree` does not exist.

- [ ] **Step 3: Implement menu entry**

Add import:

```js
import SkillTree from "./skill_tree.js";
```

Button order:

```js
INICIAR RUN
SKILL TREE
RANKING GLOBAL
CONTROLES
CONFIGURAÇÕES
```

Use these y positions to avoid crowding inside the existing card:

```js
const startY = cy + 36;
const gap = 61;
```

Navigation:

```js
showSkillTree() {
  this.hide();
  new SkillTree({
    app: this.app,
    onBack: () => { new Menu({ app: this.app }); },
  });
}
```

- [ ] **Step 4: Run focused passing test**

Run: `npm test -- --test-name-pattern "skill tree button|menu container|show and hide"`

Expected: PASS for menu tests.

- [ ] **Step 5: Checkpoint without commit**

Run: `git status --short`

Expected: menu files appear as intended changes.

## Task 8: Spawner Metadata And First Balance Pass

**Files:**
- Modify: `src/spanwer.js`
- Modify: `src/enemy.js`
- Modify: `test/spawner.test.js`
- Modify: `test/enemy.test.js`

- [ ] **Step 1: Write failing spawner metadata tests**

```js
test("enemyType includes typeId and boss metadata", () => {
  player.points = 1;
  const normal = spawner.enemyType();
  assert.equal(typeof normal.typeId, "string");
  assert.equal(normal.isBoss, false);

  player.points = 50;
  const boss = spawner.enemyType();
  assert.equal(boss.typeId, "boss");
  assert.equal(boss.isBoss, true);
});
```

- [ ] **Step 2: Run focused failing test**

Run: `npm test -- --test-name-pattern "enemyType includes"`

Expected: FAIL because metadata is absent.

- [ ] **Step 3: Implement metadata and conservative tuning**

Enemy classes:

```js
blue_tank: speed 0.48, radius 18, life 4, value 1
purple_chaser: speed 0.95, radius 17, life 3, value 1
pink_striker: speed 1.42, radius 16, life 2, value 1
red_rusher: speed 1.9, radius 15, life 1, value 1
white_sprinter: speed 2.35, radius 14, life 1, value 2
boss: speed 0.95, radius 25, life 10 * bossTier, value 10, isBoss true
```

Spawner balance:

```js
// Keep spawnLimit growth but start at 1.
// Change boss speed cap from 1.75 to 1.65 after permanent power lands.
// Keep boss trigger at score multiples of 50 for first pass.
```

- [ ] **Step 4: Run focused passing test**

Run: `npm test -- --test-name-pattern "spawner|enemy"`

Expected: PASS for spawner and enemy tests.

- [ ] **Step 5: Checkpoint without commit**

Run: `git status --short`

Expected: spawner and enemy changes appear as intended changes.

## Task 9: Full Automated Verification

**Files:**
- All files touched above

- [ ] **Step 1: Run the full test suite**

Run: `npm test`

Expected: PASS.

- [ ] **Step 2: Run build**

Run: `npm run build`

Expected: PASS and no Snowpack import errors.

- [ ] **Step 3: Search for live buff usage**

Run: `rg -n "new Buff|buff\\.update|buffContainer|speed_buff" src public test`

Expected: no live gameplay usage in `src/game.js`. References in `src/buff.js` or `test/buff.test.js` are acceptable only if the legacy file remains.

- [ ] **Step 4: Search for red-flag markers**

Run: `rg -n "TB[D]|TO[D]O|place[h]older|uncl[e]ar|[?][?]" src test docs/superpowers/plans/2026-04-06-skill-tree.md`

Expected: no output.

- [ ] **Step 5: Checkpoint without commit**

Run: `git status --short`

Expected: only intentional project files plus the already-staged spec and `.gitignore`.

## Task 10: Visual QA With Playwright

**Files:**
- Modify implementation files only if screenshots reveal visual defects.

- [ ] **Step 1: Start the dev server**

Run: `npm start`

Expected: Snowpack dev server starts and serves the game, normally on `http://localhost:8080`.

- [ ] **Step 2: Capture the no-purchase opening state**

Run: `npx playwright screenshot --viewport-size=1280,720 http://localhost:8080 /tmp/neon-hunt-skill-tree-core.png`

Manual navigation before capture is acceptable if the screenshot command cannot click through the menu. If using `playwright-interactive`, navigate to the menu, click `SKILL TREE`, and capture the canvas.

Expected visual standard:

```text
The camera frames CORE, not the full 40-node tree.
Directly available nodes can exist as distant/subtle signals, but they must not crowd CORE.
The screen reads as a game UI, not as a technical diagram.
```

- [ ] **Step 3: Capture a purchased-state view**

Use browser localStorage before loading the screen:

```js
localStorage.setItem("neonHunt.skillTree.v1", JSON.stringify({
  credits: 500,
  purchasedIds: ["core", "fire_rate_1", "bullet_speed_1", "move_speed_1", "dash_unlock"],
  spentBySkillId: { fire_rate_1: 45, bullet_speed_1: 70, move_speed_1: 45, dash_unlock: 70 }
}));
```

Expected visual standard:

```text
The camera frames only purchased nodes.
No node visually sits on top of another node.
Available neighboring nodes are distinguishable from purchased nodes.
```

- [ ] **Step 4: Capture hover tooltip**

Use Playwright to move the mouse over an available node and capture `/tmp/neon-hunt-skill-tree-tooltip.png`.

Expected visual standard:

```text
Tooltip is compact.
Tooltip contains name, type, cost, effect, prerequisites, and status.
Tooltip does not cover the hovered node.
Tooltip stays inside 1280x720.
```

- [ ] **Step 5: Capture unlock and right-click cascade states**

Use Playwright to left-click `fire_rate_1`, then right-click it after purchasing dependents in localStorage.

Expected visual standard:

```text
Left-click changes node state and credits.
Right-click removes dependent purchased nodes and credits increase by the exact spent amounts.
Feedback makes cascade removal understandable.
```

- [ ] **Step 6: Critical visual review**

Reject the implementation if any of these are true:

```text
Nodes overlap.
The opening camera shows the entire tree.
Fusion and capstone nodes are not visually distinct.
The tooltip hides the node being inspected.
The screen looks like a raw graph diagram rather than a cyberpunk constellation UI.
Pan/zoom makes the map unreadable or loses the purchased region.
```

- [ ] **Step 7: Fix and recapture**

If a screenshot fails the visual standard, adjust positions, alpha, node sizes, tooltip placement, or camera zoom, then repeat the relevant capture before presenting the UI as ready.
