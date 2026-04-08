import test from 'node:test';
import assert from 'node:assert/strict';
import { UPGRADE_REGISTRY } from '../../src/run_upgrades/run_upgrade_data.js';

test('registry has exactly 4 upgrades', () => {
  assert.equal(UPGRADE_REGISTRY.length, 4);
});

test('every upgrade has required fields', () => {
  for (const u of UPGRADE_REGISTRY) {
    assert.ok(u.id, 'missing id');
    assert.ok(u.name, 'missing name');
    assert.ok(typeof u.color === 'number', 'color must be a number');
    assert.ok(Array.isArray(u.tiers), 'tiers must be array');
  }
});

test('every upgrade has exactly 6 tiers', () => {
  for (const u of UPGRADE_REGISTRY) {
    assert.equal(u.tiers.length, 6, `${u.id} must have 6 tiers`);
  }
});

test('every tier has description and effect', () => {
  for (const u of UPGRADE_REGISTRY) {
    for (const tier of u.tiers) {
      assert.ok(typeof tier.description === 'string' && tier.description.length > 0);
      assert.ok(typeof tier.effect === 'object');
    }
  }
});

test('chain_lightning tier 6 has 100% chance', () => {
  const cl = UPGRADE_REGISTRY.find(u => u.id === 'chain_lightning');
  assert.equal(cl.tiers[5].effect.chainLightningChance, 1.00);
});

test('retaliation_pulse tier 6 has radius -1 (full screen)', () => {
  const rp = UPGRADE_REGISTRY.find(u => u.id === 'retaliation_pulse');
  assert.equal(rp.tiers[5].effect.retaliationPulseRadius, -1);
});

test('boss_hunter tier 1 starts boss damage amplification', () => {
  const bossHunter = UPGRADE_REGISTRY.find(u => u.id === 'boss_hunter');
  assert.equal(bossHunter.name, 'Caça-Titãs');
  assert.equal(bossHunter.tiers[0].effect.bossDamageMultiplier, 1.25);
});
