import Victor from "victor";

export default class EnemyBullet {
  constructor({ app, position, targetPosition, color }) {
    this.app = app;
    this.radius = 4;
    this.color = color;
    this.speed = 1.4;

    this.bullet = new PIXI.Graphics();
    this.bullet.beginFill(this.color, 0.8);
    this.bullet.drawCircle(0, 0, this.radius);
    this.bullet.endFill();
    this.bullet.position.set(position.x, position.y);
    
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

  updateTrail() {
    this.framesCount++;
    if (this.framesCount % 3 === 0) {
      const trail = new PIXI.Graphics();
      trail.beginFill(this.color, 0.4);
      trail.drawCircle(0, 0, this.radius * 0.8);
      trail.endFill();
      trail.position.set(this.bullet.position.x, this.bullet.position.y);
      this.trailContainer.addChild(trail);
      
      const fadeInterval = setInterval(() => {
        trail.alpha -= 0.05;
        trail.scale.x *= 0.9;
        trail.scale.y *= 0.9;
        if (trail.alpha <= 0) {
          trail.destroy();
          clearInterval(fadeInterval);
        }
      }, 30);
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
    this.bullet.destroy();
    
    // Trail will fade out on its own, but we detach the container from further updates
    setTimeout(() => {
      if (!this.trailContainer.destroyed) {
        this.trailContainer.destroy({ children: true });
      }
    }, 1000);
  }
}
