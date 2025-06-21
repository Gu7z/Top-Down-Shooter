import Buff from "./buff.js";
import Player from "./player.js";
import Spawner from "./spanwer.js";
import Hud from "./ui/hud.js";
import bulletHit from "./utils/bullet_hit.js";

export default class Game {
  constructor({ app, username }) {
    this.app = app;
    let paused = false;
    let muted = false;
    let shooting = false;
    const keys = {};
    const mousePosition = { x: 0, y: 0 };
    this.player = new Player({ app, mousePosition, username, keys });
    this.enemySpawner = new Spawner({ app, player: this.player });
    this.hud = new Hud();
    this.buff = new Buff({ app, hud: this.hud });

    this.clear = () => {
      this.player.shooting.interval.clear();
      app.stage.removeChild(this.player.playerContainer);
      app.stage.removeChild(this.player.shooting.shootingContainer);
      app.stage.removeChild(this.buff.buffContainer);
      app.stage.removeChild(this.enemySpawner.spawnerContainer);
    };

    this.ticker = app.ticker.add(() => {
      this.hud.update(this.player, this.clear);
      this.player.update(keys);
      this.buff.update(this.player);
      this.enemySpawner.update(this.player);
      this.enemySpawner.spawns.forEach((enemy) => {
        enemy.update(this.player, this.enemySpawner);
      });
      this.player.shooting.update(shooting, this.enemySpawner, this.player);
    });

    app.renderer.view.onmousemove = (e) => {
      this.player.setMousePosition(e.clientX, e.clientY);
    };

    window.addEventListener("pointerdown", () => {
      shooting = true;
    });

    window.addEventListener("pointerup", () => {
      shooting = false;
    });

    window.addEventListener("keydown", (e) => {
      keys[e.key] = true;
    });
    window.addEventListener("keyup", (e) => {
      keys[e.key] = false;
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "m") {
        PIXI.sound.volumeAll = muted ? 1 : 0;
        muted = !muted;
      }
    });
  }
}
