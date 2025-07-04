import Menu from "./menu.js";
import sendScore from "./utils/send_score.js";

export default class Hud {
  constructor({ app, player }) {
    this.app = app;
    this.player = player;
    this.hudContainer = new PIXI.Container();
    this.deathSound = PIXI.sound.Sound.from("sound/death.mp3");
    this.dead = false;

    this.pointsText = this.createLabel(`Pontos: ${player.points}`, 10, 10);
    this.lifesText = this.createLabel(`Vidas: ${player.lifes}`, 10, 40);
    this.pauseText = this.createLabel("Pausado", app.screen.width / 2, app.screen.height / 2);
    this.pauseText.anchor.set(0.5);
    this.pauseText.visible = false;
    this.endText = this.createLabel("Game Over", app.screen.width / 2, app.screen.height / 2 - 40);
    this.endText.anchor.set(0.5);
    this.endText.visible = false;

    this.app.stage.addChild(this.hudContainer);
  }

  createLabel(text, x, y) {
    const t = new PIXI.Text(text, { fill: 0xffffff, fontSize: 24 });
    t.position.set(x, y);
    this.hudContainer.addChild(t);
    return t;
  }

  set showPaused(val) {
    this.pauseText.visible = val;
  }

  endgameCheck(clear) {
    if (this.player.lifes < 1) {
      this.endText.visible = true;
      if (!this.dead) {
        this.dead = true;
        this.deathSound.play();
        this.createBackButton(clear);
        this.app.stop();
        sendScore({ name: this.player.username, points: this.player.points });
      }
    } else {
      this.dead = false;
    }
  }

  createBackButton(clear) {
    const x = this.app.screen.width / 2;
    const y = this.app.screen.height - 80;
    const bg = new PIXI.Sprite(PIXI.Texture.WHITE);
    bg.tint = 0xffffff;
    bg.anchor.set(0.5);
    bg.position.set(x, y);
    bg.width = 160;
    bg.height = 48;
    bg.interactive = true;
    bg.cursor = "pointer";
    bg.on("click", () => {
      clear();
      this.app.stage.removeChildren();
      this.app.start();
      new Menu({ app: this.app });
    });

    const txt = new PIXI.Text("Voltar", { fill: 0x000000, fontSize: 28 });
    txt.anchor.set(0.5);
    txt.position.set(x, y);

    this.hudContainer.addChild(bg);
    this.hudContainer.addChild(txt);
  }

  update(clear) {
    this.pointsText.text = `Pontos: ${this.player.points}`;
    this.lifesText.text = `Vidas: ${this.player.lifes}`;
    this.endgameCheck(clear);
  }
}
