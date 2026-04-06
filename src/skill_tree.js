import {
  UISkin,
  createBackdrop,
  createCard,
  createLabel,
  createPillButton,
  addScreenCorners,
} from "./ui_system.js";
import { SKILL_TREE, SKILL_BRANCHES, getSkillById } from "./progression/skill_tree_data.js";
import { createSkillTreeState } from "./progression/skill_tree_state.js";

const NODE_RADIUS = {
  core: 18,
  base: 16,
  branchHub: 22,
  fusion: 27,
  capstone: 32,
};

const branchById = new Map(SKILL_BRANCHES.map((branch) => [branch.id, branch]));
const EMPTY_CORE_RING_RADII = [48, 86, 126];
const WORLD_RING_RADII = [126, 225, 380, 470];
const MIN_CAMERA_SCALE = 0.72;
const MAX_SINGLE_NODE_SCALE = 2.6;
const MAX_CAMERA_SCALE = 4.2;
const MAX_MULTI_NODE_SCALE = 1.6;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function eventPoint(event, fallback) {
  if (Number.isFinite(event?.clientX) && Number.isFinite(event?.clientY)) {
    return { x: event.clientX, y: event.clientY };
  }
  return event?.data?.global || event?.global || fallback;
}

function createCircularHitArea(radius) {
  const hitRadius = radius * 1.7;
  if (PIXI.Circle) return new PIXI.Circle(0, 0, hitRadius);

  return {
    contains(x, y) {
      return Math.hypot(x, y) <= hitRadius;
    },
  };
}

export default class SkillTree {
  constructor({ app, skillState = createSkillTreeState(), onBack }) {
    this.app = app;
    this.skillState = skillState;
    this.onBack = onBack;
    this.container = new PIXI.Container();
    this.world = new PIXI.Container();
    this.atmosphereLayer = new PIXI.Container();
    this.panSurface = new PIXI.Graphics();
    this.worldAtmosphereLayer = new PIXI.Container();
    this.branchVeilLayer = new PIXI.Container();
    this.connectionGlowLayer = new PIXI.Container();
    this.connectionLayer = new PIXI.Container();
    this.nodeAuraLayer = new PIXI.Container();
    this.nodeLayer = new PIXI.Container();
    this.tooltipLayer = new PIXI.Container();
    this.hudLayer = new PIXI.Container();
    this.nodeViews = new Map();
    this.corePulse = null;
    this.isPanning = false;
    this.lastPanPoint = null;
    this.visualTime = 0;

    this.onPanStart = this.onPanStart.bind(this);
    this.onPanMove = this.onPanMove.bind(this);
    this.onPanEnd = this.onPanEnd.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);
    this.visualTick = this.visualTick.bind(this);

    this.build();
    this.app.stage.addChild(this.container);
    this.app.ticker.add?.(this.visualTick);
  }

  build() {
    createBackdrop(this.container, this.app);
    this.container.addChild(this.atmosphereLayer);
    this.drawAtmosphere();
    this.buildPanSurface();
    addScreenCorners(this.container, this.app, 0.18);

    this.container.addChild(this.panSurface);
    this.world.addChild(this.worldAtmosphereLayer);
    this.world.addChild(this.branchVeilLayer);
    this.world.addChild(this.connectionGlowLayer);
    this.world.addChild(this.connectionLayer);
    this.world.addChild(this.nodeAuraLayer);
    this.world.addChild(this.nodeLayer);
    this.configureGlowBlendModes();
    this.container.addChild(this.world);
    this.container.addChild(this.tooltipLayer);
    this.container.addChild(this.hudLayer);

    this.buildHud();
    this.renderWorld();
    this.frameInitialPurchasedNodes();
    this.bindCameraControls();
  }

  buildHud() {
    this.hudLayer.removeChildren();
    createLabel({
      container: this.hudLayer,
      text: "SKILL TREE",
      x: 28,
      y: 24,
      fontSize: 24,
      color: UISkin.palette.accent,
      bold: true,
      anchor: 0,
      letterSpacing: 3,
      glow: true,
    });
    createLabel({
      container: this.hudLayer,
      text: `CREDITOS: ${this.skillState.getCredits()}`,
      x: 30,
      y: 62,
      fontSize: 14,
      color: UISkin.palette.accentGreen,
      anchor: 0,
      mono: true,
      letterSpacing: 1,
    });
    createLabel({
      container: this.hudLayer,
      text: "PAN/ZOOM  //  HOVER INFO  //  LEFT BUY  //  RIGHT REFUND",
      x: this.app.screen.width / 2,
      y: 34,
      fontSize: 11,
      color: UISkin.palette.textSecondary,
      mono: true,
      letterSpacing: 1,
    });
    createPillButton({
      container: this.hudLayer,
      x: this.app.screen.width - 92,
      y: 42,
      text: "VOLTAR",
      width: 140,
      height: 42,
      onClick: () => {
        this.destroy();
        this.onBack?.();
      },
    });
  }

  renderWorld() {
    this.connectionLayer.removeChildren();
    this.connectionGlowLayer.removeChildren();
    this.worldAtmosphereLayer.removeChildren();
    this.branchVeilLayer.removeChildren();
    this.nodeAuraLayer.removeChildren();
    this.nodeLayer.removeChildren();
    this.nodeViews.clear();

    const visibleIds = new Set(this.skillState.getVisibleSkillIds());
    this.drawWorldAtmosphere(visibleIds);
    this.drawBranchVeil(visibleIds);
    this.drawConnections(visibleIds);

    for (const skill of SKILL_TREE) {
      if (visibleIds.has(skill.id)) this.drawNode(skill);
    }
  }

  drawAtmosphere() {
    this.atmosphereLayer.removeChildren();
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    const nebula = new PIXI.Graphics();
    nebula.beginFill(0x00ffff, 0.030);
    nebula.drawEllipse(width * 0.52, height * 0.48, width * 0.48, height * 0.30);
    nebula.endFill();
    nebula.beginFill(0x9b5cff, 0.028);
    nebula.drawEllipse(width * 0.68, height * 0.34, width * 0.34, height * 0.18);
    nebula.endFill();
    nebula.beginFill(0x00ff88, 0.026);
    nebula.drawEllipse(width * 0.40, height * 0.68, width * 0.26, height * 0.16);
    nebula.endFill();
    this.atmosphereLayer.addChild(nebula);

    const stars = new PIXI.Graphics();
    for (let index = 0; index < 110; index++) {
      const x = (index * 173 + 41) % width;
      const y = (index * 97 + 83) % height;
      const radius = index % 13 === 0 ? 1.4 : index % 5 === 0 ? 1 : 0.65;
      const color = index % 7 === 0 ? 0xff00ff : index % 5 === 0 ? 0x00ff88 : 0x00ffff;
      const alpha = index % 11 === 0 ? 0.36 : 0.14;
      stars.beginFill(color, alpha);
      stars.drawCircle(x, y, radius);
      stars.endFill();
    }
    this.atmosphereLayer.addChild(stars);
  }

  buildPanSurface() {
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    this.panSurface.clear();
    this.panSurface.beginFill(0x000000, 0.001);
    this.panSurface.drawRect(0, 0, width, height);
    this.panSurface.endFill();
    this.panSurface.hitArea = PIXI.Rectangle ? new PIXI.Rectangle(0, 0, width, height) : { x: 0, y: 0, width, height };
    this.panSurface.interactive = true;
    this.panSurface.eventMode = "static";
    this.panSurface.cursor = "grab";
  }

  configureGlowBlendModes() {
    const additive = PIXI.BLEND_MODES?.ADD ?? "add";
    this.atmosphereLayer.blendMode = additive;
    this.worldAtmosphereLayer.blendMode = additive;
    this.connectionGlowLayer.blendMode = additive;
    this.nodeAuraLayer.blendMode = additive;
  }

  drawWorldAtmosphere(visibleIds) {
    const dust = new PIXI.Graphics();
    const halo = new PIXI.Graphics();
    const corePulse = new PIXI.Graphics();
    const visibleSkills = SKILL_TREE.filter((skill) => visibleIds.has(skill.id));
    this.corePulse = corePulse;

    corePulse.lineStyle(2.2, UISkin.palette.accentGreen, 0.78);
    corePulse.drawCircle(0, 0, 88);
    corePulse.lineStyle(1.4, UISkin.palette.accent, 0.56);
    corePulse.drawCircle(0, 0, 58);
    corePulse.lineStyle(0.9, UISkin.palette.accentAlt, 0.40);
    corePulse.drawCircle(0, 0, 126);

    for (const skill of visibleSkills) {
      const status = this.getSkillStatus(skill.id);
      const color = this.getNodeColor(skill, status);
      const density = skill.type === "core" ? 28 : status === "purchased" ? 18 : 10;
      const spread = skill.type === "core" ? 78 : status === "purchased" ? 58 : 36;
      const baseAlpha = skill.type === "core" ? 0.18 : status === "purchased" ? 0.14 : 0.07;

      halo.beginFill(color, skill.type === "core" ? 0.065 : 0.028);
      halo.drawCircle(skill.position.x, skill.position.y, skill.type === "core" ? 112 : 44);
      halo.endFill();

      for (let index = 0; index < density; index++) {
        const angle = index * 2.399 + skill.position.x * 0.0017 + skill.position.y * 0.0023;
        const radius = 14 + ((index * 37) % spread);
        const x = skill.position.x + Math.cos(angle) * radius;
        const y = skill.position.y + Math.sin(angle) * radius;
        const particleRadius = index % 9 === 0 ? 1.8 : index % 4 === 0 ? 1.2 : 0.72;
        const alpha = baseAlpha * (index % 5 === 0 ? 1.45 : 1);
        dust.beginFill(color, alpha);
        dust.drawCircle(x, y, particleRadius);
        dust.endFill();
      }
    }

    this.worldAtmosphereLayer.addChild(halo);
    this.worldAtmosphereLayer.addChild(dust);
    this.worldAtmosphereLayer.addChild(corePulse);
  }

  drawBranchVeil(visibleIds) {
    const veil = new PIXI.Graphics();
    const purchased = new Set(this.skillState.getPurchasedIds());
    const onlyCorePurchased = purchased.size <= 1;

    for (const radius of onlyCorePurchased ? EMPTY_CORE_RING_RADII : WORLD_RING_RADII) {
      veil.lineStyle(radius < 170 ? 1.1 : 1, UISkin.palette.accent, radius < 170 ? 0.10 : 0.035);
      veil.drawCircle(0, 0, radius);
    }

    for (const branch of SKILL_BRANCHES) {
      const radians = (branch.angle * Math.PI) / 180;
      const endRadius = onlyCorePurchased ? 126 : 430;
      const startRadius = onlyCorePurchased ? 40 : 70;
      const hasVisibleBranchSkill = SKILL_TREE.some(
        (skill) => visibleIds.has(skill.id) && skill.branchIds?.includes(branch.id)
      );
      const alpha = hasVisibleBranchSkill ? 0.10 : 0.035;

      veil.lineStyle(hasVisibleBranchSkill ? 10 : 5, branch.color, hasVisibleBranchSkill ? 0.026 : 0.014);
      veil.moveTo(Math.cos(radians) * startRadius, Math.sin(radians) * startRadius);
      veil.lineTo(Math.cos(radians) * endRadius, Math.sin(radians) * endRadius);
      veil.lineStyle(1.2, branch.color, alpha);
      veil.moveTo(Math.cos(radians) * startRadius, Math.sin(radians) * startRadius);
      veil.lineTo(Math.cos(radians) * endRadius, Math.sin(radians) * endRadius);
    }

    this.branchVeilLayer.addChild(veil);
  }

  drawConnections(visibleIds) {
    const lines = new PIXI.Graphics();
    const glow = new PIXI.Graphics();
    const onlyCorePurchased = this.skillState.getPurchasedIds().length <= 1;
    for (const skill of SKILL_TREE) {
      if (!visibleIds.has(skill.id)) continue;
      for (const prereqId of skill.prereqs) {
        if (!visibleIds.has(prereqId)) continue;
        if (onlyCorePurchased && !this.skillState.has(skill.id)) continue;
        const prereq = getSkillById(prereqId);
        const purchasedPath = this.skillState.has(skill.id) && this.skillState.has(prereqId);
        const color = this.getConnectionColor(skill);
        const alpha = purchasedPath ? 0.72 : 0.18;
        glow.lineStyle(purchasedPath ? 12 : 6, color, purchasedPath ? 0.18 : 0.07);
        this.drawConnectionPath(glow, prereq.position, skill.position);
        lines.lineStyle(purchasedPath ? 2.7 : 1.35, color, alpha);
        this.drawConnectionPath(lines, prereq.position, skill.position);

        if (purchasedPath) {
          for (const t of [0.35, 0.68]) {
            const x = prereq.position.x + (skill.position.x - prereq.position.x) * t;
            const y = prereq.position.y + (skill.position.y - prereq.position.y) * t;
            glow.beginFill(color, 0.46);
            glow.drawCircle(x, y, 2.8);
            glow.endFill();
          }
        }
      }
    }
    this.connectionGlowLayer.addChild(glow);
    this.connectionLayer.addChild(lines);
  }

  drawConnectionPath(graphics, from, to) {
    graphics.moveTo(from.x, from.y);

    if (typeof graphics.quadraticCurveTo !== "function") {
      graphics.lineTo(to.x, to.y);
      return;
    }

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy);
    const curve = clamp(distance * 0.10, 16, 58);
    const normalX = distance ? -dy / distance : 0;
    const normalY = distance ? dx / distance : 0;
    const midX = (from.x + to.x) / 2 + normalX * curve;
    const midY = (from.y + to.y) / 2 + normalY * curve;

    graphics.quadraticCurveTo(midX, midY, to.x, to.y);
  }

  drawNode(skill) {
    const status = this.getSkillStatus(skill.id);
    const node = new PIXI.Graphics();
    const radius = this.getNodeRadius(skill);
    const color = this.getNodeColor(skill, status);

    node.position.set(skill.position.x, skill.position.y);
    node.interactive = true;
    node.eventMode = "static";
    node.cursor = "pointer";
    node.skillId = skill.id;
    node.visualStyle = this.getNodeVisualStyle(skill, status, radius);
    node.hitArea = createCircularHitArea(radius);

    this.drawNodeAura(skill, status, radius, color);

    if (skill.type === "core") this.drawCoreNode(node, radius, color);
    else this.drawNodeBody(node, skill.type, status, radius, color);

    node.on("pointerover", (event) => {
      node.scale?.set?.(1.14);
      this.showTooltip(skill.id, eventPoint(event, this.toScreen(skill.position)));
    });
    node.on("pointerout", () => {
      node.scale?.set?.(1);
      this.hideTooltip();
    });
    node.on("pointerdown", (event) => {
      const original = event?.data?.originalEvent || event?.originalEvent || event;
      if (original?.button === 2) this.handleNodeSecondary(skill.id);
      else this.handleNodePrimary(skill.id);
    });

    this.nodeViews.set(skill.id, node);
    this.nodeLayer.addChild(node);
  }

  getNodeRadius(skill) {
    if (skill.type === "base" && skill.prereqs?.includes("core")) return NODE_RADIUS.branchHub;
    return NODE_RADIUS[skill.type] || NODE_RADIUS.base;
  }

  getNodeVisualStyle(skill, status, radius) {
    const shapeByType = {
      core: "core-socket",
      base: "socket-ring",
      fusion: "fusion-diamond",
      capstone: "capstone-diamond",
    };

    return {
      role: skill.type,
      shape: shapeByType[skill.type] || "socket-ring",
      radius,
      status,
      branchIds: skill.branchIds || [],
    };
  }

  drawNodeAura(skill, status, radius, color) {
    const aura = new PIXI.Graphics();
    aura.position.set(skill.position.x, skill.position.y);

    if (skill.type === "core") {
      aura.beginFill(color, 0.24);
      aura.drawCircle(0, 0, radius * 2.9);
      aura.endFill();
      aura.lineStyle(1.5, color, 0.42);
      aura.drawCircle(0, 0, radius * 2.2);
      aura.lineStyle(1, UISkin.palette.accent, 0.32);
      aura.drawCircle(0, 0, radius * 3.0);
      aura.lineStyle(0.9, UISkin.palette.accentAlt, 0.28);
      aura.drawCircle(0, 0, radius * 4.0);
    } else if (status === "purchased") {
      aura.beginFill(color, 0.20);
      aura.drawCircle(0, 0, radius * 3.6);
      aura.endFill();
      aura.lineStyle(1.2, color, 0.44);
      aura.drawCircle(0, 0, radius * 2.2);
      aura.lineStyle(0.8, 0xffffff, 0.16);
      aura.drawCircle(0, 0, radius * 1.45);
    } else if (status === "available") {
      aura.beginFill(color, 0.08);
      aura.drawCircle(0, 0, radius * 2.6);
      aura.endFill();
      aura.lineStyle(1, color, 0.52);
      aura.drawCircle(0, 0, radius * 1.85);
      aura.lineStyle(0.8, color, 0.22);
      aura.drawCircle(0, 0, radius * 3.0);
    } else {
      aura.lineStyle(0.8, color, 0.12);
      aura.drawCircle(0, 0, radius * 1.7);
    }

    this.nodeAuraLayer.addChild(aura);
  }

  drawNodeBody(node, type, status, radius, color) {
    if (type === "fusion" || type === "capstone") {
      this.drawDiamondNode(node, type, status, radius, color);
      return;
    }

    this.drawSocketNode(node, status, radius, color);
  }

  drawCoreNode(node, radius, color) {
    node.lineStyle(5, color, 0.92);
    node.beginFill(0x020617, 0.96);
    node.drawCircle(0, 0, radius * 2.2);
    node.endFill();
    node.lineStyle(1.4, UISkin.palette.accent, 0.62);
    node.drawCircle(0, 0, radius * 1.58);
    node.lineStyle(1, UISkin.palette.accentAlt, 0.38);
    node.drawCircle(0, 0, radius * 2.95);

    for (let index = 0; index < 12; index++) {
      const angle = index * (Math.PI / 6);
      const inner = radius * 1.85;
      const outer = radius * (index % 3 === 0 ? 3.45 : 2.9);
      const colorIndex = index % 3;
      const rayColor = colorIndex === 0 ? UISkin.palette.accent : colorIndex === 1 ? UISkin.palette.accentAlt : color;
      node.lineStyle(1, rayColor, 0.34);
      node.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      node.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    }

    node.beginFill(color, 0.92);
    node.drawCircle(0, 0, radius * 1.34);
    node.endFill();
    node.beginFill(0xffffff, 0.28);
    node.drawCircle(0, 0, radius * 0.42);
    node.endFill();
  }

  drawSocketNode(node, status, radius, color) {
    const strokeAlpha = status === "locked" ? 0.36 : 0.96;
    const innerAlpha = status === "purchased" ? 0.94 : status === "available" ? 0.72 : 0.22;
    const shellAlpha = status === "locked" ? 0.52 : 0.95;
    const strokeWidth = status === "available" ? 5 : 4;

    node.lineStyle(strokeWidth, color, strokeAlpha);
    node.beginFill(0x050814, shellAlpha);
    node.drawCircle(0, 0, radius);
    node.endFill();

    node.lineStyle(1.2, 0xffffff, status === "locked" ? 0.08 : 0.22);
    node.drawCircle(0, 0, radius * 0.64);

    node.beginFill(color, innerAlpha);
    node.drawCircle(0, 0, radius * 0.48);
    node.endFill();

    node.beginFill(0xffffff, status === "purchased" ? 0.32 : status === "available" ? 0.18 : 0.05);
    node.drawCircle(-radius * 0.14, -radius * 0.16, Math.max(2, radius * 0.14));
    node.endFill();

    if (status !== "locked") {
      node.lineStyle(1.8, 0x020617, status === "purchased" ? 0.62 : 0.46);
      node.moveTo(-radius * 0.20, 0);
      node.lineTo(radius * 0.20, 0);
      node.moveTo(0, -radius * 0.20);
      node.lineTo(0, radius * 0.20);
    }
  }

  drawDiamondNode(node, type, status, radius, color) {
    const isCapstone = type === "capstone";
    const fillColor = isCapstone ? 0x211805 : 0x070912;
    const lineAlpha = status === "locked" ? 0.42 : 0.98;
    const fillAlpha = status === "locked" ? 0.46 : 0.96;
    const lineWidth = isCapstone ? 5 : status === "available" ? 5 : 4;

    node.lineStyle(lineWidth, color, lineAlpha);
    node.beginFill(fillColor, fillAlpha);
    this.drawNodeShape(node, type, radius);
    node.endFill();

    node.lineStyle(1.2, 0xffffff, status === "locked" ? 0.08 : 0.22);
    this.drawNodeShape(node, type, radius * 0.62);

    if (!isCapstone) {
      node.beginFill(color, status === "purchased" ? 0.54 : status === "available" ? 0.32 : 0.10);
      this.drawNodeShape(node, type, radius * 0.24);
      node.endFill();
      return;
    }

    node.lineStyle(1.4, UISkin.palette.textPrimary, status === "locked" ? 0.12 : 0.32);
    this.drawNodeShape(node, type, radius * 0.34);
  }

  drawNodeShape(node, type, radius) {
    if (type === "fusion" || type === "capstone") {
      node.moveTo(0, -radius);
      node.lineTo(radius, 0);
      node.lineTo(0, radius);
      node.lineTo(-radius, 0);
      node.closePath();
      return;
    }

    node.drawCircle(0, 0, radius);
  }

  getNodeColor(skill, status) {
    if (skill.type === "capstone") return 0xfff275;
    if (skill.type === "fusion") return UISkin.palette.accentAlt;
    if (skill.type === "core") return UISkin.palette.accentGreen;
    if (status === "locked") return UISkin.palette.textSecondary;
    return this.getBranchColor(skill);
  }

  getConnectionColor(skill) {
    if (skill.type === "fusion") return UISkin.palette.accentAlt;
    if (skill.type === "capstone") return 0xfff275;
    return this.getBranchColor(skill);
  }

  getBranchColor(skill) {
    const branchId = skill.branchIds?.[0] || skill.branch;
    return branchById.get(branchId)?.color || UISkin.palette.accent;
  }

  getSkillStatus(skillId) {
    if (this.skillState.has(skillId)) return "purchased";
    if (this.skillState.canPurchase(skillId).ok) return "available";
    return "locked";
  }

  handleNodePrimary(skillId) {
    const result = this.skillState.purchase(skillId);
    if (result.ok) {
      this.hideTooltip();
      this.renderWorld();
      this.buildHud();
    }
    return result;
  }

  handleNodeSecondary(skillId) {
    const result = this.skillState.refundCascade(skillId);
    if (result.ok) {
      this.hideTooltip();
      this.renderWorld();
      this.buildHud();
    }
    return result;
  }

  showTooltip(skillId, anchor) {
    this.tooltipLayer.removeChildren();
    const skill = getSkillById(skillId);
    if (!skill) return;

    const lines = [
      skill.name,
      `${skill.type.toUpperCase()}  //  COST ${skill.cost}`,
      skill.description,
      `REQ: ${skill.prereqs.length ? skill.prereqs.join(", ") : "NONE"}`,
      `STATUS: ${this.getSkillStatus(skillId).toUpperCase()}`,
    ];
    const width = 280;
    const height = 120 + Math.max(0, lines.length - 4) * 18;
    const pos = this.computeTooltipPosition(anchor, { width, height });

    createCard({
      container: this.tooltipLayer,
      x: pos.x + width / 2,
      y: pos.y + height / 2,
      width,
      height,
      alpha: 0.96,
      chamfer: 10,
      bracketSize: 12,
    });

    lines.forEach((line, index) => {
      createLabel({
        container: this.tooltipLayer,
        text: line,
        x: pos.x + 16,
        y: pos.y + 18 + index * 21,
        fontSize: index === 0 ? 15 : 11,
        color: index === 0 ? UISkin.palette.accent : UISkin.palette.textPrimary,
        bold: index === 0,
        anchor: 0,
        mono: index !== 0,
        letterSpacing: 1,
      });
    });
  }

  hideTooltip() {
    this.tooltipLayer.removeChildren();
  }

  computeTooltipPosition(anchor, size) {
    const margin = 12;
    const gap = 20;
    let x = anchor.x + gap;
    let y = anchor.y + gap;

    if (x + size.width + margin > this.app.screen.width) x = anchor.x - size.width - gap;
    if (y + size.height + margin > this.app.screen.height) y = anchor.y - size.height - gap;

    x = clamp(x, margin, this.app.screen.width - size.width - margin);
    y = clamp(y, margin, this.app.screen.height - size.height - margin);

    return { x, y };
  }

  frameInitialPurchasedNodes() {
    this.fitSkillIds(this.skillState.getInitialFrameIds(), 180);
  }

  fitSkillIds(skillIds, padding = 180) {
    const skills = skillIds.map(getSkillById).filter(Boolean);
    if (!skills.length) return;

    const minX = Math.min(...skills.map((skill) => skill.position.x));
    const maxX = Math.max(...skills.map((skill) => skill.position.x));
    const minY = Math.min(...skills.map((skill) => skill.position.y));
    const maxY = Math.max(...skills.map((skill) => skill.position.y));
    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);
    const maxScale = skills.length === 1 ? MAX_SINGLE_NODE_SCALE : MAX_MULTI_NODE_SCALE;
    const scale = clamp(
      Math.min(
        (this.app.screen.width - padding * 2) / width,
        (this.app.screen.height - padding * 2) / height
      ),
      MIN_CAMERA_SCALE,
      maxScale
    );
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    this.world.scale.set(scale);
    this.world.position.set(
      this.app.screen.width / 2 - centerX * scale,
      this.app.screen.height / 2 - centerY * scale
    );
  }

  bindCameraControls() {
    this.panSurface.on("pointerdown", this.onPanStart);
    this.panSurface.on("pointermove", this.onPanMove);
    this.panSurface.on("pointerup", this.onPanEnd);
    this.panSurface.on("pointerupoutside", this.onPanEnd);
    this.app.renderer.view.addEventListener?.("pointerdown", this.onPanStart);
    this.app.renderer.view.addEventListener?.("pointermove", this.onPanMove);
    this.app.renderer.view.addEventListener?.("pointerup", this.onPanEnd);
    this.app.renderer.view.addEventListener?.("pointerleave", this.onPanEnd);
    this.app.renderer.view.addEventListener?.("wheel", this.onWheel, { passive: false });
    this.app.renderer.view.addEventListener?.("contextmenu", this.onContextMenu);
  }

  onPanStart(event) {
    const original = event?.data?.originalEvent || event?.originalEvent || event;
    if (Number.isFinite(original?.button) && original.button !== 0) return;
    this.isPanning = true;
    this.lastPanPoint = eventPoint(event, { x: 0, y: 0 });
    this.panSurface.cursor = "grabbing";
  }

  onPanMove(event) {
    if (!this.isPanning) return;
    const original = event?.data?.originalEvent || event?.originalEvent || event;
    if (Number.isFinite(original?.buttons) && original.buttons === 0) {
      this.onPanEnd();
      return;
    }
    const point = eventPoint(event, this.lastPanPoint);
    const dx = point.x - this.lastPanPoint.x;
    const dy = point.y - this.lastPanPoint.y;
    this.world.position.set(this.world.position.x + dx, this.world.position.y + dy);
    this.lastPanPoint = point;
  }

  onPanEnd() {
    this.isPanning = false;
    this.lastPanPoint = null;
    this.panSurface.cursor = "grab";
  }

  visualTick(delta = 1) {
    this.visualTime += delta;
    const slowPulse = (Math.sin(this.visualTime * 0.055) + 1) / 2;
    const fastPulse = (Math.sin(this.visualTime * 0.105) + 1) / 2;
    this.atmosphereLayer.alpha = 0.86 + slowPulse * 0.10;
    this.branchVeilLayer.alpha = 0.72 + slowPulse * 0.22;
    this.worldAtmosphereLayer.alpha = 0.78 + slowPulse * 0.18;
    this.connectionGlowLayer.alpha = 0.78 + fastPulse * 0.20;
    this.nodeAuraLayer.alpha = 0.88 + fastPulse * 0.12;
    if (this.corePulse) {
      this.corePulse.alpha = 0.36 + fastPulse * 0.42;
      this.corePulse.scale?.set?.(0.88 + slowPulse * 0.42);
    }
  }

  onWheel(event) {
    event.preventDefault?.();
    const rect = this.app.renderer.view.getBoundingClientRect?.() || { left: 0, top: 0 };
    const screenPoint = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    const oldScale = this.world.scale.x;
    const nextScale = clamp(oldScale * (event.deltaY > 0 ? 0.9 : 1.1), MIN_CAMERA_SCALE, MAX_CAMERA_SCALE);
    const worldPoint = {
      x: (screenPoint.x - this.world.position.x) / oldScale,
      y: (screenPoint.y - this.world.position.y) / oldScale,
    };

    this.world.scale.set(nextScale);
    this.world.position.set(
      screenPoint.x - worldPoint.x * nextScale,
      screenPoint.y - worldPoint.y * nextScale
    );
  }

  onContextMenu(event) {
    event.preventDefault?.();
  }

  toScreen(position) {
    return {
      x: this.world.position.x + position.x * this.world.scale.x,
      y: this.world.position.y + position.y * this.world.scale.y,
    };
  }

  destroy() {
    this.app.renderer.view.removeEventListener?.("pointerdown", this.onPanStart);
    this.app.renderer.view.removeEventListener?.("pointermove", this.onPanMove);
    this.app.renderer.view.removeEventListener?.("pointerup", this.onPanEnd);
    this.app.renderer.view.removeEventListener?.("pointerleave", this.onPanEnd);
    this.app.renderer.view.removeEventListener?.("wheel", this.onWheel);
    this.app.renderer.view.removeEventListener?.("contextmenu", this.onContextMenu);
    this.app.ticker.remove?.(this.visualTick);
    this.app.stage.removeChild(this.container);
  }
}
