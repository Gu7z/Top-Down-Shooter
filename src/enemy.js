import Victor from "victor";

export default class Enemy {
  constructor({ app, enemyRadius, speed, color, life, value, container, typeId = "unknown", isBoss = false }) {
    this.app = app;
    this.speed = speed;
    this.life = life;
    this.value = value;
    this.enemyRadius = enemyRadius;
    this.typeId = typeId;
    this.isBoss = isBoss;

    const textColor = [0xffffff, 0xffc0cb].includes(color) ? 0x000000 : 0xffffff;
    this.enemy = new PIXI.Graphics();
    this.enemy.beginFill(color, 1);
    this.enemy.drawCircle(0, 0, enemyRadius);
    this.enemy.endFill();

    this.enemyLifeText = new PIXI.Text(this.life, {
      fill: textColor,
      fontWeight: "bold",
      fontSize: Math.max(12, enemyRadius),
    });
    this.enemyLifeText.position.set(0, 0);
    this.enemyLifeText.anchor.set(0.5);

    this.resetPosition();

    container.addChild(this.enemy);
    container.addChild(this.enemyLifeText);
    if (!app.stage.children.includes(container)) {
      app.stage.addChild(container);
    }
  }

  resetPosition() {
    const randomPosition = this.randomPosition();
    this.enemy.position.set(randomPosition.x, randomPosition.y);
    this.enemyLifeText.position.set(randomPosition.x, randomPosition.y);
  }

  randomPosition() {
    const { width, height } = this.app.screen;
    const edge = Math.floor(Math.random() * 4);
    const spawnPoint = new Victor(0, 0);

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

  removePlayerLife(player, spanwer, effects) {
    player.lifes -= 1;
    spanwer.reset();
    if (effects) {
      effects.shake(8);
      effects.explosion(player.player.position.x, player.player.position.y, 0xff2d55, 24);
      effects.pulse(player.player, 0xff2d55, 15);
    }
  }

  goToPlayer(player, spanwer, effects) {
    const playerSquare = player.player;

    const enemyPosition = new Victor(this.enemy.position.x, this.enemy.position.y);
    const playerPosition = new Victor(playerSquare.position.x, playerSquare.position.y);

    const isHittingPlayer = enemyPosition.distance(playerPosition) < playerSquare.width / 2;
    if (isHittingPlayer) {
      this.removePlayerLife(player, spanwer, effects);

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

  kill(enemies, indexEnemy, player, effects, damage = 1) {
    if (this.life > damage) {
      this.life -= damage;
      return;
    }

    if (!enemies) return;

    const scoreMultiplier = player.skillEffects?.scoreMultiplier || 1;
    player.points += Math.ceil(this.value * scoreMultiplier);
    player.runStats?.recordKill?.({
      typeId: this.typeId,
      value: this.value,
      isBoss: this.isBoss,
    });
    if (effects) {
      effects.explosion(this.enemy.position.x, this.enemy.position.y, 0xfff275, 18);
      effects.shake(3.5);
    }

    this.enemy.visible = false;
    this.enemyLifeText.visible = false;
    enemies.splice(indexEnemy, 1);
  }

  update(player, spanwer, effects) {
    if (this.enemy.destroyed) return;
    this.goToPlayer(player, spanwer, effects);
  }
}
