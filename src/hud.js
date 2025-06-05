import Menu from "./menu.js";
import getUrl from "./utils/get_url.js";
import sendScore from "./utils/send_score.js";

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

    this.instructionsText = new PIXI.Text(
      `Segure Mouse1 ou espaço para atirar. Use WASD para se mover`,
      textColor
    );
    this.instructionsText.position.set(middleWidth, 10);
    this.instructionsText.anchor.set(0.5);
    this.app.setTimeout(() => {
      this.instructionsText.visible = false;
    }, 10);

    this.textEnd = new PIXI.Text("Game Over", textColor);
    this.textEnd.visible = false;
    this.textEnd.position.set(middleWidth, middleHeight);
    this.textEnd.anchor.set(0.5);

    this.textPaused = new PIXI.Text(`Pausado`, textColor);
    this.textPaused.position.set(middleWidth, middleHeight);
    this.textPaused.anchor.set(0.5);
    this.textPaused.visible = false;

    this.hudContainer.addChild(this.instructionsText);
    this.hudContainer.addChild(this.textPaused);
    this.hudContainer.addChild(this.textPoints);
    this.hudContainer.addChild(this.textLifes);
    this.hudContainer.addChild(this.textEnd);

    this.app.stage.addChild(this.hudContainer);
  }

  set showPaused(paused) {
    this.textPaused.visible = paused;
  }

  endgameCheck(clear) {
    if (this.player.lifes < 1) {
      this.textEnd.visible = true;

      if (!this.dead) {
        this.dead = true;
        this.deathSound.play();
        this.backButton(clear);
        this.app.stop();

        sendScore({
          name: this.player.username,
          points: this.player.points,
        });
      }
    } else {
      this.dead = false;
    }
  }

  backButton(clear) {
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
      clear();
      this.app.stage.removeChildren();
      this.app.start();
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

  update(clear) {
    this.textPoints.text = `Pontos: ${this.player.points}`;
    this.textLifes.text = `Vidas: ${this.player.lifes}`;

    this.endgameCheck(clear);
  }
}
