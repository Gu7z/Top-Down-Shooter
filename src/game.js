import Buff from "./buff.js";
import Player from "./player.js";
import Spawner from "./spanwer.js";
import Hud from "./hud.js";
import Effects from "./effects.js";

export default class Game {
  constructor({ app, username }) {
    this.app = app;
    let paused = false;
    let muted = false;
    let shooting = false;
    const keys = {};

    this.effects = new Effects({ app });
    this.player = new Player({ app, username, keys });
    this.enemySpawner = new Spawner({ app, player: this.player });
    this.hud = new Hud({ app, player: this.player });
    this.buff = new Buff({ app, hud: this.hud });

    this.player.shooting.registerEffects(this.effects);

    this.handleMouseMove = (e) => {
      this.player.setMousePosition(e.clientX, e.clientY);
    };

    this.handlePointerDown = () => {
      shooting = true;
      this.effects.shake(1.5);
    };

    this.handlePointerUp = () => {
      shooting = false;
    };

    this.handleKeyDown = (e) => {
      keys[e.key] = true;
    };

    this.handleKeyUp = (e) => {
      keys[e.key] = false;
    };

    this.handleSystemKeys = (e) => {
      const usedKeys = ["Escape", "m"];
      if (!usedKeys.includes(e.key)) return;

      switch (e.key) {
        case "Escape":
          this.hud.showPaused = !paused;
          this.player.shooting.update();
          app.render();

          if (paused) {
            app.start();
          } else {
            app.stop();
          }

          paused = !paused;
          break;

        case "m":
          PIXI.sound.volumeAll = muted ? 1 : 0;
          muted = !muted;
          break;

        default:
          break;
      }
    };

    this.clear = () => {
      this.player.shooting.interval.clear();
      this.effects.destroy();
      this.app.ticker.remove(this.tick);
      this.app.renderer.view.onmousemove = null;
      window.removeEventListener("pointerdown", this.handlePointerDown);
      window.removeEventListener("pointerup", this.handlePointerUp);
      window.removeEventListener("keydown", this.handleKeyDown);
      window.removeEventListener("keyup", this.handleKeyUp);
      window.removeEventListener("keydown", this.handleSystemKeys);
      app.stage.removeChild(this.player.playerContainer);
      app.stage.removeChild(this.player.shooting.shootingContainer);
      app.stage.removeChild(this.buff.buffContainer);
      app.stage.removeChild(this.enemySpawner.spawnerContainer);
      app.stage.removeChild(this.hud.hudContainer);
    };

    this.tick = () => {
      this.hud.update(this.clear);
      this.player.update(keys);
      this.buff.update(this.player);
      this.enemySpawner.update(this.player);
      this.enemySpawner.spawns.forEach((enemy) => {
        enemy.update(this.player, this.enemySpawner, this.effects);
      });
      this.player.shooting.update(shooting, this.enemySpawner, this.player);
    };

    this.ticker = app.ticker.add(this.tick);

    app.renderer.view.onmousemove = this.handleMouseMove;
    window.addEventListener("pointerdown", this.handlePointerDown);
    window.addEventListener("pointerup", this.handlePointerUp);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("keydown", this.handleSystemKeys);
  }
}
