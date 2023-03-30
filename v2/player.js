class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene) {
    super(scene, 400, 300, "player");

    // Add player to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set player properties
    this.setCollideWorldBounds(true);
    this.setScale(0.1);
    this.visible = false;
    this.speed = 200;

    this.setData("health", 3);
    // this.healthBar = new HealthBar(
    //   scene,
    //   this.healthPoints,
    //   this.x,
    //   this.y,
    //   40
    // );
  }

  playerMovement() {
    const { cursors } = ui;
    const { speed } = this;

    if (cursors.W.isDown) {
      player.setVelocityY(-speed);
    } else if (cursors.S.isDown) {
      player.setVelocityY(speed);
    } else {
      player.setVelocityY(0);
    }

    if (cursors.A.isDown) {
      player.setVelocityX(-speed);
    } else if (cursors.D.isDown) {
      player.setVelocityX(speed);
    } else {
      player.setVelocityX(0);
    }
  }

  lookForPointer(scene) {
    const pointer = scene.input.activePointer;
    const angle = Phaser.Math.Angle.Between(
      player.x,
      player.y,
      pointer.x,
      pointer.y
    );
    player.rotation = angle + ROTATION_OFFSET;
  }

  update(scene) {
    this.playerMovement();
    this.lookForPointer(scene);
    //this.healthBar.update(this.x, this.y, this.healthPoints, this.visible);
  }
}
