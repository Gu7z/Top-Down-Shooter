import * as PIXI from "pixi.js";

export default class Score {
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

    const middleWidth = app.screen.width / 2;
    const middleHeight = app.screen.height / 6;
    this.textEnd = new PIXI.Text("Game Over", textColor);
    this.textEnd.visible = false;
    this.textEnd.position.set(middleWidth, middleHeight);
    this.textEnd.anchor.set(0.5);
  }

  update() {
    this.textPoints.text = `Pontos: ${this.player.points}`;
    this.textLifes.text = `Vidas: ${this.player.lifes}`;

    if (this.player.lifes < 1) this.textEnd.visible = true;

    this.app.stage.addChild(this.textPoints);
    this.app.stage.addChild(this.textLifes);
    this.app.stage.addChild(this.textEnd);
  }
}
