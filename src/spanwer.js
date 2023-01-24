import Enemy from "./enemy";

export default class Spawner {
  constructor({ app, player }) {
    this.app = app;
    this.player = player;

    this.spawns = [];
    this.spawnLimit = 1;

    this.app.setInterval(() => {
      this.spawnLimit += 1;
    }, 3);
  }

  enemyType() {
    const type = Math.floor(Math.random() * 4) + 1;

    switch (type) {
      case 1:
        return { speed: 0.5, color: 0x0302fc, enemyRadius: 18 };
      case 2:
        return { speed: 1, color: 0x63009e, enemyRadius: 17 };
      case 3:
        return { speed: 1.5, color: 0xa1015d, enemyRadius: 16 };
      case 4:
        return { speed: 2, color: 0xfe0002, enemyRadius: 15 };

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
    let spawn = new Enemy({ app, enemyRadius, ...enemyProperties });
    this.spawns.push(spawn);
  }
}
