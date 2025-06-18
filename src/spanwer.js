import Enemy from "./enemy.js";

export default class Spawner {
  constructor({ app, player }) {
    this.app = app;
    this.player = player;

    this.spawns = [];
    this.spawnLimit = 1;
    this.bossRadius = 25;
    this.alreadySpawnedBosses = new Set();

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

  calculateSpeed(speed, bossAmmoutToSpawn) {
    if (bossAmmoutToSpawn < 1) return speed;

    return Math.min(speed * bossAmmoutToSpawn, 1.75);
  }

  enemyType() {
    const pointsToBoss = 50;
    const shouldSpawnBoss = this.player.points % pointsToBoss === 0;
    const playerHasPoints = this.player.points > 0;
    const ammoutToSpawn = Math.floor(this.player.points / pointsToBoss);
    const bossAlreadySpawned = this.alreadySpawnedBosses.has(
      this.player.points
    );

    if (shouldSpawnBoss && playerHasPoints && !bossAlreadySpawned) {
      this.alreadySpawnedBosses.add(this.player.points);

      return this.enemyClass(
        1,
        0xffc0cb,
        this.bossRadius,
        10 * ammoutToSpawn,
        10,
        ammoutToSpawn
      );
    }

    const type = Math.floor(Math.random() * 13) + 1;

    let speed;
    switch (type) {
      case 1:
      case 2:
      case 3:
        speed = this.calculateSpeed(0.5, ammoutToSpawn);
        return this.enemyClass(speed, 0x0302fc, 18, 4);
      case 4:
      case 5:
      case 6:
        speed = this.calculateSpeed(1, ammoutToSpawn);
        return this.enemyClass(speed, 0x63009e, 17, 3);
      case 7:
      case 8:
      case 9:
        speed = this.calculateSpeed(1.5, ammoutToSpawn);
        return this.enemyClass(speed, 0xa1015d, 16, 2);
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
