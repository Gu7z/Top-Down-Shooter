import Controls from "./controls.js";
import Game from "./game.js";
import Score from "./score.js";
import {
  UISkin,
  createBackdrop,
  createCard,
  createLabel,
  createPillButton,
} from "./ui_system.js";

export default class Menu {
  constructor({ app }) {
    this.app = app;
    this.menuContainer = new PIXI.Container();
    this.centerX = app.screen.width / 2;
    this.centerY = app.screen.height / 2;
    this.username = localStorage.getItem("username") || "";

    this.buildScene();
    this.app.stage.addChild(this.menuContainer);
  }

  buildScene() {
    createBackdrop(this.menuContainer, this.app);
    createCard({
      container: this.menuContainer,
      x: this.centerX,
      y: this.centerY,
      width: 760,
      height: 560,
    });

    createLabel({
      container: this.menuContainer,
      text: "NEON HUNT",
      x: this.centerX,
      y: this.centerY - 220,
      fontSize: 74,
      color: UISkin.palette.highlightStrong,
      bold: true,
      letterSpacing: 4,
    });

    createLabel({
      container: this.menuContainer,
      text: "Top-Down Shooter",
      x: this.centerX,
      y: this.centerY - 170,
      fontSize: 30,
      color: UISkin.palette.textSecondary,
      letterSpacing: 2,
    });

    createLabel({
      container: this.menuContainer,
      text: "Operador",
      x: this.centerX,
      y: this.centerY - 106,
      fontSize: 22,
      color: UISkin.palette.textSecondary,
    });

    this.buildInput();
    this.buildButtons();
  }

  buildInput() {
    const input = new PIXI.TextInput({
      input: {
        fontSize: "20pt",
        padding: "12px",
        width: "300px",
        color: "#e2e8f0",
      },
      box: {
        default: {
          fill: 0x1e293b,
          rounded: 6,
          stroke: { color: UISkin.palette.highlightStrong, width: 2 },
        },
        focused: {
          fill: 0x0f172a,
          rounded: 6,
          stroke: { color: UISkin.palette.highlight, width: 2 },
        },
      },
    });

    input.placeholder = "Digite seu codinome";
    input.text = this.username;
    input.disabled = !!this.username;
    input.x = this.centerX - 150;
    input.y = this.centerY - 76;

    input.on("input", (value) => {
      this.username = value;
      localStorage.setItem("username", value);
      this.playButton.setEnabled(Boolean(value));
    });

    this.menuContainer.addChild(input);
    input.focus();
  }

  buildButtons() {
    this.playButton = createPillButton({
      container: this.menuContainer,
      x: this.centerX,
      y: this.centerY + 45,
      text: "INICIAR RUN",
      primary: true,
      width: 320,
      height: 64,
      onClick: () => {
        if (!this.username) return;
        this.play();
      },
    });

    this.playButton.setEnabled(Boolean(this.username));

    createPillButton({
      container: this.menuContainer,
      x: this.centerX,
      y: this.centerY + 123,
      text: "VER PLACAR",
      width: 320,
      onClick: () => this.showScore(),
    });

    createPillButton({
      container: this.menuContainer,
      x: this.centerX,
      y: this.centerY + 190,
      text: "CONFIG. DE CONTROLES",
      width: 320,
      onClick: () => this.showControls(),
    });
  }

  hide() {
    this.app.stage.removeChild(this.menuContainer);
  }

  show() {
    this.app.stage.addChild(this.menuContainer);
  }

  play() {
    this.hide();
    new Game({ app: this.app, username: this.username });
  }

  showControls() {
    this.hide();
    new Controls({ app: this.app, menu: this });
  }

  showScore() {
    this.hide();
    new Score({ app: this.app, menu: this });
  }
}
