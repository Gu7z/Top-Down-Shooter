import Menu from "./menu.js";
import sendScore from "./utils/send_score.js";
import {
  UISkin,
  createCard,
  createLabel,
  createPillButton,
  addCornerBrackets,
} from "./ui_system.js";

export default class Hud {
  constructor({ app, player }) {
    this.app    = app;
    this.player = player;
    this.hudContainer = new PIXI.Container();
    this.deathSound   = PIXI.sound.Sound.from("sound/death.mp3");
    this.dead = false;

    this.buildStatPanels();
    this.buildOverlayTexts();

    this.app.stage.addChild(this.hudContainer);
  }

  // ── Small chamfered stat panel ─────────────────────────────────
  makeStatPanel(cx, cy, w, h) {
    const c  = 5;
    const x0 = cx - w / 2, x1 = cx + w / 2;
    const y0 = cy - h / 2, y1 = cy + h / 2;

    const g = new PIXI.Graphics();
    g.beginFill(UISkin.palette.card, 0.88);
    g.lineStyle(1, UISkin.palette.accent, 0.5);
    g.moveTo(x0 + c, y0);
    g.lineTo(x1 - c, y0);
    g.lineTo(x1,     y0 + c);
    g.lineTo(x1,     y1 - c);
    g.lineTo(x1 - c, y1);
    g.lineTo(x0 + c, y1);
    g.lineTo(x0,     y1 - c);
    g.lineTo(x0,     y0 + c);
    g.closePath();
    g.endFill();

    this.hudContainer.addChild(g);
    addCornerBrackets(this.hudContainer, cx, cy, w, h, 8, UISkin.palette.accent, 0.55);
    return g;
  }

  // ── In-game stats (top-left / top-right) ─────────────────────
  buildStatPanels() {
    const pad = 16;
    const pW  = 194, pH = 48;

    // Points — top left
    const ptsX = pad + pW / 2;
    const ptsY = pad + pH / 2;
    this.makeStatPanel(ptsX, ptsY, pW, pH);
    this.textPoints = createLabel({
      container:    this.hudContainer,
      text:         `PTS  ${this.player.points}`,
      x:            ptsX,
      y:            ptsY,
      fontSize:     17,
      color:        UISkin.palette.accent,
      bold:         true,
      letterSpacing: 2,
    });

    // Lives — top right
    const hpX = this.app.screen.width - pad - pW / 2;
    const hpY = pad + pH / 2;
    this.makeStatPanel(hpX, hpY, pW, pH);
    this.textLifes = createLabel({
      container:    this.hudContainer,
      text:         `HP  ${this.player.lifes}`,
      x:            hpX,
      y:            hpY,
      fontSize:     17,
      color:        UISkin.palette.accentGreen,
      bold:         true,
      letterSpacing: 2,
    });
  }

  // ── Full-screen overlay text (pause / game-over) ───────────────
  buildOverlayTexts() {
    const cx = this.app.screen.width  / 2;
    const cy = this.app.screen.height / 2;

    this.textPaused = createLabel({
      container:    this.hudContainer,
      text:         "//  PAUSED  //",
      x:            cx,
      y:            cy - 40,
      fontSize:     58,
      color:        UISkin.palette.accentAlt,
      bold:         true,
      letterSpacing: 6,
      glow:         true,
    });
    this.textPaused.visible = false;

    this.pauseSettingsBtn = createPillButton({
      container: this.hudContainer,
      x:         cx,
      y:         cy + 50,
      text:      "⚙  CONFIGURAÇÕES",
      width:     280,
      height:    52,
      onClick:   () => {
        if (this._openSettings) this._openSettings();
      },
    });
    this.pauseSettingsBtn.bg.visible = false;
    this.pauseSettingsBtn.label.visible = false;

    this.pauseEndRunBtn = createPillButton({
      container: this.hudContainer,
      x:         cx,
      y:         cy + 116,
      text:      "■  ENCERRAR RUN",
      width:     280,
      height:    52,
      danger:    true,
      onClick:   () => {
        if (this._endRun) this._endRun();
      },
    });
    this.pauseEndRunBtn.bg.visible = false;
    this.pauseEndRunBtn.label.visible = false;

    this.textEnd = createLabel({
      container:    this.hudContainer,
      text:         "RUN  TERMINATED",
      x:            cx,
      y:            cy - 94,
      fontSize:     50,
      color:        UISkin.palette.danger,
      bold:         true,
      letterSpacing: 4,
      glow:         true,
    });
    this.textEnd.visible = false;
  }

  // ── Pause toggle ───────────────────────────────────────────────
  set openSettings(fn) {
    this._openSettings = fn;
  }

  set endRun(fn) {
    this._endRun = () => {
      fn();
      this.app.stage.removeChildren();
      this.app.start();
      new Menu({ app: this.app });
    };
  }

  set showPaused(val) {
    this.textPaused.visible = val;
    this.pauseSettingsBtn.bg.visible = val;
    this.pauseSettingsBtn.label.visible = val;
    this.pauseEndRunBtn.bg.visible = val;
    this.pauseEndRunBtn.label.visible = val;
    if (val) this.app.stage.addChild(this.hudContainer);
  }

  // ── Death check ───────────────────────────────────────────────
  endgameCheck(clear) {
    if (this.player.lifes < 1) {
      this.textEnd.visible = true;
      if (this.dead) return;

      this.dead = true;
      this.deathSound.play();
      this.renderGameOverMenu(clear);
      this.app.stop();
      sendScore({ name: this.player.username, points: this.player.points });
      return;
    }
    this.dead = false;
  }

  // ── Game-over modal ────────────────────────────────────────────
  renderGameOverMenu(clear) {
    const cx = this.app.screen.width  / 2;
    const cy = this.app.screen.height / 2;

    createCard({
      container: this.hudContainer,
      x: cx, y: cy + 18,
      width:  560,
      height: 272,
      alpha:  0.97,
    });

    // Reposition "RUN TERMINATED" over the card
    this.textEnd.position.set(cx, cy - 94);

    createLabel({
      container:    this.hudContainer,
      text:         `SCORE FINAL:  ${this.player.points}`,
      x:            cx,
      y:            cy - 18,
      fontSize:     30,
      color:        UISkin.palette.accentGreen,
      bold:         true,
      letterSpacing: 3,
      glow:         true,
    });

    createLabel({
      container:    this.hudContainer,
      text:         `OPERADOR: ${this.player.username}`,
      x:            cx,
      y:            cy + 24,
      fontSize:     17,
      color:        UISkin.palette.textSecondary,
      mono:         true,
      letterSpacing: 2,
    });

    createPillButton({
      container: this.hudContainer,
      x: cx, y: cy + 96,
      text:    "↩   MENU  PRINCIPAL",
      width:   320,
      height:  58,
      primary: true,
      onClick: () => {
        clear();
        this.app.stage.removeChildren();
        this.app.start();
        new Menu({ app: this.app });
      },
    });
  }

  // ── Tick ───────────────────────────────────────────────────────
  update(clear) {
    this.textPoints.text = `PTS  ${this.player.points}`;
    this.textLifes.text  = `HP   ${this.player.lifes}`;
    this.endgameCheck(clear);
  }
}
