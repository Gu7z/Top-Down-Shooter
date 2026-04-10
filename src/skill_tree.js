import { UISkin } from "./ui_system.js";
import {
  createBackdrop,
  createLabel,
  createPillButton,
  addScreenCorners
} from "./ui_system.js";
import { SKILL_TREE, SKILL_BRANCHES, getSkillById } from "./progression/skill_tree_data.js";
import { createSkillTreeState } from "./progression/skill_tree_state.js";
import { deriveSkillEffects } from "./progression/skill_effects.js";

// Layout constants for 1280x720
const SCREEN_W = 1280;
const SCREEN_H = 720;
const TAB_Y = 90;
const TAB_HEIGHT = 36;
const CONTENT_Y = 140;
const CONTENT_H = 530;
const CONTENT_PAD_X = 40;
const CONTENT_W = SCREEN_W - CONTENT_PAD_X * 2;

const CARD_HEIGHT = 64;
const CARD_GAP = 8;
const CARD_PAD_X = 16;

// ── Branch icon drawing ─────────────────────────────────────────
function drawBranchIcon(g, cx, cy, color, iconId, size = 10) {
  const s = size;
  switch (iconId) {
    case "firepower": {
      g.lineStyle(2, color, 0.9);
      g.moveTo(cx, cy - s); g.lineTo(cx, cy + s);
      g.moveTo(cx - s, cy); g.lineTo(cx + s, cy);
      g.lineStyle(0);
      g.beginFill(color, 0.4);
      g.drawCircle(cx, cy, 3);
      g.endFill();
      break;
    }
    case "mobility": {
      g.lineStyle(0);
      g.beginFill(color, 0.9);
      g.moveTo(cx + 2, cy - s);
      g.lineTo(cx - 4, cy + 1);
      g.lineTo(cx + 1, cy + 1);
      g.lineTo(cx - 2, cy + s);
      g.lineTo(cx + 4, cy - 1);
      g.lineTo(cx - 1, cy - 1);
      g.closePath();
      g.endFill();
      break;
    }
    case "survival": {
      g.beginFill(color, 0.15);
      g.lineStyle(2, color, 0.9);
      g.moveTo(cx, cy - s);
      g.lineTo(cx + s, cy - s * 0.4);
      g.lineTo(cx + s * 0.7, cy + s * 0.5);
      g.lineTo(cx, cy + s);
      g.lineTo(cx - s * 0.7, cy + s * 0.5);
      g.lineTo(cx - s, cy - s * 0.4);
      g.closePath();
      g.endFill();
      break;
    }
    case "economy": {
      g.beginFill(color, 0.2);
      g.lineStyle(2, color, 0.9);
      g.moveTo(cx, cy - s);
      g.lineTo(cx + s, cy);
      g.lineTo(cx, cy + s);
      g.lineTo(cx - s, cy);
      g.closePath();
      g.endFill();
      break;
    }
    case "tech": {
      g.beginFill(color, 0.15);
      g.lineStyle(2, color, 0.9);
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const px = cx + s * Math.cos(angle);
        const py = cy + s * Math.sin(angle);
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.endFill();
      g.lineStyle(0);
      g.beginFill(color, 0.6);
      g.drawCircle(cx, cy, 3);
      g.endFill();
      break;
    }
    case "control": {
      g.lineStyle(0);
      g.beginFill(color, 0.12);
      g.drawCircle(cx, cy, s);
      g.endFill();
      g.lineStyle(1.5, color, 0.7);
      g.drawCircle(cx, cy, s);
      g.drawCircle(cx, cy, s * 0.55);
      g.lineStyle(0);
      g.beginFill(color, 0.9);
      g.drawCircle(cx, cy, 3);
      g.endFill();
      break;
    }
  }
}

function drawCheckmark(g, cx, cy, color) {
  g.lineStyle(2.5, color, 1);
  g.moveTo(cx - 5, cy);
  g.lineTo(cx - 1, cy + 4);
  g.lineTo(cx + 5, cy - 4);
}

function drawLock(g, cx, cy, color) {
  g.lineStyle(1.5, color, 0.5);
  g.beginFill(color, 0.15);
  g.drawRoundedRect(cx - 5, cy - 1, 10, 8, 2);
  g.endFill();
  g.lineStyle(1.5, color, 0.5);
  g.arc(cx, cy - 1, 4, Math.PI, 0);
}

export default class SkillTree {
  constructor({ app, skillState = createSkillTreeState(), onBack }) {
    this.app = app;
    this.skillState = skillState;
    this.onBack = onBack;
    this.selectedBranch = 0;

    this.container = new PIXI.Container();
    this.hudLayer = new PIXI.Container();
    this.tabsLayer = new PIXI.Container();
    this.contentLayer = new PIXI.Container();
    this.tooltipLayer = new PIXI.Container();

    this.scrollY = 0;
    this.onContextMenu = this.onContextMenu.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);

    this.build();
    this.app.stage.addChild(this.container);
  }

  build() {
    createBackdrop(this.container, this.app);
    addScreenCorners(this.container, this.app, 0.18);

    this.container.addChild(this.contentLayer);
    this.container.addChild(this.tabsLayer);
    this.container.addChild(this.hudLayer);
    this.container.addChild(this.tooltipLayer);

    this.app.renderer.view.addEventListener("contextmenu", this.onContextMenu);
    this.app.renderer.view.addEventListener("wheel", this.onWheel, { passive: false });
    globalThis.window?.addEventListener?.("keydown", this.onKeyDown);

    this.buildHud();
    this.buildTabs();
    this.renderContent();
  }

  onContextMenu(e) {
    if (this.container.children.length > 0) {
      e.preventDefault();
    }
  }

  onWheel(e) {
    if (!this.scrollContent || !Number.isFinite(this.contentTotalH) || !Number.isFinite(this.scrollBaseY)) {
      return;
    }

    const rect = this.app.renderer.view.getBoundingClientRect();
    if (!rect.height) return;
    const my = (e.clientY - rect.top) * (SCREEN_H / rect.height);

    if (my >= CONTENT_Y && my <= CONTENT_Y + CONTENT_H) {
      const maxScroll = Math.max(0, this.contentTotalH - CONTENT_H);
      this.scrollY = Math.max(-maxScroll, Math.min(0, this.scrollY - e.deltaY * 0.6));
      this.scrollContent.y = this.scrollBaseY + this.scrollY;
      e.preventDefault();
    }
  }

  goBack() {
    this.destroy();
    this.onBack?.();
  }

  onKeyDown(e) {
    if (e.key !== "Escape") return;
    e.preventDefault?.();
    this.goBack();
  }

  destroy() {
    this.app.renderer.view.removeEventListener("contextmenu", this.onContextMenu);
    this.app.renderer.view.removeEventListener("wheel", this.onWheel);
    globalThis.window?.removeEventListener?.("keydown", this.onKeyDown);
    this.app.stage.removeChild(this.container);
    this.container.destroy({ children: true });
  }

  buildHud() {
    this.hudLayer.removeChildren();

    createLabel({
      container: this.hudLayer,
      text: "ÁRVORE DE HABILIDADES",
      x: 32,
      y: 28,
      fontSize: 26,
      color: UISkin.palette.accent,
      bold: true,
      anchor: 0,
      letterSpacing: 3,
      glow: true,
    });

    createLabel({
      container: this.hudLayer,
      text: `CRÉDITOS: ${this.skillState.getCredits()}`,
      x: 34,
      y: 64,
      fontSize: 14,
      color: UISkin.palette.accentGreen,
      anchor: 0,
      mono: true,
      letterSpacing: 1,
    });

    createPillButton({
      container: this.hudLayer,
      x: SCREEN_W - 92,
      y: 42,
      text: "VOLTAR",
      width: 140,
      height: 42,
      onClick: () => this.goBack(),
    });
  }

  buildTabs() {
    this.tabsLayer.removeChildren();

    const totalTabW = CONTENT_W;
    const tabW = Math.floor(totalTabW / SKILL_BRANCHES.length);

    SKILL_BRANCHES.forEach((branch, index) => {
      const x = CONTENT_PAD_X + index * tabW;
      const isSelected = index === this.selectedBranch;
      const skills = SKILL_TREE.filter(s => s.branch === branch.id);
      const purchased = skills.filter(s => this.skillState.has(s.id)).length;

      // Tab background
      const tabBg = new PIXI.Graphics();
      tabBg.beginFill(isSelected ? branch.color : UISkin.palette.card, isSelected ? 0.2 : 0.6);
      tabBg.lineStyle(isSelected ? 2 : 1, branch.color, isSelected ? 0.8 : 0.2);
      tabBg.drawRoundedRect(x, TAB_Y, tabW - 4, TAB_HEIGHT, 4);
      tabBg.endFill();

      // Bottom accent for selected
      if (isSelected) {
        tabBg.lineStyle(3, branch.color, 0.9);
        tabBg.moveTo(x + 8, TAB_Y + TAB_HEIGHT);
        tabBg.lineTo(x + tabW - 12, TAB_Y + TAB_HEIGHT);
      }

      tabBg.interactive = true;
      tabBg.cursor = "pointer";
      tabBg.hitArea = new PIXI.Rectangle(x, TAB_Y, tabW - 4, TAB_HEIGHT);
      tabBg.on("pointerdown", () => {
        this.selectedBranch = index;
        this.scrollY = 0;
        this.buildTabs();
        this.renderContent();
      });

      this.tabsLayer.addChild(tabBg);

      // Icon
      const iconG = new PIXI.Graphics();
      drawBranchIcon(iconG, x + 20, TAB_Y + TAB_HEIGHT / 2, branch.color, branch.icon, 7);
      this.tabsLayer.addChild(iconG);

      // Label
      createLabel({
        container: this.tabsLayer,
        text: branch.label.toUpperCase(),
        x: x + 38,
        y: TAB_Y + TAB_HEIGHT / 2 - 1,
        fontSize: 11,
        color: isSelected ? branch.color : UISkin.palette.textSecondary,
        bold: isSelected,
        anchor: { x: 0, y: 0.5 },
        letterSpacing: 1,
      });

      // Progress count
      createLabel({
        container: this.tabsLayer,
        text: `${purchased}/${skills.length}`,
        x: x + tabW - 18,
        y: TAB_Y + TAB_HEIGHT / 2 - 1,
        fontSize: 10,
        color: purchased >= skills.length ? branch.color : UISkin.palette.textSecondary,
        mono: true,
        anchor: { x: 1, y: 0.5 },
        letterSpacing: 0,
      });
    });
  }

  renderContent() {
    this.contentLayer.removeChildren();
    this.hideTooltip();

    const branch = SKILL_BRANCHES[this.selectedBranch];
    const skills = SKILL_TREE.filter(s => s.branch === branch.id);
    const currentEffects = deriveSkillEffects(this.skillState.getPurchasedIds());

    // Scroll container
    this.scrollContent = new PIXI.Container();
    this.scrollBaseY = CONTENT_Y;
    this.contentTotalH = 12 + skills.length * (CARD_HEIGHT + CARD_GAP) + 20;

    // Build skill cards
    skills.forEach((skill, index) => {
      const cardY = 12 + index * (CARD_HEIGHT + CARD_GAP);
      this.buildSkillCard(this.scrollContent, skill, branch, cardY, index, currentEffects);
    });

    this.scrollContent.x = 0;
    this.scrollContent.y = this.scrollBaseY + this.scrollY;

    // Mask
    const mask = new PIXI.Graphics();
    mask.beginFill(0xffffff);
    mask.drawRect(0, CONTENT_Y, SCREEN_W, CONTENT_H);
    mask.endFill();
    this.contentLayer.addChild(mask);
    this.scrollContent.mask = mask;

    this.contentLayer.addChild(this.scrollContent);

    // Instruction hint at the bottom
    createLabel({
      container: this.contentLayer,
      text: "BOTÃO ESQUERDO: COMPRAR  //  BOTÃO DIREITO: REEMBOLSAR",
      x: SCREEN_W / 2,
      y: CONTENT_Y + CONTENT_H + 16,
      fontSize: 11,
      color: UISkin.palette.textSecondary,
      mono: true,
      letterSpacing: 1,
    });
  }

  buildSkillCard(container, skill, branch, localY, index, currentEffects) {
    const status = this.getNodeStatus(skill.id);
    const isPurchased = status === "purchased";
    const isAvailable = status === "available";
    const isLocked = status === "locked";

    const x0 = CONTENT_PAD_X;
    const cardW = CONTENT_W;
    const cy = localY + CARD_HEIGHT / 2;

    // The entire card is one interactive container
    const card = new PIXI.Container();

    // ── Background ──
    const bg = new PIXI.Graphics();

    const drawCard = (hover) => {
      bg.clear();

      let fillColor, fillAlpha, borderColor, borderAlpha;
      if (isPurchased) {
        fillColor = branch.color;
        fillAlpha = hover ? 0.18 : 0.1;
        borderColor = branch.color;
        borderAlpha = hover ? 0.6 : 0.35;
      } else if (isAvailable) {
        fillColor = 0xffffff;
        fillAlpha = hover ? 0.1 : 0.04;
        borderColor = 0xffffff;
        borderAlpha = hover ? 0.4 : 0.15;
      } else {
        fillColor = UISkin.palette.card;
        fillAlpha = hover ? 0.5 : 0.35;
        borderColor = UISkin.palette.disabled;
        borderAlpha = hover ? 0.25 : 0.12;
      }

      bg.beginFill(fillColor, fillAlpha);
      bg.lineStyle(1, borderColor, borderAlpha);
      bg.drawRoundedRect(x0, localY, cardW, CARD_HEIGHT, 5);
      bg.endFill();

      // Left accent bar for purchased
      if (isPurchased) {
        bg.lineStyle(0);
        bg.beginFill(branch.color, 0.8);
        bg.drawRoundedRect(x0, localY + 8, 3, CARD_HEIGHT - 16, 2);
        bg.endFill();
      }
    };

    drawCard(false);
    card.addChild(bg);

    // ── Tier number ──
    const tierNum = index + 1;
    createLabel({
      container: card,
      text: `T${tierNum}`,
      x: x0 + 22,
      y: cy,
      fontSize: 11,
      color: isPurchased ? branch.color : UISkin.palette.textSecondary,
      mono: true,
      letterSpacing: 0,
    });

    // ── Status indicator ──
    const statusG = new PIXI.Graphics();
    const indicatorX = x0 + 52;

    if (isPurchased) {
      drawCheckmark(statusG, indicatorX, cy, branch.color);
    } else if (isAvailable) {
      statusG.beginFill(0xffffff, 0.8);
      statusG.drawCircle(indicatorX, cy, 4);
      statusG.endFill();
      statusG.lineStyle(1, 0xffffff, 0.3);
      statusG.drawCircle(indicatorX, cy, 7);
    } else {
      drawLock(statusG, indicatorX, cy - 2, UISkin.palette.textSecondary);
    }
    card.addChild(statusG);

    // ── Skill name ──
    createLabel({
      container: card,
      text: skill.name,
      x: x0 + 76,
      y: cy - 10,
      fontSize: 14,
      anchor: { x: 0, y: 0.5 },
      color: isPurchased ? 0xffffff : isAvailable ? 0xdddddd : 0x667788,
      bold: isPurchased,
      letterSpacing: 1,
    });

    // ── Description (full, no truncation) ──
    createLabel({
      container: card,
      text: skill.description,
      x: x0 + 76,
      y: cy + 10,
      fontSize: 11,
      anchor: { x: 0, y: 0.5 },
      color: isPurchased ? branch.color : isAvailable ? UISkin.palette.textSecondary : 0x445566,
      mono: true,
      letterSpacing: 0,
    });

    // ── Effects summary: "current → new" format ──
    const effectEntries = Object.entries(skill.effects);
    if (effectEntries.length > 0) {
      const parts = [];
      for (const [k, v] of effectEntries) {
        if (typeof v === "boolean") {
          parts.push(isPurchased ? k : `${k}: ON`);
        } else {
          const cur = currentEffects[k];
          let newVal;
          if (k.endsWith("Multiplier")) {
            newVal = parseFloat(((cur ?? 1) * v).toFixed(3));
          } else {
            newVal = parseFloat(((cur ?? 0) + v).toFixed(3));
          }
          const curDisplay = parseFloat((cur ?? 0).toFixed(3));
          if (isPurchased) {
            parts.push(`${k}: ${curDisplay}`);
          } else {
            parts.push(`${k}: ${curDisplay} > ${newVal}`);
          }
        }
      }
      const effectStr = parts.join("  |  ");

      createLabel({
        container: card,
        text: effectStr,
        x: x0 + cardW / 2 + 60,
        y: cy + 10,
        fontSize: 10,
        anchor: { x: 0, y: 0.5 },
        color: isPurchased ? branch.color : isAvailable ? UISkin.palette.accent : 0x445566,
        mono: true,
        letterSpacing: 0,
      });
    }

    // ── Cost / Status badge (right side) ──
    const costX = x0 + cardW - CARD_PAD_X;

    if (isPurchased) {
      // "OWNED" badge
      const badgeBg = new PIXI.Graphics();
      badgeBg.beginFill(UISkin.palette.accentGreen, 0.15);
      badgeBg.lineStyle(1, UISkin.palette.accentGreen, 0.4);
      badgeBg.drawRoundedRect(costX - 86, cy - 12, 76, 24, 4);
      badgeBg.endFill();
      card.addChild(badgeBg);

      const checkG = new PIXI.Graphics();
      drawCheckmark(checkG, costX - 68, cy, UISkin.palette.accentGreen);
      card.addChild(checkG);

      createLabel({
        container: card,
        text: "ATIVO",
        x: costX - 36,
        y: cy,
        fontSize: 10,
        color: UISkin.palette.accentGreen,
        bold: true,
        mono: true,
        letterSpacing: 1,
      });
    } else {
      const cost = this.skillState.getCost(skill);
      const credits = this.skillState.getCredits();
      const canAfford = credits >= cost;
      const costColor = isAvailable
        ? (canAfford ? UISkin.palette.accentGreen : UISkin.palette.danger)
        : 0x556677;

      // Cost box
      const costBg = new PIXI.Graphics();
      costBg.beginFill(0x000000, 0.2);
      costBg.lineStyle(1, costColor, 0.3);
      costBg.drawRoundedRect(costX - 60, cy - 12, 50, 24, 4);
      costBg.endFill();
      card.addChild(costBg);

      createLabel({
        container: card,
        text: cost.toString(),
        x: costX - 35,
        y: cy,
        fontSize: 13,
        color: costColor,
        mono: true,
        bold: true,
        letterSpacing: 0,
      });
    }

    // ── Make the CARD CONTAINER interactive (not individual children) ──
    card.interactive = true;
    card.interactiveChildren = false; // prevent children from eating events
    card.hitArea = new PIXI.Rectangle(x0, localY, cardW, CARD_HEIGHT);
    card.cursor = isAvailable || isPurchased ? "pointer" : "default";

    card.on("pointerover", () => {
      drawCard(true);
    });

    card.on("pointerout", () => {
      drawCard(false);
      this.hideTooltip();
    });

    card.on("pointerdown", (e) => {
      const isRightClick = e.data?.button === 2;
      if (isRightClick) {
        this.handleNodeSecondary(skill.id);
      } else {
        this.handleNodePrimary(skill.id);
      }
    });

    container.addChild(card);
  }

  getNodeStatus(skillId) {
    if (this.skillState.has(skillId)) return "purchased";
    const result = this.skillState.canPurchase(skillId);
    if (result.ok || result.reason === "not_enough_credits") return "available";
    return "locked";
  }

  handleNodePrimary(skillId) {
    if (this.skillState.has(skillId)) return;

    const result = this.skillState.purchaseCascade(skillId);
    if (result.ok) {
      this.flashFeedback(UISkin.palette.accentGreen);
      this.buildHud();
      this.buildTabs();
      this.renderContent();
    }
  }

  handleNodeSecondary(skillId) {
    const status = this.getNodeStatus(skillId);
    if (status === "purchased") {
      const result = this.skillState.refundCascade(skillId);
      if (result.ok) {
        this.flashFeedback(UISkin.palette.danger);
        this.buildHud();
        this.buildTabs();
        this.renderContent();
      }
    }
  }

  flashFeedback(color) {
    const flash = new PIXI.Graphics();
    flash.beginFill(color, 0.08);
    flash.drawRect(0, 0, SCREEN_W, SCREEN_H);
    flash.endFill();
    this.container.addChild(flash);

    let alpha = 0.08;
    const raf = typeof requestAnimationFrame === "function" ? requestAnimationFrame : (fn) => setTimeout(fn, 16);
    const fade = () => {
      alpha -= 0.015;
      if (alpha <= 0) {
        this.container.removeChild(flash);
        flash.destroy();
        return;
      }
      flash.alpha = alpha / 0.08;
      raf(fade);
    };
    raf(fade);
  }

  showTooltip(skill, basePos, status) {
    // Not needed in new layout — all info visible on card
  }

  hideTooltip() {
    this.tooltipLayer.removeChildren();
  }
}
