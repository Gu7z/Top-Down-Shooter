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
    this.drawTitle();
    this.drawInput();
    this.drawButtons();
    this.app.stage.addChild(this.menuContainer);
  }

  drawTitle() {
    const title = new PIXI.Text("Top Down Shooter", {
      fill: 0xffffff,
      fontSize: 48,
    });
    title.anchor.set(0.5);
    title.position.set(this.centerX, this.centerY - 120);
    this.menuContainer.addChild(title);
  }

  drawInput() {
    const input = new PIXI.TextInput({
      input: { fontSize: "22pt", padding: "10px", width: "220px", color: "#000" },
      box: { default: { fill: 0xfefefe, rounded: 8, stroke: { color: 0x888888, width: 2 } } },
    });
    input.placeholder = "Nome";
    input.text = this.username;
    input.disabled = !!this.username;
    input.x = this.centerX - 110;
    input.y = this.centerY - 40;
    input.on("input", (val) => {
      this.username = val;
      localStorage.setItem("username", val);
      this.playButton.tint = val ? 0xffffff : 0xcccccc;
    });
    this.menuContainer.addChild(input);
    input.focus();
  }

  createButton(label, offsetY, onClick) {
    const bg = new PIXI.Sprite(PIXI.Texture.WHITE);
    bg.tint = 0xffffff;
    bg.anchor.set(0.5);
    bg.position.set(this.centerX, this.centerY + offsetY);
    bg.width = 180;
    bg.height = 52;
    bg.interactive = true;
    bg.cursor = "pointer";
    bg.on("click", onClick);

    const text = new PIXI.Text(label, { fill: 0x000000, fontSize: 32 });
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
    if (!this.username) this.playButton.tint = 0xcccccc;

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
