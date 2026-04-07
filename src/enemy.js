import Victor from "victor";

export default class Enemy {
  constructor({ app, enemyRadius, speed, color, life, value, container, typeId = "unknown", isBoss = false, behaviorType = "melee", enemyBullets = null }) {
    this.app = app;
    this.baseSpeed = speed;
    this.speed = speed;
    this.life = life;
    this.value = value;
    this.enemyRadius = enemyRadius;
    this.typeId = typeId;
    this.isBoss = isBoss;
    this.behaviorType = behaviorType; // "melee" or "ranged"
    this.enemyBullets = enemyBullets; // Reference to global enemy bullets array
    this.color = color;

    // Control effect state
    this.frozen = false;
    this.freezeTimer = 0;
    this.damageMultiplier = 1;
    this.controlTimers = [];
    this.contactCooldown = 0;

    // AI State for ranged enemies
    this.aiState = "aproximar"; // aproximar, strafe, recuar
    this.aiTimer = 0;
    this.strafeDirection = Math.random() > 0.5 ? 1 : -1;
    this.shootCooldown = 0;

    const textColor = [0xffffff, 0xffc0cb, 0xffdd00].includes(color) ? 0x000000 : 0xffffff;
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
        spawnPoint.y = -50;
        break;
      case 1:
        spawnPoint.x = width + 50;
        spawnPoint.y = height * Math.random();
        break;
      case 2:
        spawnPoint.x = width * Math.random();
        spawnPoint.y = height + 50;
        break;
      case 3:
        spawnPoint.x = -50;
        spawnPoint.y = height * Math.random();
        break;
      default:
        break;
    }

    return spawnPoint;
  }

  applyControlEffects(controlEffects, durationMultiplier = 1) {
    if (!controlEffects) return;

    const baseDuration = 120; // ~2 seconds at 60fps
    const duration = Math.ceil(baseDuration * durationMultiplier);

    // Freeze
    if (controlEffects.freezeChance && Math.random() < controlEffects.freezeChance) {
      if (!this.frozen) {
        this.frozen = true;
        this.freezeTimer = duration;
        this.enemy.tint = 0x88ccff;
        this.enemyLifeText.style.fill = 0x002244;
      }
    }

    // Enemy weaken
    if (controlEffects.enemyWeakenMultiplier && controlEffects.enemyWeakenMultiplier > 1) {
      this.damageMultiplier *= controlEffects.enemyWeakenMultiplier;
      this.controlTimers.push({
        type: "weaken",
        timer: duration,
        value: controlEffects.enemyWeakenMultiplier,
      });
    }

    // Knockback
    if (controlEffects.knockbackBonus && controlEffects.knockbackBonus > 0 && controlEffects.knockbackDirection) {
      const kb = controlEffects.knockbackBonus;
      const dir = controlEffects.knockbackDirection;
      this.enemy.position.set(
        this.enemy.position.x + dir.x * kb,
        this.enemy.position.y + dir.y * kb
      );
      this.enemyLifeText.position.set(
        this.enemyLifeText.position.x + dir.x * kb,
        this.enemyLifeText.position.y + dir.y * kb
      );
    }
  }

  updateControlTimers() {
    if (this.contactCooldown > 0) this.contactCooldown -= 1;

    if (this.controlTimers.length === 0) return;

    this.controlTimers = this.controlTimers.filter((entry) => {
      entry.timer -= 1;
      if (entry.timer <= 0) {
        if (entry.type === "weaken") {
          this.damageMultiplier /= entry.value;
        }
        return false;
      }
      return true;
    });
  }

  removePlayerLife(player, spanwer, effects) {
    if (this.contactCooldown > 0) return;

    // Heavy enemy (>10 HP): damage player once + knockback both, never forceKill
    if (this.life > 10) {
      const damaged = player.takeDamage?.(1, effects);
      if (damaged === undefined) player.lifes -= 1;
      // Always apply knockback and cooldown regardless of invulnerability
      this.contactCooldown = 90;
      this._applyCollisionKnockback(player);
      if (effects) {
        effects.shake(6);
        effects.explosion(player.player.position.x, player.player.position.y, 0xff2d55, 18);
        effects.pulse(player.player, 0xff2d55, 12);
      }
      return;
    }

    // Light enemy: player invulnerable → 10 contact damage to enemy
    const damaged = player.takeDamage?.(1, effects);

    if (damaged === false) {
      this.contactCooldown = 90;
      const index = spanwer.spawns.indexOf(this);
      if (index > -1) {
        this.kill(spanwer.spawns, index, player, effects, 10);
      }
      return;
    }

    if (damaged === undefined) player.lifes -= 1;

    this.forceKill();
    const index = spanwer.spawns.indexOf(this);
    if (index > -1) spanwer.spawns.splice(index, 1);

    if (effects) {
      effects.shake(8);
      effects.explosion(player.player.position.x, player.player.position.y, 0xff2d55, 24);
      effects.pulse(player.player, 0xff2d55, 15);
    }
  }

  _applyCollisionKnockback(player) {
    const dx = player.player.position.x - this.enemy.position.x;
    const dy = player.player.position.y - this.enemy.position.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = dx / len;
    const ny = dy / len;

    const playerKb = 90;
    const enemyKb  = 50;

    player.player.x += nx * playerKb;
    player.player.y += ny * playerKb;

    this.enemy.position.set(
      this.enemy.position.x - nx * enemyKb,
      this.enemy.position.y - ny * enemyKb
    );
    this.enemyLifeText.position.set(this.enemy.position.x, this.enemy.position.y);
  }

  updateRanged(player, spanwer, effects) {
    const playerSquare = player.player;
    const enemyPosition = new Victor(this.enemy.position.x, this.enemy.position.y);
    const playerPosition = new Victor(playerSquare.position.x, playerSquare.position.y);
    const dist = enemyPosition.distance(playerPosition);

    if (dist < playerSquare.width / 2) {
      this.removePlayerLife(player, spanwer, effects);
      return;
    }

    // AI decision cycle every ~30 frames
    this.aiTimer -= 1;
    if (this.aiTimer <= 0) {
      this.aiTimer = 30 + Math.random() * 10;
      if (dist < 150) {
        this.aiState = "recuar";
      } else if (dist >= 150 && dist <= 300) {
        this.aiState = "strafe";
        if (Math.random() > 0.8) {
          this.strafeDirection *= -1; // Sometimes change strafe direction
        }
      } else {
        this.aiState = "aproximar";
      }
    }

    // Movement execution
    let velocity;

    const distanceVec = playerPosition.clone().subtract(enemyPosition);
    distanceVec.normalize();

    if (this.aiState === "recuar") {
      velocity = distanceVec.clone().invert().multiplyScalar(this.speed);
    } else if (this.aiState === "strafe") {
      // Orthogonal vector for strafing
      velocity = new Victor(-distanceVec.y * this.strafeDirection, distanceVec.x * this.strafeDirection).multiplyScalar(this.speed * 0.8);

      // Slight pull towards player so it doesn't drift off screen completely
      velocity.add(distanceVec.clone().multiplyScalar(this.speed * 0.15));
    } else {
      // "aproximar"
      velocity = distanceVec.clone().multiplyScalar(this.speed);
    }

    // Add tiny random variation so movement isn't perfectly rigid
    velocity.rotateDeg((Math.random() - 0.5) * 15);

    this.enemy.position.set(this.enemy.position.x + velocity.x, this.enemy.position.y + velocity.y);
    this.enemyLifeText.position.set(this.enemy.position.x, this.enemy.position.y);
    this.enemyLifeText.text = this.life;

    // Shooting mechanics
    this.shootCooldown -= 1;
    if (this.shootCooldown <= 0 && this.enemyBullets) {
      this.shootCooldown = this.typeId === "artilheiro" ? 260 : 180; // ~4.3s for artilheiro, 3s for atirador
      this.fireBullet(playerPosition);
    }
  }

  fireBullet(playerPosition) {
    if (!this.enemyBullets) return;

    // Fire sound via Pixi Sound if we want
    // (Optional: add a muffled laser sound later)

    const enemyPos = { x: this.enemy.position.x, y: this.enemy.position.y };
    
    // Import EnemyBullet directly here to avoid circular dep issues. Wait, I'll pass a bullet class instance or just create it.
    // Better yet: spawner creates the bullet, enemy just triggers an event. Or enemy dynamically imports/requires it.
    // I can just pass the bullet constructor to Enemy or use a global.
    let BulletClass;
    if (typeof window !== "undefined" && window.EnemyBulletClass) {
      BulletClass = window.EnemyBulletClass;
    }
    
    if (this.typeId === "artilheiro") {
      // 3 projectiles in an arc
      for (let i = -1; i <= 1; i++) {
        const spreadRad = i * 0.25;
        const targetPos = playerPosition.clone().subtract(new Victor(enemyPos.x, enemyPos.y)).rotate(spreadRad).add(new Victor(enemyPos.x, enemyPos.y));
        if (BulletClass) {
           this.enemyBullets.push(new BulletClass({
             app: this.app,
             position: enemyPos,
             targetPosition: targetPos,
             color: this.color
           }));
        }
      }
    } else {
      // Single bullet with slight inaccuracy
      const inaccuracy = (Math.random() - 0.5) * 0.1; // ±0.05 rad
      const targetPos = playerPosition.clone().subtract(new Victor(enemyPos.x, enemyPos.y)).rotate(inaccuracy).add(new Victor(enemyPos.x, enemyPos.y));
      if (BulletClass) {
        this.enemyBullets.push(new BulletClass({
          app: this.app,
          position: enemyPos,
          targetPosition: targetPos,
          color: this.color
        }));
      }
    }
  }

  goToPlayer(player, spanwer, effects) {
    const playerSquare = player.player;
    const enemyPosition = new Victor(this.enemy.position.x, this.enemy.position.y);
    const playerPosition = new Victor(playerSquare.position.x, playerSquare.position.y);

    const isHittingPlayer = player.collidesWithCircle(this.enemy.position.x, this.enemy.position.y, this.enemyRadius);
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
    const effectiveDamage = Math.ceil(damage * this.damageMultiplier);

    if (this.life > effectiveDamage) {
      this.life -= effectiveDamage;
      return;
    }

    this.life = 0;
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

  forceKill() {
    this.enemy.visible = false;
    this.enemyLifeText.visible = false;
    this.enemy.destroy();
    this.enemyLifeText.destroy();
  }

  update(player, spanwer, effects) {
    if (this.enemy.destroyed) return;


    if (this.frozen) {
      this.enemyLifeText.text = this.life;
      this.freezeTimer -= 1;
      if (this.freezeTimer <= 0) {
        this.frozen = false;
        this.enemy.tint = 0xffffff;
        this.enemyLifeText.style.fill = [0xffffff, 0xffc0cb, 0xffdd00].includes(this.color) ? 0x000000 : 0xffffff;
      } else {
        return;
      }
    }

    this.updateControlTimers();

    if (this.behaviorType === "ranged") {
      this.updateRanged(player, spanwer, effects);
    } else {
      this.goToPlayer(player, spanwer, effects);
    }
  }
}
