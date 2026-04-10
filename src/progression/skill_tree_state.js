import { SKILL_TREE, getSkillById } from "./skill_tree_data.js";
import { encodePayload, decodePayload } from "./storage_security.js";

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

  // Filtrar IDs existentes na árvore, em ordem topológica
  const rawPurchased = new Set(Array.isArray(payload.purchasedIds) ? payload.purchasedIds : []);
  rawPurchased.add("core");
  const knownIds = [...rawPurchased]
    .filter((id) => getSkillById(id))
    .sort((a, b) => (treeOrder.get(a) ?? 0) - (treeOrder.get(b) ?? 0));

  // Validar cadeia de pré-requisitos — skill sem prereq satisfeito é descartada
  const validated = new Set(["core"]);
  for (const id of knownIds) {
    if (id === "core") continue;
    const skill = getSkillById(id);
    const prereqs = Array.isArray(skill?.prereqs) ? skill.prereqs : [];
    if (prereqs.every((pId) => validated.has(pId))) validated.add(id);
  }

  return {
    credits: Number.isFinite(payload.credits) ? Math.max(0, Math.floor(payload.credits)) : fallback.credits,
    purchasedIds: [...validated],
    spentBySkillId: payload.spentBySkillId || {},
  };
}

// Lida com saves antigos (plain JSON) — código legado
function migrateLegacyPayload(raw, storage, initialCredits) {
  if (!raw || raw.charAt(0) !== '{') return null;
  try {
    const legacy = JSON.parse(raw);
    const migrated = normalizePayload(legacy, initialCredits);
    storage?.setItem?.(SKILL_TREE_STORAGE_KEY, encodePayload(migrated));
    return migrated;
  } catch {
    return null;
  }
}

function loadPayload(storage, initialCredits) {
  const raw = storage?.getItem?.(SKILL_TREE_STORAGE_KEY);
  if (!raw) return createDefaultPayload(initialCredits);

  // Tenta formato seguro atual
  const decoded = decodePayload(raw);
  if (decoded !== null) return normalizePayload(decoded, initialCredits);

  // Tenta migrar save legado (plain JSON)
  const migrated = migrateLegacyPayload(raw, storage, initialCredits);
  if (migrated !== null) return migrated;

  // Assinatura inválida ou formato desconhecido → reset para defaults
  return createDefaultPayload(initialCredits);
}

function sortByTreeOrder(ids) {
  return [...ids].sort((a, b) => treeOrder.get(a) - treeOrder.get(b));
}

function getPrereqs(skill) {
  return Array.isArray(skill?.prereqs) ? skill.prereqs : [];
}

function skillDepth(skillId, seen = new Set()) {
  if (seen.has(skillId)) return 0;
  seen.add(skillId);

  const skill = getSkillById(skillId);
  const prereqs = getPrereqs(skill);
  if (prereqs.length === 0) return 0;

  return 1 + Math.max(...prereqs.map((id) => skillDepth(id, new Set(seen))));
}

function dependsOn(skillId, targetId, seen = new Set()) {
  if (skillId === targetId) return true;
  if (seen.has(skillId)) return false;
  seen.add(skillId);

  const skill = getSkillById(skillId);
  if (!skill) return false;

  return getPrereqs(skill).some((prereqId) => dependsOn(prereqId, targetId, seen));
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
    storage?.setItem?.(SKILL_TREE_STORAGE_KEY, encodePayload(payload));
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

  function getDiscountMultiplierFor(purchasedIds) {
    return [...purchasedIds].reduce((multiplier, id) => {
      const skill = getSkillById(id);
      return multiplier * (skill?.effects?.discountMultiplier || 1);
    }, 1);
  }

  function getDiscountMultiplier() {
    return getDiscountMultiplierFor(purchased);
  }

  function getCost(skill, purchasedIds = purchased) {
    if (skill.id === "core") return 0;
    return Math.max(1, Math.ceil(skill.cost * getDiscountMultiplierFor(purchasedIds)));
  }

  function canPurchase(id) {
    const skill = getSkillById(id);
    if (!skill) return { ok: false, reason: "missing_skill" };
    if (purchased.has(id)) return { ok: false, reason: "already_purchased" };

    const missingPrereqs = getPrereqs(skill).filter((prereq) => !purchased.has(prereq));
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

  function purchaseCascade(targetId) {
    if (purchased.has(targetId)) return { ok: false, reason: "already_purchased" };
    const skill = getSkillById(targetId);
    if (!skill) return { ok: false, reason: "missing_skill" };

    // Coleta em ordem topológica: prereqs antes do alvo
    const chain = [];
    const visited = new Set();
    function collect(id) {
      if (visited.has(id) || purchased.has(id)) return;
      visited.add(id);
      for (const prereqId of getPrereqs(getSkillById(id))) collect(prereqId);
      chain.push(id);
    }
    collect(targetId);

    if (chain.length === 0) return { ok: false, reason: "already_purchased" };

    const simulatedPurchased = new Set(purchased);
    let simulatedCredits = payload.credits;

    for (const id of chain) {
      const skillToBuy = getSkillById(id);
      const cost = getCost(skillToBuy, simulatedPurchased);
      if (simulatedCredits < cost) {
        return { ok: false, reason: "not_enough_credits" };
      }
      simulatedCredits -= cost;
      simulatedPurchased.add(id);
    }

    const purchasedIds = [];
    for (const id of chain) {
      const result = purchase(id);
      if (!result.ok) {
        return { ok: false, reason: result.reason || "purchase_failed" };
      }
      purchasedIds.push(id);
    }

    return { ok: true, purchasedIds };
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

      const prereqs = getPrereqs(skill);
      const isAvailable = prereqs.length > 0 && prereqs.every((id) => purchased.has(id));
      const isDirectChildSignal = prereqs.some((id) => purchased.has(id));

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
    getCost,
    purchase,
    purchaseCascade,
    refundCascade,
    getVisibleSkillIds,
    getInitialFrameIds,
    save,
  };
}
