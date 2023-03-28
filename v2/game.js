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

function preload() {
  this.load.image("player", "https://i.imgur.com/bFWTpaL.png");
  this.load.image("enemy", "https://i.imgur.com/bFWTpaL.png");
  this.load.image("boss", "https://i.imgur.com/bFWTpaL.png");
}

function create() {
  player = new Player(this);
  ui = new UI(this, player.healthPoints);
}

function update() {
  player.update(this);
}
