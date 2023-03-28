// game.js
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#000",
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
};

const game = new Phaser.Game(config);
let player,
  bullets,
  enemies,
  bosses,
  cursors,
  scoreText,
  gameOverText,
  menuText,
  startButton;
let bossAmount = 1;
let score = 0;
let bossSpawnThreshold = 500;
let gameStarted = false;
let bulletInterval = 150;
let enemySpawnInterval = 1000;
const rotationOffset = Math.PI / 2;

function preload() {
  this.load.image("player", "https://i.imgur.com/bFWTpaL.png");
  this.load.image("enemy", "https://i.imgur.com/bFWTpaL.png");
  this.load.image("boss", "https://i.imgur.com/bFWTpaL.png");
}

function create() {
  // Create Player
  player = this.physics.add.sprite(400, 300, "player");
  player.setCollideWorldBounds(true);
  player.visible = false;
  player.setScale(0.1);

  // Create Bullets
  bullets = this.physics.add.group({
    classType: Phaser.Physics.Arcade.Image,
    runChildUpdate: true,
  });

  // Create Enemies
  enemies = this.physics.add.group();

  // Create Bosses
  bosses = this.physics.add.group();

  // Create Cursor Keys
  cursors = this.input.keyboard.addKeys("W,A,S,D");

  // Create Score Text
  scoreText = this.add.text(16, 16, "score: 0", {
    fontSize: "32px",
    fill: "#fff",
  });

  // Create Game Over Text
  gameOverText = this.add.text(250, 250, "GAME OVER", {
    fontSize: "48px",
    fill: "#ff0000",
  });
  gameOverText.visible = false;

  // Create Menu Text
  menuText = this.add.text(250, 150, "Shooter Game", {
    fontSize: "48px",
    fill: "#fff",
  });

  // Create Start Button
  startButton = this.add.text(325, 300, "START", {
    fontSize: "32px",
    fill: "#fff",
  });
  startButton.setInteractive();
  startButton.on("pointerdown", () => {
    bullets.clear(true);
    enemies.clear(true);
    player.visible = false;
    bosses.clear(true);
    gameStarted = true;
    menuText.visible = false;
    startButton.visible = false;
    player.visible = true;
    gameOverText.visible = false;
  });

  // Enemy Spawning
  this.time.addEvent({
    delay: enemySpawnInterval,
    callback: spawnEnemies,
    callbackScope: this,
    loop: true,
  });

  // Bullet Firing
  this.time.addEvent({
    delay: bulletInterval,
    callback: fireBullet,
    callbackScope: this,
    loop: true,
  });

  // Collisions
  this.physics.add.collider(bullets, enemies, bulletEnemyCollision, null, this);
  this.physics.add.collider(bullets, bosses, bulletBossCollision, null, this);
  this.physics.add.collider(player, enemies, playerEnemyCollision, null, this);
  this.physics.add.collider(player, bosses, playerEnemyCollision, null, this);
}

function update() {
  if (!gameStarted) return;

  // Player Movement
  const speed = 200;
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

  // Player rotation
  const pointer = this.input.activePointer;
  const angle = Phaser.Math.Angle.Between(
    player.x,
    player.y,
    pointer.x,
    pointer.y
  );
  player.rotation = angle + rotationOffset;

  // Update enemy movements
  //  enemies.children.iterate(function (enemy) {
  //    if (enemy) {
  //      this.physics.moveToObject(enemy, player, enemy.getData("velocity"));
  //      enemy.rotation =
  //        Phaser.Math.Angle.BetweenPoints(enemy, player) + rotationOffset;
  //    }
  //  }, this);
  //
  //  // Update boss movements
  //  bosses.children.iterate(function (boss) {
  //    if (boss) {
  //      const randomX = Phaser.Math.Between(0, this.physics.world.bounds.width);
  //      const randomY = Phaser.Math.Between(0, this.physics.world.bounds.height);
  //      this.physics.moveTo(boss, randomX, randomY, boss.getData("velocity"));
  //      boss.rotation =
  //        Phaser.Math.Angle.BetweenPoints(boss, player) + rotationOffset;
  //    }
  //  }, this);
}

function fireBullet() {
  if (!gameStarted) return;

  const bullet = bullets.get();
  if (bullet) {
    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.setScale(0.3);
    bullet.body.reset(player.x, player.y);
    bullet.rotation = player.rotation;
    const pointer = this.input.activePointer;
    this.physics.moveTo(bullet, pointer.x, pointer.y, 300);
    bullet.setData("damage", 1);
  }
}

function spawnEnemies() {
  if (!gameStarted || bosses.countActive(true) > 0) return;

  const enemyType = Phaser.Math.Between(1, 4);
  const enemy = enemies.create(0, 0, "enemy");
  enemy.setScale(0.1);
  enemy.setTint(getEnemyColor(enemyType));
  enemy.setData("type", enemyType);
  enemy.setData("health", getEnemyHealth(enemyType));
  enemy.setData("points", getEnemyPoints(enemyType));
  enemy.setData("velocity", getEnemyVelocity(enemyType));
  enemy.setOrigin(0.5);
  enemy.setCollideWorldBounds(true);
  enemy.x = Phaser.Math.Between(0, this.physics.world.bounds.width);
  enemy.y = Phaser.Math.Between(0, this.physics.world.bounds.height);

  // Spawn boss if necessary
  if (score >= bossSpawnThreshold) {
    for (let i = 0; i < bossAmount; i++) {
      spawnBoss.call(this);
    }
    bossSpawnThreshold += 500;
    bossAmount++;
  }
}

function spawnBoss() {
  const boss = bosses.create(0, 0, "boss");
  boss.setScale(0.3);
  boss.setTint(0xff0000);
  boss.setData("health", 100);
  boss.setData("points", 100);
  boss.setData("velocity", 200);
  boss.setCollideWorldBounds(true);
  boss.x = Phaser.Math.Between(0, this.physics.world.bounds.width);
  boss.y = Phaser.Math.Between(0, this.physics.world.bounds.height);
  enemies.clear(true);
}

function bulletEnemyCollision(bullet, enemy) {
  bullet.setActive(false);
  bullet.setVisible(false);
  bullet.body.reset(0, 0);
  enemy.setData("health", enemy.getData("health") - bullet.getData("damage"));
  if (enemy.getData("health") <= 0) {
    score += enemy.getData("points");
    enemy.destroy();
    updateScore();
    enemySpawnInterval -= 10;
  }
}

function bulletBossCollision(bullet, boss) {
  bullet.setActive(false);
  bullet.setVisible(false);
  bullet.body.reset(0, 0);
  boss.setData("health", boss.getData("health") - bullet.getData("damage"));
  if (boss.getData("health") <= 0) {
    score += boss.getData("points");
    boss.destroy();
    updateScore();
    if (bosses.countActive(true) === 0 && score >= 2000) {
      gameWon.call(this);
    }
  }
}

function playerEnemyCollision(player, enemy) {
  gameOver.call(this);
}

function updateScore() {
  scoreText.setText("score: " + score);
}

function gameOver() {
  gameStarted = false;
  gameOverText.visible = true;
  menuText.visible = true;
  startButton.visible = true;
  player.setVelocity(0, 0);
  enemies.children.iterate(function (child) {
    if (!child) return;

    child.setVelocity(0, 0);
  });
  bullets.children.iterate(function (child) {
    if (!child) return;

    child.setVelocity(0, 0);
  });
  bosses.children.iterate(function (child) {
    if (!child) return;

    child.setVelocity(0, 0);
  });

  score = 0;
  updateScore();
  bossSpawnThreshold = 500;
}

function gameWon() {
  gameOver.call(this);
  gameOverText.setText("YOU WON!");
}

function getEnemyColor(type) {
  switch (type) {
    case 1:
      return 0x00ff00;
    case 2:
      return 0x0000ff;
    case 3:
      return 0xffff00;
    case 4:
      return 0xff00ff;
    default:
      return 0xffffff;
  }
}

function getEnemyHealth(type) {
  return type;
}

function getEnemyPoints(type) {
  return type * 10;
}

function getEnemyVelocity(type) {
  return 50 + type * 25;
}
