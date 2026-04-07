import test from "node:test";
import assert from "node:assert/strict";
import {
  createDefaultSkillEffects,
  deriveSkillEffects,
} from "../../src/progression/skill_effects.js";

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
    slowFieldMultiplier: 1,
    knockbackBonus: 0,
    enemyWeakenMultiplier: 1,
    chainPulseRadius: 0,
    controlDurationMultiplier: 1,
    dashReload: false,
    dashShield: false,
    lowHpCreditBonus: 0,
    droneBountyBonus: false,
    droneAppliesSlow: false,
  });
});

test("deriveSkillEffects combines purchased skills", () => {
  const effects = deriveSkillEffects([
    "core",
    "fire_rate_1",
    "bullet_speed_1",
    "credit_gain_1",
  ]);

  assert.equal(effects.fireVelocityMultiplier, 1.15);
  assert.equal(effects.bulletSpeedBonus, 0.4);
  assert.equal(effects.creditMultiplier, 1.1);
});

test("deriveSkillEffects safely combines additive, boolean, and multiplier effects", () => {
  const effects = deriveSkillEffects([
    "core",
    "shield_1",
    "aegis_dash",
    "slow_field_1",
    "marking_swarm",
  ]);

  assert.equal(effects.maxShield, 2);
  assert.equal(effects.dashShield, true);
  assert.equal(Number(effects.slowFieldMultiplier.toFixed(3)), 0.92);
  assert.equal(effects.droneAppliesSlow, true);
});
