import {
  UISkin,
  createBackdrop,
  createCard,
  createLabel,
  createPillButton,
  addScreenCorners,
} from "./ui_system.js";

export default class RunSummary {
  constructor({ app, username, summary, onBackToMenu }) {
    this.app = app;
    this.username = username;
    this.summary = summary;
    this.onBackToMenu = onBackToMenu;
    this.container = new PIXI.Container();

    this.build();
    this.app.stage.addChild(this.container);
  }

  build() {
    const cx = this.app.screen.width / 2;
    const cy = this.app.screen.height / 2;

    createBackdrop(this.container, this.app);
    addScreenCorners(this.container, this.app);

    createCard({
      container: this.container,
      x: cx,
      y: cy,
      width: 860,
      height: 590,
      chamfer: 18,
      bracketSize: 26,
    });

    createLabel({
      container: this.container,
      text: "RUN SUMMARY",
      x: cx,
      y: cy - 238,
      fontSize: 48,
      color: UISkin.palette.accent,
      bold: true,
      letterSpacing: 5,
      glow: true,
    });

    createLabel({
      container: this.container,
      text: `OPERADOR: ${this.username}`,
      x: cx,
      y: cy - 190,
      fontSize: 15,
      color: UISkin.palette.textSecondary,
      mono: true,
      letterSpacing: 2,
    });

    this.buildStats(cx, cy);
    this.buildHighlights(cx, cy);

    createPillButton({
      container: this.container,
      x: cx,
      y: cy + 238,
      text: "<  MENU PRINCIPAL",
      width: 320,
      height: 56,
      primary: true,
      onClick: () => this.onBackToMenu?.(),
    });
  }

  buildStats(cx, cy) {
    const { summary } = this;
    const leftX = cx - 250;
    const rightX = cx + 210;
    const startY = cy - 122;
    const gap = 34;

    const rows = [
      [`SCORE FINAL: ${summary.score}`, UISkin.palette.accentGreen],
      [`CREDITOS GANHOS: ${summary.credits.total}`, UISkin.palette.accent],
      [`PRECISAO: ${summary.accuracyPercent}%`, UISkin.palette.textPrimary],
      [`TIROS: ${summary.shotsHit}/${summary.shotsFired}`, UISkin.palette.textPrimary],
      [`TEMPO: ${summary.timeSurvivedSeconds}s`, UISkin.palette.textPrimary],
      [`BOSSES: ${summary.bossKills}`, UISkin.palette.textPrimary],
    ];

    rows.forEach(([text, color], index) => {
      createLabel({
        container: this.container,
        text,
        x: leftX,
        y: startY + index * gap,
        fontSize: index < 2 ? 20 : 17,
        color,
        bold: index < 2,
        anchor: 0,
        mono: index >= 2,
        letterSpacing: 1,
      });
    });

    createLabel({
      container: this.container,
      text: "KILLS POR TIPO",
      x: rightX,
      y: startY,
      fontSize: 18,
      color: UISkin.palette.accentAlt,
      bold: true,
      anchor: 0,
      letterSpacing: 2,
    });

    Object.entries(summary.killsByType).forEach(([type, count], index) => {
      createLabel({
        container: this.container,
        text: `${type.toUpperCase()}: ${count}`,
        x: rightX,
        y: startY + 36 + index * 28,
        fontSize: 15,
        color: UISkin.palette.textPrimary,
        anchor: 0,
        mono: true,
        letterSpacing: 1,
      });
    });
  }

  buildHighlights(cx, cy) {
    const highlights = this.summary.highlights.length
      ? this.summary.highlights
      : ["RUN RECORDED"];

    createLabel({
      container: this.container,
      text: "HIGHLIGHTS",
      x: cx,
      y: cy + 90,
      fontSize: 18,
      color: UISkin.palette.accentAlt,
      bold: true,
      letterSpacing: 3,
    });

    highlights.slice(0, 4).forEach((highlight, index) => {
      const x = cx - 255 + index * 170;
      createCard({
        container: this.container,
        x,
        y: cy + 136,
        width: 150,
        height: 44,
        alpha: 0.78,
        chamfer: 8,
        brackets: false,
      });
      createLabel({
        container: this.container,
        text: highlight,
        x,
        y: cy + 136,
        fontSize: 12,
        color: UISkin.palette.accentGreen,
        mono: true,
        letterSpacing: 1,
      });
    });
  }

  destroy() {
    this.app.stage.removeChild(this.container);
  }
}
