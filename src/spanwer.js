import Enemy from "./enemy";

export default class Spawner {
  constructor({ app, player }) {
    this.app = app;
    this.player = player;

    this.initialInterval = this.spawnInterval = 4000;
    this.enemyRadius = 16;
    this.spawns = [];
    this.startingSpawns = 1;

    this.interval = setInterval(() => this.spawn(player), this.initialInterval);
  }

  spawnLimit() {
    const pointsToIncreaseEnemies = 20;
    const maxSpawnsMultiplier =
      Math.floor(this.player.points / pointsToIncreaseEnemies) || 1;

    return this.startingSpawns + maxSpawnsMultiplier;
  }

  spawnTime(player) {
    clearInterval(this.interval);
    this.spawnInterval = Math.max(this.spawnInterval - 100, 0);
    this.interval = setInterval(() => this.spawn(player), this.spawnInterval);
  }

  spawn(player) {
    if (this.spawns.length >= this.spawnLimit()) return;
    if (player.lifes < 1) return;
    this.spawnTime(player);

    const { app, enemyRadius } = this;
    let spawn = new Enemy({ app, enemyRadius });
    this.spawns.push(spawn);
  }

  reset() {
    this.spawns.forEach((spawn) => spawn.kill());
    this.spawns = [];
  }
}
