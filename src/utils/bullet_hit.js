const bulletHit = (bullets, enemies, bulletRadius, player) => {
  bullets.forEach((bullet) => {
    enemies.forEach((enemy, index) => {
      let distanceX = enemy.enemy.position.x - bullet.position.x;
      let distancey = enemy.enemy.position.y - bullet.position.y;
      let distance = Math.sqrt(distanceX * distanceX + distancey * distancey);

      if (distance < bulletRadius + enemy.enemyRadius) {
        enemies.splice(index, 1);
        enemy.kill();

        player.points += 1;
      }
    });
  });
};

export default bulletHit;
