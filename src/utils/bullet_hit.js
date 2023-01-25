const bulletHit = (bullets, enemies, bulletRadius, player) => {
  bullets.forEach((bullet, indexBullet) => {
    enemies.forEach((enemy, indexEnemy) => {
      let distanceX = enemy.enemy.position.x - bullet.position.x;
      let distancey = enemy.enemy.position.y - bullet.position.y;
      let distance = Math.sqrt(distanceX * distanceX + distancey * distancey);

      if (distance < bulletRadius + enemy.enemyRadius) {
        enemy.kill(enemies, indexEnemy, player);

        bullet.visible = false;
        bullets.splice(indexBullet, 1);

        if (player.points % 10 === 0) {
          PIXI.sound.Sound.from("sound/reward.mp3").play();
        }

        return;
      }
    });
  });
};

export default bulletHit;
