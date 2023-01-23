import Victor from "victor";

export default class Shooting {
  constructor({ app, player, playerSize }) {
    this.app = app;
    this.player = player;
    this.playerSize = playerSize;
    this.bulletSpeed = 3;
    this.bullets = [];
    this.bulletRadius = 5;
    this.fireVelocity = 1;
    this.shooting = false;
    this.sound = PIXI.sound.Sound.from("sound/shot.mp3");
  }

  fire() {
    this.sound.play();
    let angle = this.player.rotation;

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
    this.app.stage.addChild(bullet);
  }

  set setFireVelocity(velocity) {
    const wasShooting = this.shooting;
    this.shoot = false;
    this.fireVelocity = velocity;
    this.shoot = wasShooting;
  }

  set shoot(shooting) {
    this.shooting = shooting;
    if (shooting) {
      this.fire();
      this.interval = setInterval(() => this.fire(), 300 / this.fireVelocity);
    } else {
      clearInterval(this.interval);
    }
  }

  update() {
    this.bullets.forEach((bullet, index) => {
      const isInsideScreen =
        Math.abs(bullet.position.x) < this.app.screen.width &&
        Math.abs(bullet.position.y) < this.app.screen.height;

      if (!isInsideScreen) {
        this.bullets[index].destroy();
        this.bullets.splice(index, 1);
        return;
      }

      bullet.position.set(
        bullet.position.x + bullet.velocity.x,
        bullet.position.y + bullet.velocity.y
      );
    });
  }
}
