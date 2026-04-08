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

    const killListTop    = startY + 36;
    const killListBottom = cardBottom - 230;
    const visibleH       = killListBottom - killListTop;
    const itemH          = 28;
    const entries        = Object.entries(summary.killsByType);

    const killScroll = new PIXI.Container();
    killScroll.position.set(0, killListTop);
    entries.forEach(([type, count], index) => {
      createLabel({
        container:     killScroll,
        text:          `${type.toUpperCase()}: ${count}`,
        x:             rightX,
        y:             index * itemH,
        fontSize:      15,
        color:         UISkin.palette.textPrimary,
        anchor:        1,
        mono:          true,
        letterSpacing: 1,
      });
    });

    const killMask = new PIXI.Graphics();
    killMask.beginFill(0xffffff, 1);
    killMask.drawRect(cx, killListTop, halfW + 20, visibleH);
    killMask.endFill();
    this.container.addChild(killMask);
    this.container.addChild(killScroll);
    killScroll.mask = killMask;

    const totalH = entries.length * itemH;
    if (totalH > visibleH) {
      const scrollbarX  = rightX + 8;
      const trackW      = 2;
      const thumbW      = 4;
      const thumbH      = Math.max(16, Math.round(visibleH * (visibleH / totalH)));
      const thumbTravel = visibleH - thumbH;

      // Track
      const track = new PIXI.Graphics();
      track.beginFill(UISkin.palette.textSecondary, 0.2);
      track.drawRect(scrollbarX, killListTop, trackW, visibleH);
      track.endFill();
      this.container.addChild(track);

      // Thumb
      const thumb = new PIXI.Graphics();
      thumb.beginFill(UISkin.palette.accent, 0.7);
      thumb.drawRect(scrollbarX - 1, killListTop, thumbW, thumbH);
      thumb.endFill();
      this.container.addChild(thumb);

      // Bottom fade — signals more content below
      const fade = new PIXI.Graphics();
      const fadeH = 32;
      fade.beginFill(UISkin.palette.void ?? 0x070314, 0.85);
      fade.drawRect(cx, killListBottom - fadeH, halfW + 12, fadeH);
      fade.endFill();
      this.container.addChild(fade);

      const updateThumb = () => {
        const scrolled = killListTop - killScroll.y; // 0 → (totalH - visibleH)
        const ratio    = scrolled / (totalH - visibleH);
        thumb.y        = Math.round(ratio * thumbTravel);
        // Hide fade when scrolled to bottom
        fade.alpha = ratio >= 0.98 ? 0 : 1;
      };

      this._wheelHandler = (e) => {
        const minY = killListTop - (totalH - visibleH);
        killScroll.y = Math.max(minY, Math.min(killListTop, killScroll.y - e.deltaY * 0.4));
        updateThumb();
      };
      this.app.view.addEventListener('wheel', this._wheelHandler);
    }
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
    if (this._wheelHandler) {
      this.app.view.removeEventListener('wheel', this._wheelHandler);
      this._wheelHandler = null;
    }
    this.app.stage.removeChild(this.container);
  }
}
