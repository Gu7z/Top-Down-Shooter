import generateRandom from "./utils/generate_random.js";

export default class Buff {
  constructor({ app, hud }) {
    this.app = app;
    this.hud = hud;
    this.width = 40;
    this.height = 40;
    this.buffDuration = 4;
    this.buffLifetime = 7;
    this.respawnDelay = 20;
    this.buffContainer = new PIXI.Container();
    this.buff = null;
    this.expireTimer = null;
    this.respawnTimer = null;
    this.disposed = false;

    this.createBuff({
      app: this.app,
    });
  }

  createBuff({ app }) {
    if (this.disposed || this.hud.dead) return;

    this.destroy();
    this.respawnTimer?.clear?.();
    this.respawnTimer = null;

    const randomX = generateRandom(
      this.width,
      this.app.screen.width - this.width
    );
    const randomY = generateRandom(
      this.height,
      this.app.screen.height - this.height
    );

    const buffTexture = PIXI.Texture.from("./images/speed_buff.png");
    if (buffTexture?.baseTexture) {
      buffTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    }
    this.buff = new PIXI.Sprite(buffTexture);
    this.buff.position.set(randomX, randomY);
    this.buff.width = this.width;
    this.buff.height = this.height;

    this.expireTimer = this.app.setTimeout(() => {
      this.expireTimer = null;
      if (!this.buff?.destroyed) {
        this.destroy();
      }
    }, this.buffLifetime);

    this.respawnTimer = this.app.setTimeout(() => {
      this.respawnTimer = null;
      if (!this.hud.dead && !this.disposed) {
        this.createBuff({
          app: this.app,
        });
      }
    }, this.respawnDelay);

    this.buffContainer.addChild(this.buff);
    if (!app.stage.children.includes(this.buffContainer)) {
      app.stage.addChild(this.buffContainer);
    }
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
    if (!this.buff || this.buff.destroyed) return;

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
    this.expireTimer?.clear?.();
    this.expireTimer = null;
    if (this.buff) {
      this.buff.parent?.removeChild?.(this.buff);
      if (!this.buff.destroyed) {
        this.buff.destroy();
      }
    }
  }

  dispose() {
    this.disposed = true;
    this.destroy();
    this.respawnTimer?.clear?.();
    this.respawnTimer = null;
    this.buffContainer.destroy?.({ children: true });
  }
}
