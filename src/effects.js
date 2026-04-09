export default class Effects {
  constructor({ app }) {
    this.app = app;
    this.baseStagePosition = { x: 0, y: 0 };
    this.shakePower = 0;
    this.particles = [];
    this.pulses = [];
    this.circleParticlePool = [];
    this.boltPool = [];

    this.backgroundContainer = new PIXI.Container();
    this.effectsContainer = new PIXI.Container();

    this.createBackground();
    this.app.stage.addChild(this.backgroundContainer);
    this.app.stage.addChild(this.effectsContainer);

    this.tick = () => {
      this.updateShake();
      this.updateParticles();
      this.updatePulses();
    };

    this.app.ticker.add(this.tick);
  }

  createBackground() {
    const { width, height } = this.app.screen;
    const bg = new PIXI.Sprite(PIXI.Texture.WHITE);
    bg.width = width;
    bg.height = height;
    bg.tint = 0x040714;

    const stars = new PIXI.Graphics();
    for (let i = 0; i < 120; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = Math.random() * 1.7 + 0.3;
      const alpha = Math.random() * 0.6 + 0.2;
      stars.beginFill(0xffffff, alpha);
      stars.drawCircle(x, y, radius);
      stars.endFill();
    }

    this.backgroundContainer.addChild(bg);
    this.backgroundContainer.addChild(stars);
  }

  shake(power = 5) {
    this.shakePower = Math.max(this.shakePower, power);
  }

  pulse(displayObject, color = 0xffffff, duration = 8) {
    if (!displayObject) return;
    this.pulses.push({
      displayObject,
      color,
      duration,
      current: duration,
      originalTint: displayObject.tint ?? 0xffffff,
    });
  }

  _acquireCircleParticle() {
    const sprite = this.circleParticlePool.pop() || new PIXI.Graphics();
    sprite.clear();
    sprite.alpha = 1;
    sprite.visible = true;
    sprite.scale.set(1, 1);
    return sprite;
  }

  _acquireBoltGraphic() {
    const sprite = this.boltPool.pop() || new PIXI.Graphics();
    sprite.clear();
    sprite.alpha = 1;
    sprite.visible = true;
    sprite.scale.set(1, 1);
    return sprite;
  }

  _releaseCircleParticle(sprite) {
    sprite.clear();
    sprite.parent?.removeChild?.(sprite);
    this.circleParticlePool.push(sprite);
  }

  _releaseBoltGraphic(sprite) {
    sprite.clear();
    sprite.parent?.removeChild?.(sprite);
    this.boltPool.push(sprite);
  }

  explosion(x, y, color = 0xff4d4d, amount = 14) {
    for (let i = 0; i < amount; i += 1) {
      const particle = this._acquireCircleParticle();
      const radius = Math.random() * 2 + 1;
      const angle = (Math.PI * 2 * i) / amount + Math.random() * 0.3;
      const speed = Math.random() * 3 + 1.2;

      particle.beginFill(color, 1);
      particle.drawCircle(0, 0, radius);
      particle.endFill();
      particle.position.set(x, y);

      this.effectsContainer.addChild(particle);
      this.particles.push({
        sprite: particle,
        kind: "circle",
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        maxLife: 30,
        gravity: 0.05,
      });
    }
  }

  updateShake() {
    if (this.shakePower <= 0.05) {
      this.shakePower = 0;
      this.app.stage.position?.set?.(this.baseStagePosition.x, this.baseStagePosition.y);
      return;
    }

    const offsetX = (Math.random() - 0.5) * this.shakePower;
    const offsetY = (Math.random() - 0.5) * this.shakePower;
    this.app.stage.position?.set?.(this.baseStagePosition.x + offsetX, this.baseStagePosition.y + offsetY);
    this.shakePower *= 0.88;
  }

  updateParticles() {
    let write = 0;

    for (let i = 0; i < this.particles.length; i += 1) {
      const particle = this.particles[i];
      particle.vy += particle.gravity;
      particle.sprite.position.x += particle.vx;
      particle.sprite.position.y += particle.vy;
      particle.life -= 1;
      particle.sprite.alpha = Math.max(0, particle.life / particle.maxLife);

      if (particle.life <= 0) {
        if (particle.kind === "bolt") this._releaseBoltGraphic(particle.sprite);
        else this._releaseCircleParticle(particle.sprite);
        continue;
      }

      this.particles[write] = particle;
      write += 1;
    }

    this.particles.length = write;
  }

  updatePulses() {
    let write = 0;

    for (let i = 0; i < this.pulses.length; i += 1) {
      const pulse = this.pulses[i];
      if (pulse.displayObject.destroyed) continue;

      const progress = pulse.current / pulse.duration;
      pulse.displayObject.tint = progress > 0.5 ? pulse.color : pulse.originalTint;
      pulse.current -= 1;

      if (pulse.current <= 0) {
        pulse.displayObject.tint = pulse.originalTint;
        continue;
      }

      this.pulses[write] = pulse;
      write += 1;
    }

    this.pulses.length = write;
  }

  chainLightning(fromX, fromY, targets) {
    for (const target of targets) {
      const bolt = this._acquireBoltGraphic();
      const segments = 8;
      const points = [{ x: fromX, y: fromY }];
      for (let i = 1; i < segments; i++) {
        const t = i / segments;
        points.push({
          x: fromX + (target.x - fromX) * t + (Math.random() - 0.5) * 30,
          y: fromY + (target.y - fromY) * t + (Math.random() - 0.5) * 30,
        });
      }
      points.push({ x: target.x, y: target.y });

      const drawPath = (style) => {
        bolt.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) bolt.lineTo(points[i].x, points[i].y);
      };

      // Outer glow
      bolt.lineStyle(10, 0x00FFFF, 0.2);
      drawPath();
      // Mid glow
      bolt.lineStyle(5, 0x00FFFF, 0.5);
      drawPath();
      // Main bolt
      bolt.lineStyle(2.5, 0x00FFFF, 1);
      drawPath();
      // White hot core
      bolt.lineStyle(1, 0xFFFFFF, 0.9);
      drawPath();

      this.effectsContainer.addChild(bolt);
      this.particles.push({
        sprite: bolt,
        kind: "bolt",
        vx: 0,
        vy: 0,
        life: 35,
        maxLife: 35,
        gravity: 0,
      });
    }
  }

  screenPulse(color = 0xFF00FF, onComplete) {
    const { width: W, height: H } = this.app.screen;
    const maxRadius = Math.sqrt(W * W + H * H) / 2 + 20;
    const ring = new PIXI.Graphics();
    this.effectsContainer.addChild(ring);

    let radius = 0;
    const speed = maxRadius / 18;

    const tick = () => {
      radius += speed;
      const alpha = Math.max(0, 1 - radius / maxRadius);
      ring.clear();
      ring.lineStyle(5, color, alpha);
      ring.drawCircle(W / 2, H / 2, radius);
      ring.lineStyle(2, 0xFFFFFF, alpha * 0.4);
      ring.drawCircle(W / 2, H / 2, radius - 6);

      if (radius >= maxRadius) {
        this.app.ticker.remove(tick);
        ring.destroy();
        onComplete?.();
      }
    };
    this.app.ticker.add(tick);

    const flash = new PIXI.Graphics();
    flash.beginFill(color, 0.15);
    flash.drawRect(0, 0, W, H);
    flash.endFill();
    this.effectsContainer.addChild(flash);
    let flashLife = 8;
    const flashTick = () => {
      flashLife--;
      flash.alpha = flashLife / 8;
      if (flashLife <= 0) {
        this.app.ticker.remove(flashTick);
        flash.destroy();
      }
    };
    this.app.ticker.add(flashTick);
  }

  destroy() {
    this.app.ticker.remove(this.tick);
    this.backgroundContainer.destroy?.({ children: true });
    this.effectsContainer.destroy?.({ children: true });
    this.particles.length = 0;
    this.pulses.length = 0;

    for (const sprite of this.circleParticlePool) {
      sprite.parent?.removeChild?.(sprite);
      sprite.destroy?.();
    }
    for (const sprite of this.boltPool) {
      sprite.parent?.removeChild?.(sprite);
      sprite.destroy?.();
    }

    this.circleParticlePool.length = 0;
    this.boltPool.length = 0;
  }
}
