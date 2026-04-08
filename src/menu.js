import Controls from "./controls.js";
import Game from "./game.js";
import PatchNotesModal from "./patch_notes/patch_notes_modal.js";
import { shouldShowPatchNotes } from "./patch_notes/patch_notes_state.js";
import Settings from "./settings.js";
import SkillTree from "./skill_tree.js";
import {
  UISkin,
  createBackdrop,
  createCard,
  createLabel,
  createPillButton,
  addScreenCorners,
} from "./ui_system.js";

export default class Menu {
  constructor({ app }) {
    this.app = app;
    this.menuContainer = new PIXI.Container();
    this.centerX = app.screen.width  / 2;
    this.centerY = app.screen.height / 2;
    this.username = localStorage.getItem("username") || "";
    this._ticker = null;
    this.patchNotesModal = null;
    this.input = null;
    this.skillTreeButton = null;
    this.controlsButton = null;
    this.settingsButton = null;

    this.buildScene();
    this.app.stage.addChild(this.menuContainer);
    this.maybeShowPatchNotes();
  }

  // ── Scene ──────────────────────────────────────────────────────
  buildScene() {
    const { centerX: cx, centerY: cy } = this;

    createBackdrop(this.menuContainer, this.app);
    addScreenCorners(this.menuContainer, this.app);
    this.buildStatusBar();

    createCard({
      container:   this.menuContainer,
      x:           cx,
      y:           cy,
      width:       780,
      height:      530,
      chamfer:     16,
      bracketSize: 22,
    });

    this.buildTitle();
    this.buildInput();
    this.buildButtons();
    this.startGlitch();
  }

  // ── Bottom status bar ──────────────────────────────────────────
  buildStatusBar() {
    const H = this.app.screen.height;
    const W = this.app.screen.width;

    const bar = new PIXI.Graphics();
    bar.lineStyle(1, UISkin.palette.accent, 0.18);
    bar.moveTo(0, H - 1);
    bar.lineTo(W, H - 1);
    this.menuContainer.addChild(bar);

    createLabel({
      container: this.menuContainer,
      text: "SYS:ONLINE  //  BUILD:1.0.0  //  ESC PARA PAUSAR",
      x: W / 2,
      y: H - 14,
      fontSize: 11,
      color: UISkin.palette.textSecondary,
      mono: true,
      letterSpacing: 1,
    });
  }

  // ── Title + glitch targets ─────────────────────────────────────
  buildTitle() {
    const cx = this.centerX;
    const cy = this.centerY + 46;
    const titleY = cy - 224;

    // Glitch layer 1 — magenta offset (invisible until animation fires)
    this.glitch1 = new PIXI.Text("NEON HUNT", {
      fontFamily: "'Orbitron', sans-serif",
      fill:       UISkin.palette.accentAlt,
      fontSize:   82,
      fontWeight: "900",
      letterSpacing: 8,
    });
    this.glitch1.anchor.set(0.5);
    this.glitch1.position.set(cx, titleY);
    this.glitch1.alpha = 0;
    this.menuContainer.addChild(this.glitch1);

    // Glitch layer 2 — danger red offset
    this.glitch2 = new PIXI.Text("NEON HUNT", {
      fontFamily: "'Orbitron', sans-serif",
      fill:       UISkin.palette.danger,
      fontSize:   82,
      fontWeight: "900",
      letterSpacing: 8,
    });
    this.glitch2.anchor.set(0.5);
    this.glitch2.position.set(cx, titleY);
    this.glitch2.alpha = 0;
    this.menuContainer.addChild(this.glitch2);

    // Glow halo (wide stroke, very low alpha)
    const halo = new PIXI.Text("NEON HUNT", {
      fontFamily: "'Orbitron', sans-serif",
      fill:       UISkin.palette.accent,
      fontSize:   82,
      fontWeight: "900",
      letterSpacing: 8,
      stroke:     UISkin.palette.accent,
      strokeThickness: 18,
    });
    halo.anchor.set(0.5);
    halo.position.set(cx, titleY);
    halo.alpha = 0.14;
    this.menuContainer.addChild(halo);

    // Main title
    this.titleText = new PIXI.Text("NEON HUNT", {
      fontFamily: "'Orbitron', sans-serif",
      fill:       UISkin.palette.accent,
      fontSize:   82,
      fontWeight: "900",
      letterSpacing: 8,
      stroke:     UISkin.palette.ink,
      strokeThickness: 4,
    });
    this.titleText.anchor.set(0.5);
    this.titleText.position.set(cx, titleY);
    this.menuContainer.addChild(this.titleText);

    // Subtitle
    createLabel({
      container:    this.menuContainer,
      text:         "▸  T O P - D O W N  S H O O T E R  ◂",
      x:            cx,
      y:            cy - 163,
      fontSize:     14,
      color:        UISkin.palette.textSecondary,
      mono:         true,
      letterSpacing: 4,
    });

    // Divider
    const div = new PIXI.Graphics();
    div.lineStyle(1, UISkin.palette.accent, 0.22);
    div.moveTo(cx - 240, cy - 144);
    div.lineTo(cx + 240, cy - 144);
    this.menuContainer.addChild(div);

    // Operator label
    createLabel({
      container:    this.menuContainer,
      text:         "[ OPERADOR_ID ]",
      x:            cx,
      y:            cy - 102,
      fontSize:     13,
      color:        UISkin.palette.textSecondary,
      mono:         true,
      letterSpacing: 3,
    });
  }

  buildInput() {
    const cx = this.centerX;
    const cy = this.centerY + 46;

    const input = new PIXI.TextInput({
      input: {
        fontSize:   "18pt",
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        padding:    "10px 16px",
        width:      "414px",
        color:      "#00FFFF",
        letterSpacing: "2px",
        background: "transparent",
        caretColor: "#00FFFF",
      },
      box: {
        default: {
          fill:    0x07070F,
          rounded: 0,
          stroke:  { color: UISkin.palette.accent, width: 1.5 },
        },
        focused: {
          fill:    0x05050D,
          rounded: 0,
          stroke:  { color: UISkin.palette.accentAlt, width: 2 },
        },
      },
    });

    input.placeholder = "▶  DIGITE SEU CODINOME";
    input.text        = this.username;
    input.disabled    = !!this.username;
    input.x = cx - 215;
    input.y = cy - 76;

    input.on("input", (value) => {
      this.username = value;
      localStorage.setItem("username", value);
      this.playButton.setEnabled(Boolean(value));
    });

    this.menuContainer.addChild(input);
    input.focus();
    this.input = input;
  }

  // ── Buttons ────────────────────────────────────────────────────
  buildButtons() {
    const cx = this.centerX;
    const cy = this.centerY + 46;
    const startY = cy + 44;
    const gapY = 72;
    const offsetX = 180;
    const btnWidth = 320;
    const btnHeight = 56;

    // Row 1
    this.playButton = createPillButton({
      container: this.menuContainer,
      x: cx - offsetX, y: startY,
      text:    "▶  INICIAR RUN",
      primary: true,
      width:   btnWidth,
      height:  btnHeight,
      onClick: () => { if (this.username) this.play(); },
    });
    this.playButton.setEnabled(Boolean(this.username));

    this.skillTreeButton = createPillButton({
      container: this.menuContainer,
      x: cx + offsetX, y: startY,
      text:   "ÁRVORE DE HABILIDADES",
      width:  btnWidth,
      height: btnHeight,
      fontSize: 16,
      letterSpacing: 2,
      onClick: () => this.showSkillTree(),
    });

    // Row 2
    this.controlsButton = createPillButton({
      container: this.menuContainer,
      x: cx - offsetX, y: startY + gapY,
      text:   "CONTROLES",
      width:  btnWidth,
      height: btnHeight,
      onClick: () => this.showControls(),
    });

    this.settingsButton = createPillButton({
      container: this.menuContainer,
      x: cx + offsetX, y: startY + gapY,
      text:   "⚙  CONFIGURAÇÕES",
      width:  btnWidth,
      height: btnHeight,
      onClick: () => this.showSettings(),
    });
  }

  maybeShowPatchNotes() {
    if (!shouldShowPatchNotes()) return;
    this.setMenuEnabled(false);
    this.patchNotesModal = new PatchNotesModal({
      app: this.app,
      onConfirm: () => {
        this.patchNotesModal = null;
        this.setMenuEnabled(true);
      },
    });
    this.patchNotesModal.show(this.menuContainer);
  }

  setMenuEnabled(enabled) {
    this.playButton?.setEnabled(enabled && Boolean(this.username));
    this.skillTreeButton?.setEnabled(enabled);
    this.controlsButton?.setEnabled(enabled);
    this.settingsButton?.setEnabled(enabled);
    if (this.input) {
      this.input.disabled = !enabled || !!this.username;
    }
  }

  // ── Glitch title animation ─────────────────────────────────────
  startGlitch() {
    const cx     = this.centerX;
    const titleY = (this.centerY + 46) - 224;
    let   tick   = 0;

    this._ticker = () => {
      tick++;
      const frame = tick % 220; // glitch burst every ~3.6 s at 60fps

      if (frame < 5) {
        const dx = (Math.random() - 0.5) * 16;
        const dy = (Math.random() - 0.5) * 3;

        this.glitch1.x     = cx + dx;
        this.glitch1.y     = titleY + dy;
        this.glitch1.alpha = Math.random() * 0.55 + 0.08;

        this.glitch2.x     = cx - dx * 0.6;
        this.glitch2.y     = titleY - dy * 0.5;
        this.glitch2.alpha = Math.random() * 0.3 + 0.04;

        this.titleText.x   = cx + dx * 0.1;
      } else {
        this.glitch1.alpha = 0;
        this.glitch2.alpha = 0;
        this.titleText.x   = cx;
      }
    };

    this.app.ticker.add(this._ticker);
  }

  // ── Lifecycle ──────────────────────────────────────────────────
  hide() {
    if (this._ticker) {
      this.app.ticker.remove(this._ticker);
      this._ticker = null;
    }
    this.patchNotesModal?.destroy();
    this.patchNotesModal = null;
    this.app.stage.removeChild(this.menuContainer);
  }

  show() {
    this.app.stage.addChild(this.menuContainer);
    this.startGlitch();
  }

  play() {
    this.hide();
    new Game({ app: this.app, username: this.username });
  }

  showControls() {
    this.hide();
    new Controls({ app: this.app, menu: this });
  }



  showSkillTree() {
    this.hide();
    new SkillTree({
      app: this.app,
      onBack: () => { new Menu({ app: this.app }); },
    });
  }

  showSettings() {
    this.hide();
    new Settings({
      app: this.app,
      onBack: () => { new Menu({ app: this.app }); },
    });
  }
}
