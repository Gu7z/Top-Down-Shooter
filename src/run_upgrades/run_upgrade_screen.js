import { createLabel, addScreenCorners, addCornerBrackets, UISkin } from '../ui_system.js';

const CARD_W = 260;
const CARD_H = 380;
const CHAMFER = 14;

export class RunUpgradeScreen {
  constructor(app) {
    this.app = app;
    this.container = null;
    this._animTicker = null;
  }

  show(upgradeState, onComplete) {
    const cards = upgradeState.getCardsToShow();
    this._build(cards, (chosenIndex) => {
      this._animateOut(() => {
        this._destroy();
        onComplete(chosenIndex);
      });
    });
  }

  _build(cards, onSelect) {
    const { width: W, height: H } = this.app.screen;
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);

    const backdrop = new PIXI.Graphics();
    backdrop.beginFill(UISkin.palette.void, 0.92);
    backdrop.drawRect(0, 0, W, H);
    backdrop.endFill();
    backdrop.alpha = 0;
    this.container.addChild(backdrop);

    const grid = new PIXI.Graphics();
    const step = 64;
    grid.lineStyle(1, UISkin.palette.grid, 0.04);
    for (let x = step; x < W; x += step) { grid.moveTo(x, 0); grid.lineTo(x, H); }
    for (let y = step; y < H; y += step) { grid.moveTo(0, y); grid.lineTo(W, y); }
    this.container.addChild(grid);

    addScreenCorners(this.container, this.app, 0.35);

    const header = createLabel({
      container: this.container,
      text: 'ESCOLHA SEU UPGRADE',
      x: W / 2, y: H * 0.13,
      fontSize: 26, color: UISkin.palette.accent,
      glow: true, bold: true, letterSpacing: 7,
    });
    header.alpha = 0;

    const accentBar = new PIXI.Graphics();
    accentBar.lineStyle(1.5, UISkin.palette.accent, 0.7);
    accentBar.moveTo(W / 2 - 170, H * 0.13 + 22);
    accentBar.lineTo(W / 2 + 170, H * 0.13 + 22);
    accentBar.alpha = 0;
    this.container.addChild(accentBar);

    const gap = 56;
    const totalW = cards.length * CARD_W + (cards.length - 1) * gap;
    const startX = (W - totalW) / 2 + CARD_W / 2;
    const cardY = H / 2 + 15;

    const cardContainers = cards.map((cardData, i) => {
      const cx = startX + i * (CARD_W + gap);
      const c = this._buildCard(cardData, cx, cardY, () => onSelect(cardData.index));
      return { container: c, finalY: cardY };
    });

    this._animateIn(backdrop, header, accentBar, cardContainers);
  }

  _buildCard(cardData, cx, cy, onSelectFn) {
    const { upgrade, level } = cardData;
    const c = new PIXI.Container();
    c.position.set(cx, cy - 36);
    c.alpha = 0;
    this.container.addChild(c);

    const bg = new PIXI.Graphics();
    this._drawCardBg(bg, upgrade.color, false);
    c.addChild(bg);

    const topLine = new PIXI.Graphics();
    topLine.lineStyle(2, upgrade.color, 0.9);
    topLine.moveTo(-CARD_W / 2 + 24, -CARD_H / 2 + 1);
    topLine.lineTo(CARD_W / 2 - 24, -CARD_H / 2 + 1);
    c.addChild(topLine);

    addCornerBrackets(c, 0, 0, CARD_W, CARD_H, 14, upgrade.color, 0.95);

    const iconY = -CARD_H / 2 + 20 + 48;
    this._buildIcon(c, upgrade, 0, iconY);

    const nameY = iconY + 56;
    createLabel({
      container: c,
      text: upgrade.name.toUpperCase(),
      x: 0, y: nameY,
      fontSize: 14, color: upgrade.color,
      glow: true, bold: true, letterSpacing: 3,
    });

    const pipY = nameY + 22;
    const pipCount = 6;
    const pipSpacing = 26;
    const pipStartX = -((pipCount - 1) * pipSpacing) / 2;
    for (let p = 0; p < pipCount; p++) {
      const pip = new PIXI.Graphics();
      const filled = p < level;
      pip.beginFill(filled ? upgrade.color : UISkin.palette.disabled, filled ? 1 : 0.7);
      if (!filled) pip.lineStyle(1, upgrade.color, 0.4);
      pip.drawCircle(pipStartX + p * pipSpacing, pipY, 4.5);
      pip.endFill();
      c.addChild(pip);
    }

    const tierData = level < 6 ? upgrade.tiers[level] : upgrade.tiers[5];
    const descLabel = new PIXI.Text(tierData.description, {
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      fill: UISkin.palette.textSecondary,
      fontSize: 10,
      wordWrap: true,
      wordWrapWidth: CARD_W - 36,
      align: 'center',
      letterSpacing: 0.3,
      lineHeight: 15,
    });
    descLabel.anchor.set(0.5, 0);
    descLabel.position.set(0, pipY + 14);
    c.addChild(descLabel);

    bg.interactive = true;
    bg.cursor = 'pointer';
    bg.on('pointerover', () => {
      c.scale.set(1.03);
      this._drawCardBg(bg, upgrade.color, true);
    });
    bg.on('pointerout', () => {
      c.scale.set(1.0);
      this._drawCardBg(bg, upgrade.color, false);
    });
    bg.on('pointerdown', () => {
      this._flashCard(c, upgrade.color, onSelectFn);
    });

    return c;
  }

  _drawCardBg(g, color, hover) {
    g.clear();
    g.beginFill(UISkin.palette.card, 0.97);
    g.lineStyle(hover ? 2.5 : 1.5, color, hover ? 1.0 : 0.75);
    this._chamferedPath(g, 0, 0, CARD_W, CARD_H, CHAMFER);
    g.endFill();
    if (hover) {
      g.lineStyle(8, color, 0.07);
      this._chamferedPath(g, 0, 0, CARD_W + 12, CARD_H + 12, CHAMFER + 4);
    }
  }

  _chamferedPath(g, cx, cy, w, h, c) {
    const x0 = cx - w / 2, x1 = cx + w / 2;
    const y0 = cy - h / 2, y1 = cy + h / 2;
    g.moveTo(x0 + c, y0);
    g.lineTo(x1 - c, y0); g.lineTo(x1, y0 + c);
    g.lineTo(x1, y1 - c); g.lineTo(x1 - c, y1);
    g.lineTo(x0 + c, y1); g.lineTo(x0, y1 - c);
    g.lineTo(x0, y0 + c);
    g.closePath();
  }

  _buildIcon(container, upgrade, cx, cy) {
    const g = new PIXI.Graphics();
    g.position.set(cx, cy);
    g.beginFill(0x0A0A18, 0.9);
    g.lineStyle(1, upgrade.color, 0.25);
    g.drawRoundedRect(-50, -44, 100, 88, 6);
    g.endFill();
    switch (upgrade.id) {
      case 'chain_lightning': this._iconLightning(g, upgrade.color); break;
      case 'viral_core':      this._iconViral(g, upgrade.color);     break;
      case 'retaliation_pulse': this._iconPulse(g, upgrade.color);   break;
    }
    container.addChild(g);
  }

  _iconLightning(g, color) {
    g.lineStyle(3.5, color, 1);
    const pts = [[-6, -30], [6, -6], [-2, 0], [8, 30]];
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.lineStyle(1.5, color, 0.5);
    g.arc(-22, 8, 14, -0.8, 0.8);
    g.lineStyle(1, color, 0.35);
    g.arc(24, -10, 10, Math.PI + 0.5, Math.PI * 2 - 0.5);
  }

  _iconViral(g, color) {
    g.lineStyle(2.5, color, 1);
    g.drawCircle(0, 0, 10);
    g.lineStyle(1.5, color, 0.6);
    g.drawCircle(0, 0, 22);
    g.lineStyle(1, color, 0.3);
    g.drawCircle(0, 0, 36);
    g.lineStyle(0);
    g.beginFill(color, 0.7);
    [[0, -26], [18, 18], [-20, 14]].forEach(([px, py]) => g.drawCircle(px, py, 3));
    g.endFill();
  }

  _iconPulse(g, color) {
    g.lineStyle(3, color, 1);
    g.drawCircle(0, 0, 18);
    const angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    angles.forEach(a => {
      g.lineStyle(2.5, color, 0.8);
      g.moveTo(Math.cos(a) * 22, Math.sin(a) * 22);
      g.lineTo(Math.cos(a) * 36, Math.sin(a) * 36);
      g.lineStyle(1, color, 0.35);
      g.moveTo(Math.cos(a + 0.35) * 26, Math.sin(a + 0.35) * 26);
      g.lineTo(Math.cos(a + 0.35) * 36, Math.sin(a + 0.35) * 36);
    });
  }

  _flashCard(cardContainer, color, onDone) {
    let frame = 0;
    const ticker = () => {
      frame++;
      if (frame < 6) {
        cardContainer.scale.set(1 + frame * 0.012);
      } else if (frame < 12) {
        cardContainer.scale.set(1.07 - (frame - 6) * 0.01);
      }
      if (frame >= 12) {
        this.app.ticker.remove(ticker);
        onDone();
      }
    };
    this.app.ticker.add(ticker);

    const { x: cx, y: cy } = cardContainer.position;
    for (let i = 0; i < 20; i++) {
      const p = new PIXI.Graphics();
      p.beginFill(color, 1);
      p.drawCircle(0, 0, Math.random() * 3 + 1);
      p.endFill();
      p.position.set(cx, cy);
      this.container.addChild(p);
      const angle = (Math.PI * 2 * i) / 20 + Math.random() * 0.4;
      const speed = Math.random() * 4 + 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      let life = 25;
      const ptick = () => {
        if (p.destroyed) { this.app.ticker.remove(ptick); return; }
        p.position.x += vx;
        p.position.y += vy;
        life--;
        p.alpha = Math.max(0, life / 25);
        if (life <= 0) { this.app.ticker.remove(ptick); p.destroy(); }
      };
      this.app.ticker.add(ptick);
    }
  }

  _animateIn(backdrop, header, accentBar, cardContainers) {
    let frame = 0;
    const total = 34;
    const ticker = () => {
      frame++;
      if (frame <= 14) {
        backdrop.alpha = (frame / 14) * 0.92;
        header.alpha = frame / 14;
        accentBar.alpha = frame / 14;
      }
      if (cardContainers[0] && frame >= 10) {
        const t = Math.min(1, (frame - 10) / 20);
        const ease = 1 - Math.pow(1 - t, 3);
        cardContainers[0].container.alpha = ease;
        cardContainers[0].container.y = cardContainers[0].finalY - 36 + 36 * ease;
      }
      if (cardContainers[1] && frame >= 14) {
        const t = Math.min(1, (frame - 14) / 20);
        const ease = 1 - Math.pow(1 - t, 3);
        cardContainers[1].container.alpha = ease;
        cardContainers[1].container.y = cardContainers[1].finalY - 36 + 36 * ease;
      }
      if (frame >= total) {
        this.app.ticker.remove(ticker);
        this._animTicker = null;
      }
    };
    this._animTicker = ticker;
    this.app.ticker.add(ticker);
  }

  _animateOut(onDone) {
    let frame = 0;
    const ticker = () => {
      frame++;
      this.container.alpha = Math.max(0, 1 - frame / 12);
      if (frame >= 12) {
        this.app.ticker.remove(ticker);
        onDone();
      }
    };
    this.app.ticker.add(ticker);
  }

  _destroy() {
    if (this._animTicker) {
      this.app.ticker.remove(this._animTicker);
      this._animTicker = null;
    }
    this.container?.destroy({ children: true });
    this.container = null;
  }
}
