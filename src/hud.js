import Menu from "./menu";
import getUrl from "./utils/get_url";

export default class Hud {
  constructor({ app, player, menu }) {
    this.app = app;
    this.player = player;
    this.menu = menu;
    this.hudContainer = new PIXI.Container();
    this.deathSound = PIXI.sound.Sound.from("sound/death.mp3");
    this.dead = false;

    const textColor = {
      fill: 0xffffff,
    };

    this.textPoints = new PIXI.Text(`Pontos: ${this.player.points}`, textColor);
    this.textPoints.position.set(0, 0);

    this.textLifes = new PIXI.Text(`Vidas: ${this.player.lifes}`, textColor);
    this.textLifes.position.set(0, 30);

    this.textLifes = new PIXI.Text(`Pausado`, textColor);
    this.textLifes.position.set(0, 30);

    const middleWidth = app.screen.width / 2;
    const middleHeight = app.screen.height / 6;
    this.textEnd = new PIXI.Text("Game Over", textColor);
    this.textEnd.visible = false;
    this.textEnd.position.set(middleWidth, middleHeight);
    this.textEnd.anchor.set(0.5);

    this.textPaused = new PIXI.Text(`Pausado`, textColor);
    this.textPaused.position.set(middleWidth, middleHeight);
    this.textPaused.anchor.set(0.5);
    this.textPaused.visible = false;

    this.hudContainer.addChild(this.textPaused);
    this.hudContainer.addChild(this.textPoints);
    this.hudContainer.addChild(this.textLifes);
    this.hudContainer.addChild(this.textEnd);

    this.app.stage.addChild(this.hudContainer);
  }

  set showPaused(paused) {
    this.textPaused.visible = paused;
  }

  async sendScore() {
    const url = getUrl();

    await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: this.player.username,
        points: this.player.points,
      }),
    });
  }

  endgameCheck() {
    if (this.player.lifes < 1) {
      this.textEnd.visible = true;

      if (!this.dead) {
        this.dead = true;
        this.deathSound.play();

        this.backButton();
        this.sendScore();
      }
    } else {
      this.dead = false;
    }
  }

  backButton() {
    const x = this.app.screen.width / 2;
    const y = this.app.screen.height;
    const back = new PIXI.Sprite(PIXI.Texture.WHITE);

    back.tint = 0xffffff;
    back.anchor.set(0.5);
    back.position.set(x, y - 100);
    back.width = 160;
    back.height = 40;
    back.interactive = true;
    back.cursor = "pointer";
    back.on("click", () => {
      console.log("teste");

      this.app.stage.removeChildren();
      new Menu({ app: this.app });
    });

    const backText = new PIXI.Text("Voltar", {
      fill: 0x000000,
      fontSize: 30,
    });
    backText.position.set(x, y - 100);
    backText.anchor.set(0.5);

    this.hudContainer.addChild(back);
    this.hudContainer.addChild(backText);
  }

  update(ticker) {
    this.textPoints.text = `Pontos: ${this.player.points}`;
    this.textLifes.text = `Vidas: ${this.player.lifes}`;

    this.endgameCheck();
  }
}
