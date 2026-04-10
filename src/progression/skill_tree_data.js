const COSTS = {
  tier1: 40,
  tier2: 60,
  tier3: 85,
  tier4: 115,
  tier5: 150,
  tier6: 195,
  tier7: 245,
  tier8: 305,
  tier9: 375,
  tier10: 455,
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
  const costsArray = [
    COSTS.tier1, COSTS.tier2, COSTS.tier3, COSTS.tier4, COSTS.tier5,
    COSTS.tier6, COSTS.tier7, COSTS.tier8, COSTS.tier9, COSTS.tier10,
  ];
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
      description: "+10% de cadência de tiro.",
      effects: { fireVelocityMultiplier: 1.10 },
    },
    {
      id: "bullet_speed_1",
      name: "Indução Eletromagnética",
      description: "+0.25 de velocidade do projétil.",
      effects: { bulletSpeedBonus: 0.25 },
    },
    {
      id: "bullet_damage_1",
      name: "Carga Perfurante",
      description: "+1 de dano de projétil.",
      effects: { bulletDamageBonus: 1 },
    },
    {
      id: "fire_rate_2",
      name: "Bobina de Ignição",
      description: "+8% de cadência de tiro.",
      effects: { fireVelocityMultiplier: 1.08 },
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
      description: "+5% de chance de acerto crítico. Acertos críticos causam 1.5× de dano.",
      effects: { critChance: 0.05, critMultiplier: 1.5 },
    },
    {
      id: "bullet_speed_2",
      name: "Projétil Magnético",
      description: "+0.25 de velocidade do projétil.",
      effects: { bulletSpeedBonus: 0.25 },
    },
    {
      id: "fire_rate_3",
      name: "Sincronização de Disparo",
      description: "+8% de cadência de tiro.",
      effects: { fireVelocityMultiplier: 1.08 },
    },
    {
      id: "overheat_2",
      name: "Fragmentação Crítica",
      description: "+7% de chance de acerto crítico. Acertos críticos causam 1.5× de dano (acumula).",
      effects: { critChance: 0.07, critMultiplier: 1.5 },
    },
    {
      id: "apex_armament",
      name: "Munição Ápice",
      description: "+6% de chance crítica. Maximização de dano crítico (+1.35×, acumula).",
      effects: { critChance: 0.06, critMultiplier: 1.35 },
    },
  ]),
  ...makeBranchSkills("mobility", [
    {
      id: "move_speed_1",
      name: "Pernas Vetoriais I",
      description: "+0.15 de velocidade de movimento.",
      effects: { moveSpeedBonus: 0.15 },
    },
    {
      id: "move_speed_2",
      name: "Pernas Vetoriais II",
      description: "+0.10 de velocidade de movimento.",
      effects: { moveSpeedBonus: 0.10 },
    },
    {
      id: "dash_unlock",
      name: "Teletransporte",
      description: "Desbloqueia a habilidade de Dash evasivo.",
      effects: { dashEnabled: true },
    },
    {
      id: "dash_cooldown_1",
      name: "Sangria Térmica I",
      description: "O tempo de recarga do Dash é 10% mais veloz.",
      effects: { dashCooldownMultiplier: 0.90 },
    },
    {
      id: "dash_iframe_1",
      name: "Entrada Fásica I",
      description: "Dash concede 120ms de invulnerabilidade.",
      effects: { dashInvulnerabilityMs: 120 },
    },
    {
      id: "strafe_control_1",
      name: "Deslizamento Giroscópico",
      description: "Melhora o controle da fricção no solo.",
      effects: { strafeControlBonus: 0.25 },
    },
    {
      id: "dash_cooldown_2",
      name: "Sangria Térmica II",
      description: "O tempo de recarga do Dash é mais 10% veloz.",
      effects: { dashCooldownMultiplier: 0.90 },
    },
    {
      id: "dash_iframe_2",
      name: "Entrada Fásica II",
      description: "Dash concede mais 100ms de invulnerabilidade.",
      effects: { dashInvulnerabilityMs: 100 },
    },
    {
      id: "kinetic_reload",
      name: "Recarga Cinética",
      description: "Após usar dash, o próximo disparo sai imediatamente.",
      effects: { dashReload: true },
    },
    {
      id: "reactor_evasion",
      name: "Evasão de Reator",
      description: "+0.15 de velocidade de movimento, +20% de score por abates.",
      effects: { moveSpeedBonus: 0.15, scoreMultiplier: 1.20 },
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
      name: "Buffer Égide I",
      description: "+1 barreira de escudo de energia.",
      effects: { maxShield: 1 },
    },
    {
      id: "shield_regen_1",
      name: "Reboot de Égide",
      description: "Escudo pode se regenerar fora de combate a cada 15s.",
      effects: { shieldRegenSeconds: 15 },
    },
    {
      id: "hit_guard_1",
      name: "Guarda em Trauma",
      description: "Garante 1.2s de invulnerabilidade após levar dano.",
      effects: { postHitGuardMs: 1200 },
    },
    {
      id: "shield_2",
      name: "Buffer Égide II",
      description: "+1 barreira de escudo de energia.",
      effects: { maxShield: 1 },
    },
    {
      id: "emergency_shield_1",
      name: "Relé do Presunto",
      description: "Garante um escudo de emergência ao atingir 1 HP pela primeira vez.",
      effects: { emergencyShield: true },
    },
    {
      id: "max_hp_2",
      name: "Muralha de Ferro",
      description: "+1 de vida máxima.",
      effects: { maxLifeBonus: 1 },
    },
    {
      id: "shield_regen_2",
      name: "Reboot Avançado",
      description: "Escudo se regenera 7s mais rápido.",
      effects: { shieldRegenSeconds: -7 },
    },
    {
      id: "aegis_dash",
      name: "Dash da Égide",
      description: "Quando o escudo está vazio, o dash o restaura em +1 (cooldown: 10s).",
      effects: { dashShield: true },
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
      effects: { creditMultiplier: 1.10 },
    },
    {
      id: "score_bonus_1",
      name: "Uplink de Pontos",
      description: "+10% no ganho de score por abates.",
      effects: { scoreMultiplier: 1.10 },
    },
    {
      id: "streak_reward_1",
      name: "Contrato de Campanha",
      description: "+2 créditos por onda concluída na run.",
      effects: { waveCreditBonus: 2 },
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
      description: "-5% no custo de todas as habilidades permanentes.",
      effects: { discountMultiplier: 0.95 },
    },
    {
      id: "last_stand_contract",
      name: "Contrato de Risco",
      description: "Ganho exorbitante de créditos sobrevivendo com 1 HP.",
      effects: { lowHpCreditBonus: 20 },
    },
    {
      id: "reactor_yield_1",
      name: "Rendimento do Reator I",
      description: "+12% em todos os ganhos de créditos.",
      effects: { creditMultiplier: 1.12 },
    },
    {
      id: "bounty_drone",
      name: "Drone Caçador",
      description: "Abates feitos por drones rendem +1 crédito extra no fim da run.",
      effects: { droneKillCreditBonus: 1 },
    },
    {
      id: "wave_harvest",
      name: "Colheita de Ondas",
      description: "+3 créditos por onda concluída na run.",
      effects: { waveCreditBonus: 3 },
    },
    {
      id: "neon_oligarch",
      name: "Oligarca da Neon",
      description: "+15% em ganhos de créditos e +25% de score por abates.",
      effects: { creditMultiplier: 1.15, scoreMultiplier: 1.25 },
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
      name: "Capacitor de Drone I",
      description: "+25% de cadência de tiro em Drones aliados.",
      effects: { droneFireVelocityMultiplier: 1.25 },
    },
    {
      id: "drone_targeting_1",
      name: "Alvos Próximos",
      description: "Drones priorizam ameaças em proximidade perigosa.",
      effects: { droneTargeting: true },
    },
    {
      id: "magnet_scan_1",
      name: "Matriz de Dispersão",
      description: "Drones disparam +1 projétil extra em leque.",
      effects: { droneExtraProjectiles: 1, droneSpreadRadians: 0.18 },
    },
    {
      id: "drone_overclock_1",
      name: "Overclock Leve",
      description: "+50% de dano por disparo dos Drones.",
      effects: { droneOverclockMultiplier: 1.5 },
    },
    {
      id: "drone_piercing_1",
      name: "Núcleo Perfurante",
      description: "Balas do drone atravessam 1 inimigo adicional.",
      effects: { dronePiercing: 1 },
    },
    {
      id: "drone_fire_rate_2",
      name: "Capacitor de Drone II",
      description: "+25% de cadência de tiro em Drones aliados.",
      effects: { droneFireVelocityMultiplier: 1.25 },
    },
    {
      id: "drone_overclock_2",
      name: "Overclock Avançado",
      description: "+50% de dano por disparo dos Drones.",
      effects: { droneOverclockMultiplier: 1.5 },
    },
    {
      id: "marking_swarm",
      name: "Enxame Marcador",
      description: "+1 Drone. Os drones têm 25% de chance de congelar os inimigos visados, mas não afetam chefes.",
      effects: { droneAppliesFreeze: true, droneCount: 1 },
    },
    {
      id: "swarm_network",
      name: "Rede de Enxame",
      description: "+1 Drone adicional e +15% de cadência de todos os Drones.",
      effects: { droneCount: 1, droneFireVelocityMultiplier: 1.15 },
    },
  ]),
  ...makeBranchSkills("control", [
    {
      id: "slow_field_1",
      name: "Campo Criogênico I",
      description: "+15% de chance de congelar inimigos com cada tiro. Não afeta chefes.",
      effects: { freezeChance: 0.15 },
    },
    {
      id: "knockback_1",
      name: "Vetor de Impacto I",
      description: "Projéteis agora possuem recuo.",
      effects: { knockbackBonus: 15 },
    },
    {
      id: "enemy_weaken_1",
      name: "Marca de Fraqueza",
      description: "Inimigos congelados ou atordoados tomam 20% mais dano.",
      effects: { enemyWeakenMultiplier: 1.20 },
    },
    {
      id: "chain_pulse_1",
      name: "Pulso em Cadeia I",
      description: "Adiciona uma área de desorientação elétrica de 60px.",
      effects: { chainPulseRadius: 60 },
    },
    {
      id: "control_duration_1",
      name: "Sinal Persistente",
      description: "Efeitos de controle duram +20% a mais.",
      effects: { controlDurationMultiplier: 1.20 },
    },
    {
      id: "marked_ammunition",
      name: "Munição Marcadora",
      description: "+1 de dano de projétil. Inimigos congelados ou atordoados tomam 25% mais dano.",
      effects: { enemyWeakenMultiplier: 1.25, bulletDamageBonus: 1 },
    },
    {
      id: "slow_field_2",
      name: "Campo Criogênico II",
      description: "+10% de chance de congelar inimigos com cada tiro. Não afeta chefes.",
      effects: { freezeChance: 0.10 },
    },
    {
      id: "knockback_2",
      name: "Vetor de Impacto II",
      description: "Projéteis possuem recuo ainda maior.",
      effects: { knockbackBonus: 10 },
    },
    {
      id: "chain_pulse_2",
      name: "Pulso em Cadeia II",
      description: "Expansão da área de desorientação para 80px extras.",
      effects: { chainPulseRadius: 80 },
    },
    {
      id: "pulse_network",
      name: "Rede de Eletromagnetismo",
      description: "Expansão extrema para pulsos de confusão em massa. Inimigos controlados tomam 30% mais dano.",
      effects: { chainPulseRadius: 100, enemyWeakenMultiplier: 1.30 },
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
