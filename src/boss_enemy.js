import Victor from "victor";
import Enemy from "./enemy.js";

export default class BossEnemy extends Enemy {
  constructor(options) {
    super(options);
    
    // Additional boss-specific state
    this.maxLife = options.life;
    this.attackTimers = {
      burst: 0,
      arc: 0,
      spin: 0,
      cross: 0
    };
    
    // Make boss graphic slightly pulsate or add a subtle difference if needed
    // Setting baseline timers
    const name = this.typeId.toLowerCase();
    if (name.includes("guardiao")) {
      this.attackTimers.burst = 180;
    } else if (name.includes("destruidor")) {
      this.attackTimers.arc = 180;
      this.attackTimers.spin = 480;
    } else if (name.includes("colosso")) {
      this.attackTimers.cross = 150;
      this.attackTimers.arc = 240;
    } else if (name.includes("supremo")) {
      this.attackTimers.burst = 120;
      this.attackTimers.arc = 200;
      this.attackTimers.spin = 400;
    }
    
    // Boss does not strafe like basic ranged. Boss holds center or slowly tracks.
    this.behaviorType = "boss"; 
  }

  updateBossBehavior(player) {
    const playerSquare = player.player;
    const enemyPosition = new Victor(this.enemy.position.x, this.enemy.position.y);
    const playerPosition = new Victor(playerSquare.position.x, playerSquare.position.y);
    const dist = enemyPosition.distance(playerPosition);
    
    // Boss slowly moves towards player regardless, no complex AI state yet
    const effectiveSpeed = this.speed * this.speedMultiplier;
    const velocity = playerPosition.clone().subtract(enemyPosition).normalize().multiplyScalar(effectiveSpeed);

    if (dist > playerSquare.width / 2 + this.enemyRadius / 2) {
      this.enemy.position.set(this.enemy.position.x + velocity.x, this.enemy.position.y + velocity.y);
      this.enemyLifeText.position.set(this.enemy.position.x, this.enemy.position.y);
    }

    this.enemyLifeText.text = this.life;
    
    // HP based pacing - fires faster at lower health
    const healthRatio = this.life / this.maxLife;
    const fireSpeedMod = healthRatio < 0.5 ? 1.4 : 1; 

    // Handle Attack Patterns
    this.attackTimers.burst -= 1 * fireSpeedMod;
    this.attackTimers.arc -= 1 * fireSpeedMod;
    this.attackTimers.spin -= 1 * fireSpeedMod;
    this.attackTimers.cross -= 1 * fireSpeedMod;

    const name = this.typeId.toLowerCase();

    if (name.includes("guardiao")) {
      if (this.attackTimers.burst <= 0) {
        this.fireBurst(playerPosition, 3);
        this.attackTimers.burst = 180;
      }
    } else if (name.includes("destruidor")) {
      if (this.attackTimers.arc <= 0) {
        this.fireArc(playerPosition, 5);
        this.attackTimers.arc = 180;
      }
      if (this.attackTimers.spin <= 0) {
        this.fireSpin();
        this.attackTimers.spin = 480;
      }
    } else if (name.includes("colosso")) {
      if (this.attackTimers.cross <= 0) {
        this.fireCross();
        this.attackTimers.cross = 150;
      }
      if (this.attackTimers.arc <= 0) {
        this.fireArc(playerPosition, 3);
        this.attackTimers.arc = 240;
      }
    } else if (name.includes("supremo")) {
      if (this.attackTimers.burst <= 0) {
        this.fireBurst(playerPosition, 3);
        this.attackTimers.burst = 120;
      }
      if (this.attackTimers.arc <= 0) {
        this.fireArc(playerPosition, 5);
        this.attackTimers.arc = 200;
      }
      if (this.attackTimers.spin <= 0) {
        this.fireSpin();
        this.attackTimers.spin = 400;
      }
    }
  }

  createBullet(targetPos) {
    let BulletClass;
    if (typeof window !== "undefined" && window.EnemyBulletClass) {
      BulletClass = window.EnemyBulletClass;
    }
    if (!BulletClass || !this.enemyBullets) return;

    this.enemyBullets.push(new BulletClass({
      app: this.app,
      position: { x: this.enemy.position.x, y: this.enemy.position.y },
      targetPosition: targetPos,
      color: this.color
    }));
  }

  fireBurst(playerPos, count) {
    // Fire straight line, slightly offset
    const enemyPos = new Victor(this.enemy.position.x, this.enemy.position.y);
    for(let i = 0; i < count; i++) {
       // Spread them out over time? We can't do delays easily in a single tick without queues.
       // So instead we fire them simultaneously with very slight spread or create a staggered array.
       // Simpler approach: fire them in a very tight cone (mini arc)
       const offset = (i - Math.floor(count/2)) * 0.1;
       const targetPos = playerPos.clone().subtract(enemyPos).rotate(offset).add(enemyPos);
       this.createBullet(targetPos);
    }
  }

  fireArc(playerPos, count) {
    const enemyPos = new Victor(this.enemy.position.x, this.enemy.position.y);
    for(let i = 0; i < count; i++) {
       const offset = (i - Math.floor(count/2)) * 0.3; // wider spread than burst
       const targetPos = playerPos.clone().subtract(enemyPos).rotate(offset).add(enemyPos);
       this.createBullet(targetPos);
    }
  }

  fireCross() {
    const enemyPos = new Victor(this.enemy.position.x, this.enemy.position.y);
    const angles = [0, Math.PI/2, Math.PI, Math.PI * 1.5];
    angles.forEach(ang => {
       const pushVector = new Victor(1, 0).rotate(ang).multiplyScalar(100).add(enemyPos);
       this.createBullet(pushVector);
    });
  }

  fireSpin() {
    // 8 directions at once
    const enemyPos = new Victor(this.enemy.position.x, this.enemy.position.y);
    const count = 8;
    for(let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 / count) * i;
      const pushVector = new Victor(1, 0).rotate(ang).multiplyScalar(100).add(enemyPos);
      this.createBullet(pushVector);
    }
  }

  update(player, spanwer, effects) {
    if (this.enemy.destroyed) return;
    this.updateControlTimers();
    this.updateBossBehavior(player);
    
    // Check melee collision just like parent
    const playerSquare = player.player;
    const enemyPos = new Victor(this.enemy.position.x, this.enemy.position.y);
    const playerPos = new Victor(playerSquare.position.x, playerSquare.position.y);
    if (enemyPos.distance(playerPos) < playerSquare.width / 2 + this.enemyRadius / 2) {
      this.removePlayerLife(player, spanwer, effects);
    }
  }
}
