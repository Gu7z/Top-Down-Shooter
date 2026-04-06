import Controls from "./controls.js";
import Game from "./game.js";
import Score from "./score.js";

export default class Menu {
  constructor({ app }) {
    this.app = app;
    this.menuContainer = new PIXI.Container();
    this.centerX = app.screen.width / 2;
    this.centerY = app.screen.height / 3;
    this.username = localStorage.getItem("username") || "";
    this.drawBackground();
    this.drawTitle();
    this.drawInput();
    this.drawButtons();
    this.app.stage.addChild(this.menuContainer);
  }

  drawBackground() {
    const panel = new PIXI.Sprite(PIXI.Texture.WHITE);
    panel.tint = 0x0f172a;
    panel.alpha = 0.9;
    panel.width = 500;
    panel.height = 480;
    panel.anchor.set(0.5);
    panel.position.set(this.centerX, this.centerY + 20);

    this.menuContainer.addChild(panel);
  }

  drawTitle() {
    const title = new PIXI.Text("Top Down Shooter", {
      fill: 0x7dd3fc,
      fontSize: 52,
      fontWeight: "bold",
      stroke: 0x020617,
      strokeThickness: 8,
    });
    title.anchor.set(0.5);
    title.position.set(this.centerX, this.centerY - 140);
    this.menuContainer.addChild(title);
  }

  drawInput() {
    const input = new PIXI.TextInput({
      input: { fontSize: "22pt", padding: "10px", width: "220px", color: "#000" },
      box: { default: { fill: 0xfefefe, rounded: 8, stroke: { color: 0x0ea5e9, width: 2 } } },
    });
    input.placeholder = "Nome";
    input.text = this.username;
    input.disabled = !!this.username;
    input.x = this.centerX - 110;
    input.y = this.centerY - 40;
    input.on("input", (val) => {
      this.username = val;
      localStorage.setItem("username", val);
      this.playButton.tint = val ? 0x38bdf8 : 0x334155;
    });
    this.menuContainer.addChild(input);
    input.focus();
  }

  createButton(label, offsetY, onClick) {
    const bg = new PIXI.Sprite(PIXI.Texture.WHITE);
    bg.tint = 0x38bdf8;
    bg.anchor.set(0.5);
    bg.position.set(this.centerX, this.centerY + offsetY);
    bg.width = 220;
    bg.height = 52;
    bg.interactive = true;
    bg.cursor = "pointer";
    bg.on("click", onClick);
    bg.on("pointerover", () => {
      bg.alpha = 0.8;
      bg.scale.x = 1.03;
      bg.scale.y = 1.03;
    });
    bg.on("pointerout", () => {
      bg.alpha = 1;
      bg.scale.x = 1;
      bg.scale.y = 1;
    });

    const text = new PIXI.Text(label, { fill: 0x020617, fontSize: 30, fontWeight: "bold" });
    text.anchor.set(0.5);
    text.position.set(this.centerX, this.centerY + offsetY);

    this.menuContainer.addChild(bg);
    this.menuContainer.addChild(text);
    return bg;
  }

  drawButtons() {
    this.playButton = this.createButton("Jogar", 60, () => {
      if (!this.username) return;
      this.play();
    });
    if (!this.username) this.playButton.tint = 0x334155;

    this.createButton("Score", 130, () => this.showScore());
    this.createButton("Controles", 200, () => this.showControls());
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
