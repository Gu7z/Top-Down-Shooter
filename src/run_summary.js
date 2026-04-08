import {
  UISkin,
  createBackdrop,
  createCard,
  createLabel,
  createPillButton,
  addScreenCorners,
} from "./ui_system.js";

export default class RunSummary {
  constructor({ app, username, summary, reason = "manual", onBackToMenu }) {
    this.app = app;
    this.username = username;
    this.summary = summary;
    this.reason = reason;
    this.onBackToMenu = onBackToMenu;
    this.container = new PIXI.Container();

    this.build();
    this.app.stage.addChild(this.container);
  }

  build() {
    const sw = this.app.screen.width;
    const sh = this.app.screen.height;
    const cx = sw / 2;
    const cy = sh / 2;

    const cardW = Math.min(sw - 40, 860);
    const cardH = Math.min(sh - 60, 590);
    const cardTop    = cy - cardH / 2;
    const cardBottom = cy + cardH / 2;
    const halfW      = cardW / 2;

    createBackdrop(this.container, this.app);
    addScreenCorners(this.container, this.app);

    createCard({
      container:   this.container,
      x:           cx,
      y:           cy,
      width:       cardW,
      height:      cardH,
      chamfer:     18,
      bracketSize: 26,
    });

    createLabel({
      container:     this.container,
      text:          this.reason === "victory" ? "EMINÊNCIA SUPERADA" : "SÚMULA DA RUN",
      x:             cx,
      y:             cardTop + 57,
      fontSize:      48,
      color:         UISkin.palette.accent,
      bold:          true,
      letterSpacing: 5,
      glow:          true,
    });

    createLabel({
      container:     this.container,
      text:          `OPERADOR: ${this.username}`,
      x:             cx,
      y:             cardTop + 105,
      fontSize:      15,
      color:         UISkin.palette.textSecondary,
      mono:          true,
      letterSpacing: 2,
    });

    this.buildStats(cx, cy, cardTop, cardBottom, halfW);
    this.buildHighlights(cx, cardBottom, halfW);

    createPillButton({
      container: this.container,
      x:         cx,
      y:         cardBottom - 44,
      text:      "<  MENU PRINCIPAL",
      width:     320,
      height:    56,
      primary:   true,
      onClick:   () => this.onBackToMenu?.(),
    });
  }

  buildStats(cx, cy, cardTop, cardBottom, halfW) {
    const { summary } = this;

    // Left column: anchor 0 (left-aligned), starts near left edge of card
    const leftX  = cx - halfW + 20;
    // Right column: anchor 1 (right-aligned), pinned to right edge of card.
    // Text grows leftward so it can never overflow the card.
    const rightX = cx + halfW - 20;

    const startY = cardTop + 173;
    const availableGap = (cardBottom - 220 - startY) / 6;
    const gap = Math.max(24, Math.min(34, availableGap));

    const rows = [
      [`SCORE FINAL: ${summary.score}`,                    UISkin.palette.accentGreen],
      [`CREDITOS GANHOS: ${summary.credits.total}`,        UISkin.palette.accent],
      [`PRECISAO: ${summary.accuracyPercent}%`,            UISkin.palette.textPrimary],
      [`TIROS: ${summary.shotsHit}/${summary.shotsFired}`, UISkin.palette.textPrimary],
      [`TEMPO: ${summary.timeSurvivedSeconds}s`,           UISkin.palette.textPrimary],
      [`BOSSES: ${summary.bossKills}`,                     UISkin.palette.textPrimary],
    ];

    rows.forEach(([text, color], index) => {
      createLabel({
        container:     this.container,
        text,
        x:             leftX,
        y:             startY + index * gap,
        fontSize:      index < 2 ? 20 : 17,
        color,
        bold:          index < 2,
        anchor:        0,
        mono:          index >= 2,
        letterSpacing: 1,
      });
    });

    createLabel({
      container:     this.container,
      text:          "ABATES POR INIMIGO",
      x:             rightX,
      y:             startY,
      fontSize:      18,
      color:         UISkin.palette.accentAlt,
      bold:          true,
      anchor:        1,
      letterSpacing: 2,
    });

    Object.entries(summary.killsByType).forEach(([type, count], index) => {
      createLabel({
        container:     this.container,
        text:          `${type.toUpperCase()}: ${count}`,
        x:             rightX,
        y:             startY + 36 + index * 28,
        fontSize:      15,
        color:         UISkin.palette.textPrimary,
        anchor:        1,
        mono:          true,
        letterSpacing: 1,
      });
    });
  }

  buildHighlights(cx, cardBottom, halfW) {
    const highlights = this.summary.highlights.length
      ? this.summary.highlights
      : ["RUN RECORDED"];

    const labelY = cardBottom - 205;
    const cardsY = cardBottom - 159;

    createLabel({
      container:     this.container,
      text:          "DESTAQUES",
      x:             cx,
      y:             labelY,
      fontSize:      18,
      color:         UISkin.palette.accentAlt,
      bold:          true,
      letterSpacing: 3,
    });

    const items      = highlights.slice(0, 4);
    const itemW      = Math.min(150, (halfW * 2 - 60) / items.length - 10);
    const spacing    = itemW + 10;
    const totalSpan  = spacing * items.length - 10;
    const startX     = cx - totalSpan / 2 + itemW / 2;

    items.forEach((highlight, index) => {
      const x = startX + index * spacing;
      createCard({
        container: this.container,
        x,
        y:         cardsY,
        width:     itemW,
        height:    44,
        alpha:     0.78,
        chamfer:   8,
        brackets:  false,
      });
      createLabel({
        container:     this.container,
        text:          highlight,
        x,
        y:             cardsY,
        fontSize:      12,
        color:         UISkin.palette.accentGreen,
        mono:          true,
        letterSpacing: 1,
      });
    });
  }

  destroy() {
    this.app.stage.removeChild(this.container);
  }
}
