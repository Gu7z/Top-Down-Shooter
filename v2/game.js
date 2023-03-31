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

let player, bullets, enemies, bosses, ui;
let ROTATION_OFFSET = Math.PI / 2;
let gameStarted = false;

function preload() {
  this.load.image("player", "https://i.imgur.com/bFWTpaL.png");
  this.load.image("enemy", "https://i.imgur.com/bFWTpaL.png");
  this.load.image("boss", "https://i.imgur.com/bFWTpaL.png");
}

function create() {
  const pointer = this.input.activePointer;

  player = new Player(this);
  ui = new UI(this, player.getData("health"));
  enemies = new Enemies(this);
  bullets = new Bullet(this, player, pointer, enemies.enemies);

  this.physics.add.collider(
    bullets.bullets,
    enemies.enemies,
    (bullet, enemy) => {
      const bulletDamage = bullets.bulletDamage;
      const enemyValue = enemy.getData("points");
      const addScore = () => ui.updateScore(enemyValue);

      bullets.destroyBullet(bullet);
      enemies.damage(enemy, bulletDamage, addScore);
    },
    null,
    this
  );
}

function update() {
  player.update(this);
  ui.updateHealth(player.getData("health"));
  enemies.update();
}
