import { UPGRADE_REGISTRY } from './run_upgrade_data.js';

const DEFAULT_EFFECTS = {
  chainLightningChance: 0,
  chainLightningTargets: 2,
  chainLightningDamage: 1,
  viralCoreRadius: 0,
  viralCoreDamagePerTick: 0,
  viralCoreDuration: 0,
  viralCoreSlow: 0,
  retaliationPulseRadius: 0,
  retaliationPulseDamage: 0,
  retaliationPulseStunMs: 0,
};

export class RunUpgradeState {
  constructor() {
    const shuffled = [...UPGRADE_REGISTRY].sort(() => Math.random() - 0.5);
    this.active = shuffled.slice(0, 2);
    this.levels = [0, 0];
    this._cachedEffects = { ...DEFAULT_EFFECTS };
  }

  applyChoice(index) {
    if (index < 0 || index > 1) return;
    if (this.levels[index] >= 6) return;
    this.levels[index]++;
    this._cachedEffects = this._computeEffects();
  }

  shouldShow() {
    return this.levels[0] < 6 || this.levels[1] < 6;
  }

  getCardsToShow() {
    return this.active
      .map((upgrade, i) => ({ upgrade, level: this.levels[i], index: i }))
      .filter((_, i) => this.levels[i] < 6);
  }

  getActiveEffects() {
    return this._cachedEffects;
  }

  _computeEffects() {
    const result = { ...DEFAULT_EFFECTS };
    this.active.forEach((upgrade, i) => {
      const level = this.levels[i];
      if (level === 0) return;
      const tierEffect = upgrade.tiers[level - 1].effect;
      Object.assign(result, tierEffect);
    });
    return result;
  }
}
