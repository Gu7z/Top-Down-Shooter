import * as PIXI from "pixi.js";
import generateRandom from "./utils/generate_random";

export default class Buff {
  constructor({ app }) {
    this.app = app;
    this.width = 50;
    this.height = 50;
    this.buffDuration = 3000;

    this.createBuff({ app });
  }

  createBuff({ app }) {
    const randomX = generateRandom(
      this.width,
      this.app.screen.width - this.width
    );
    const randomY = generateRandom(
      this.height,
      this.app.screen.height - this.height
    );

    this.buff = new PIXI.Sprite(PIXI.Texture.WHITE);
    this.buff.position.set(randomX, randomY);
    this.buff.tint = 0xffaa00;
    this.buff.width = this.width;
    this.buff.height = this.height;

    this.text = new PIXI.Text("Buff", { fill: 0xffffff });
    this.text.position.set(randomX, randomY);

    app.stage.addChild(this.buff);
    app.stage.addChild(this.text);
  }

  get(player) {
    player.shooting.setFireVelocity = 3;
    player.velocity = 3;
    setTimeout(() => {
      player.shooting.setFireVelocity = 1;
      player.velocity = 2;
    }, this.buffDuration);
  }

  update(player) {
    if (this.buff.destroyed) return;

    const playerBounds = player.player.getBounds();
    const buffBounds = this.buff.getBounds();
    const isColliding =
      playerBounds.x + playerBounds.width > buffBounds.x &&
      playerBounds.x < buffBounds.x + buffBounds.width &&
      playerBounds.y + playerBounds.height > buffBounds.y &&
      playerBounds.y < buffBounds.y + buffBounds.height;

    if (isColliding && this.buff.visible) {
      this.destroy();
      this.get(player);

      // Cria um novo buff a cada 10 segundos
      const timer = setInterval(() => {
        this.createBuff({
          app: this.app,
        });
        clearInterval(timer);
      }, 10000);
    }
  }

  destroy() {
    this.buff.destroy();
    this.text.destroy();
  }
}
