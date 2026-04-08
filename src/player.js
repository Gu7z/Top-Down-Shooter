import Shooting from "./shooting.js";
import { createDefaultSkillEffects } from "./progression/skill_effects.js";
import CollisionMask from "./utils/collision_mask.js";

export default class Player {
  constructor({ app, username, keys, skillEffects = {}, runStats = null, effects = null }) {
    this.app = app;
    this.points = 0;
    this.skillEffects = { ...createDefaultSkillEffects(), ...skillEffects };
    this.runStats = runStats;
    this.lifes = 1 + this.skillEffects.maxLifeBonus;
    this.shield = this.skillEffects.maxShield;
    this.velocity = 2 + this.skillEffects.moveSpeedBonus;
    this.size = 20;
    this.username = username;
    this.playerContainer = new PIXI.Container();

    // Shield regen state
    this.shieldRegenTimer = 0;
    this.shieldRegenCooldown = this.skillEffects.shieldRegenSeconds > 0
      ? this.skillEffects.shieldRegenSeconds * 60
      : 0;

    // Post-hit guard state
    this.invulnerable = false;
    this.invulnerableTimer = 0;

    // Emergency shield state
    this.emergencyShieldUsed = false;

    // Low HP tracking for credit bonus
    this.survivedLowHp = false;

    // Dash state
    this.dashEnabled = this.skillEffects.dashEnabled;
    this.dashSpeed = 12;
    this.dashDuration = 8; // frames
    this.dashCooldownBase = 90; // frames (~1.5s at 60fps)
    this.dashCooldownMultiplier = this.skillEffects.dashCooldownMultiplier;
    this.dashInvulnerabilityMs = this.skillEffects.dashInvulnerabilityMs;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
    this.dashDirection = { x: 0, y: 0 };
    this.dashReloadPrimed = false;

    // Dash shield fusion
    this.dashShieldEnabled = this.skillEffects.dashShield;

    // Dash reload fusion
    this.dashReloadEnabled = this.skillEffects.dashReload;

    // In-run upgrade state
    this.runUpgradeEffects = null;
    this.onEnemyKilledAt = null;

    // Strafe control
    this.strafeControlBonus = this.skillEffects.strafeControlBonus;

    const middleWidth = app.screen.width / 2;
    const middleHeight = app.screen.height / 2;

    const playerTexture = PIXI.Texture.from("./images/spaceship.png");
    playerTexture.rotate = 6;
    this.player = new PIXI.Sprite(playerTexture);
    this.player.scale.x *= this.size / 100;
    this.player.scale.y *= this.size / 100;
    this.player.anchor.set(0.5);
    this.player.position.set(middleWidth, middleHeight);

    // Build perfect collision mask
    this.collisionMask = null;
    const makeMask = () => {
      if (!playerTexture.baseTexture || !playerTexture.baseTexture.resource) return;
      const source = playerTexture.baseTexture.resource.source;
      if (!source) return;
      const width = playerTexture.baseTexture.width;
      const height = playerTexture.baseTexture.height;
      this.collisionMask = new CollisionMask(source, width, height);
    };

    if (playerTexture.baseTexture && playerTexture.baseTexture.hasLoaded) {
      makeMask();
    } else if (playerTexture.baseTexture && playerTexture.baseTexture.once) {
      playerTexture.baseTexture.once("loaded", makeMask);
    }

    this.playerGlow = new PIXI.Sprite(playerTexture);
    this.playerGlow.tint = 0x00e5ff;
    this.playerGlow.alpha = 0.35;
    this.playerGlow.anchor.set(0.5);
    this.playerGlow.scale.x *= (this.size / 100) * 1.25;
    this.playerGlow.scale.y *= (this.size / 100) * 1.25;
    this.playerGlow.position.set(middleWidth, middleHeight);

    this.shooting = new Shooting({
      app,
      player: this.player,
      playerSize: this.size,
      keys,
      skillEffects: this.skillEffects,
      runStats,
      effects,
    });

    // Shield bubble — visible only when shield > 0
    this.shieldBubble = new PIXI.Graphics();
    this._drawShieldBubble();
    this.shieldBubble.position.set(middleWidth, middleHeight);

    this.setMousePosition(middleWidth, 0);
    this.playerContainer.addChild(this.shieldBubble);
    this.playerContainer.addChild(this.playerGlow);
    this.playerContainer.addChild(this.player);
    this.app.stage.addChild(this.playerContainer);
  }

  setMousePosition = (x, y) => {
    this.mouseX = x;
    this.mouseY = y;
  };

  takeDamage(amount = 1, effects = null) {
    if (this.invulnerable) return false;

    // Shield absorbs damage first
    if (this.shield > 0) {
      this.shield -= 1;
      this.shieldRegenTimer = this.shieldRegenCooldown;
      if (effects) {
        effects.explosion(this.player.position.x, this.player.position.y, 0x00ffff, 12);
      }
      this.applyPostHitGuard();
      return true;
    }

    // HP damage
    this.lifes -= amount;

    // Track low HP survival
    if (this.lifes === 1) {
      this.survivedLowHp = true;
    }

    // Emergency shield: at 1 HP, grant 1 shield once per run
    if (this.lifes === 1 && this.skillEffects.emergencyShield && !this.emergencyShieldUsed) {
      this.emergencyShieldUsed = true;
      this.shield = 1;
    }

    this.shieldRegenTimer = this.shieldRegenCooldown;
    this.applyPostHitGuard();
    return true;
  }

  applyPostHitGuard() {
    const guardMs = this.skillEffects.postHitGuardMs;
    if (guardMs > 0) {
      this.invulnerable = true;
      this.invulnerableTimer = Math.ceil((guardMs / 1000) * 60);
    }
  }

  tryDash(keys) {
    if (!this.dashEnabled) return;
    if (this.dashCooldownTimer > 0) return;
    if (this.isDashing) return;

    // Determine dash direction from movement keys
    let dx = 0;
    let dy = 0;
    if (keys.w) dy -= 1;
    if (keys.s) dy += 1;
    if (keys.a) dx -= 1;
    if (keys.d) dx += 1;

    // If no direction, dash towards mouse
    if (dx === 0 && dy === 0) {
      const angle = Math.atan2(
        this.mouseY - this.player.position.y,
        this.mouseX - this.player.position.x
      );
      dx = Math.cos(angle);
      dy = Math.sin(angle);
    } else {
      const length = Math.hypot(dx, dy);
      dx /= length;
      dy /= length;
    }

    this.isDashing = true;
    this.dashTimer = this.dashDuration;
    this.dashCooldownTimer = Math.ceil(this.dashCooldownBase * this.dashCooldownMultiplier);
    this.dashDirection = { x: dx, y: dy };

    // Dash invulnerability
    if (this.dashInvulnerabilityMs > 0) {
      this.invulnerable = true;
      this.invulnerableTimer = Math.max(
        this.invulnerableTimer,
        Math.ceil((this.dashInvulnerabilityMs / 1000) * 60)
      );
    }

    // Dash shield fusion: gain 1 temporary shield
    if (this.dashShieldEnabled && this.shield < this.skillEffects.maxShield + 1) {
      this.shield = Math.min(this.shield + 1, this.skillEffects.maxShield + 1);
    }

    // Dash reload fusion: prime next shot
    if (this.dashReloadEnabled) {
      this.dashReloadPrimed = true;
    }
  }

  updateDash() {
    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer -= 1;
    }

    if (!this.isDashing) return;

    this.dashTimer -= 1;
    const moveX = this.dashDirection.x * this.dashSpeed;
    const moveY = this.dashDirection.y * this.dashSpeed;
    this.player.position.set(
      this.player.position.x + moveX,
      this.player.position.y + moveY
    );

    if (this.dashTimer <= 0) {
      this.isDashing = false;
    }

    // Clamp to screen bounds so dash can't leave the play area.
    // player.x/y is the center (anchor 0.5), so clamp to [halfW, screenW - halfW].
    const { width, height } = this.app.screen;
    const halfW = this.player.width / 2;
    const halfH = this.player.height / 2;
    this.player.x = Math.max(halfW, Math.min(width - halfW, this.player.x));
    this.player.y = Math.max(halfH, Math.min(height - halfH, this.player.y));
  }

  updateShieldRegen() {
    if (this.shieldRegenCooldown <= 0) return;
    if (this.shield >= this.skillEffects.maxShield) return;

    if (this.shieldRegenTimer > 0) {
      this.shieldRegenTimer -= 1;
      return;
    }

    // Regen 1 shield when timer expires
    this.shield = Math.min(this.shield + 1, this.skillEffects.maxShield);
    this.shieldRegenTimer = this.shieldRegenCooldown;
  }

  updateInvulnerability() {
    if (!this.invulnerable) return;

    this.invulnerableTimer -= 1;
    if (this.invulnerableTimer <= 0) {
      this.invulnerable = false;
      this.invulnerableTimer = 0;
    }
  }

  outOfBounds(key) {
    const playerYBoundarie = this.player.y + this.player.height;
    const playerXBoundarie = this.player.x + this.player.width;
    const { width, height } = this.app.screen;
    const boundaries = {
      leftAndTop: this.size * 4.5,
      right: width + this.size * 2.5,
      bottom: height + this.size * 2.5,
    };

    switch (key) {
      case "w":
        return playerYBoundarie < boundaries.leftAndTop;
      case "a":
        return playerXBoundarie < boundaries.leftAndTop;
      case "s":
        return playerYBoundarie > boundaries.bottom;
      case "d":
        return playerXBoundarie > boundaries.right;
      default:
        return true;
    }
  }

  movePlayer = (keys) => {
    // During dash, movement is handled by updateDash
    if (this.isDashing) return;

    let dx = 0;
    let dy = 0;

    if (keys.w && !this.outOfBounds("w")) dy -= 1;
    if (keys.s && !this.outOfBounds("s")) dy += 1;
    if (keys.a && !this.outOfBounds("a")) dx -= 1;
    if (keys.d && !this.outOfBounds("d")) dx += 1;

    // Normalize diagonal movement with strafe control bonus
    if (dx !== 0 && dy !== 0) {
      // Without strafe bonus: normalize to ~0.707 each axis
      // With full strafe bonus (1.0): no penalty, each axis stays at 1.0
      const normalFactor = 1 / Math.SQRT2;
      const strafeFactor = normalFactor + (1 - normalFactor) * this.strafeControlBonus;
      dx *= strafeFactor;
      dy *= strafeFactor;
    }

    this.player.x += dx * this.velocity;
    this.player.y += dy * this.velocity;
  };

  lookTo = () => {
    const angle = Math.atan2(this.mouseY - this.player.position.y, this.mouseX - this.player.position.x);
    this.player.rotation = angle;
    this.playerGlow.rotation = this.player.rotation;
  };

  collidesWithCircle(cx, cy, r) {
    if (this.shield > 0) {
      const dist = Math.hypot(cx - this.player.position.x, cy - this.player.position.y);
      return dist < r + this.size * 1.25;
    }

    if (!this.collisionMask) {
      // Fallback simple distance check before mask loads
      const dist = Math.hypot(cx - this.player.position.x, cy - this.player.position.y);
      return dist < r + this.size / 2;
    }

    // Convert global circle center to local sprite texture coordinates
    const localPoint = this.player.toLocal(new PIXI.Point(cx, cy));
    
    // Scale down the global bullet radius into local radius
    const localR = r / this.player.scale.x;

    // localPoint is relative to anchor (0.5, 0.5), so 0,0 is center of sprite.
    const texWidth = this.collisionMask.width;
    const texHeight = this.collisionMask.height;
    
    // Convert to unanchored top-left pixel coordinates
    const pxCenter = localPoint.x + texWidth / 2;
    const pyCenter = localPoint.y + texHeight / 2;

    // Fast bounding box check
    const minX = Math.max(0, Math.floor(pxCenter - localR));
    const maxX = Math.min(texWidth - 1, Math.ceil(pxCenter + localR));
    const minY = Math.max(0, Math.floor(pyCenter - localR));
    const maxY = Math.min(texHeight - 1, Math.ceil(pyCenter + localR));

    const r2 = localR * localR;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        // Distance check between local pix and mapping circle center
        const dx = x - pxCenter;
        const dy = y - pyCenter;
        if (dx * dx + dy * dy <= r2) {
          if (this.collisionMask.isSolid(x, y)) return true;
        }
      }
    }

    return false;
  }

  _drawShieldBubble() {
    const g = this.shieldBubble;
    g.clear();
    const r = this.size + 7;
    g.lineStyle(1.5, 0x00ccff, 0.85);
    g.drawCircle(0, 0, r);
    g.lineStyle(1, 0x00ccff, 0.2);
    g.drawCircle(0, 0, r + 3);
  }

  updateGlow() {
    this.playerGlow.position.set(this.player.position.x, this.player.position.y);

    // Shield bubble follows player and shows only when shield > 0
    this.shieldBubble.position.set(this.player.position.x, this.player.position.y);
    this.shieldBubble.visible = this.shield > 0;

    // Blink player sprite and boost glow during invulnerability
    if (this.invulnerable) {
      this.player.alpha = Math.floor(Date.now() / 90) % 2 === 0 ? 1 : 0.15;
      this.playerGlow.alpha = 0.45 + Math.abs(Math.sin(Date.now() * 0.025)) * 0.45;
    } else {
      this.player.alpha = 1;
      this.playerGlow.alpha = 0.17 + Math.abs(Math.sin(Date.now() * 0.008)) * 0.18;
    }
  }

  setRunUpgradeEffects(effects) {
    this.runUpgradeEffects = effects;
  }

  update(keys) {
    this.lookTo();
    this.movePlayer(keys);
    this.updateDash();
    this.updateShieldRegen();
    this.updateInvulnerability();
    this.updateGlow();
  }
}
