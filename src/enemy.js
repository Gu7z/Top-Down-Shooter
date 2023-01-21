import * as PIXI from "pixi.js";
import Victor from "victor";

export default class Enemy {
  constructor({ app, enemyRadius }) {
    this.app = app;
    this.speed = 1;

    this.enemy = new PIXI.Graphics();
    this.enemy.beginFill(0xff0000, 1);
    this.enemy.drawCircle(0, 0, enemyRadius);
    this.enemy.endFill();

    this.resetPosition();

    app.stage.addChild(this.enemy);
  }

  resetPosition() {
    const randomPosition = this.randomPosition();
    this.enemy.position.set(randomPosition.x, randomPosition.y);
  }

  randomPosition() {
    const { width, height } = this.app.screen;
    let edge = Math.floor(Math.random() * 4);
    let spawnPoint = new Victor(0, 0);

    switch (edge) {
      case 0:
        spawnPoint.x = width * Math.random();
        break;
      case 1:
        spawnPoint.x = width;
        spawnPoint.y = height * Math.random();
        break;
      case 2:
        spawnPoint.x = width * Math.random();
        spawnPoint.y = height;
        break;
      case 3:
        spawnPoint.y = height * Math.random();
        break;
      default:
        break;
    }

    return spawnPoint;
  }

  removePlayerLife(player, spanwer) {
    player.lifes -= 1;
    spanwer.reset();
  }

  goToPlayer(player, spanwer) {
    const playerSquare = player.player;

    const enemyPosition = new Victor(
      this.enemy.position.x,
      this.enemy.position.y
    );
    const playerPosition = new Victor(
      playerSquare.position.x,
      playerSquare.position.y
    );

    const isHittingPlayer =
      enemyPosition.distance(playerPosition) < playerSquare.width / 2;
    if (isHittingPlayer) {
      this.removePlayerLife(player, spanwer);

      return;
    }

    const distance = playerPosition.subtract(enemyPosition);
    const velocity = distance.normalize().multiplyScalar(this.speed);

    this.enemy.position.set(
      this.enemy.position.x + velocity.x,
      this.enemy.position.y + velocity.y
    );
  }

  kill() {
    this.enemy.destroy();
  }

  update(player, spanwer) {
    if (this.enemy.destroyed) return;
    this.goToPlayer(player, spanwer);
  }
}
