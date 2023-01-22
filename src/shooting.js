import Victor from "victor";

export default class Shooting {
  constructor({ app, player }) {
    this.app = app;
    this.player = player;
    this.bulletSpeed = 3;
    this.bullets = [];
    this.bulletRadius = 5;
    this.fireVelocity = 1;
    this.shooting = false;
  }

  fire() {
    const bullet = new PIXI.Graphics();
    bullet.position.set(this.player.position.x, this.player.position.y);
    bullet.beginFill(0x0000ff, 1);
    bullet.drawCircle(0, 0, this.bulletRadius);
    bullet.endFill();

    let angle = this.player.rotation;
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
    this.bullets.forEach((b, index) => {
      const isInsideScreen =
        Math.abs(b.position.x) < this.app.screen.width &&
        Math.abs(b.position.y) < this.app.screen.height;

      if (!isInsideScreen) {
        this.bullets[index].destroy();
        this.bullets.splice(index, 1);
        return;
      }

      b.position.set(b.position.x + b.velocity.x, b.position.y + b.velocity.y);
    });
  }
}
