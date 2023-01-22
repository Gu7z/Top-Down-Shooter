import Controls from "./controls";
import Game from "./game";

export default class Menu {
  constructor({ app }) {
    this.x = app.screen.width / 2;
    this.y = app.screen.height / 6;
    this.app = app;
    this.menuContainer = new PIXI.Container();

    this.drawWelcomeText();
    this.drawMenuOptions();

    this.app.stage.addChild(this.menuContainer);
    // this.showControls();
  }

  drawWelcomeText() {
    this.welcomeText = new PIXI.Text("Bem Vindo", {
      fill: 0xffffff,
      fontSize: 50,
    });
    this.welcomeText.position.set(this.x, this.y);
    this.welcomeText.anchor.set(0.5);
    this.menuContainer.addChild(this.welcomeText);
  }

  drawMenuButton(text, x, y, width, height, func) {
    const button = new PIXI.Sprite(PIXI.Texture.WHITE);
    button.tint = 0xffffff;
    button.anchor.set(0.5);
    button.interactive = true;
    button.cursor = "pointer";
    button.position.set(x, y);
    button.width = width;
    button.height = height;
    button.on("click", func);

    const buttonText = new PIXI.Text(text, {
      fill: 0x000000,
      fontSize: 50,
    });
    buttonText.position.set(x, y);
    buttonText.anchor.set(0.5);

    this.menuContainer.addChild(button);
    this.menuContainer.addChild(buttonText);
  }

  drawMenuOptions() {
    this.drawMenuButton("Jogar", this.x, this.y + 150, 150, 60, () =>
      this.play()
    );

    this.drawMenuButton("Score", this.x, this.y + 250, 160, 60, () =>
      this.showScore()
    );

    this.drawMenuButton("Controles", this.x, this.y + 350, 220, 60, () =>
      this.showControls()
    );
  }

  hide() {
    this.app.stage.removeChild(this.menuContainer);
  }

  show() {
    this.app.stage.addChild(this.menuContainer);
  }

  play() {
    new Game({ app: this.app });
  }

  showControls() {
    this.app.stage.removeChild(this.menuContainer);

    new Controls({ app: this.app, menu: this });
  }

  showScore() {}
}
