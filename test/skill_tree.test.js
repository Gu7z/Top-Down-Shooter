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
    has(id) { return this.purchased.has(id); },
    getPurchasedIds() { return [...this.purchased]; },
    getVisibleSkillIds() { return visibleIds; },
    getInitialFrameIds() { return initialFrameIds; },
    canPurchase(id) {
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

test('skill tree builds progressive visible nodes and tooltip layer', () => {
  const screen = new SkillTree({
    app: createSkillTreeAppMock(),
    skillState: createStateStub(),
    onBack: () => {},
  });

  assert.ok(screen.container.children.length > 0);
  assert.ok(screen.nodeViews.get('core'));
  assert.ok(screen.nodeViews.get('fire_rate_1'));
  assert.equal(screen.nodeViews.has('bullet_speed_1'), false);
});

test('skill tree builds visual constellation layers', () => {
  const screen = new SkillTree({
    app: createSkillTreeAppMock(),
    skillState: createStateStub(),
    onBack: () => {},
  });

  assert.ok(screen.atmosphereLayer);
  assert.ok(screen.worldAtmosphereLayer);
  assert.ok(screen.branchVeilLayer);
  assert.ok(screen.connectionGlowLayer);
  assert.ok(screen.nodeAuraLayer);
  assert.ok(screen.corePulse);
  assert.equal(screen.world.children.includes(screen.worldAtmosphereLayer), true);
  assert.equal(screen.world.children.includes(screen.branchVeilLayer), true);
  assert.equal(screen.connectionGlowLayer.blendMode, 'add');
  assert.equal(screen.nodeAuraLayer.blendMode, 'add');
  assert.ok(screen.worldAtmosphereLayer.children.length > 0);
});

test('skill tree has a full-screen pan surface for mouse drag', () => {
  const screen = new SkillTree({
    app: createSkillTreeAppMock(),
    skillState: createStateStub(),
    onBack: () => {},
  });

  assert.ok(screen.panSurface);
  assert.equal(screen.container.children.includes(screen.panSurface), true);
  assert.ok(screen.panSurface.hitArea);
  assert.equal(screen.panSurface.eventMode, 'static');

  screen.panSurface.eventHandlers.pointerdown({ data: { global: { x: 100, y: 100 } } });
  screen.panSurface.eventHandlers.pointermove({ data: { global: { x: 124, y: 132 } } });

  assert.equal(screen.world.position.x, 664);
  assert.equal(screen.world.position.y, 392);
});

test('skill tree wires canvas pointer drag fallback for Pixi hit-test gaps', () => {
  const app = createSkillTreeAppMock();
  const screen = new SkillTree({
    app,
    skillState: createStateStub(),
    onBack: () => {},
  });

  assert.equal(app.renderer.view.eventListeners.pointerdown, screen.onPanStart);
  assert.equal(app.renderer.view.eventListeners.pointermove, screen.onPanMove);
  app.renderer.view.eventListeners.pointerdown({ button: 0, clientX: 250, clientY: 250 });
  app.renderer.view.eventListeners.pointermove({ button: 0, clientX: 300, clientY: 280 });

  assert.equal(screen.world.position.x, 690);
  assert.equal(screen.world.position.y, 390);
});

test('skill tree registers animated visual effects with the ticker', () => {
  const app = createSkillTreeAppMock();
  const screen = new SkillTree({
    app,
    skillState: createStateStub(),
    onBack: () => {},
  });

  assert.equal(app.ticker.fn, screen.visualTick);
  const previousAlpha = screen.branchVeilLayer.alpha;
  screen.visualTick(1);
  assert.notEqual(screen.branchVeilLayer.alpha, previousAlpha);
});

test('base skill nodes use their branch color instead of a generic cyan', () => {
  const screen = new SkillTree({
    app: createSkillTreeAppMock(),
    skillState: createStateStub(),
    onBack: () => {},
  });

  assert.equal(screen.getNodeColor(getSkillById('fire_rate_1'), 'available'), 0xff3366);
  assert.equal(screen.getNodeColor(getSkillById('move_speed_1'), 'available'), 0x00ffff);
});

test('skill tree renders the approved gem socket visual roles', () => {
  const screen = new SkillTree({
    app: createSkillTreeAppMock(),
    skillState: createStateStub({
      visibleIds: ['core', 'fire_rate_1', 'fusion_firepower_mobility', 'capstone_overdrive_matrix'],
    }),
    onBack: () => {},
  });

  assert.equal(screen.nodeViews.get('core').visualStyle.shape, 'core-socket');
  assert.equal(screen.nodeViews.get('fire_rate_1').visualStyle.shape, 'socket-ring');
  assert.equal(screen.nodeViews.get('fire_rate_1').visualStyle.role, 'base');
  assert.equal(screen.nodeViews.get('fusion_firepower_mobility').visualStyle.shape, 'fusion-diamond');
  assert.equal(screen.nodeViews.get('capstone_overdrive_matrix').visualStyle.shape, 'capstone-diamond');
});

test('skill tree node hit areas are compatible with Pixi hit testing', () => {
  const screen = new SkillTree({
    app: createSkillTreeAppMock(),
    skillState: createStateStub(),
    onBack: () => {},
  });

  for (const node of screen.nodeViews.values()) {
    assert.equal(typeof node.hitArea.contains, 'function');
  }
});

test('skill tree camera caps compact layout zoom to avoid clipped next-node signals', () => {
  const screen = new SkillTree({
    app: createSkillTreeAppMock(),
    skillState: createStateStub({
      initialFrameIds: [
        'core',
        'fire_rate_1',
        'bullet_speed_1',
        'bullet_damage_1',
        'move_speed_1',
        'dash_unlock',
        'dash_cooldown_1',
        'fusion_firepower_mobility',
      ],
    }),
    onBack: () => {},
  });

  assert.equal(screen.world.scale.x <= 1.6, true);
});

test('skill tree core-only camera keeps the first socket ring legible', () => {
  const screen = new SkillTree({
    app: createSkillTreeAppMock(),
    skillState: createStateStub(),
    onBack: () => {},
  });

  assert.equal(screen.world.scale.x <= 2.6, true);
});

test('left click purchases and right click refunds cascade', () => {
  const screen = new SkillTree({
    app: createSkillTreeAppMock(),
    skillState: createStateStub(),
    onBack: () => {},
  });

  screen.handleNodePrimary('fire_rate_1');
  assert.equal(screen.skillState.has('fire_rate_1'), true);
  screen.handleNodeSecondary('fire_rate_1');
  assert.equal(screen.skillState.has('fire_rate_1'), false);
});

test('tooltip clamps inside 1280 by 720 and avoids hovered node center', () => {
  const screen = new SkillTree({
    app: createSkillTreeAppMock(),
    skillState: createStateStub(),
    onBack: () => {},
  });

  const rect = screen.computeTooltipPosition({ x: 1240, y: 700 }, { width: 260, height: 120 });
  assert.equal(rect.x <= 1012, true);
  assert.equal(rect.y <= 592, true);
  assert.equal(rect.x < 1240 - 20, true);
});
