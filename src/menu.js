import Game from "./game";

export default class Menu {
  constructor({ app }) {
    this.middleWidth = app.screen.width / 2;
    this.middleHeight = app.screen.height / 6;
    this.app = app;
    this.menuContainer = new PIXI.Container();

    this.drawWelcomeText();
    this.drawMenuOptions();

    this.app.stage.addChild(this.menuContainer);
  }

  drawWelcomeText() {
    this.welcomeText = new PIXI.Text("Bem Vindo", {
      fill: 0xffffff,
      fontSize: 50,
    });
    this.welcomeText.position.set(this.middleWidth, this.middleHeight);
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
    this.drawMenuButton(
      "Jogar",
      this.middleWidth,
      this.middleHeight + 150,
      150,
      60,
      () => this.play()
    );

    this.drawMenuButton(
      "Score",
      this.middleWidth,
      this.middleHeight + 250,
      160,
      60,
      () => this.showControls()
    );

    this.drawMenuButton(
      "Controles",
      this.middleWidth,
      this.middleHeight + 350,
      220,
      60,
      () => this.showScore()
    );
  }

  play() {
    this.app.stage.removeChild(this.menuContainer);

    new Game({ app: this.app });
  }

  showControls() {
    this.app.stage.removeChild(this.menuContainer);
  }

  showScore() {}
}
