import Menu from "./menu.js";
import sendScore from "./utils/send_score.js";
import {
  UISkin,
  createCard,
  createLabel,
  createPillButton,
} from "./ui_system.js";

export default class Hud {
  constructor({ app, player }) {
    this.app = app;
    this.player = player;
    this.hudContainer = new PIXI.Container();
    this.deathSound = PIXI.sound.Sound.from("sound/death.mp3");
    this.dead = false;

    this.textPoints = this.createLabel(`Pontos ${player.points}`, 16, 12);
    this.textLifes = this.createLabel(`Vidas ${player.lifes}`, 16, 42);

    this.textPaused = createLabel({
      container: this.hudContainer,
      text: "RUN PAUSADA",
      x: app.screen.width / 2,
      y: app.screen.height / 2,
      fontSize: 54,
      color: UISkin.palette.highlightStrong,
      bold: true,
      letterSpacing: 3,
    });
    this.textPaused.visible = false;

    this.textEnd = createLabel({
      container: this.hudContainer,
      text: "RUN ENCERRADA",
      x: app.screen.width / 2,
      y: app.screen.height / 2 - 76,
      fontSize: 56,
      color: UISkin.palette.warning,
      bold: true,
      letterSpacing: 3,
    });
    this.textEnd.visible = false;

    this.app.stage.addChild(this.hudContainer);
  }

  createLabel(text, x, y) {
    return createLabel({
      container: this.hudContainer,
      text,
      x,
      y,
      fontSize: 24,
      color: UISkin.palette.textPrimary,
      bold: true,
      anchor: 0,
    });
  }

  set showPaused(val) {
    this.textPaused.visible = val;
  }

  endgameCheck(clear) {
    if (this.player.lifes < 1) {
      this.textEnd.visible = true;
      if (this.dead) return;

      this.dead = true;
      this.deathSound.play();
      this.renderGameOverMenu(clear);
      this.app.stop();
      sendScore({ name: this.player.username, points: this.player.points });
      return;
    }

    this.dead = false;
  }

  renderGameOverMenu(clear) {
    const centerX = this.app.screen.width / 2;
    const centerY = this.app.screen.height / 2;

    createCard({
      container: this.hudContainer,
      x: centerX,
      y: centerY,
      width: 520,
      height: 280,
      alpha: 0.9,
    });

    this.textEnd.position.set(centerX, centerY - 86);

    createLabel({
      container: this.hudContainer,
      text: `Pontuação final: ${this.player.points}`,
      x: centerX,
      y: centerY - 26,
      fontSize: 29,
      color: UISkin.palette.textPrimary,
      bold: true,
    });

    createPillButton({
      container: this.hudContainer,
      x: centerX,
      y: centerY + 58,
      text: "VOLTAR AO MENU",
      width: 300,
      primary: true,
      onClick: () => {
        clear();
        this.app.stage.removeChildren();
        this.app.start();
        new Menu({ app: this.app });
      },
    });
  }

  update(clear) {
    this.textPoints.text = `Pontos ${this.player.points}`;
    this.textLifes.text = `Vidas ${this.player.lifes}`;
    this.endgameCheck(clear);
  }
}
