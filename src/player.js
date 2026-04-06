import Shooting from "./shooting.js";
import { createDefaultSkillEffects } from "./progression/skill_effects.js";

export default class Player {
  constructor({ app, username, keys, skillEffects = {}, runStats = null }) {
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

    const middleWidth = app.screen.width / 2;
    const middleHeight = app.screen.height / 2;

    const playerTexture = PIXI.Texture.from("./images/spaceship.png");
    playerTexture.rotate = 6;
    this.player = new PIXI.Sprite(playerTexture);
    this.player.scale.x *= this.size / 100;
    this.player.scale.y *= this.size / 100;
    this.player.anchor.set(0.5);
    this.player.position.set(middleWidth, middleHeight);

    this.playerGlow = new PIXI.Graphics();
    this.playerGlow.beginFill(0x00e5ff, 0.2);
    this.playerGlow.drawCircle(0, 0, this.size * 1.2);
    this.playerGlow.endFill();
    this.playerGlow.position.set(middleWidth, middleHeight);

    this.shooting = new Shooting({
      app,
      player: this.player,
      playerSize: this.size,
      keys,
      skillEffects: this.skillEffects,
      runStats,
    });

    this.setMousePosition(middleWidth, 0);
    this.playerContainer.addChild(this.playerGlow);
    this.playerContainer.addChild(this.player);
    this.app.stage.addChild(this.playerContainer);
  }

  setMousePosition = (x, y) => {
    this.mouseX = x;
    this.mouseY = y;
  };

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
    if (keys.w) {
      if (this.outOfBounds("w")) return;
      this.player.y -= this.velocity;
    }
    if (keys.a) {
      if (this.outOfBounds("a")) return;
      this.player.x -= this.velocity;
    }
    if (keys.s) {
      if (this.outOfBounds("s")) return;
      this.player.y += this.velocity;
    }
    if (keys.d) {
      if (this.outOfBounds("d")) return;
      this.player.x += this.velocity;
    }
  };

  lookTo = () => {
    const angle = Math.atan2(this.mouseY - this.player.position.y, this.mouseX - this.player.position.x);

    this.player.rotation = angle;
  };

  updateGlow() {
    this.playerGlow.position.set(this.player.position.x, this.player.position.y);
    this.playerGlow.alpha = 0.17 + Math.abs(Math.sin(Date.now() * 0.008)) * 0.18;
  }

  update(keys) {
    this.lookTo();
    this.movePlayer(keys);
    this.updateGlow();
  }
}
