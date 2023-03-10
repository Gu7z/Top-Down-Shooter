import Buff from "../src/buff";
import Player from "../src/player";
import Spawner from "../src/spanwer";
import Hud from "./hud";
import bulletHit from "./utils/bullet_hit";

export default class Game {
  constructor({ app, username }) {
    this.app = app;
    let paused = false;
    let muted = false;
    let shooting = false;
    const keys = {};
    const mousePosition = { x: 0, y: 0 };
    const player = new Player({ app, mousePosition, username, keys });
    const enemySpawner = new Spawner({ app, player });
    const hud = new Hud({ app, player });
    const buff = new Buff({ app, hud });

    const clear = () => {
      player.shooting.interval.clear();
      app.stage.removeChild(player.playerContainer);
      app.stage.removeChild(player.shooting.shootingContainer);
      app.stage.removeChild(buff.buffContainer);
      app.stage.removeChild(enemySpawner.spawnerContainer);
    };

    this.ticker = app.ticker.add(() => {
      hud.update(clear);
      player.update(keys);
      buff.update(player);
      enemySpawner.update(player);
      enemySpawner.spawns.forEach((enemy) => {
        enemy.update(player, enemySpawner);
      });
      player.shooting.update(shooting, enemySpawner, player);
    });

    app.renderer.view.onmousemove = function (e) {
      player.setMousePosition(e.clientX, e.clientY);
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
      const usedKeys = ["Escape", "m"];
      if (!usedKeys.includes(e.key)) return;

      switch (e.key) {
        case "Escape":
          hud.showPaused = !paused;
          player.shooting.update();
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
    });
  }
}
