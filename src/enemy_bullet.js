import Victor from "victor";

export default class EnemyBullet {
  constructor({
    app,
    position,
    targetPosition,
    color,
    speed = 1.4,
    coreColor = color,
    fillAlpha = 0.8,
    ringColor = null,
    ringWidth = 0,
    ringAlpha = 1,
    glowColor = null,
    glowAlpha = 0,
    glowScale = 1.6,
    trailColor = color,
    trailAlpha = 0.4,
    trailScale = 0.8,
  }) {
    this.app = app;
    this.radius = 4;
    this.color = color;
    this.speed = speed;
    this.coreColor = coreColor;
    this.fillAlpha = fillAlpha;
    this.ringColor = ringColor;
    this.ringWidth = ringWidth;
    this.ringAlpha = ringAlpha;
    this.glowColor = glowColor;
    this.glowAlpha = glowAlpha;
    this.glowScale = glowScale;
    this.trailColor = trailColor;
    this.trailAlpha = trailAlpha;
    this.trailScale = trailScale;

    this.bullet = new PIXI.Container();
    this.bullet.visible = true;

    if (this.glowColor !== null && this.glowAlpha > 0) {
      const glow = new PIXI.Graphics();
      glow.beginFill(this.glowColor, 1);
      glow.drawCircle(0, 0, this.radius * this.glowScale);
      glow.endFill();
      glow.alpha = this.glowAlpha;
      this.bullet.addChild(glow);
    }

    const core = new PIXI.Graphics();
    if (this.ringColor !== null && this.ringWidth > 0) {
      core.lineStyle(this.ringWidth, this.ringColor, this.ringAlpha);
    }
    core.beginFill(this.coreColor, this.fillAlpha);
    core.drawCircle(0, 0, this.radius);
    core.endFill();
    this.bullet.addChild(core);
    this.bullet.position.set(position.x, position.y);
    this.app.stage.addChild(this.bullet);
    
    // Calculate direction and velocity
    const targetVector = new Victor(targetPosition.x, targetPosition.y);
    const posVector = new Victor(position.x, position.y);
    const distanceVector = targetVector.subtract(posVector);
    
    this.velocity = distanceVector.normalize().multiplyScalar(this.speed);
    
    this.sprite = this.bullet;
    this.destroyed = false;
    
    // Keep reference to container for trail graphics
    this.trailContainer = new PIXI.Container();
    app.stage.addChild(this.trailContainer);
    
    this.framesCount = 0;
    this.trailFadeStepFrames = 2;
    this.trailNodes = [];
  }

  isOutOfBounds() {
    const { width, height } = this.app.screen;
    return (
      this.bullet.position.x < -this.radius ||
      this.bullet.position.x > width + this.radius ||
      this.bullet.position.y < -this.radius ||
      this.bullet.position.y > height + this.radius
    );
  }

  _spawnTrailNode() {
    const trail = new PIXI.Graphics();
    trail.beginFill(this.trailColor, 1);
    trail.drawCircle(0, 0, this.radius * this.trailScale);
    trail.endFill();
    trail.alpha = this.trailAlpha;
    trail.position.set(this.bullet.position.x, this.bullet.position.y);
    this.trailContainer.addChild(trail);

    this.trailNodes.push({
      sprite: trail,
      alpha: this.trailAlpha,
      scale: 1,
      fadeFrames: 0,
    });
  }

  _updateTrailNodes() {
    let write = 0;

    for (let i = 0; i < this.trailNodes.length; i += 1) {
      const node = this.trailNodes[i];
      if (node.sprite.destroyed) {
        this.trailContainer.removeChild(node.sprite);
        continue;
      }

      node.fadeFrames += 1;
      if (node.fadeFrames < this.trailFadeStepFrames) {
        this.trailNodes[write] = node;
        write += 1;
        continue;
      }

      node.fadeFrames = 0;
      node.alpha -= 0.05;
      node.scale *= 0.9;
      node.sprite.alpha = node.alpha;
      node.sprite.scale.set(node.scale, node.scale);

      if (node.alpha <= 0) {
        this.trailContainer.removeChild(node.sprite);
        node.sprite.destroy();
        continue;
      }

      this.trailNodes[write] = node;
      write += 1;
    }

    this.trailNodes.length = write;
  }

  updateTrail() {
    this.framesCount += 1;
    this._updateTrailNodes();
    if (this.framesCount % 3 === 0) {
      this._spawnTrailNode();
    }
  }

  update() {
    if (this.destroyed) return;
    
    this.bullet.position.set(
      this.bullet.position.x + this.velocity.x,
      this.bullet.position.y + this.velocity.y
    );
    
    this.updateTrail();
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.bullet.visible = false;
    this.bullet.parent?.removeChild?.(this.bullet);
    this.bullet.destroy({ children: true });
    this.trailNodes.forEach((node) => {
      this.trailContainer.removeChild(node.sprite);
      node.sprite.destroy();
    });
    this.trailNodes.length = 0;
    if (!this.trailContainer.destroyed) {
      this.trailContainer.parent?.removeChild?.(this.trailContainer);
      this.trailContainer.destroy({ children: true });
    }
  }
}
