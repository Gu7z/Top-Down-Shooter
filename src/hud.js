import.meta.hot; // For snowpack env

export default class Hud {
  constructor({ app, player }) {
    this.app = app;
    this.player = player;
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

    this.app.stage.addChild(this.textPaused);

    this.deathSound = PIXI.sound.Sound.from("sound/death.mp3");
    this.dead = false;
  }

  set showPaused(paused) {
    this.textPaused.visible = paused;
  }

  async sendScore() {
    const { SNOWPACK_PUBLIC_API_URL } = __SNOWPACK_ENV__;
    await fetch(SNOWPACK_PUBLIC_API_URL, {
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

        this.sendScore();
      }
    } else {
      this.dead = false;
    }
  }

  update() {
    this.textPoints.text = `Pontos: ${this.player.points}`;
    this.textLifes.text = `Vidas: ${this.player.lifes}`;

    this.endgameCheck();

    this.app.stage.addChild(this.textPoints);
    this.app.stage.addChild(this.textLifes);
    this.app.stage.addChild(this.textEnd);
  }
}
