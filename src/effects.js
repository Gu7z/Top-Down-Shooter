export default class Effects {
  constructor({ app }) {
    this.app = app;
    this.baseStagePosition = { x: 0, y: 0 };
    this.shakePower = 0;
    this.particles = [];
    this.pulses = [];

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

  explosion(x, y, color = 0xff4d4d, amount = 14) {
    for (let i = 0; i < amount; i += 1) {
      const particle = new PIXI.Graphics();
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
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
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
    this.particles = this.particles.filter((particle) => {
      particle.vy += particle.gravity;
      particle.sprite.position.x += particle.vx;
      particle.sprite.position.y += particle.vy;
      particle.life -= 1;
      particle.sprite.alpha = Math.max(0, particle.life / 30);

      if (particle.life <= 0) {
        particle.sprite.destroy();
        return false;
      }

      return true;
    });
  }

  updatePulses() {
    this.pulses = this.pulses.filter((pulse) => {
      if (pulse.displayObject.destroyed) return false;
      const progress = pulse.current / pulse.duration;
      pulse.displayObject.tint = progress > 0.5 ? pulse.color : pulse.originalTint;
      pulse.current -= 1;

      if (pulse.current <= 0) {
        pulse.displayObject.tint = pulse.originalTint;
        return false;
      }
      return true;
    });
  }

  destroy() {
    this.app.ticker.remove(this.tick);
    this.backgroundContainer.destroy?.({ children: true });
    this.effectsContainer.destroy?.({ children: true });
  }
}
