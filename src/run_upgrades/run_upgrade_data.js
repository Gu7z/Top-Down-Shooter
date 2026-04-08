export const UPGRADE_REGISTRY = [
  {
    id: 'boss_hunter',
    name: 'Caça-Titãs',
    color: 0xFF7A00,
    tiers: [
      { description: 'Causa 25% mais dano em chefes.', effect: { bossDamageMultiplier: 1.25 } },
      { description: 'Causa 50% mais dano em chefes.', effect: { bossDamageMultiplier: 1.50 } },
      { description: 'Causa 75% mais dano em chefes.', effect: { bossDamageMultiplier: 1.75 } },
      { description: 'Dobra o dano contra chefes.', effect: { bossDamageMultiplier: 2.00 } },
      { description: 'Causa 125% mais dano em chefes.', effect: { bossDamageMultiplier: 2.25 } },
      { description: 'ANIQUILADOR DE TITÃS: causa 150% mais dano em chefes.', effect: { bossDamageMultiplier: 2.50 } },
    ],
  },
  {
    id: 'chain_lightning',
    name: 'Raio em Cadeia',
    color: 0x00FFFF,
    tiers: [
      { description: 'Ao acertar um inimigo, 15% de chance de arco elétrico atingir os 2 inimigos mais próximos causando 2 de dano.', effect: { chainLightningChance: 0.15, chainLightningTargets: 2, chainLightningDamage: 2 } },
      { description: 'Arco elétrico com 25% de chance atingindo os 2 mais próximos — 3 de dano cada.', effect: { chainLightningChance: 0.25, chainLightningTargets: 2, chainLightningDamage: 3 } },
      { description: 'Arco elétrico com 40% de chance atingindo os 3 mais próximos — 3 de dano cada.', effect: { chainLightningChance: 0.40, chainLightningTargets: 3, chainLightningDamage: 3 } },
      { description: 'Arco elétrico com 55% de chance atingindo os 3 mais próximos — 4 de dano cada.', effect: { chainLightningChance: 0.55, chainLightningTargets: 3, chainLightningDamage: 4 } },
      { description: 'Arco elétrico com 75% de chance atingindo os 4 mais próximos — 4 de dano cada.', effect: { chainLightningChance: 0.75, chainLightningTargets: 4, chainLightningDamage: 4 } },
      { description: 'Arco elétrico GARANTIDO atingindo os 5 inimigos mais próximos — 5 de dano cada.', effect: { chainLightningChance: 1.00, chainLightningTargets: 5, chainLightningDamage: 5 } },
    ],
  },
  {
    id: 'viral_core',
    name: 'Núcleo Viral',
    color: 0x00FF88,
    tiers: [
      { description: 'Inimigos eliminados deixam nuvem tóxica por 3s. Causa 2 de dano/s e reduz velocidade em 30% de inimigos próximos.', effect: { viralCoreRadius: 60, viralCoreDamagePerTick: 1, viralCoreDuration: 180, viralCoreSlow: 0.30 } },
      { description: 'Nuvem tóxica por 3.5s em raio maior. Causa 2 de dano/s e reduz velocidade em 35%.', effect: { viralCoreRadius: 75, viralCoreDamagePerTick: 1, viralCoreDuration: 210, viralCoreSlow: 0.35 } },
      { description: 'Nuvem tóxica por 4s — 4 de dano/s e slow de 45%. Inimigos mal conseguem escapar.', effect: { viralCoreRadius: 95, viralCoreDamagePerTick: 2, viralCoreDuration: 240, viralCoreSlow: 0.45 } },
      { description: 'Nuvem tóxica por 4.5s em raio ampliado — 4 de dano/s e slow de 55%.', effect: { viralCoreRadius: 115, viralCoreDamagePerTick: 2, viralCoreDuration: 270, viralCoreSlow: 0.55 } },
      { description: 'Nuvem tóxica por 5.5s em grande raio — 6 de dano/s e slow de 60%.', effect: { viralCoreRadius: 140, viralCoreDamagePerTick: 3, viralCoreDuration: 330, viralCoreSlow: 0.60 } },
      { description: 'NUVEM VIRAL MÁXIMA: 7s de duração, 8 de dano/s e slow de 70%. Inimigos que entram raramente saem.', effect: { viralCoreRadius: 170, viralCoreDamagePerTick: 4, viralCoreDuration: 420, viralCoreSlow: 0.70 } },
    ],
  },
  {
    id: 'retaliation_pulse',
    name: 'Pulso de Retaliação',
    color: 0xFF00FF,
    tiers: [
      { description: 'Ao receber dano, emite pulso que causa 2 de dano e 0.2s de stun em inimigos próximos.', effect: { retaliationPulseRadius: 180, retaliationPulseDamage: 2, retaliationPulseStunMs: 200 } },
      { description: 'Pulso com alcance maior — 3 de dano e 0.35s de stun.', effect: { retaliationPulseRadius: 230, retaliationPulseDamage: 3, retaliationPulseStunMs: 350 } },
      { description: 'Pulso devastador — 4 de dano e 0.55s de stun em amplo raio.', effect: { retaliationPulseRadius: 300, retaliationPulseDamage: 4, retaliationPulseStunMs: 550 } },
      { description: 'Pulso de grande alcance — 5 de dano e 0.75s de stun. Controla metade da tela.', effect: { retaliationPulseRadius: 380, retaliationPulseDamage: 5, retaliationPulseStunMs: 750 } },
      { description: 'Pulso dominante — 7 de dano e 1s de stun em quase toda a tela.', effect: { retaliationPulseRadius: 470, retaliationPulseDamage: 7, retaliationPulseStunMs: 1000 } },
      { description: 'PULSO TOTAL: onda que varre toda a tela — 9 de dano e 1.5s de stun em todos os inimigos.', effect: { retaliationPulseRadius: -1, retaliationPulseDamage: 9, retaliationPulseStunMs: 1500 } },
    ],
  },
];
