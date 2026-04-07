const bulletHit = (bullet, enemies, bulletRadius, player, effects) => {
  enemies.forEach((enemy, indexEnemy) => {
    if (bullet.destroyed) return;
    const distanceX = enemy.enemy.position.x - bullet.position.x;
    const distanceY = enemy.enemy.position.y - bullet.position.y;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    if (distance < bulletRadius + enemy.enemyRadius) {
      player.runStats?.recordShotHit?.();

      // Calculate knockback direction from bullet to enemy
      const controlEffects = bullet.controlEffects ? { ...bullet.controlEffects } : null;
      if (controlEffects && controlEffects.knockbackBonus > 0) {
        const knockLen = Math.hypot(distanceX, distanceY) || 1;
        controlEffects.knockbackDirection = {
          x: distanceX / knockLen,
          y: distanceY / knockLen,
        };
      }

      // Apply control effects to the hit enemy
      const durationMultiplier = bullet.controlDurationMultiplier || 1;
      if (enemy.applyControlEffects) {
        enemy.applyControlEffects(controlEffects, durationMultiplier);
      }

      // Chain pulse: apply control effects to nearby enemies
      const chainRadius = bullet.chainPulseRadius || 0;
      if (chainRadius > 0 && controlEffects) {
        enemies.forEach((nearbyEnemy, nearbyIndex) => {
          if (nearbyIndex === indexEnemy) return;
          if (nearbyEnemy.enemy.destroyed) return;
          const nDx = nearbyEnemy.enemy.position.x - enemy.enemy.position.x;
          const nDy = nearbyEnemy.enemy.position.y - enemy.enemy.position.y;
          const nearbyDist = Math.sqrt(nDx * nDx + nDy * nDy);
          if (nearbyDist <= chainRadius) {
            const chainControl = { ...controlEffects };
            // No knockback for chain targets, just slow/weaken
            delete chainControl.knockbackBonus;
            delete chainControl.knockbackDirection;
            if (nearbyEnemy.applyControlEffects) {
              nearbyEnemy.applyControlEffects(chainControl, durationMultiplier);
            }
            if (effects) {
              effects.pulse(nearbyEnemy.enemy, 0x5cc8ff, 6);
            }
          }
        });
      }

      if (bullet.source === 'drone' && player.skillEffects?.droneBountyBonus) {
        player.points += enemy.value; // Drone kills give 100% extra points
      }
      enemy.kill(enemies, indexEnemy, player, effects, bullet.damage || 1);

      if (effects) {
        const pulseColor = bullet.isCrit ? 0xff4d4d : 0xffffff;
        const explosionColor = bullet.isCrit ? 0xff2d55 : 0xffa940;
        const shakeAmount = bullet.isCrit ? 4.0 : 2.4;
        effects.pulse(enemy.enemy, pulseColor, 6);
        effects.explosion(bullet.position.x, bullet.position.y, explosionColor, bullet.isCrit ? 16 : 10);
        effects.shake(shakeAmount);
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
