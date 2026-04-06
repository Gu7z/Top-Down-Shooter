import Controls from "./controls.js";
import Game from "./game.js";
import Score from "./score.js";
import {
  MenuTheme,
  addMenuOverlay,
  addPanel,
  addSectionTitle,
  addSectionSubtitle,
  createMenuButton,
} from "./ui_theme.js";

export default class Menu {
  constructor({ app }) {
    this.app = app;
    this.menuContainer = new PIXI.Container();
    this.centerX = app.screen.width / 2;
    this.centerY = app.screen.height / 2;
    this.username = localStorage.getItem("username") || "";

    this.drawBackground();
    this.drawTitle();
    this.drawInput();
    this.drawButtons();

    this.app.stage.addChild(this.menuContainer);
  }

  drawBackground() {
    addMenuOverlay(this.menuContainer, this.app);
    addPanel({
      container: this.menuContainer,
      x: this.centerX,
      y: this.centerY,
      width: 620,
      height: 560,
      tint: MenuTheme.color.panel,
      alpha: 0.96,
    });
  }

  drawTitle() {
    addSectionTitle(this.menuContainer, "TOP DOWN", this.centerX, this.centerY - 220);
    addSectionTitle(this.menuContainer, "SHOOTER", this.centerX, this.centerY - 164);
    addSectionSubtitle(
      this.menuContainer,
      "Sobreviva, escale o placar e mantenha seu combo vivo.",
      this.centerX,
      this.centerY - 108,
      22
    );
  }

  drawInput() {
    const inputLabel = new PIXI.Text("Nome de piloto", {
      fill: MenuTheme.color.textDim,
      fontSize: 22,
      fontWeight: "600",
    });
    inputLabel.anchor.set(0.5);
    inputLabel.position.set(this.centerX, this.centerY - 44);

    const input = new PIXI.TextInput({
      input: {
        fontSize: "20pt",
        padding: "12px",
        width: "280px",
        color: "#020617",
      },
      box: {
        default: {
          fill: 0xe2e8f0,
          rounded: 10,
          stroke: { color: MenuTheme.color.accentStrong, width: 2 },
        },
        focused: {
          fill: 0xf8fafc,
          rounded: 10,
          stroke: { color: MenuTheme.color.accent, width: 2 },
        },
      },
    });

    input.placeholder = "Digite seu nome";
    input.text = this.username;
    input.disabled = !!this.username;
    input.x = this.centerX - 140;
    input.y = this.centerY - 18;
    input.on("input", (val) => {
      this.username = val;
      localStorage.setItem("username", val);
      this.playButton.setEnabled(Boolean(val));
    });

    this.menuContainer.addChild(inputLabel);
    this.menuContainer.addChild(input);
    input.focus();
  }

  drawButtons() {
    this.playButton = createMenuButton({
      container: this.menuContainer,
      x: this.centerX,
      y: this.centerY + 94,
      label: "JOGAR",
      onClick: () => {
        if (!this.username) return;
        this.play();
      },
      isPrimary: true,
      width: 300,
      height: 64,
    });
    this.playButton.setEnabled(Boolean(this.username));

    createMenuButton({
      container: this.menuContainer,
      x: this.centerX,
      y: this.centerY + 168,
      label: "PLACAR GLOBAL",
      onClick: () => this.showScore(),
      width: 300,
      height: 54,
    });

    createMenuButton({
      container: this.menuContainer,
      x: this.centerX,
      y: this.centerY + 232,
      label: "CONTROLES",
      onClick: () => this.showControls(),
      width: 300,
      height: 54,
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
