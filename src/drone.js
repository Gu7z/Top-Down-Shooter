import Victor from "victor";
import bulletHit from "./utils/bullet_hit.js";

export default class DroneSystem {
  constructor({ app, player, skillEffects = {}, runStats = null, effects = null }) {
    this.app = app;
    this.player = player;
    this.skillEffects = skillEffects;
    this.runStats = runStats;
    this.effects = effects;
    
    this.droneCount = this.skillEffects.droneCount || 0;
    this.drones = [];
    this.bullets = [];
    
    this.bulletSpeed = 4 * (this.skillEffects.droneFireVelocityMultiplier || 1);
    this.bulletRadius = 5;
    this.bulletDamage = Math.ceil(1 * (this.skillEffects.droneOverclockMultiplier || 1));
    
    this.orbitRadius = 55;
    this.orbitSpeed = 0.03;
    this.orbitAngle = 0;
    
    this.fireIntervalBase = 45; // base ~0.75s
    const fireMultiplier = this.skillEffects.droneFireVelocityMultiplier || 1;
    this.fireInterval = Math.max(10, Math.floor(this.fireIntervalBase / fireMultiplier));
    
    this.magnetRadius = 350 + (this.skillEffects.magnetRadiusBonus || 0);
    this.droneTargeting = this.skillEffects.droneTargeting;
    this.droneAppliesFreeze = this.skillEffects.droneAppliesFreeze;
    
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    
    for (let i = 0; i < this.droneCount; i++) {
      const droneSprite = new PIXI.Graphics();
      droneSprite.beginFill(0x8be9fd, 1);
      // Draw a small arrow shape
      droneSprite.drawPolygon([
        -6, -5,
        8, 0,
        -6, 5
      ]);
      droneSprite.endFill();
      this.container.addChild(droneSprite);
      
      this.drones.push({
        sprite: droneSprite,
        fireTimer: Math.floor(this.fireInterval / this.droneCount) * i, // Stagger initial fire times
        angleOffset: (Math.PI * 2 / this.droneCount) * i
      });
    }
  }

  update(enemySpawner) {
    if (this.droneCount === 0) return;
    
    // Ensure the container is always rendered correctly on top
    this.app.stage.addChild(this.container);
    
    this.orbitAngle -= this.orbitSpeed; // Orbit counter-clockwise
    
    const px = this.player.player.position.x;
    const py = this.player.player.position.y;
    
    this.drones.forEach(drone => {
      const angle = this.orbitAngle + drone.angleOffset;
      drone.sprite.position.set(
        px + Math.cos(angle) * this.orbitRadius,
        py + Math.sin(angle) * this.orbitRadius
      );
      
      drone.fireTimer -= 1;
      let target = null;
      let targetDist = this.magnetRadius;
      
      const dx = drone.sprite.position.x;
      const dy = drone.sprite.position.y;
      
      // Look for targets
      enemySpawner.spawns.forEach(enemy => {
        if (enemy.enemy.destroyed) return;
        const ex = enemy.enemy.position.x;
        const ey = enemy.enemy.position.y;
        const dist = Math.hypot(ex - dx, ey - dy);
        
        if (dist < targetDist) {
          if (this.droneTargeting) {
            targetDist = dist;
            target = enemy;
          } else {
            if (!target) target = enemy;
          }
        }
      });
      
      if (target) {
        const fireAngle = Math.atan2(
          target.enemy.position.y - dy,
          target.enemy.position.x - dx
        );
        drone.sprite.rotation = fireAngle;
      } else {
        drone.sprite.rotation = angle + Math.PI / 2; // Facing tangent to orbit
      }
      
      if (drone.fireTimer <= 0 && target) {
        drone.fireTimer = this.fireInterval;
        this.fire(drone, drone.sprite.rotation);
      }
    });
    
    this.bullets = this.bullets.filter(b => {
      if (b.destroyed) return false;
      return (
        Math.abs(b.position.x) < this.app.screen.width + this.bulletRadius &&
        Math.abs(b.position.y) < this.app.screen.height + this.bulletRadius
      );
    });
    
    this.bullets.forEach((bullet) => {
      if (bullet.destroyed) return;
      bullet.position.set(
        bullet.position.x + bullet.velocity.x,
        bullet.position.y + bullet.velocity.y
      );
      
      bulletHit(bullet, enemySpawner.spawns, this.bulletRadius, this.player, this.effects);
    });
  }
  
  fire(drone, fireAngle) {
    const dx = drone.sprite.position.x;
    const dy = drone.sprite.position.y;
    
    const bullet = new PIXI.Graphics();
    bullet.beginFill(0x8be9fd, 1);
    bullet.drawCircle(0, 0, this.bulletRadius);
    bullet.endFill();
    
    bullet.position.set(dx, dy);
    bullet.velocity = new Victor(Math.cos(fireAngle), Math.sin(fireAngle)).multiplyScalar(this.bulletSpeed);
    bullet.damage = this.bulletDamage;
    bullet.source = 'drone';
    bullet.isCrit = false;
    
    // Fusion: Drone Applies Freeze
    if (this.droneAppliesFreeze) {
      bullet.controlEffects = { freezeChance: 0.45 };
      bullet.controlDurationMultiplier = 1;
    }
    
    this.bullets.push(bullet);
    this.container.addChild(bullet);
    
    if (this.effects) {
      this.effects.explosion(dx, dy, 0x8be9fd, 4); // small muzzle flash animation
    }
    try {
      if (PIXI.sound && PIXI.sound.Sound) {
         PIXI.sound.Sound.from("sound/shot.mp3").play();
      }
    } catch(e) {}
  }
}
