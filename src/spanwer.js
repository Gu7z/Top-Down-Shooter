import Enemy from "./enemy";

export default class Spawner {
  constructor({ app, player }) {
    this.app = app;
    this.player = player;

    this.spawns = [];
    this.spawnLimit = 1;

    this.spawnerContainer = new PIXI.Container();

    this.app.setInterval(() => {
      this.spawnLimit += 1;
    }, 5);
  }

  enemyType() {
    const type = Math.floor(Math.random() * 13) + 1;

    switch (type) {
      case 1:
      case 2:
      case 3:
        return { speed: 0.5, color: 0x0302fc, enemyRadius: 18 };
      case 4:
      case 5:
      case 6:
        return { speed: 1, color: 0x63009e, enemyRadius: 17 };
      case 7:
      case 8:
      case 9:
        return { speed: 1.5, color: 0xa1015d, enemyRadius: 16 };
      case 10:
      case 11:
      case 12:
        return { speed: 2, color: 0xfe0002, enemyRadius: 15 };
      case 13:
        return { speed: 2.5, color: 0xffffff, enemyRadius: 14 };
      default:
        break;
    }
  }

  reset() {
    this.spawns.forEach((spawn) => spawn.kill());
    this.spawns = [];
  }

  update(player) {
    if (this.spawns.length >= this.spawnLimit) return;
    if (player.lifes < 1) return;

    const { app, enemyRadius } = this;
    const enemyProperties = this.enemyType();
    let spawn = new Enemy({
      app,
      enemyRadius,
      ...enemyProperties,
      container: this.spawnerContainer,
    });
    this.spawns.push(spawn);
  }
}
