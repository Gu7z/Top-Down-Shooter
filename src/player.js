import Shooting from "./shooting.js";

export default class Player {
  constructor({ app, username, keys }) {
    this.app = app;
    this.points = 0;
    this.lifes = 1;
    this.velocity = 2;
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

    this.shooting = new Shooting({
      app,
      player: this.player,
      playerSize: this.size,
      keys,
    });

    this.setMousePosition(middleWidth, 0);
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

  movePlayer = (keys) => {
    if (keys["w"]) {
      if (this.outOfBounds("w")) return;
      this.player.y -= this.velocity;
    }
    if (keys["a"]) {
      if (this.outOfBounds("a")) return;
      this.player.x -= this.velocity;
    }
    if (keys["s"]) {
      if (this.outOfBounds("s")) return;
      this.player.y += this.velocity;
    }
    if (keys["d"]) {
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

  update(keys) {
    this.lookTo();
    this.movePlayer(keys);
  }
}
