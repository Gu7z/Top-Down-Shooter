import test from 'node:test';
import assert from 'node:assert/strict';
import SkillTree from '../src/skill_tree.js';
import { getSkillById } from '../src/progression/skill_tree_data.js';
import { setupPixiMock, createAppMock } from './helpers.js';

setupPixiMock();

function createSkillTreeAppMock() {
  const app = createAppMock();
  app.screen = { width: 1280, height: 720 };
  app.renderer.view.eventListeners = {};
  app.renderer.view.addEventListener = (event, fn) => {
    app.renderer.view.eventListeners[event] = fn;
  };
  app.renderer.view.removeEventListener = (event, fn) => {
    if (app.renderer.view.eventListeners[event] === fn) delete app.renderer.view.eventListeners[event];
  };
  return app;
}

function createStateStub(options = {}) {
  const visibleIds = options.visibleIds || ['core', 'fire_rate_1'];
  const purchased = new Set(options.purchased || ['core']);
  const initialFrameIds = options.initialFrameIds || ['core'];
  return {
    credits: 500,
    purchased,
    getCredits() { return this.credits; },
    getCost(skill) { return skill.cost; },
    has(id) { return this.purchased.has(id); },
    getPurchasedIds() { return [...this.purchased]; },
    getVisibleSkillIds() { return visibleIds; },
    getInitialFrameIds() { return initialFrameIds; },
    canPurchase(id) {
      if (this.purchased.has(id)) return { ok: false, reason: "already_purchased" };
      return id === 'fire_rate_1'
        ? { ok: true, cost: 45 }
        : { ok: false, reason: 'blocked' };
    },
    purchase(id) {
      this.purchased.add(id);
      return { ok: true, purchasedId: id, cost: 45 };
    },
    refundCascade(id) {
      this.purchased.delete(id);
      return { ok: true, removedIds: [id], refunded: 45 };
    },
  };
}

test('skill tree builds tabs and content successfully', () => {
  const screen = new SkillTree({
    app: createSkillTreeAppMock(),
    skillState: createStateStub(),
    onBack: () => {},
  });

  assert.ok(screen.contentLayer.children.length > 0);
  assert.ok(screen.hudLayer.children.length > 0);
  assert.ok(screen.tabsLayer.children.length > 0);
});

test('skill tree handles nodes click properly through secondary methods', () => {
  const screen = new SkillTree({
    app: createSkillTreeAppMock(),
    skillState: createStateStub(),
    onBack: () => {},
  });

  const previousPurchasedLength = screen.skillState.getPurchasedIds().length;
  // Node is locked so clicking it shouldn't purchase
  screen.handleNodePrimary('bullet_speed_1');
  assert.equal(screen.skillState.getPurchasedIds().length, previousPurchasedLength);

  // Available node
  screen.handleNodePrimary('fire_rate_1');
  assert.equal(screen.skillState.getPurchasedIds().length, previousPurchasedLength + 1);
});

test('skill tree handles node secondary refund cascade', () => {
  const screen = new SkillTree({
    app: createSkillTreeAppMock(),
    skillState: createStateStub({ purchased: ['core', 'fire_rate_1'] }),
    onBack: () => {},
  });

  assert.equal(screen.skillState.getPurchasedIds().includes('fire_rate_1'), true);
  screen.handleNodeSecondary('fire_rate_1');
  assert.equal(screen.skillState.getPurchasedIds().includes('fire_rate_1'), false);
});

test('skill tree switches branches via selectedBranch', () => {
  const screen = new SkillTree({
    app: createSkillTreeAppMock(),
    skillState: createStateStub(),
    onBack: () => {},
  });

  assert.equal(screen.selectedBranch, 0);
  screen.selectedBranch = 2;
  screen.buildTabs();
  screen.renderContent();
  assert.equal(screen.selectedBranch, 2);
  assert.ok(screen.contentLayer.children.length > 0);
});
