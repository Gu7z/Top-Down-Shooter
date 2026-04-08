import Victor from "victor";
import Enemy from "./enemy.js";

const SNIPER_SNIPE_COOLDOWN = 150;
const SNIPER_BULLET_SPEED = 6.0;
const SNIPER_VELOCITY_SMOOTHING = 0.3;
const SNIPER_DIRECTION_FLIP_SMOOTHING = 0.16;
const SNIPER_TRACKED_SPEED_CAP = 4.5;
const SNIPER_MAX_INTERCEPT_FRAMES = 42;
const SNIPER_MAX_LEAD_DISTANCE = 120;

export default class BossEnemy extends Enemy {
  constructor(options) {
    super(options);
    
    // Additional boss-specific state
    this.maxLife = options.life;
    this.bossName = this.typeId.toLowerCase().replace("boss_", "");
    this.attackTimers = {
      burst: 0,
      arc: 0,
      spin: 0,
      cross: 0,
      snipe: 0,
    };
    this.orbitDirection = this._getInitialOrbitDirection();
    this.maneuverTimer = this._getInitialManeuverTimer();
    this.burstCooldown = this._getInitialBurstCooldown();
    this.burstFrames = 0;
    this.burstVelocity = new Victor(0, 0);
    this.lastTrackedPlayerPosition = null;
    this.playerVelocityEstimate = new Victor(0, 0);
    this.hasEnteredArena = this._isWithinArenaBounds(this.enemy.position);
    this.entryTarget = this.hasEnteredArena ? null : this._computeEntryTarget(this.enemy.position);
    
    // Make boss graphic slightly pulsate or add a subtle difference if needed
    // Setting baseline timers
    const name = this.typeId.toLowerCase();
    if (name.includes("guardiao")) {
      this.attackTimers.burst = 180;
    } else if (name.includes("sniper")) {
      this.attackTimers.snipe = SNIPER_SNIPE_COOLDOWN;
    } else if (name.includes("colosso")) {
      this.attackTimers.cross = 150;
      this.attackTimers.arc = 240;
    } else if (name.includes("supremo")) {
      this.attackTimers.burst = 120;
      this.attackTimers.arc = 200;
      this.attackTimers.spin = 400;
    } else if (name.includes("predador")) {
      // Fast hunter: rapid burst + wide arc + spin
      this.attackTimers.burst = 90;
      this.attackTimers.arc = 150;
      this.attackTimers.spin = 350;
    } else if (name.includes("apocalipse")) {
      // Final boss: all patterns at peak aggression
      this.attackTimers.burst = 80;
      this.attackTimers.arc = 130;
      this.attackTimers.spin = 300;
      this.attackTimers.cross = 110;
    }
    
    // Boss does not strafe like basic ranged. Boss holds center or slowly tracks.
    this.behaviorType = "boss"; 
  }

  _getInitialOrbitDirection() {
    if (["sniper", "predador", "apocalipse"].includes(this.bossName)) return -1;
    return 1;
  }

  _getInitialManeuverTimer() {
    return this._getMovementProfile(1).maneuverInterval || 120;
  }

  _getInitialBurstCooldown() {
    return this._getMovementProfile(1).burstCooldownBase || Infinity;
  }

  _getArenaBounds() {
    const { width, height } = this.app.screen;
    return {
      minX: this.enemyRadius,
      maxX: width - this.enemyRadius,
      minY: this.enemyRadius,
      maxY: height - this.enemyRadius,
    };
  }

  _isWithinArenaBounds(position = this.enemy.position) {
    const { minX, maxX, minY, maxY } = this._getArenaBounds();
    return position.x >= minX && position.x <= maxX && position.y >= minY && position.y <= maxY;
  }

  _computeEntryTarget(position = this.enemy.position) {
    const { minX, maxX, minY, maxY } = this._getArenaBounds();
    return new Victor(
      Math.max(minX, Math.min(maxX, position.x)),
      Math.max(minY, Math.min(maxY, position.y)),
    );
  }

  _setPosition(x, y, clampToArena = false) {
    if (clampToArena) {
      const { minX, maxX, minY, maxY } = this._getArenaBounds();
      x = Math.max(minX, Math.min(maxX, x));
      y = Math.max(minY, Math.min(maxY, y));
    }
    this.enemy.position.set(x, y);
    this.enemyLifeText.position.set(x, y);
  }

  _completeArenaEntry() {
    this.hasEnteredArena = true;
    this.entryTarget = null;
  }

  _getMovementProfile(healthRatio = 1) {
    switch (this.bossName) {
      case "guardiao":
        return {
          preferredRange: 220,
          rangeTolerance: 55,
          orbitWeight: 1.35,
          approachWeight: 0.35,
          retreatWeight: 1.15,
          holdBias: 0,
          pressureWeight: 0,
          maneuverInterval: 150,
          flipsOrbit: true,
        };
      case "sniper":
        return {
          preferredRange: 320,
          rangeTolerance: 40,
          orbitWeight: 0.4,
          approachWeight: 0.18,
          retreatWeight: 2.2,
          holdBias: -0.2,
          pressureWeight: 0,
          maneuverInterval: 70,
          flipsOrbit: true,
          farRange: 390,
          farMoveSpeedMultiplier: 1.45,
          farOrbitWeight: 0.06,
          farApproachWeight: 2.6,
          farRetreatWeight: 0.1,
          farHoldBias: 0,
          farPressureWeight: 0.8,
          panicRange: 250,
          panicMoveSpeedMultiplier: 1.8,
          panicOrbitWeight: 0.08,
          panicApproachWeight: 0,
          panicRetreatWeight: 3.4,
          panicHoldBias: -0.45,
          panicPressureWeight: -0.8,
          emergencyBurstRange: 185,
          burstCooldownBase: 45,
          burstFrames: 6,
          burstMultiplier: 3.4,
          burstTowardWeight: -2.8,
          burstLateralWeight: 0.06,
          burstMinRange: 0,
          burstMaxRange: 235,
        };
      case "colosso":
        return {
          preferredRange: 115,
          rangeTolerance: 25,
          orbitWeight: 0.55,
          approachWeight: 1.0,
          retreatWeight: 0.15,
          holdBias: 0.35,
          pressureWeight: 0.55,
          maneuverInterval: 200,
          flipsOrbit: false,
        };
      case "supremo":
        return {
          preferredRange: healthRatio < 0.5 ? 175 : 210,
          rangeTolerance: 40,
          orbitWeight: healthRatio < 0.5 ? 1.1 : 0.9,
          approachWeight: 0.75,
          retreatWeight: 0.7,
          holdBias: 0.2,
          pressureWeight: healthRatio < 0.5 ? 0.45 : 0.2,
          maneuverInterval: 90,
          flipsOrbit: true,
        };
      case "predador":
        return {
          preferredRange: 145,
          rangeTolerance: 30,
          orbitWeight: 1.0,
          approachWeight: 0.95,
          retreatWeight: 0.2,
          holdBias: 0.25,
          pressureWeight: 0.45,
          maneuverInterval: 75,
          flipsOrbit: true,
          burstCooldownBase: 90,
          burstFrames: 8,
          burstMultiplier: 2.4,
          burstTowardWeight: 0.65,
          burstLateralWeight: 1.25,
          burstMinRange: 90,
          burstMaxRange: 260,
        };
      case "apocalipse":
        return {
          preferredRange: healthRatio < 0.5 ? 165 : 205,
          rangeTolerance: 45,
          orbitWeight: 1.15,
          approachWeight: 0.85,
          retreatWeight: 0.55,
          holdBias: 0.3,
          pressureWeight: 0.45,
          maneuverInterval: 70,
          flipsOrbit: true,
          burstCooldownBase: 110,
          burstFrames: 10,
          burstMultiplier: 2.05,
          burstTowardWeight: 0.85,
          burstLateralWeight: 1.1,
          burstMinRange: 110,
          burstMaxRange: 320,
        };
      default:
        return {
          preferredRange: 180,
          rangeTolerance: 40,
          orbitWeight: 0.8,
          approachWeight: 0.8,
          retreatWeight: 0.6,
          holdBias: 0.1,
          pressureWeight: 0.2,
          maneuverInterval: 120,
          flipsOrbit: true,
        };
    }
  }

  _updateManeuverState(profile) {
    this.maneuverTimer -= 1;
    if (profile.flipsOrbit && this.maneuverTimer <= 0) {
      this.orbitDirection *= -1;
      this.maneuverTimer = profile.maneuverInterval;
    } else if (!profile.flipsOrbit) {
      this.maneuverTimer = profile.maneuverInterval;
    }
  }

  _startBurst(profile, toward, lateral) {
    this.burstFrames = profile.burstFrames;
    this.burstCooldown = profile.burstCooldownBase;
    this.burstVelocity = toward.clone()
      .multiplyScalar(profile.burstTowardWeight)
      .add(lateral.clone().multiplyScalar(profile.burstLateralWeight))
      .normalize()
      .multiplyScalar(this.speed * profile.burstMultiplier);
  }

  _trackPlayerMotion(playerPosition) {
    if (!this.lastTrackedPlayerPosition) {
      this.playerVelocityEstimate = new Victor(0, 0);
      this.lastTrackedPlayerPosition = playerPosition.clone();
      return;
    }

    const measuredVelocity = playerPosition.clone().subtract(this.lastTrackedPlayerPosition);
    if (measuredVelocity.length() > SNIPER_TRACKED_SPEED_CAP) {
      measuredVelocity.normalize().multiplyScalar(SNIPER_TRACKED_SPEED_CAP);
    }

    if (measuredVelocity.length() <= 0.05) {
      this.playerVelocityEstimate = this.playerVelocityEstimate.clone().multiplyScalar(0.65);
      this.lastTrackedPlayerPosition = playerPosition.clone();
      return;
    }

    const previousEstimate = this.playerVelocityEstimate.clone();
    const directionAgreement =
      previousEstimate.length() > 0.05
        ? previousEstimate.clone().normalize().dot(measuredVelocity.clone().normalize())
        : 1;
    const smoothing = directionAgreement < -0.2
      ? SNIPER_DIRECTION_FLIP_SMOOTHING
      : SNIPER_VELOCITY_SMOOTHING;

    if (previousEstimate.length() <= 0.001) {
      this.playerVelocityEstimate = measuredVelocity;
    } else {
      this.playerVelocityEstimate = previousEstimate
        .multiplyScalar(1 - smoothing)
        .add(measuredVelocity.multiplyScalar(smoothing));
    }

    this.lastTrackedPlayerPosition = playerPosition.clone();
  }

  _solveInterceptTime(relativePosition, targetVelocity, bulletSpeed) {
    const velocityX = targetVelocity.x;
    const velocityY = targetVelocity.y;
    const relativeX = relativePosition.x;
    const relativeY = relativePosition.y;
    const bulletSpeedSquared = bulletSpeed * bulletSpeed;
    const targetSpeedSquared = (velocityX * velocityX) + (velocityY * velocityY);
    const a = targetSpeedSquared - bulletSpeedSquared;
    const b = 2 * ((relativeX * velocityX) + (relativeY * velocityY));
    const c = (relativeX * relativeX) + (relativeY * relativeY);
    const epsilon = 0.000001;

    if (Math.abs(a) < epsilon) {
      if (Math.abs(b) < epsilon) return null;
      const linearTime = -c / b;
      return linearTime > 0 ? linearTime : null;
    }

    const discriminant = (b * b) - (4 * a * c);
    if (discriminant < 0) return null;

    const sqrtDiscriminant = Math.sqrt(discriminant);
    const firstTime = (-b - sqrtDiscriminant) / (2 * a);
    const secondTime = (-b + sqrtDiscriminant) / (2 * a);
    const validTimes = [firstTime, secondTime]
      .filter((time) => Number.isFinite(time) && time > 0);

    if (validTimes.length === 0) return null;
    return Math.min(...validTimes);
  }

  _predictPlayerPosition(playerPosition, bulletSpeed) {
    const enemyPosition = new Victor(this.enemy.position.x, this.enemy.position.y);
    const movement = this.playerVelocityEstimate.clone();
    if (movement.length() <= 0.05) return playerPosition.clone();

    const relativePosition = playerPosition.clone().subtract(enemyPosition);
    const interceptTime = this._solveInterceptTime(relativePosition, movement, bulletSpeed);
    const clampedInterceptTime = interceptTime === null
      ? null
      : Math.min(interceptTime, SNIPER_MAX_INTERCEPT_FRAMES);
    const predicted = interceptTime === null
      ? playerPosition.clone()
      : playerPosition.clone().add(movement.multiplyScalar(clampedInterceptTime));
    const leadOffset = predicted.clone().subtract(playerPosition);
    if (leadOffset.length() > SNIPER_MAX_LEAD_DISTANCE) {
      predicted.copy(
        playerPosition.clone().add(
          leadOffset.normalize().multiplyScalar(SNIPER_MAX_LEAD_DISTANCE),
        ),
      );
    }
    const { width, height } = this.app.screen;
    predicted.x = Math.max(0, Math.min(width, predicted.x));
    predicted.y = Math.max(0, Math.min(height, predicted.y));
    return predicted;
  }

  _getActiveMovementProfile(profile, dist) {
    if (profile.panicRange && dist < profile.panicRange) {
      return {
        ...profile,
        moveSpeedMultiplier: profile.panicMoveSpeedMultiplier ?? profile.moveSpeedMultiplier ?? 1,
        orbitWeight: profile.panicOrbitWeight ?? profile.orbitWeight,
        approachWeight: profile.panicApproachWeight ?? profile.approachWeight,
        retreatWeight: profile.panicRetreatWeight ?? profile.retreatWeight,
        holdBias: profile.panicHoldBias ?? profile.holdBias,
        pressureWeight: profile.panicPressureWeight ?? profile.pressureWeight,
      };
    }

    if (profile.farRange && dist > profile.farRange) {
      return {
        ...profile,
        moveSpeedMultiplier: profile.farMoveSpeedMultiplier ?? profile.moveSpeedMultiplier ?? 1,
        orbitWeight: profile.farOrbitWeight ?? profile.orbitWeight,
        approachWeight: profile.farApproachWeight ?? profile.approachWeight,
        retreatWeight: profile.farRetreatWeight ?? profile.retreatWeight,
        holdBias: profile.farHoldBias ?? profile.holdBias,
        pressureWeight: profile.farPressureWeight ?? profile.pressureWeight,
      };
    }

    return profile;
  }

  _computeMovementVector(playerPosition, enemyPosition, healthRatio) {
    const toPlayer = playerPosition.clone().subtract(enemyPosition);
    const dist = toPlayer.length();
    if (dist <= 0.001) return new Victor(0, 0);

    const profile = this._getMovementProfile(healthRatio);
    this._updateManeuverState(profile);
    const activeProfile = this._getActiveMovementProfile(profile, dist);

    const toward = toPlayer.clone().normalize();
    const lateral = new Victor(-toward.y * this.orbitDirection, toward.x * this.orbitDirection);

    if (this.burstFrames > 0) {
      this.burstFrames -= 1;
      return this.burstVelocity.clone();
    }

    if (Number.isFinite(this.burstCooldown)) this.burstCooldown -= 1;
    const shouldEmergencyBurst =
      activeProfile.emergencyBurstRange &&
      dist <= activeProfile.emergencyBurstRange;
    if (
      activeProfile.burstCooldownBase &&
      (shouldEmergencyBurst || this.burstCooldown <= 0) &&
      dist >= activeProfile.burstMinRange &&
      dist <= activeProfile.burstMaxRange
    ) {
      this._startBurst(activeProfile, toward, lateral);
      this.burstFrames -= 1;
      return this.burstVelocity.clone();
    }

    const move = new Victor(0, 0);

    if (dist > activeProfile.preferredRange + activeProfile.rangeTolerance) {
      move.add(toward.clone().multiplyScalar(activeProfile.approachWeight));
    } else if (dist < activeProfile.preferredRange - activeProfile.rangeTolerance) {
      move.add(toward.clone().invert().multiplyScalar(activeProfile.retreatWeight));
    } else if (activeProfile.holdBias !== 0) {
      move.add(toward.clone().multiplyScalar(activeProfile.holdBias));
    }

    if (activeProfile.pressureWeight) {
      move.add(toward.clone().multiplyScalar(activeProfile.pressureWeight));
    }
    if (activeProfile.orbitWeight) {
      move.add(lateral.clone().multiplyScalar(activeProfile.orbitWeight));
    }

    if (move.length() <= 0.001) return new Victor(0, 0);
    return move
      .normalize()
      .multiplyScalar(this.speed * (activeProfile.moveSpeedMultiplier ?? 1));
  }

  updateBossBehavior(player) {
    const playerSquare = player.player;
    const enemyPosition = new Victor(this.enemy.position.x, this.enemy.position.y);
    const playerPosition = new Victor(playerSquare.position.x, playerSquare.position.y);
    const dist = enemyPosition.distance(playerPosition);
    this._trackPlayerMotion(playerPosition);
    
    // Apply knockback velocity with friction
    if (this.knockbackVelocity.x !== 0 || this.knockbackVelocity.y !== 0) {
      this._setPosition(
        this.enemy.position.x + this.knockbackVelocity.x,
        this.enemy.position.y + this.knockbackVelocity.y,
        this.hasEnteredArena,
      );
      this.knockbackVelocity.x *= 0.82;
      this.knockbackVelocity.y *= 0.82;
      if (Math.abs(this.knockbackVelocity.x) < 0.1 && Math.abs(this.knockbackVelocity.y) < 0.1) {
        this.knockbackVelocity.x = 0;
        this.knockbackVelocity.y = 0;
      }
      if (!this.hasEnteredArena && this._isWithinArenaBounds()) {
        this._completeArenaEntry();
      }
      return;
    }

    if (!this.hasEnteredArena && this._isWithinArenaBounds(enemyPosition)) {
      this._completeArenaEntry();
    }

    if (!this.hasEnteredArena) {
      this.entryTarget = this._computeEntryTarget(enemyPosition);
      const toEntry = this.entryTarget.clone().subtract(enemyPosition);
      const ingressSpeed = Math.max(this.speed * 1.15, 1);
      if (toEntry.length() <= ingressSpeed) {
        this._setPosition(this.entryTarget.x, this.entryTarget.y, true);
        this._completeArenaEntry();
        this.enemyLifeText.text = this.life;
        return;
      } else {
        const ingressVelocity = toEntry.normalize().multiplyScalar(ingressSpeed);
        this._setPosition(
          this.enemy.position.x + ingressVelocity.x,
          this.enemy.position.y + ingressVelocity.y,
          false,
        );
        this.enemyLifeText.text = this.life;
        return;
      }
    }

    // HP based pacing - bosses can tighten cadence at low health, but sniper keeps a fixed shot rhythm.
    const maxLife = Math.max(1, this.maxLife || 0);
    const healthRatio = Math.max(0, this.life) / maxLife;
    const velocity = this._computeMovementVector(playerPosition, enemyPosition, healthRatio);

    const movingAwayFromPlayer = (velocity.x * (playerPosition.x - enemyPosition.x)) + (velocity.y * (playerPosition.y - enemyPosition.y)) < 0;
    if (dist > playerSquare.width / 2 + this.enemyRadius / 2 || movingAwayFromPlayer) {
      this._setPosition(
        this.enemy.position.x + velocity.x,
        this.enemy.position.y + velocity.y,
        true,
      );
    }

    this.enemyLifeText.text = this.life;

    const name = this.typeId.toLowerCase();
    const fireSpeedMod = name.includes("sniper") ? 1 : healthRatio < 0.5 ? 1.4 : 1;

    // Handle Attack Patterns
    this.attackTimers.burst -= 1 * fireSpeedMod;
    this.attackTimers.arc -= 1 * fireSpeedMod;
    this.attackTimers.spin -= 1 * fireSpeedMod;
    this.attackTimers.cross -= 1 * fireSpeedMod;
    this.attackTimers.snipe -= 1 * fireSpeedMod;

    if (name.includes("guardiao")) {
      if (this.attackTimers.burst <= 0) {
        this.fireBurst(playerPosition, 3);
        this.attackTimers.burst = 180;
      }
    } else if (name.includes("sniper")) {
      if (this.attackTimers.snipe <= 0) {
        this.fireSniperShot(playerPosition);
        this.attackTimers.snipe = SNIPER_SNIPE_COOLDOWN;
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
    } else if (name.includes("predador")) {
      if (this.attackTimers.burst <= 0) {
        this.fireBurst(playerPosition, 5);
        this.attackTimers.burst = 90;
      }
      if (this.attackTimers.arc <= 0) {
        this.fireArc(playerPosition, 7);
        this.attackTimers.arc = 150;
      }
      if (this.attackTimers.spin <= 0) {
        this.fireSpin();
        this.attackTimers.spin = 350;
      }
    } else if (name.includes("apocalipse")) {
      if (this.attackTimers.burst <= 0) {
        this.fireBurst(playerPosition, 7);
        this.attackTimers.burst = 80;
      }
      if (this.attackTimers.arc <= 0) {
        this.fireArc(playerPosition, 9);
        this.attackTimers.arc = 130;
      }
      if (this.attackTimers.spin <= 0) {
        this.fireSpin();
        this.attackTimers.spin = 300;
      }
      if (this.attackTimers.cross <= 0) {
        this.fireCross();
        this.attackTimers.cross = 110;
      }
    }
  }

  createBullet(targetPos, bulletOptions = {}) {
    let BulletClass;
    if (typeof window !== "undefined" && window.EnemyBulletClass) {
      BulletClass = window.EnemyBulletClass;
    }
    if (!BulletClass || !this.enemyBullets) return;

    this.enemyBullets.push(new BulletClass({
      app: this.app,
      position: { x: this.enemy.position.x, y: this.enemy.position.y },
      targetPosition: targetPos,
      color: this.color,
      ...bulletOptions,
    }));
  }

  fireSniperShot(playerPos) {
    const predictedTarget = this._predictPlayerPosition(playerPos, SNIPER_BULLET_SPEED);
    this.createBullet(predictedTarget, {
      speed: SNIPER_BULLET_SPEED,
      coreColor: 0xffffff,
      fillAlpha: 1,
      ringColor: 0xff66ff,
      ringWidth: 2,
      ringAlpha: 1,
      glowColor: 0xff66ff,
      glowAlpha: 0.35,
      glowScale: 1.9,
      trailColor: 0xf0d8ff,
      trailAlpha: 0.55,
      trailScale: 1.05,
    });
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

    if (this.frozen) {
      this.enemyLifeText.text = this.life;
      this.freezeTimer -= 1;
      if (this.freezeTimer <= 0) {
        this.frozen = false;
        this.enemy.tint = 0xffffff;
        this.enemyLifeText.style.fill = 0xffffff;
      } else {
        return;
      }
    }

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
