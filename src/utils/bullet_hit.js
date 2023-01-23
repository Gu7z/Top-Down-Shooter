const bulletHit = (bullets, enemies, bulletRadius, player) => {
  bullets.forEach((bullet, bulletIndex) => {
    enemies.forEach((enemy, index) => {
      let distanceX = enemy.enemy.position.x - bullet.position.x;
      let distancey = enemy.enemy.position.y - bullet.position.y;
      let distance = Math.sqrt(distanceX * distanceX + distancey * distancey);

      if (distance < bulletRadius + enemy.enemyRadius) {
        enemies.splice(index, 1);
        enemy.kill();

        bullet.emit("destroy", { index: bulletIndex });

        player.points += 1;
        if (player.points % 10 === 0) {
          PIXI.sound.Sound.from("sound/reward.mp3").play();
        }
      }
    });
  });
};

export default bulletHit;
