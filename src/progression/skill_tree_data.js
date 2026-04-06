const COSTS = {
  tier1: 45,
  tier2: 70,
  tier3: 100,
  tier4: 135,
  tier5: 175,
  fusion: 240,
  capstone: 420,
};

export const SKILL_BRANCHES = [
  { id: "firepower", label: "Firepower", color: 0xff3366, angle: -90 },
  { id: "mobility", label: "Mobility", color: 0x00ffff, angle: -30 },
  { id: "survival", label: "Survival", color: 0x00ff88, angle: 30 },
  { id: "economy", label: "Economy", color: 0xfff275, angle: 90 },
  { id: "tech", label: "Tech", color: 0x9b5cff, angle: 150 },
  { id: "control", label: "Control", color: 0x5cc8ff, angle: 210 },
];

const branchById = new Map(SKILL_BRANCHES.map((branch) => [branch.id, branch]));
const BRANCH_POSITIONS = {
  firepower: [
    { x: 0, y: -100 },
    { x: -55, y: -135 },
    { x: 55, y: -135 },
    { x: -35, y: -188 },
    { x: 35, y: -188 },
  ],
  mobility: [
    { x: 130, y: -75 },
    { x: 195, y: -120 },
    { x: 270, y: -90 },
    { x: 225, y: -30 },
    { x: 160, y: -15 },
  ],
  survival: [
    { x: 125, y: 75 },
    { x: 190, y: 110 },
    { x: 260, y: 80 },
    { x: 225, y: 175 },
    { x: 295, y: 155 },
  ],
  economy: [
    { x: 0, y: 110 },
    { x: -55, y: 160 },
    { x: 55, y: 160 },
    { x: -30, y: 225 },
    { x: 30, y: 225 },
  ],
  tech: [
    { x: -125, y: 75 },
    { x: -190, y: 110 },
    { x: -260, y: 80 },
    { x: -225, y: 175 },
    { x: -295, y: 155 },
  ],
  control: [
    { x: -130, y: -75 },
    { x: -195, y: -120 },
    { x: -270, y: -90 },
    { x: -225, y: -30 },
    { x: -160, y: -15 },
  ],
};

function branchPosition(branchId, tierIndex) {
  const position = BRANCH_POSITIONS[branchId]?.[tierIndex];
  if (position) return { ...position };

  const branch = branchById.get(branchId);
  const radians = ((branch?.angle || 0) * Math.PI) / 180;
  const radius = 100 + tierIndex * 55;
  return {
    x: Math.round(Math.cos(radians) * radius),
    y: Math.round(Math.sin(radians) * radius),
  };
}

function makeSkill({
  id,
  name,
  branch,
  type = "base",
  cost,
  description,
  effects = {},
  prereqs,
  position,
  branchIds,
}) {
  return {
    id,
    name,
    branch,
    branchIds: branchIds || [branch],
    type,
    cost,
    description,
    effects,
    prereqs,
    position,
    reveal: { distance: 1 },
  };
}

function makeBranchSkills(branchId, specs) {
  return specs.map((spec, index) =>
    makeSkill({
      ...spec,
      branch: branchId,
      type: "base",
      cost: [COSTS.tier1, COSTS.tier2, COSTS.tier3, COSTS.tier4, COSTS.tier5][index],
      prereqs: index === 0 ? ["core"] : [specs[index - 1].id],
      position: branchPosition(branchId, index),
    })
  );
}

const baseSkills = [
  ...makeBranchSkills("firepower", [
    {
      id: "fire_rate_1",
      name: "Rapid Capacitor",
      description: "+15% fire velocity.",
      effects: { fireVelocityMultiplier: 1.15 },
    },
    {
      id: "bullet_speed_1",
      name: "Rail Induction",
      description: "+0.4 bullet speed.",
      effects: { bulletSpeedBonus: 0.4 },
    },
    {
      id: "bullet_damage_1",
      name: "Piercing Charge",
      description: "+1 bullet damage.",
      effects: { bulletDamageBonus: 1 },
    },
    {
      id: "multishot_1",
      name: "Split Prism",
      description: "Adds one light spread projectile.",
      effects: { extraProjectiles: 1, spreadRadians: 0.16 },
    },
    {
      id: "overheat_1",
      name: "Overheat Loop",
      description: "Adds a small critical shot chance.",
      effects: { critChance: 0.08, critMultiplier: 2 },
    },
  ]),
  ...makeBranchSkills("mobility", [
    {
      id: "move_speed_1",
      name: "Vector Legs",
      description: "+0.25 movement speed.",
      effects: { moveSpeedBonus: 0.25 },
    },
    {
      id: "dash_unlock",
      name: "Blink Dash",
      description: "Unlocks a short dash.",
      effects: { dashEnabled: true },
    },
    {
      id: "dash_cooldown_1",
      name: "Cooldown Bleed",
      description: "Dash cooldown is 15% faster.",
      effects: { dashCooldownMultiplier: 0.85 },
    },
    {
      id: "dash_iframe_1",
      name: "Phase Entry",
      description: "Dash grants brief invulnerability.",
      effects: { dashInvulnerabilityMs: 250 },
    },
    {
      id: "strafe_control_1",
      name: "Gyro Strafe",
      description: "Improves drift and strafe control.",
      effects: { strafeControlBonus: 0.2 },
    },
  ]),
  ...makeBranchSkills("survival", [
    {
      id: "max_hp_1",
      name: "Reinforced Hull",
      description: "+1 max HP.",
      effects: { maxLifeBonus: 1 },
    },
    {
      id: "shield_1",
      name: "Aegis Buffer",
      description: "Adds one shield charge.",
      effects: { maxShield: 1 },
    },
    {
      id: "shield_regen_1",
      name: "Aegis Reboot",
      description: "Shield can regenerate after a delay.",
      effects: { shieldRegenSeconds: 12 },
    },
    {
      id: "hit_guard_1",
      name: "Trauma Guard",
      description: "Adds a short guard window after hits.",
      effects: { postHitGuardMs: 500 },
    },
    {
      id: "emergency_shield_1",
      name: "Deadman Relay",
      description: "One emergency shield can trigger at low HP.",
      effects: { emergencyShield: true },
    },
  ]),
  ...makeBranchSkills("economy", [
    {
      id: "credit_gain_1",
      name: "Credit Siphon",
      description: "+10% run credit gain.",
      effects: { creditMultiplier: 1.1 },
    },
    {
      id: "score_bonus_1",
      name: "Score Uplink",
      description: "+10% score from kills.",
      effects: { scoreMultiplier: 1.1 },
    },
    {
      id: "streak_reward_1",
      name: "Streak Contract",
      description: "Adds credit rewards for high kill runs.",
      effects: { streakCreditBonus: 5 },
    },
    {
      id: "boss_bounty_1",
      name: "Bounty Spike",
      description: "+15 credits from boss kills.",
      effects: { bossCreditBonus: 15 },
    },
    {
      id: "discount_protocol_1",
      name: "Discount Protocol",
      description: "Future skill purchases cost 5% less.",
      effects: { discountMultiplier: 0.95 },
    },
  ]),
  ...makeBranchSkills("tech", [
    {
      id: "drone_unlock",
      name: "Drone Seed",
      description: "Unlocks one helper drone.",
      effects: { droneCount: 1 },
    },
    {
      id: "drone_fire_rate_1",
      name: "Drone Capacitor",
      description: "+15% drone fire velocity.",
      effects: { droneFireVelocityMultiplier: 1.15 },
    },
    {
      id: "drone_targeting_1",
      name: "Target Lattice",
      description: "Drones prioritize closer enemies.",
      effects: { droneTargeting: true },
    },
    {
      id: "magnet_scan_1",
      name: "Scan Magnet",
      description: "Increases pickup and scan radius.",
      effects: { magnetRadiusBonus: 80 },
    },
    {
      id: "drone_overclock_1",
      name: "Drone Overclock",
      description: "Improves drone output.",
      effects: { droneOverclockMultiplier: 1.25 },
    },
  ]),
  ...makeBranchSkills("control", [
    {
      id: "slow_field_1",
      name: "Slow Field",
      description: "Enemies are slightly slowed by control hits.",
      effects: { slowFieldMultiplier: 0.92 },
    },
    {
      id: "knockback_1",
      name: "Impact Vector",
      description: "Shots gain knockback.",
      effects: { knockbackBonus: 18 },
    },
    {
      id: "enemy_weaken_1",
      name: "Weakness Mark",
      description: "Controlled enemies take extra shot damage.",
      effects: { enemyWeakenMultiplier: 1.15 },
    },
    {
      id: "chain_pulse_1",
      name: "Chain Pulse",
      description: "Adds a small control pulse radius.",
      effects: { chainPulseRadius: 70 },
    },
    {
      id: "control_duration_1",
      name: "Long Signal",
      description: "Control effects last 20% longer.",
      effects: { controlDurationMultiplier: 1.2 },
    },
  ]),
];

const fusionSkills = [
  makeSkill({
    id: "fusion_firepower_mobility",
    name: "Dash Reload",
    branch: "fusion",
    branchIds: ["firepower", "mobility"],
    type: "fusion",
    cost: COSTS.fusion,
    description: "Dashing primes your next burst.",
    effects: { dashReload: true, fireVelocityMultiplier: 1.08 },
    prereqs: ["bullet_damage_1", "dash_cooldown_1"],
    position: { x: 125, y: -158 },
  }),
  makeSkill({
    id: "fusion_mobility_survival",
    name: "Aegis Dash",
    branch: "fusion",
    branchIds: ["mobility", "survival"],
    type: "fusion",
    cost: COSTS.fusion,
    description: "Dash grants a shield pulse.",
    effects: { dashShield: true, maxShield: 1 },
    prereqs: ["dash_iframe_1", "shield_regen_1"],
    position: { x: 280, y: 10 },
  }),
  makeSkill({
    id: "fusion_survival_economy",
    name: "Last Stand Contract",
    branch: "fusion",
    branchIds: ["survival", "economy"],
    type: "fusion",
    cost: COSTS.fusion,
    description: "Surviving danger increases credits.",
    effects: { lowHpCreditBonus: 20 },
    prereqs: ["hit_guard_1", "boss_bounty_1"],
    position: { x: 115, y: 190 },
  }),
  makeSkill({
    id: "fusion_economy_tech",
    name: "Bounty Drone",
    branch: "fusion",
    branchIds: ["economy", "tech"],
    type: "fusion",
    cost: COSTS.fusion,
    description: "Drones improve bounty value.",
    effects: { bossCreditBonus: 10, droneBountyBonus: true },
    prereqs: ["discount_protocol_1", "drone_targeting_1"],
    position: { x: -115, y: 190 },
  }),
  makeSkill({
    id: "fusion_tech_control",
    name: "Marking Swarm",
    branch: "fusion",
    branchIds: ["tech", "control"],
    type: "fusion",
    cost: COSTS.fusion,
    description: "Drones apply slow marks.",
    effects: { droneAppliesSlow: true, slowFieldMultiplier: 0.9 },
    prereqs: ["drone_overclock_1", "enemy_weaken_1"],
    position: { x: -280, y: 10 },
  }),
  makeSkill({
    id: "fusion_control_firepower",
    name: "Marked Ammunition",
    branch: "fusion",
    branchIds: ["control", "firepower"],
    type: "fusion",
    cost: COSTS.fusion,
    description: "Controlled enemies take bonus shot damage.",
    effects: { enemyWeakenMultiplier: 1.2, bulletDamageBonus: 1 },
    prereqs: ["control_duration_1", "multishot_1"],
    position: { x: -125, y: -158 },
  }),
];

const capstoneSkills = [
  makeSkill({
    id: "capstone_overdrive_matrix",
    name: "Overdrive Matrix",
    branch: "capstone",
    branchIds: ["firepower", "mobility", "control"],
    type: "capstone",
    cost: COSTS.capstone,
    description: "A major offensive overdrive.",
    effects: { fireVelocityMultiplier: 1.2, critChance: 0.12, critMultiplier: 2.5 },
    prereqs: ["overheat_1", "fusion_firepower_mobility", "fusion_control_firepower"],
    position: { x: 0, y: -228 },
  }),
  makeSkill({
    id: "capstone_adaptive_reactor",
    name: "Adaptive Reactor",
    branch: "capstone",
    branchIds: ["mobility", "survival", "economy"],
    type: "capstone",
    cost: COSTS.capstone,
    description: "A major defensive economy reactor.",
    effects: { maxLifeBonus: 1, maxShield: 1, creditMultiplier: 1.15 },
    prereqs: ["emergency_shield_1", "fusion_mobility_survival", "fusion_survival_economy"],
    position: { x: 380, y: 65 },
  }),
  makeSkill({
    id: "capstone_synapse_swarm",
    name: "Synapse Swarm",
    branch: "capstone",
    branchIds: ["economy", "tech", "control"],
    type: "capstone",
    cost: COSTS.capstone,
    description: "A major tech-control swarm upgrade.",
    effects: { droneCount: 1, droneOverclockMultiplier: 1.35, chainPulseRadius: 100 },
    prereqs: ["drone_overclock_1", "fusion_economy_tech", "fusion_tech_control"],
    position: { x: -380, y: 65 },
  }),
];

export const SKILL_TREE = [
  makeSkill({
    id: "core",
    name: "Core",
    branch: "core",
    branchIds: [],
    type: "core",
    cost: 0,
    description: "The permanent progression root.",
    effects: {},
    prereqs: [],
    position: { x: 0, y: 0 },
  }),
  ...baseSkills,
  ...fusionSkills,
  ...capstoneSkills,
];

const skillsById = new Map(SKILL_TREE.map((skill) => [skill.id, skill]));

export function getSkillById(id) {
  return skillsById.get(id);
}
