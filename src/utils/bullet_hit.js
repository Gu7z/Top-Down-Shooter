const bulletHit = (bullet, enemies, bulletRadius, player) => {
  enemies.forEach((enemy, indexEnemy) => {
    if (bullet.destroyed) return;
    let distanceX = enemy.enemy.position.x - bullet.position.x;
    let distancey = enemy.enemy.position.y - bullet.position.y;
    let distance = Math.sqrt(distanceX * distanceX + distancey * distancey);

    if (distance < bulletRadius + enemy.enemyRadius) {
      enemy.kill(enemies, indexEnemy, player);

      bullet.visible = false;
      bullet.destroy();

      if (player.points % 10 === 0) {
        PIXI.sound.Sound.from("sound/reward.mp3").play();
      }

      return;
    }
  });
};

export default bulletHit;
