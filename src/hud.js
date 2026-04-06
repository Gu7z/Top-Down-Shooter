import Menu from "./menu.js";
import sendScore from "./utils/send_score.js";
import { MenuTheme, createMenuButton, addPanel } from "./ui_theme.js";

export default class Hud {
  constructor({ app, player }) {
    this.app = app;
    this.player = player;
    this.hudContainer = new PIXI.Container();
    this.deathSound = PIXI.sound.Sound.from("sound/death.mp3");
    this.dead = false;

    this.textPoints = this.createLabel(`Pontos: ${player.points}`, 18, 14, 23, MenuTheme.color.title);
    this.textLifes = this.createLabel(`Vidas: ${player.lifes}`, 18, 44, 23, MenuTheme.color.title);

    this.textPaused = this.createLabel(
      "PAUSADO",
      app.screen.width / 2,
      app.screen.height / 2,
      56,
      MenuTheme.color.accent
    );
    this.textPaused.anchor.set(0.5);
    this.textPaused.visible = false;

    this.textEnd = this.createLabel(
      "FIM DE JOGO",
      app.screen.width / 2,
      app.screen.height / 2 - 90,
      58,
      MenuTheme.color.danger
    );
    this.textEnd.anchor.set(0.5);
    this.textEnd.visible = false;

    this.app.stage.addChild(this.hudContainer);
  }

  createLabel(text, x, y, fontSize = 24, fill = 0xffffff) {
    const t = new PIXI.Text(text, {
      fill,
      fontSize,
      fontWeight: "700",
      stroke: 0x020617,
      strokeThickness: 4,
      letterSpacing: 1,
    });
    t.position.set(x, y);
    this.hudContainer.addChild(t);
    return t;
  }

  set showPaused(val) {
    this.textPaused.visible = val;
  }

  endgameCheck(clear) {
    if (this.player.lifes < 1) {
      this.textEnd.visible = true;
      if (!this.dead) {
        this.dead = true;
        this.deathSound.play();
        this.backButton(clear);
        this.app.stop();
        sendScore({ name: this.player.username, points: this.player.points });
      }
    } else {
      this.dead = false;
    }
  }

  backButton(clear) {
    const x = this.app.screen.width / 2;
    const y = this.app.screen.height / 2 + 34;

    addPanel({
      container: this.hudContainer,
      x,
      y: this.app.screen.height / 2,
      width: 460,
      height: 250,
      tint: 0x020617,
      alpha: 0.88,
    });

    this.textEnd.position.set(x, this.app.screen.height / 2 - 56);

    this.createLabel("Sua run terminou. Tente bater seu recorde.", x, this.app.screen.height / 2 - 14, 24, MenuTheme.color.text)
      .anchor.set(0.5);

    createMenuButton({
      container: this.hudContainer,
      x,
      y: y + 56,
      label: "MENU PRINCIPAL",
      onClick: () => {
        clear();
        this.app.stage.removeChildren();
        this.app.start();
        new Menu({ app: this.app });
      },
      width: 290,
      height: 56,
      isPrimary: true,
    });
  }

  update(clear) {
    this.textPoints.text = `Pontos: ${this.player.points}`;
    this.textLifes.text = `Vidas: ${this.player.lifes}`;
    this.endgameCheck(clear);
  }
}
