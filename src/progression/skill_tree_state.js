import { SKILL_TREE, getSkillById } from "./skill_tree_data.js";

export const SKILL_TREE_STORAGE_KEY = "neonHunt.skillTree.v1";

const treeOrder = new Map(SKILL_TREE.map((skill, index) => [skill.id, index]));

function createDefaultPayload(initialCredits) {
  return {
    credits: initialCredits,
    purchasedIds: ["core"],
    spentBySkillId: {},
  };
}

function normalizePayload(payload, initialCredits) {
  const fallback = createDefaultPayload(initialCredits);
  if (!payload || typeof payload !== "object") return fallback;

  const purchased = new Set(Array.isArray(payload.purchasedIds) ? payload.purchasedIds : []);
  purchased.add("core");

  return {
    credits: Number.isFinite(payload.credits) ? payload.credits : fallback.credits,
    purchasedIds: [...purchased].filter((id) => getSkillById(id)),
    spentBySkillId: payload.spentBySkillId || {},
  };
}

function loadPayload(storage, initialCredits) {
  const raw = storage?.getItem?.(SKILL_TREE_STORAGE_KEY);
  if (!raw) return createDefaultPayload(initialCredits);

  try {
    return normalizePayload(JSON.parse(raw), initialCredits);
  } catch {
    return createDefaultPayload(initialCredits);
  }
}

function sortByTreeOrder(ids) {
  return [...ids].sort((a, b) => treeOrder.get(a) - treeOrder.get(b));
}

function skillDepth(skillId, seen = new Set()) {
  if (seen.has(skillId)) return 0;
  seen.add(skillId);

  const skill = getSkillById(skillId);
  if (!skill || skill.prereqs.length === 0) return 0;

  return 1 + Math.max(...skill.prereqs.map((id) => skillDepth(id, new Set(seen))));
}

function dependsOn(skillId, targetId, seen = new Set()) {
  if (skillId === targetId) return true;
  if (seen.has(skillId)) return false;
  seen.add(skillId);

  const skill = getSkillById(skillId);
  if (!skill) return false;

  return skill.prereqs.some((prereqId) => dependsOn(prereqId, targetId, seen));
}

function getDefaultStorage() {
  if (typeof localStorage !== "undefined") return localStorage;
  return {
    getItem() {
      return null;
    },
    setItem() {},
  };
}

export function createSkillTreeState({
  storage = getDefaultStorage(),
  initialCredits = 0,
} = {}) {
  let payload = normalizePayload(loadPayload(storage, initialCredits), initialCredits);
  let purchased = new Set(payload.purchasedIds);

  function save() {
    payload.purchasedIds = sortByTreeOrder(purchased);
    storage?.setItem?.(SKILL_TREE_STORAGE_KEY, JSON.stringify(payload));
  }

  function getCredits() {
    return payload.credits;
  }

  function setCredits(credits) {
    payload.credits = Math.max(0, Math.floor(credits));
    save();
  }

  function addCredits(amount) {
    payload.credits = Math.max(0, payload.credits + Math.floor(amount));
    save();
  }

  function getPurchasedIds() {
    return sortByTreeOrder(purchased);
  }

  function has(id) {
    return purchased.has(id);
  }

  function getDiscountMultiplier() {
    return getPurchasedIds().reduce((multiplier, id) => {
      const skill = getSkillById(id);
      return multiplier * (skill?.effects?.discountMultiplier || 1);
    }, 1);
  }

  function getCost(skill) {
    if (skill.id === "core") return 0;
    return Math.max(1, Math.ceil(skill.cost * getDiscountMultiplier()));
  }

  function canPurchase(id) {
    const skill = getSkillById(id);
    if (!skill) return { ok: false, reason: "missing_skill" };
    if (purchased.has(id)) return { ok: false, reason: "already_purchased" };

    const missingPrereqs = skill.prereqs.filter((prereq) => !purchased.has(prereq));
    if (missingPrereqs.length) {
      return { ok: false, reason: "missing_prereqs", missingPrereqs };
    }

    const cost = getCost(skill);
    if (payload.credits < cost) {
      return { ok: false, reason: "not_enough_credits", cost, credits: payload.credits };
    }

    return { ok: true, cost };
  }

  function purchase(id) {
    const result = canPurchase(id);
    if (!result.ok) return result;

    purchased.add(id);
    payload.credits -= result.cost;
    payload.spentBySkillId[id] = result.cost;
    save();

    return { ok: true, purchasedId: id, cost: result.cost };
  }

  function refundCascade(id) {
    if (id === "core") return { ok: false, reason: "core_locked", removedIds: [], refunded: 0 };
    if (!purchased.has(id)) return { ok: false, reason: "not_purchased", removedIds: [], refunded: 0 };

    const removedIds = getPurchasedIds()
      .filter((purchasedId) => purchasedId !== "core" && dependsOn(purchasedId, id))
      .sort((a, b) => skillDepth(b) - skillDepth(a));

    const refunded = removedIds.reduce((sum, removedId) => {
      const skill = getSkillById(removedId);
      return sum + (payload.spentBySkillId[removedId] || skill?.cost || 0);
    }, 0);

    for (const removedId of removedIds) {
      purchased.delete(removedId);
      delete payload.spentBySkillId[removedId];
    }

    payload.credits += refunded;
    save();

    return { ok: true, removedIds, refunded };
  }

  function getVisibleSkillIds() {
    const visible = new Set(["core", ...purchased]);

    for (const skill of SKILL_TREE) {
      if (visible.has(skill.id)) continue;

      const isAvailable = skill.prereqs.length > 0 && skill.prereqs.every((id) => purchased.has(id));
      const isDirectChildSignal = skill.prereqs.some((id) => purchased.has(id));

      if (isAvailable || isDirectChildSignal) visible.add(skill.id);
    }

    return sortByTreeOrder(visible);
  }

  function getInitialFrameIds() {
    const frameIds = getPurchasedIds();
    return frameIds.length ? frameIds : ["core"];
  }

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
