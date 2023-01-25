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

  enemyClass = (
    speed,
    color,
    enemyRadius,
    life,
    value = 1,
    ammoutToSpawn = 1
  ) => ({
    speed,
    color,
    enemyRadius,
    life,
    value,
    ammoutToSpawn,
  });

  enemyType() {
    if (this.player.points % 50 === 0 && this.player.points > 0) {
      const ammoutToSpawn = Math.floor(this.player.points / 50);
      return this.enemyClass(1, 0xffc0cb, 25, 10, 10, ammoutToSpawn);
    }

    const type = Math.floor(Math.random() * 13) + 1;

    switch (type) {
      case 1:
      case 2:
      case 3:
        return this.enemyClass(0.5, 0x0302fc, 18, 4);
      case 4:
      case 5:
      case 6:
        return this.enemyClass(1, 0x63009e, 17, 3);
      case 7:
      case 8:
      case 9:
        return this.enemyClass(1.5, 0xa1015d, 16, 2);
      case 10:
      case 11:
      case 12:
        return this.enemyClass(2, 0xfe0002, 15, 1);
      case 13:
        return this.enemyClass(2.5, 0xffffff, 14, 1);
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

    const { app } = this;
    const enemyProperties = this.enemyType();
    for (let index = 0; index < enemyProperties.ammoutToSpawn; index++) {
      let spawn = new Enemy({
        app,
        ...enemyProperties,
        container: this.spawnerContainer,
      });

      this.spawns.push(spawn);
    }
  }
}
