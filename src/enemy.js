import Victor from "victor";

export default class Enemy {
  constructor({ app, enemyRadius, speed, color, life, value, container }) {
    this.app = app;
    this.speed = speed;
    this.life = life;
    this.value = value;
    this.enemyRadius = enemyRadius;

    const textColor = [0xffffff, 0xffc0cb].includes(color)
      ? 0x000000
      : 0xffffff;
    this.enemy = new PIXI.Graphics();
    this.enemy.beginFill(color, 1);
    this.enemy.drawCircle(0, 0, enemyRadius);
    this.enemy.endFill();
    this.enemyLifeText = new PIXI.Text(this.life, {
      fill: textColor,
    });
    this.enemyLifeText.position.set(0, 0);
    this.enemyLifeText.anchor.set(0.5);

    this.resetPosition();

    container.addChild(this.enemy);
    container.addChild(this.enemyLifeText);
    app.stage.addChild(container);
  }

  resetPosition() {
    const randomPosition = this.randomPosition();
    this.enemy.position.set(randomPosition.x, randomPosition.y);
    this.enemyLifeText.position.set(randomPosition.x, randomPosition.y);
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

    const newX = this.enemy.position.x + velocity.x;
    const newY = this.enemy.position.y + velocity.y;

    this.enemy.position.set(newX, newY);
    this.enemyLifeText.position.set(newX, newY);

    this.enemyLifeText.text = this.life;
  }

  kill(enemies, indexEnemy, player) {
    if (this.life > 1) {
      this.life -= 1;
    } else {
      if (enemies) {
        player.points += this.value;
        this.enemy.visible = false;
        this.enemyLifeText.visible = false;
        enemies.splice(indexEnemy, 1);
      }
    }
  }

  update(player, spanwer) {
    if (this.enemy.destroyed) return;
    this.goToPlayer(player, spanwer);
  }
}
