const COSTS = {
  tier1: 45,
  tier2: 70,
  tier3: 100,
  tier4: 135,
  tier5: 175,
  tier6: 220,
  tier7: 280,
  tier8: 350,
};

export const SKILL_BRANCHES = [
  { id: "firepower", label: "Poder de Fogo", icon: "firepower", color: 0xff3366 },
  { id: "mobility", label: "Mobilidade", icon: "mobility", color: 0x00ffff },
  { id: "survival", label: "Sobrevivência", icon: "survival", color: 0x00ff88 },
  { id: "economy", label: "Economia", icon: "economy", color: 0xfff275 },
  { id: "tech", label: "Tecnologia", icon: "tech", color: 0x9b5cff },
  { id: "control", label: "Controle", icon: "control", color: 0x5cc8ff },
];

function makeSkill({
  id,
  name,
  branch,
  type = "base",
  cost,
  description,
  effects = {},
  prereqs,
}) {
  return {
    id,
    name,
    branch,
    branchIds: [branch],
    type,
    cost,
    description,
    effects,
    prereqs,
    reveal: { distance: 1 }, 
  };
}

function makeBranchSkills(branchId, specs) {
  const costsArray = [COSTS.tier1, COSTS.tier2, COSTS.tier3, COSTS.tier4, COSTS.tier5, COSTS.tier6, COSTS.tier7, COSTS.tier8];
  return specs.map((spec, index) =>
    makeSkill({
      ...spec,
      branch: branchId,
      type: "base",
      cost: costsArray[index] || 999,
      prereqs: index === 0 ? ["core"] : [specs[index - 1].id],
    })
  );
}

const baseSkills = [
  ...makeBranchSkills("firepower", [
    {
      id: "fire_rate_1",
      name: "Capacitor Rápido",
      description: "+15% de cadência de tiro.",
      effects: { fireVelocityMultiplier: 1.15 },
    },
    {
      id: "bullet_speed_1",
      name: "Indução Eletromagnética",
      description: "+40% de velocidade do projétil.",
      effects: { bulletSpeedBonus: 0.4 },
    },
    {
      id: "bullet_damage_1",
      name: "Carga Perfurante",
      description: "+1 de dano de projétil.",
      effects: { bulletDamageBonus: 1 },
    },
    {
      id: "multishot_1",
      name: "Prisma Divisor",
      description: "Adiciona +1 projétil em dispersão.",
      effects: { extraProjectiles: 1, spreadRadians: 0.16 },
    },
    {
      id: "overheat_1",
      name: "Ciclo de Sobrecarga",
      description: "Adiciona 8% de chance de acerto crítico.",
      effects: { critChance: 0.08, critMultiplier: 2 },
    },
    {
      id: "overdrive_matrix_1",
      name: "Explosão Controlada",
      description: "+20% de cadência de tiro.",
      effects: { fireVelocityMultiplier: 1.2 },
    },
    {
      id: "overdrive_matrix_2",
      name: "Munição Ápice",
      description: "+12% de chance crítica e danos críticos massivos.",
      effects: { critChance: 0.12, critMultiplier: 2.5 },
    },
  ]),
  ...makeBranchSkills("mobility", [
    {
      id: "move_speed_1",
      name: "Pernas Vetoriais",
      description: "+25% de velocidade de movimento.",
      effects: { moveSpeedBonus: 0.25 },
    },
    {
      id: "dash_unlock",
      name: "Teletransporte",
      description: "Desbloqueia a habilidade de Dash evasivo.",
      effects: { dashEnabled: true },
    },
    {
      id: "dash_cooldown_1",
      name: "Sangria Térmica",
      description: "O tempo de recarga do Dash é 15% mais veloz.",
      effects: { dashCooldownMultiplier: 0.85 },
    },
    {
      id: "dash_iframe_1",
      name: "Entrada Fásica",
      description: "Dash concede invulnerabilidade temporária.",
      effects: { dashInvulnerabilityMs: 250 },
    },
    {
      id: "strafe_control_1",
      name: "Deslizamento Giroscópico",
      description: "Melhora o controle da fricção no solo.",
      effects: { strafeControlBonus: 0.2 },
    },
    {
      id: "kinetic_reload",
      name: "Recarga Cinética",
      description: "Dashing reseta o tempo de ataque.",
      effects: { dashReload: true, fireVelocityMultiplier: 1.08 },
    },
    {
      id: "reactor_evasion",
      name: "Evasão de Reator",
      description: "+20% de velocidade de movimento, +15% pontuação.",
      effects: { moveSpeedBonus: 0.2, scoreMultiplier: 1.15 },
    },
  ]),
  ...makeBranchSkills("survival", [
    {
      id: "max_hp_1",
      name: "Carenagem Reforçada",
      description: "+1 de vida máxima.",
      effects: { maxLifeBonus: 1 },
    },
    {
      id: "shield_1",
      name: "Buffer Égide",
      description: "+1 barreira de escudo de energia.",
      effects: { maxShield: 1 },
    },
    {
      id: "shield_regen_1",
      name: "Reboot de Égide",
      description: "Escudo pode se regenerar fora de combate.",
      effects: { shieldRegenSeconds: 12 },
    },
    {
      id: "hit_guard_1",
      name: "Guarda em Trauma",
      description: "Garante invulnerabilidade extra após levar dano.",
      effects: { postHitGuardMs: 2000 },
    },
    {
      id: "emergency_shield_1",
      name: "Relé do Presunto",
      description: "Garante um escudo de emergência em vida baixa.",
      effects: { emergencyShield: true },
    },
    {
      id: "aegis_dash",
      name: "Dash da Égide",
      description: "Dashing recarrega energia temporária de escudo.",
      effects: { dashShield: true, maxShield: 1 },
    },
    {
      id: "iron_reserve",
      name: "Reserva de Ferro",
      description: "+1 de vida máxima e +1 de barreira de escudo.",
      effects: { maxLifeBonus: 1, maxShield: 1 },
    },
  ]),
  ...makeBranchSkills("economy", [
    {
      id: "credit_gain_1",
      name: "Sifão de Créditos",
      description: "+10% em todos os ganhos de créditos.",
      effects: { creditMultiplier: 1.1 },
    },
    {
      id: "score_bonus_1",
      name: "Uplink de Pontos",
      description: "+10% no ganho de score por abates.",
      effects: { scoreMultiplier: 1.1 },
    },
    {
      id: "streak_reward_1",
      name: "Contrato de Sequência",
      description: "Ganha bônus de créditos em sequências imbatíveis.",
      effects: { streakCreditBonus: 5 },
    },
    {
      id: "boss_bounty_1",
      name: "Recompensa Dupla",
      description: "+15 de bônus na execução de Chefões.",
      effects: { bossCreditBonus: 15 },
    },
    {
      id: "discount_protocol_1",
      name: "Protocolo de Desconto",
      description: "-5% no valor de compras nessa aba.",
      effects: { discountMultiplier: 0.95 },
    },
    {
      id: "last_stand_contract",
      name: "Contrato de Risco",
      description: "Ganho exorbitante de créditos sobrevivendo com 1 HP.",
      effects: { lowHpCreditBonus: 20 },
    },
    {
      id: "reactor_yield",
      name: "Rendimento do Reator",
      description: "Maximização econômica. +15% ganho de créditos.",
      effects: { creditMultiplier: 1.15 },
    },
  ]),
  ...makeBranchSkills("tech", [
    {
      id: "drone_unlock",
      name: "Semente Drone",
      description: "Desbloqueia +1 Drone flutuante de apoio.",
      effects: { droneCount: 1 },
    },
    {
      id: "drone_fire_rate_1",
      name: "Capacitor de Drone",
      description: "+15% de cadência de tiro em Drones aliados.",
      effects: { droneFireVelocityMultiplier: 1.15 },
    },
    {
      id: "drone_targeting_1",
      name: "Alvos Próximos",
      description: "Drones priorizam ameaças em proximidade perigosa.",
      effects: { droneTargeting: true },
    },
    {
      id: "magnet_scan_1",
      name: "Raio Trator",
      description: "Aumenta distância de coleta passiva.",
      effects: { magnetRadiusBonus: 80 },
    },
    {
      id: "drone_overclock_1",
      name: "Overclock em Drones",
      description: "+25% de dano e letalidade focada para os drones.",
      effects: { droneOverclockMultiplier: 1.25 },
    },
    {
      id: "bounty_drone",
      name: "Drone Caçador",
      description: "Kills feitas por Drones rendem mais créditos.",
      effects: { droneBountyBonus: true, bossCreditBonus: 10 },
    },
    {
      id: "marking_swarm",
      name: "Enxame Marcador",
      description: "+1 Drone. Os drones congelam os inimigos visados.",
      effects: { droneAppliesFreeze: true, droneCount: 1 },
    },
  ]),
  ...makeBranchSkills("control", [
    {
      id: "slow_field_1",
      name: "Campo Criogênico",
      description: "+20% de chance de congelar inimigos com cada tiro.",
      effects: { freezeChance: 0.20 },
    },
    {
      id: "knockback_1",
      name: "Vetor de Impacto",
      description: "Projéteis agora possuem recuo massivo.",
      effects: { knockbackBonus: 18 },
    },
    {
      id: "enemy_weaken_1",
      name: "Marca de Fraqueza",
      description: "Inimigos congelados tomam mais dano.",
      effects: { enemyWeakenMultiplier: 1.15 },
    },
    {
      id: "chain_pulse_1",
      name: "Pulso em Cadeia",
      description: "Adiciona uma pequena área de desorientação elétrica.",
      effects: { chainPulseRadius: 70 },
    },
    {
      id: "control_duration_1",
      name: "Sinal Persistente",
      description: "Efeitos de controle duram +20% à mais.",
      effects: { controlDurationMultiplier: 1.2 },
    },
    {
      id: "marked_ammunition",
      name: "Munição Marcadora",
      description: "Dano severo contra inimgos controlados.",
      effects: { enemyWeakenMultiplier: 1.2, bulletDamageBonus: 1 },
    },
    {
      id: "pulse_network",
      name: "Rede de Eletromagnetismo",
      description: "Expansão extrema para pulsos de confusão em massa.",
      effects: { chainPulseRadius: 100 },
    },
  ]),
];

export const SKILL_TREE = [
  {
    id: "core",
    name: "Core",
    branch: "core",
    branchIds: [],
    type: "core",
    cost: 0,
    description: "The permanent progression root.",
    effects: {},
    prereqs: [],
  },
  ...baseSkills,
];

const skillsById = new Map(SKILL_TREE.map((skill) => [skill.id, skill]));

export function getSkillById(id) {
  return skillsById.get(id);
}
