import Victor from "victor";
import bulletHit from "./utils/bullet_hit.js";
import { createDefaultSkillEffects } from "./progression/skill_effects.js";

export default class Shooting {
  constructor({ app, player, playerSize, keys, skillEffects = {}, runStats = null, effects = null }) {
    this.app = app;
    this.player = player;
    this.playerSize = playerSize;
    this.skillEffects = { ...createDefaultSkillEffects(), ...skillEffects };
    this.runStats = runStats;
    this.bulletSpeed = 4 + this.skillEffects.bulletSpeedBonus;
    this.bullets = [];
    this.bulletRadius = 5;
    this.fireVelocity = this.skillEffects.fireVelocityMultiplier;
    this.bulletDamage = 1 + this.skillEffects.bulletDamageBonus;
    this.extraProjectiles = this.skillEffects.extraProjectiles;
    this.spreadRadians = this.skillEffects.spreadRadians;
    this.critChance = this.skillEffects.critChance;
    this.critMultiplier = this.skillEffects.critMultiplier;
    this.controlDurationMultiplier = this.skillEffects.controlDurationMultiplier;
    this.keys = keys;
    this.shooting = false;
    this.shootInterval = 0.3;
    this.shootingContainer = new PIXI.Container();
    this.app.stage.addChild(this.shootingContainer);
    this.sound = PIXI.sound.Sound.from("sound/shot.mp3");
    this.interval = undefined;
    this.effects = effects;

    this.shoot();
  }

  registerEffects(effects) {
    this.effects = effects;
  }

  shoot() {
    this.interval = this.app.setInterval(() => {
      if (this.keys[" "] || this.shooting) {
        this.fire();
      }
      this.interval.clear();
      this.shoot();
    }, this.shootInterval / this.fireVelocity);
  }

  fire() {
    this.sound.play();
    const angle = this.player.rotation;

    this.bullets = this.bullets.filter((bullet) => {
      if (bullet.destroyed) return;

      return (
        Math.abs(bullet.position.x) < this.app.screen.width + this.bulletRadius &&
        Math.abs(bullet.position.y) < this.app.screen.height + this.bulletRadius
      );
    });

    const projectileAngles = [angle];
    for (let index = 1; index <= this.extraProjectiles; index++) {
      const direction = index % 2 === 1 ? 1 : -1;
      const ring = Math.ceil(index / 2);
      projectileAngles.push(angle + direction * ring * this.spreadRadians);
    }

    projectileAngles.forEach((projectileAngle) => {
      const bullet = new PIXI.Graphics();

      // Roll for critical hit
      const isCrit = this.critChance > 0 && Math.random() < this.critChance;
      let damage = this.bulletDamage;
      let bulletColor = 0x41f7ff;

      if (isCrit) {
        damage = Math.ceil(damage * this.critMultiplier);
        bulletColor = 0xff4d4d; // Red for crit
      }

      bullet.beginFill(bulletColor, 1);
      bullet.drawCircle(0, 0, isCrit ? this.bulletRadius * 1.3 : this.bulletRadius);
      bullet.endFill();

      const moveFromCenterToTip = new Victor(Math.cos(projectileAngle), Math.sin(projectileAngle)).multiplyScalar(this.playerSize);
      const initialX = this.player.position.x + moveFromCenterToTip.x;
      const initialY = this.player.position.y + moveFromCenterToTip.y;
      bullet.position.set(initialX, initialY);
      bullet.velocity = new Victor(Math.cos(projectileAngle), Math.sin(projectileAngle)).multiplyScalar(this.bulletSpeed);
      bullet.damage = damage;
      bullet.isCrit = isCrit;
      bullet.controlEffects = {
        knockbackBonus: this.skillEffects.knockbackBonus,
        enemyWeakenMultiplier: this.skillEffects.enemyWeakenMultiplier,
        freezeChance: this.skillEffects.freezeChance || 0,
      };
      bullet.controlDurationMultiplier = this.controlDurationMultiplier;
      bullet.chainPulseRadius = this.skillEffects.chainPulseRadius;

      this.bullets.push(bullet);
      this.shootingContainer.addChild(bullet);
      this.runStats?.recordShotFired?.();

      if (this.effects) {
        const explosionColor = isCrit ? 0xff4d4d : 0x8be9fd;
        this.effects.explosion(initialX, initialY, explosionColor, isCrit ? 10 : 6);
      }
    });

    if (this.effects) {
      this.effects.shake(1.4);
    }
  }

  set setFireVelocity(velocity) {
    this.fireVelocity = velocity;
  }

  update(shooting, enemySpawner, player) {
    if (!enemySpawner || !player) return;
    this.shooting = shooting;
    this.bullets.forEach((bullet) => {
      if (bullet.destroyed || !bullet) return;

      bullet.position.set(bullet.position.x + bullet.velocity.x, bullet.position.y + bullet.velocity.y);

      bulletHit(bullet, enemySpawner.spawns, this.bulletRadius, player, this.effects);
    });
  }
}
