class HealthBar extends Phaser.GameObjects.Graphics {
  constructor(scene, maxHealth, x, y, width = 100, height = 10) {
    super(scene);
    scene.add.existing(this);

    // Set health bar properties
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.maxHealth = maxHealth;
    this.currentHealth = this.maxHealth;

    // Draw health bar
    this.fillStyle(0xff0000);
    this.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    this.fillStyle(0x00ff00);
    this.fillRect(
      -this.width / 2,
      -this.height / 2,
      (this.width * this.currentHealth) / this.maxHealth,
      this.height
    );

    this.depth = 1;
  }

  updateHealth(health) {
    // Update health bar
    this.currentHealth = health;
    this.clear();
    this.fillStyle(0xff0000);
    this.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    this.fillStyle(0x00ff00);
    this.fillRect(
      -this.width / 2,
      -this.height / 2,
      (this.width * this.currentHealth) / this.maxHealth,
      this.height
    );
  }

  updateLocation(x, y) {
    this.x = x;
    this.y = y - 42;
  }

  update(x, y, health, visible) {
    this.updateLocation(x, y);
    this.updateHealth(health);
    this.visible = visible;
  }
}
