export const UPGRADE_REGISTRY = [
  {
    id: 'chain_lightning',
    name: 'Raio em Cadeia',
    color: 0x00FFFF,
    tiers: [
      { description: 'Ao acertar um inimigo, 20% de chance de arco elétrico atingir até 2 alvos próximos causando 1 de dano.', effect: { chainLightningChance: 0.20, chainLightningTargets: 2, chainLightningRange: 100, chainLightningDamage: 1 } },
      { description: 'Arco elétrico com 35% de chance atingindo até 2 alvos próximos — 1 de dano.', effect: { chainLightningChance: 0.35, chainLightningTargets: 2, chainLightningRange: 110, chainLightningDamage: 1 } },
      { description: 'Arco elétrico com 50% de chance atingindo até 3 alvos próximos — 1 de dano.', effect: { chainLightningChance: 0.50, chainLightningTargets: 3, chainLightningRange: 120, chainLightningDamage: 1 } },
      { description: 'Arco elétrico com 65% de chance atingindo até 3 alvos próximos — 2 de dano.', effect: { chainLightningChance: 0.65, chainLightningTargets: 3, chainLightningRange: 130, chainLightningDamage: 2 } },
      { description: 'Arco elétrico com 85% de chance atingindo até 4 alvos próximos — 2 de dano.', effect: { chainLightningChance: 0.85, chainLightningTargets: 4, chainLightningRange: 140, chainLightningDamage: 2 } },
      { description: 'Arco elétrico GARANTIDO em até 4 alvos próximos — 2 de dano cada.', effect: { chainLightningChance: 1.00, chainLightningTargets: 4, chainLightningRange: 150, chainLightningDamage: 2 } },
    ],
  },
  {
    id: 'viral_core',
    name: 'Núcleo Viral',
    color: 0x00FF88,
    tiers: [
      { description: 'Inimigos eliminados deixam nuvem tóxica por 2s causando 1 de dano/s a inimigos próximos.', effect: { viralCoreRadius: 40, viralCoreDamagePerTick: 0.5, viralCoreDuration: 120 } },
      { description: 'Nuvem tóxica por 2.5s em raio maior — 1 de dano/s.', effect: { viralCoreRadius: 50, viralCoreDamagePerTick: 0.5, viralCoreDuration: 150 } },
      { description: 'Nuvem tóxica por 3s — 2 de dano/s a inimigos próximos.', effect: { viralCoreRadius: 60, viralCoreDamagePerTick: 1, viralCoreDuration: 180 } },
      { description: 'Nuvem tóxica por 3.5s em raio ampliado — 2 de dano/s.', effect: { viralCoreRadius: 75, viralCoreDamagePerTick: 1, viralCoreDuration: 210 } },
      { description: 'Nuvem tóxica por 4s em grande raio — 3 de dano/s.', effect: { viralCoreRadius: 90, viralCoreDamagePerTick: 1.5, viralCoreDuration: 240 } },
      { description: 'Nuvem tóxica por 5s em raio máximo — 4 de dano/s. Inimigos não conseguem sair da nuvem.', effect: { viralCoreRadius: 110, viralCoreDamagePerTick: 2, viralCoreDuration: 300 } },
    ],
  },
  {
    id: 'retaliation_pulse',
    name: 'Pulso de Retaliação',
    color: 0xFF00FF,
    tiers: [
      { description: 'Ao receber dano, emite pulso que causa 1 de dano e empurra inimigos próximos.', effect: { retaliationPulseRadius: 120, retaliationPulseDamage: 1, retaliationPulseStunMs: 0 } },
      { description: 'Pulso de retaliação com alcance maior — 1 de dano.', effect: { retaliationPulseRadius: 160, retaliationPulseDamage: 1, retaliationPulseStunMs: 0 } },
      { description: 'Pulso de retaliação com alcance ampliado — 2 de dano.', effect: { retaliationPulseRadius: 200, retaliationPulseDamage: 2, retaliationPulseStunMs: 0 } },
      { description: 'Pulso maior com 2 de dano e 0.3s de stun nos inimigos atingidos.', effect: { retaliationPulseRadius: 250, retaliationPulseDamage: 2, retaliationPulseStunMs: 300 } },
      { description: 'Pulso de grande alcance com 3 de dano e 0.5s de stun.', effect: { retaliationPulseRadius: 320, retaliationPulseDamage: 3, retaliationPulseStunMs: 500 } },
      { description: 'PULSO TOTAL: onda que varre toda a tela — 4 de dano e 0.8s de stun em todos os inimigos.', effect: { retaliationPulseRadius: -1, retaliationPulseDamage: 4, retaliationPulseStunMs: 800 } },
    ],
  },
];
