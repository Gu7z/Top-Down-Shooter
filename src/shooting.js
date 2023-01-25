import Victor from "victor";
import bulletHit from "./utils/bullet_hit";

export default class Shooting {
  constructor({ app, player, playerSize, keys }) {
    this.app = app;
    this.player = player;
    this.playerSize = playerSize;
    this.bulletSpeed = 4;
    this.bullets = [];
    this.bulletRadius = 5;
    this.fireVelocity = 1;
    this.keys = keys;
    this.shooting = false;
    this.shootInterval = 0.3;
    this.shootingContainer = new PIXI.Container();
    this.sound = PIXI.sound.Sound.from("sound/shot.mp3");
    this.interval = undefined;

    window.addEventListener("pointerdown", () => {
      this.shooting = true;
    });

    window.addEventListener("pointerup", () => {
      this.shooting = false;
    });

    this.shoot();
  }

  shoot() {
    this.interval = this.app.setInterval(() => {
      if (this.keys[" "] || this.shooting) {
        this.fire();
      }
      this.interval.clear();
      this.shoot();
    }, this.shootInterval / this.fireVelocity);
  }

  fire() {
    this.sound.play();
    let angle = this.player.rotation;

    this.bullets = this.bullets.filter((bullet) => {
      if (bullet.destroyed) return;

      return (
        Math.abs(bullet.position.x) <
          this.app.screen.width + this.bulletRadius &&
        Math.abs(bullet.position.y) < this.app.screen.height + this.bulletRadius
      );
    });

    const bullet = new PIXI.Graphics();
    bullet.beginFill(0x00ff00, 1);
    bullet.drawCircle(0, 0, this.bulletRadius);
    bullet.endFill();
    const moveFromCenterToTip = new Victor(
      Math.cos(angle),
      Math.sin(angle)
    ).multiplyScalar(this.playerSize);
    bullet.position.set(
      this.player.position.x + moveFromCenterToTip.x,
      this.player.position.y + moveFromCenterToTip.y
    );
    bullet.velocity = new Victor(
      Math.cos(angle),
      Math.sin(angle)
    ).multiplyScalar(this.bulletSpeed);

    this.bullets.push(bullet);
    this.shootingContainer.addChild(bullet);
    this.app.stage.addChild(this.shootingContainer);
  }

  set setFireVelocity(velocity) {
    this.fireVelocity = velocity;
  }

  update(enemySpawner, player) {
    if (!enemySpawner || !player) return;
    this.bullets.forEach((bullet) => {
      if (bullet.destroyed || !bullet) return;

      bullet.position.set(
        bullet.position.x + bullet.velocity.x,
        bullet.position.y + bullet.velocity.y
      );

      bulletHit(bullet, enemySpawner.spawns, this.bulletRadius, player);
    });
  }
}
