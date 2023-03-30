class Enemies {
  constructor(scene) {
    this.scene = scene;
    this.enemies = scene.physics.add.group();
    this.enemySpawnInterval = 500;
    this.shouldSpawn = true;

    scene.time.addEvent({
      delay: this.enemySpawnInterval,
      callback: () => this.spawnEnemies(),
      callbackScope: scene,
      loop: true,
    });

    this.enemyTypes = [
      { color: 0x00ff00, health: 1, points: 10, velocity: 75 },
      { color: 0x0000ff, health: 2, points: 20, velocity: 100 },
      { color: 0xffff00, health: 3, points: 30, velocity: 125 },
      { color: 0xff00ff, health: 4, points: 40, velocity: 150 },
    ];
  }

  spawnEnemies() {
    if (!gameStarted) return;
    if (!this.shouldSpawn) return;

    this.generateEnemyType();

    this.shouldSpawn = false;
  }

  generateEnemyType() {
    const randomEnemyChoice = Phaser.Math.Between(0, 3);
    const enemyType = this.enemyTypes[randomEnemyChoice];
    const enemy = this.enemies.create(0, 0, "enemy");

    enemy.setScale(0.1);
    enemy.setTint(enemyType.color);
    enemy.setData("health", enemyType.health);
    enemy.setData("points", enemyType.points);
    enemy.setData("velocity", enemyType.velocity);
    enemy.setOrigin(0.1);
    enemy.setCollideWorldBounds(true);
    enemy.x = Phaser.Math.Between(0, this.scene.physics.world.bounds.width);
    enemy.y = Phaser.Math.Between(0, this.scene.physics.world.bounds.height);

    this.shoot(enemy);
  }

  shoot(enemy) {
    new Bullet(this.scene, enemy, player, player, 500);
  }
}
