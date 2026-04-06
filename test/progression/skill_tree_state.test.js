import test from "node:test";
import assert from "node:assert/strict";
import {
  createSkillTreeState,
  SKILL_TREE_STORAGE_KEY,
} from "../../src/progression/skill_tree_state.js";

function memoryStorage(initial = {}) {
  return {
    storage: { ...initial },
    getItem(key) {
      return this.storage[key] || null;
    },
    setItem(key, value) {
      this.storage[key] = value;
    },
  };
}

test("new state starts with credits and only core purchased", () => {
  const state = createSkillTreeState({
    storage: memoryStorage(),
    initialCredits: 100,
  });

  assert.equal(state.getCredits(), 100);
  assert.deepEqual(state.getPurchasedIds(), ["core"]);
});

test("purchase requires credits and prerequisites", () => {
  const state = createSkillTreeState({
    storage: memoryStorage(),
    initialCredits: 200,
  });

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
  const state = createSkillTreeState({
    storage: memoryStorage(),
    initialCredits: 1000,
  });
  state.purchase("fire_rate_1");
  state.purchase("bullet_speed_1");
  state.purchase("bullet_damage_1");

  const creditsBeforeRefund = state.getCredits();
  const result = state.refundCascade("fire_rate_1");

  assert.equal(result.ok, true);
  assert.deepEqual(result.removedIds, [
    "bullet_damage_1",
    "bullet_speed_1",
    "fire_rate_1",
  ]);
  assert.equal(state.has("fire_rate_1"), false);
  assert.equal(state.getCredits(), creditsBeforeRefund + 45 + 70 + 100);
});

test("progressive reveal exposes purchased, available, and direct child signals", () => {
  const state = createSkillTreeState({
    storage: memoryStorage(),
    initialCredits: 100,
  });

  assert.ok(state.getVisibleSkillIds().includes("core"));
  assert.ok(state.getVisibleSkillIds().includes("fire_rate_1"));
  assert.equal(state.getInitialFrameIds().join(","), "core");
});
