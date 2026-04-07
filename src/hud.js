import Menu from "./menu.js";
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

    // Points — top left (panel kept)
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

    // Boss bar + banner — always created
    const cx = this.app.screen.width / 2;
    const cy = this.app.screen.height / 2;
    this.buildBossBar(cx);
    this.buildBanner(cx, cy);

    // HP — top right, icon + value only (no panel)
    const iconR = 8;
    const iconX = this.app.screen.width - pad - iconR;
    const hpY   = pad + iconR + 4;
    this._drawStatIcon(iconX, hpY, iconR, UISkin.palette.accentGreen, "heart");
    this.textLifes = createLabel({
      container:    this.hudContainer,
      text:         `${this.player.lifes}`,
      x:            iconX - iconR - 6,
      y:            hpY,
      fontSize:     18,
      color:        UISkin.palette.accentGreen,
      bold:         true,
      letterSpacing: 1,
      anchor:       { x: 1, y: 0.5 },
    });

    // SLD — below HP, icon + value only (only if player has shield capacity)
    if (this.player.skillEffects?.maxShield > 0) {
      const sldY = hpY + iconR * 2 + 10;
      this._drawStatIcon(iconX, sldY, iconR, UISkin.palette.accent, "hex");
      this.textShield = createLabel({
        container:    this.hudContainer,
        text:         `${this.player.shield || 0}`,
        x:            iconX - iconR - 6,
        y:            sldY,
        fontSize:     18,
        color:        UISkin.palette.accent,
        bold:         true,
        letterSpacing: 1,
        anchor:       { x: 1, y: 0.5 },
      });
      this._shieldIconX = iconX;
      this._shieldIconY = sldY;
      this.shieldRegenArc = new PIXI.Graphics();
      this.hudContainer.addChild(this.shieldRegenArc);
    }
  }

  // ── Small icon shapes for stat display ────────────────────────
  _drawStatIcon(x, y, r, color, shape) {
    const g = new PIXI.Graphics();
    if (shape === "heart") {
      const s = r * 1.05;
      g.beginFill(color, 0.9);
      g.moveTo(x, y + s);
      // right lower → right bump
      g.bezierCurveTo(x + s * 0.5, y + s * 0.5, x + s * 1.2, y + s * 0.1, x + s, y - s * 0.3);
      // right bump → center indent
      g.bezierCurveTo(x + s * 0.8, y - s * 0.8, x + s * 0.2, y - s * 0.95, x, y - s * 0.5);
      // center indent → left bump
      g.bezierCurveTo(x - s * 0.2, y - s * 0.95, x - s * 0.8, y - s * 0.8, x - s, y - s * 0.3);
      // left bump → bottom tip
      g.bezierCurveTo(x - s * 1.2, y + s * 0.1, x - s * 0.5, y + s * 0.5, x, y + s);
      g.endFill();
    } else if (shape === "hex") {
      g.beginFill(color, 0.9);
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        pts.push(x + r * Math.cos(a), y + r * Math.sin(a));
      }
      g.drawPolygon(pts);
      g.endFill();
      g.lineStyle(1, color, 0.3);
      const pts2 = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        pts2.push(x + (r + 2) * Math.cos(a), y + (r + 2) * Math.sin(a));
      }
      g.drawPolygon(pts2);
    }
    this.hudContainer.addChild(g);
    return g;
  }

  // ── Full-screen overlay text (pause / game-over) ───────────────
  buildOverlayTexts() {
    const cx = this.app.screen.width  / 2;
    const cy = this.app.screen.height / 2;

    this.textPaused = createLabel({
      container:    this.hudContainer,
      text:         "//  PAUSADO  //",
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

    this.pauseControlsBtn = createPillButton({
      container: this.hudContainer,
      x:         cx,
      y:         cy + 116,
      text:      "⌨  CONTROLES",
      width:     280,
      height:    52,
      onClick:   () => {
        if (this._openControls) this._openControls();
      },
    });
    this.pauseControlsBtn.bg.visible = false;
    this.pauseControlsBtn.label.visible = false;

    this.pauseEndRunBtn = createPillButton({
      container: this.hudContainer,
      x:         cx,
      y:         cy + 182,
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
      text:         "SISTEMA DESCONECTADO",
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

  set openControls(fn) {
    this._openControls = fn;
  }

  set endRun(fn) {
    this._endRun = () => {
      fn();
      if (!this._onRunEnded) {
        this.app.stage.removeChildren();
        this.app.start();
        new Menu({ app: this.app });
      }
    };
  }

  set onRunEnded(fn) {
    this._onRunEnded = fn;
  }

  set showPaused(val) {
    this.textPaused.visible = val;
    this.pauseSettingsBtn.bg.visible = val;
    this.pauseSettingsBtn.label.visible = val;
    this.pauseControlsBtn.bg.visible = val;
    this.pauseControlsBtn.label.visible = val;
    this.pauseEndRunBtn.bg.visible = val;
    this.pauseEndRunBtn.label.visible = val;
    if (val) this.app.stage.addChild(this.hudContainer);
  }

  // ── Death check ───────────────────────────────────────────────
  buildBossBar(cx) {
    this.bossBarContainer = new PIXI.Container();
    this.bossBarContainer.visible = false;

    // Background
    this.bossBarBg = new PIXI.Graphics();
    this.bossBarBg.beginFill(0x000000, 0.4);
    this.bossBarBg.lineStyle(1, 0x444444, 1);
    this.bossBarBg.drawRect(cx - 300, 20, 600, 16);
    this.bossBarBg.endFill();
    this.bossBarContainer.addChild(this.bossBarBg);

    // Fill
    this.bossBarFill = new PIXI.Graphics();
    this.bossBarContainer.addChild(this.bossBarFill);

    // Text name
    this.bossNameObj = createLabel({
      container: this.bossBarContainer,
      text: "BOSS",
      x: cx,
      y: 10,
      fontSize: 12,
      color: 0xffffff,
      bold: true,
      letterSpacing: 2,
    });

    this.hudContainer.addChild(this.bossBarContainer);
  }

  updateBossBar(bossRef, hp, maxHp, color, name) {
    if (!bossRef) {
      this.bossBarContainer.visible = false;
      return;
    }

    this.bossBarContainer.visible = true;
    this.bossNameObj.text = name;

    const ratio = Math.max(0, hp / maxHp);
    const cx = this.app.screen.width / 2;

    this.bossBarFill.clear();
    this.bossBarFill.beginFill(color, 0.9);
    this.bossBarFill.drawRect(cx - 298, 22, (600 - 4) * ratio, 12);
    this.bossBarFill.endFill();
  }

  buildBanner(cx, cy) {
    this.bannerText = createLabel({
      container: this.hudContainer,
      text: "W A V E   1",
      x: cx,
      y: cy - 100,
      fontSize: 42,
      color: 0xffffff,
      bold: true,
      glow: true,
    });
    this.bannerText.alpha = 0;
    this.bannerState = "IDLE";
    this.bannerTimer = 0;
    this.bannerPersist = false;
  }

  showBanner(text, persist = false) {
    this.bannerText.text = text;
    if (this.bannerText.haloWrapper) this.bannerText.haloWrapper.text = text;
    this.bannerPersist = persist;
    this.bannerState = "IN";
    this.bannerAlpha = 0;
  }

  updateBanner() {
    if (this.bannerState === "IDLE") return;

    if (this.bannerState === "IN") {
      this.bannerAlpha += 0.05;
      if (this.bannerAlpha >= 1) {
        this.bannerAlpha = 1;
        if (!this.bannerPersist) {
           this.bannerState = "HOLD";
           this.bannerTimer = 60; // 1s
        }
      }
    } else if (this.bannerState === "HOLD") {
      this.bannerTimer -= 1;
      if (this.bannerTimer <= 0) {
        this.bannerState = "OUT";
      }
    } else if (this.bannerState === "OUT") {
      this.bannerAlpha -= 0.03;
      if (this.bannerAlpha <= 0) {
        this.bannerAlpha = 0;
        this.bannerState = "IDLE";
      }
    }

    this.bannerText.alpha = this.bannerAlpha;
    if (this.bannerText.haloWrapper) this.bannerText.haloWrapper.alpha = this.bannerAlpha * 0.16;
  }

  endgameCheck(clear) {
    if (this.player.lifes < 1) {
      this.textEnd.visible = true;
      if (this.dead) return;

      this.dead = true;
      this.deathSound.play();
      this.app.stop();
      if (this._onRunEnded) {
        this._onRunEnded({ reason: "death" });
        return;
      }

      this.renderGameOverMenu(clear);
      return;
    }
    this.dead = false;
  }

  // ── Game-over modal ────────────────────────────────────────────
  renderGameOverMenu(clear) {
    this.app.stage.addChild(this.hudContainer);
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

  // ── Shield regen arc ──────────────────────────────────────────
  _updateShieldRegenArc() {
    if (!this.shieldRegenArc) return;
    const g = this.shieldRegenArc;
    g.clear();

    const p = this.player;
    const maxShield = p.skillEffects?.maxShield || 0;
    if (maxShield <= 0 || p.shieldRegenCooldown <= 0) return;

    const arcR = 14;
    const start = -Math.PI / 2;
    const cx = this._shieldIconX;
    const cy = this._shieldIconY;

    // Faint background ring — moveTo prevents stray connector line
    g.lineStyle(1.5, UISkin.palette.accent, 0.15);
    g.moveTo(cx + arcR, cy);
    g.arc(cx, cy, arcR, 0, Math.PI * 2);

    if (p.shield < maxShield && p.shieldRegenTimer > 0) {
      const progress = 1 - p.shieldRegenTimer / p.shieldRegenCooldown;
      const end = start + Math.PI * 2 * progress;
      g.lineStyle(2, UISkin.palette.accent, 0.85);
      g.moveTo(cx + arcR * Math.cos(start), cy + arcR * Math.sin(start));
      g.arc(cx, cy, arcR, start, end);
    }
  }

  // ── Tick ───────────────────────────────────────────────────────
  update(clear) {
    this.updateBanner();
    this.textPoints.text = `PTS  ${this.player.points}`;
    this.textLifes.text  = `${this.player.lifes}`;
    if (this.textShield) {
      this.textShield.text = `${this.player.shield || 0}`;
      this._updateShieldRegenArc();
    }
    this.endgameCheck(clear);
  }
}
