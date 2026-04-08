import test from 'node:test';
import assert from 'node:assert/strict';
import { RunUpgradeState } from '../../src/run_upgrades/run_upgrade_state.js';

test('picks exactly 2 upgrades from registry', () => {
  const state = new RunUpgradeState();
  assert.equal(state.active.length, 2);
  assert.notEqual(state.active[0].id, state.active[1].id);
});

test('starts with levels [0, 0]', () => {
  const state = new RunUpgradeState();
  assert.deepEqual(state.levels, [0, 0]);
});

test('applyChoice advances chosen level', () => {
  const state = new RunUpgradeState();
  state.applyChoice(0);
  assert.equal(state.levels[0], 1);
  assert.equal(state.levels[1], 0);
});

test('applyChoice does not go above 6', () => {
  const state = new RunUpgradeState();
  for (let i = 0; i < 10; i++) state.applyChoice(0);
  assert.equal(state.levels[0], 6);
});

test('shouldShow returns true when any level < 6', () => {
  const state = new RunUpgradeState();
  assert.equal(state.shouldShow(), true);
  for (let i = 0; i < 6; i++) state.applyChoice(0);
  assert.equal(state.shouldShow(), true);
});

test('shouldShow returns false when both maxed', () => {
  const state = new RunUpgradeState();
  for (let i = 0; i < 6; i++) state.applyChoice(0);
  for (let i = 0; i < 6; i++) state.applyChoice(1);
  assert.equal(state.shouldShow(), false);
});

test('getCardsToShow returns both when none maxed', () => {
  const state = new RunUpgradeState();
  const cards = state.getCardsToShow();
  assert.equal(cards.length, 2);
});

test('getCardsToShow returns 1 when first is maxed', () => {
  const state = new RunUpgradeState();
  for (let i = 0; i < 6; i++) state.applyChoice(0);
  const cards = state.getCardsToShow();
  assert.equal(cards.length, 1);
  assert.equal(cards[0].index, 1);
});

test('getActiveEffects returns zero values before any choice', () => {
  const state = new RunUpgradeState();
  const eff = state.getActiveEffects();
  assert.equal(eff.chainLightningChance, 0);
  assert.equal(eff.viralCoreRadius, 0);
  assert.equal(eff.retaliationPulseRadius, 0);
});

test('getActiveEffects reflects chosen upgrade tier', () => {
  const state = new RunUpgradeState();
  const chainUpgrade = state.active.find(u => u.id === 'chain_lightning');
  const chainIdx = state.active.indexOf(chainUpgrade);
  if (chainIdx === -1) return;
  state.applyChoice(chainIdx);
  const eff = state.getActiveEffects();
  assert.equal(eff.chainLightningChance, 0.20);
  assert.equal(eff.chainLightningTargets, 2);
});
