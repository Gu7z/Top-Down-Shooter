import Shooting from "./shooting";

export default class Player {
  constructor({ app, username }) {
    this.app = app;
    this.key = {};
    this.points = 0;
    this.lifes = 1;
    this.velocity = 2;
    this.size = 20;
    this.username = username;

    const middleWidth = app.screen.width / 2;
    const middleHeight = app.screen.height / 2;

    const playerTexture = PIXI.Texture.from("./images/spaceship.png");
    playerTexture.rotate = 6;
    this.player = new PIXI.Sprite(playerTexture);
    this.player.scale.x *= this.size / 100;
    this.player.scale.y *= this.size / 100;
    this.player.anchor.set(0.5);
    this.player.position.set(middleWidth, middleHeight);

    this.shooting = new Shooting({
      app,
      player: this.player,
      playerSize: this.size,
    });

    this.setMousePosition(middleWidth, 0);
    this.app.stage.addChild(this.player);

    window.addEventListener("keydown", this.keydown);
    window.addEventListener("keyup", this.keyup);
  }

  setMousePosition = (x, y) => {
    this.mouseX = x;
    this.mouseY = y;
  };

  keydown = (e) => {
    this.key[e.key] = true;
  };

  keyup = (e) => {
    this.key[e.key] = false;
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
        return playerYBoundarie < boundaries["leftAndTop"];
      case "a":
        return playerXBoundarie < boundaries["leftAndTop"];
      case "s":
        return playerYBoundarie > boundaries["bottom"];
      case "d":
        return playerXBoundarie > boundaries["right"];
      default:
        return true;
    }
  }

  movePlayer = () => {
    if (this.key["w"]) {
      if (this.outOfBounds("w")) return;
      this.player.y -= this.velocity;
    }
    if (this.key["a"]) {
      if (this.outOfBounds("a")) return;
      this.player.x -= this.velocity;
    }
    if (this.key["s"]) {
      if (this.outOfBounds("s")) return;
      this.player.y += this.velocity;
    }
    if (this.key["d"]) {
      if (this.outOfBounds("d")) return;
      this.player.x += this.velocity;
    }
  };

  lookTo = () => {
    const angle = Math.atan2(
      this.mouseY - this.player.position.y,
      this.mouseX - this.player.position.x
    );

    this.player.rotation = angle;
  };

  update() {
    this.lookTo();
    this.movePlayer();
  }
}
