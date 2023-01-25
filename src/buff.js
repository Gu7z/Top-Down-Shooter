import generateRandom from "./utils/generate_random";

export default class Buff {
  constructor({ app, hud }) {
    this.app = app;
    this.hud = hud;
    this.width = 40;
    this.height = 40;
    this.buffDuration = 4;
    this.buffContainer = new PIXI.Container();

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

    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
    const buffTexture = PIXI.Texture.from("./images/speed_buff.png");
    this.buff = new PIXI.Sprite(buffTexture);
    this.buff.position.set(randomX, randomY);
    this.buff.width = this.width;
    this.buff.height = this.height;

    const timer = this.app.setInterval(() => {
      if (!this.buff.destroyed) {
        this.destroy();
      }

      timer.clear();
    }, 7);

    const newtimer = this.app.setInterval(() => {
      if (!this.hud.dead) {
        this.createBuff({
          app: this.app,
        });
      }
      newtimer.clear();
    }, 20);

    this.buffContainer.addChild(this.buff);
    app.stage.addChild(this.buffContainer);
  }

  get(player) {
    player.shooting.setFireVelocity = 2;
    // player.shooting.bulletSpeed = 5;
    // player.velocity = 3;
    this.app.setTimeout(() => {
      player.shooting.setFireVelocity = 1;
      // player.shooting.bulletSpeed = 4;
      // player.velocity = 2;
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
  }
}
