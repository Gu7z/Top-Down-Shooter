class Bullet {
  constructor(scene, shooter, target, enemies, bulletInterval = 150) {
    this.bulletInterval = bulletInterval;
    this.bulletDamage = 1;

    this.scene = scene;
    this.shooter = shooter;
    this.target = target;

    this.bullets = scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      runChildUpdate: true,
    });

    scene.time.addEvent({
      delay: 250,
      callback: () => this.fireBullet(),
      callbackScope: scene,
      loop: true,
    });

    if (!enemies) return;
    //scene.physics.add.collider(
    //  this.bullets,
    //  enemies,
    //  this.enemyCollision,
    //  null,
    //  scene
    //);
  }

  fireBullet() {
    if (!gameStarted) return;

    const bullet = this.bullets.get();
    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.setScale(0.3);
      bullet.body.reset(this.shooter.x, this.shooter.y);
      bullet.rotation = this.shooter.rotation;
      this.scene.physics.moveTo(bullet, this.target.x, this.target.y, 300);
    }
  }

  enemyCollision(bullet, enemy) {
    bullet.setActive(false);
    bullet.setVisible(false);
    bullet.body.reset(0, 0);
    //enemy.setData("health", enemy.getData("health") - bullet.bulletDamage);
  }
}
