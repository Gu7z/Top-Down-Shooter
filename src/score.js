import.meta.hot; // For snowpack env

export default class Score {
  constructor({ app, menu }) {
    this.app = app;
    this.menu = menu;
    this.scoreContainer = new PIXI.Container();

    this.showScore().then(() => {
      this.backButton();
      this.app.stage.addChild(this.scoreContainer);
    });
  }

  backButton() {
    const x = this.app.screen.width / 2;
    const y = this.app.screen.height / 10;
    const back = new PIXI.Sprite(PIXI.Texture.WHITE);

    back.tint = 0xffffff;
    back.anchor.set(0.5);
    back.position.set(x, y);
    back.width = 160;
    back.height = 40;
    back.interactive = true;
    back.cursor = "pointer";
    back.on("click", () => {
      this.app.stage.removeChild(this.scoreContainer);
      this.menu.show();
    });

    const backText = new PIXI.Text("Voltar", {
      fill: 0x000000,
      fontSize: 30,
    });
    backText.position.set(x, y);
    backText.anchor.set(0.5);

    this.scoreContainer.addChild(back);
    this.scoreContainer.addChild(backText);
  }

  drawScoreLine(text, x, y) {
    const buttonText = new PIXI.Text(text, {
      fill: 0xffffff,
      fontSize: 50,
    });
    buttonText.position.set(x, y);

    this.scoreContainer.addChild(buttonText);
  }

  async getScore() {
    const { SNOWPACK_PUBLIC_API_URL } = __SNOWPACK_ENV__;
    const response = await fetch(SNOWPACK_PUBLIC_API_URL);
    const data = await response.json();

    console.log(data);
    return data;
  }

  async showScore() {
    const score = await this.getScore();
    let initialY = 0;
    score.map((line) => {
      this.drawScoreLine(
        line,
        this.app.screen.width / 4,
        this.app.screen.height / 6 + initialY
      );
      initialY += 100;
    });
  }
}
