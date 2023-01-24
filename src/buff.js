import generateRandom from "./utils/generate_random";

export default class Buff {
  constructor({ app }) {
    this.app = app;
    this.width = 50;
    this.height = 50;
    this.buffDuration = 5;

    this.createBuff({
      app: this.app,
    });
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

    const timer = this.app.setInterval(() => {
      if (!this.buff.destroyed) {
        this.destroy();
      }

      timer.clear();
    }, 5);

    const newtimer = this.app.setInterval(() => {
      this.createBuff({
        app: this.app,
      });
      newtimer.clear();
    }, 10);

    app.stage.addChild(this.buff);
    app.stage.addChild(this.text);
  }

  get(player) {
    player.shooting.setFireVelocity = 3;
    player.shooting.bulletSpeed = 5;
    player.velocity = 3;
    this.app.setTimeout(() => {
      player.shooting.setFireVelocity = 1;
      player.shooting.bulletSpeed = 3;
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
    }
  }

  destroy() {
    this.buff.destroy();
    this.text.destroy();
  }
}
