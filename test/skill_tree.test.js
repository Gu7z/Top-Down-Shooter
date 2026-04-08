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
    purchaseCascade(id) {
      if (this.purchased.has(id)) return { ok: false, reason: 'already_purchased' };
      const skill = getSkillById(id);
      if (!skill) return { ok: false, reason: 'missing_skill' };
      const chain = [];
      const collect = (sid) => {
        if (this.purchased.has(sid)) return;
        for (const prereq of (getSkillById(sid)?.prereqs || [])) collect(prereq);
        chain.push(sid);
      };
      collect(id);
      if (chain.length === 0) return { ok: false, reason: 'already_purchased' };
      for (const cid of chain) this.purchased.add(cid);
      return { ok: true, purchasedIds: chain };
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
  // Locked node: cascade compra pré-requisitos + alvo (fire_rate_1 + bullet_speed_1 = +2)
  screen.handleNodePrimary('bullet_speed_1');
  assert.equal(screen.skillState.getPurchasedIds().length, previousPurchasedLength + 2);

  // Skill já comprada: não faz nada
  screen.handleNodePrimary('fire_rate_1');
  assert.equal(screen.skillState.getPurchasedIds().length, previousPurchasedLength + 2);
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

test('skill tree ignores wheel before scroll content is available', () => {
  const screen = new SkillTree({
    app: createSkillTreeAppMock(),
    skillState: createStateStub(),
    onBack: () => {},
  });
  let prevented = false;

  screen.scrollContent = null;
  screen.contentTotalH = undefined;
  screen.onWheel({
    clientY: 200,
    deltaY: 20,
    preventDefault() { prevented = true; },
  });

  assert.equal(screen.scrollY, 0);
  assert.equal(prevented, false);
});

test('skill tree scrolls inside the content viewport and clamps the offset', () => {
  const screen = new SkillTree({
    app: createSkillTreeAppMock(),
    skillState: createStateStub(),
    onBack: () => {},
  });
  let prevented = false;

  screen.contentTotalH = 900;
  screen.scrollBaseY = 140;
  screen.scrollContent.y = screen.scrollBaseY;

  screen.onWheel({
    clientY: 240,
    deltaY: 120,
    preventDefault() { prevented = true; },
  });

  assert.equal(prevented, true);
  assert.ok(screen.scrollY < 0);
  assert.equal(screen.scrollContent.y, screen.scrollBaseY + screen.scrollY);
});

test('skill tree prevents context menu and back button destroys the screen', () => {
  const app = createSkillTreeAppMock();
  let backCalls = 0;
  const screen = new SkillTree({
    app,
    skillState: createStateStub(),
    onBack: () => { backCalls += 1; },
  });
  let prevented = false;

  screen.onContextMenu({
    preventDefault() { prevented = true; },
  });

  const backButton = screen.hudLayer.children.find((child) => child.eventHandlers?.pointerdown);
  backButton.eventHandlers.pointerdown();

  assert.equal(prevented, true);
  assert.equal(backCalls, 1);
  assert.equal(screen.container.destroyed, true);
  assert.equal(app.renderer.view.eventListeners.contextmenu, undefined);
  assert.equal(app.renderer.view.eventListeners.wheel, undefined);
});
