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
  const stored = storage.getItem(SKILL_TREE_STORAGE_KEY);
  assert.ok(stored.startsWith("v1."), "deve usar formato seguro");
  assert.ok(!stored.startsWith("{"), "não deve ser JSON puro");
});

test("purchaseCascade compra pré-requisitos em ordem e depois o alvo", () => {
  const state = createSkillTreeState({
    storage: memoryStorage(),
    initialCredits: 1000,
  });

  // bullet_damage_1 requer fire_rate_1 e bullet_speed_1
  const result = state.purchaseCascade("bullet_damage_1");

  assert.equal(result.ok, true);
  assert.deepEqual(result.purchasedIds, ["fire_rate_1", "bullet_speed_1", "bullet_damage_1"]);
  assert.ok(state.has("fire_rate_1"));
  assert.ok(state.has("bullet_speed_1"));
  assert.ok(state.has("bullet_damage_1"));
  assert.equal(state.getCredits(), 1000 - 45 - 70 - 100);
});

test("purchaseCascade não compra nada se créditos insuficientes", () => {
  const state = createSkillTreeState({
    storage: memoryStorage(),
    initialCredits: 10, // insuficiente para fire_rate_1 (custa 45)
  });

  const result = state.purchaseCascade("bullet_damage_1");

  assert.equal(result.ok, false);
  assert.equal(result.reason, "not_enough_credits");
  assert.ok(!state.has("fire_rate_1"));
});

test("purchaseCascade em skill já comprada retorna already_purchased", () => {
  const state = createSkillTreeState({
    storage: memoryStorage(),
    initialCredits: 1000,
  });
  state.purchase("fire_rate_1");

  const result = state.purchaseCascade("fire_rate_1");

  assert.equal(result.ok, false);
  assert.equal(result.reason, "already_purchased");
});

test("purchaseCascade em skill disponível compra só ela", () => {
  const state = createSkillTreeState({
    storage: memoryStorage(),
    initialCredits: 1000,
  });
  state.purchase("fire_rate_1");

  const result = state.purchaseCascade("bullet_speed_1");

  assert.equal(result.ok, true);
  assert.deepEqual(result.purchasedIds, ["bullet_speed_1"]);
  assert.equal(state.getCredits(), 1000 - 45 - 70);
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

test("state falls back when storage contains invalid JSON and clamps credits when setting them", () => {
  const storage = memoryStorage({
    [SKILL_TREE_STORAGE_KEY]: "{not-json",
  });
  const state = createSkillTreeState({ storage, initialCredits: 50 });

  assert.equal(state.getCredits(), 50);
  assert.deepEqual(state.getPurchasedIds(), ["core"]);

  state.setCredits(-1.2);
  assert.equal(state.getCredits(), 0);
});

test("migrates old plain JSON save to secure format without losing data", () => {
  const legacyPayload = JSON.stringify({
    credits: 200,
    purchasedIds: ["core", "fire_rate_1"],
    spentBySkillId: { fire_rate_1: 45 },
  });
  const storage = memoryStorage({ [SKILL_TREE_STORAGE_KEY]: legacyPayload });

  const state = createSkillTreeState({ storage, initialCredits: 100 });

  assert.equal(state.getCredits(), 200);
  assert.ok(state.has("fire_rate_1"));
  const stored = storage.getItem(SKILL_TREE_STORAGE_KEY);
  assert.ok(stored.startsWith("v1."), "migração deve salvar no formato seguro");

  const reloaded = createSkillTreeState({ storage });
  assert.equal(reloaded.getCredits(), 200);
  assert.ok(reloaded.has("fire_rate_1"));
});

test("tampered secure storage resets to defaults", () => {
  const storage = memoryStorage();
  const state = createSkillTreeState({ storage, initialCredits: 100 });
  state.purchase("fire_rate_1");

  const stored = storage.getItem(SKILL_TREE_STORAGE_KEY);
  const parts = stored.split(".");
  parts[2] = parts[2].replace(/[0-9a-f]/, (c) => ((parseInt(c, 16) ^ 1).toString(16)));
  storage.storage[SKILL_TREE_STORAGE_KEY] = parts.join(".");

  const tampered = createSkillTreeState({ storage, initialCredits: 100 });
  assert.equal(tampered.getCredits(), 100, "créditos devem resetar ao detectar tamper");
  assert.deepEqual(tampered.getPurchasedIds(), ["core"], "apenas core após tamper");
});

test("normalizePayload drops skill purchased without prerequisites", () => {
  const legacyPayload = JSON.stringify({
    credits: 0,
    purchasedIds: ["core", "bullet_speed_1"], // fire_rate_1 ausente!
    spentBySkillId: { bullet_speed_1: 70 },
  });
  const storage = memoryStorage({ [SKILL_TREE_STORAGE_KEY]: legacyPayload });
  const state = createSkillTreeState({ storage, initialCredits: 0 });

  assert.ok(!state.has("bullet_speed_1"), "skill sem prereq deve ser descartada");
  assert.deepEqual(state.getPurchasedIds(), ["core"]);
});

test("normalizePayload drops cascading skills when prereq is missing", () => {
  const legacyPayload = JSON.stringify({
    credits: 0,
    purchasedIds: ["core", "bullet_speed_1", "bullet_damage_1"], // fire_rate_1 ausente
    spentBySkillId: {},
  });
  const storage = memoryStorage({ [SKILL_TREE_STORAGE_KEY]: legacyPayload });
  const state = createSkillTreeState({ storage, initialCredits: 0 });

  assert.ok(!state.has("bullet_speed_1"), "skill sem prereq deve ser descartada");
  assert.ok(!state.has("bullet_damage_1"), "dependente também deve ser descartado");
  assert.deepEqual(state.getPurchasedIds(), ["core"]);
});

test("normalizePayload clamps negative credits to zero", () => {
  const legacyPayload = JSON.stringify({
    credits: -500,
    purchasedIds: ["core"],
    spentBySkillId: {},
  });
  const storage = memoryStorage({ [SKILL_TREE_STORAGE_KEY]: legacyPayload });
  const state = createSkillTreeState({ storage, initialCredits: 50 });

  assert.equal(state.getCredits(), 0, "créditos negativos devem ser clampados para 0");
});

test("state works without global localStorage by using the default in-memory fallback", () => {
  const originalLocalStorage = global.localStorage;
  delete global.localStorage;

  try {
    const state = createSkillTreeState();
    state.setCredits(3.9);

    assert.equal(state.getCredits(), 3);
    assert.deepEqual(state.getPurchasedIds(), ["core"]);
  } finally {
    global.localStorage = originalLocalStorage;
  }
});
