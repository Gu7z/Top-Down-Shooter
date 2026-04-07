import { getSkillById } from "./skill_tree_data.js";

export function createDefaultSkillEffects() {
  return {
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
    strafeControlBonus: 0,
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
    freezeChance: 0,
    knockbackBonus: 0,
    enemyWeakenMultiplier: 1,
    chainPulseRadius: 0,
    controlDurationMultiplier: 1,
    dashReload: false,
    dashShield: false,
    lowHpCreditBonus: 0,
    droneBountyBonus: false,
    droneAppliesFreeze: false,
  };
}

function mergeEffect(effects, key, value) {
  if (typeof value === "boolean") {
    effects[key] = Boolean(effects[key] || value);
    return;
  }

  if (typeof value !== "number") return;

  if (key.endsWith("Multiplier")) {
    effects[key] = (effects[key] ?? 1) * value;
    return;
  }

  effects[key] = (effects[key] ?? 0) + value;
}

export function deriveSkillEffects(purchasedIds = []) {
  const effects = createDefaultSkillEffects();

  for (const id of purchasedIds) {
    const skill = getSkillById(id);
    if (!skill) continue;

    for (const [key, value] of Object.entries(skill.effects)) {
      mergeEffect(effects, key, value);
    }
  }

  return effects;
}
