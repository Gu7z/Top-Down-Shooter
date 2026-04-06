const bulletHit = (bullet, enemies, bulletRadius, player, effects) => {
  enemies.forEach((enemy, indexEnemy) => {
    if (bullet.destroyed) return;
    const distanceX = enemy.enemy.position.x - bullet.position.x;
    const distanceY = enemy.enemy.position.y - bullet.position.y;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    if (distance < bulletRadius + enemy.enemyRadius) {
      player.runStats?.recordShotHit?.();
      enemy.kill(enemies, indexEnemy, player, effects, bullet.damage || 1);
      if (effects) {
        effects.pulse(enemy.enemy, 0xffffff, 6);
        effects.explosion(bullet.position.x, bullet.position.y, 0xffa940, 10);
        effects.shake(2.4);
      }

      bullet.visible = false;
      bullet.destroy();

      if (player.points % 10 === 0) {
        PIXI.sound.Sound.from("sound/reward.mp3").play();
      }
    }
  });
};

export default bulletHit;
