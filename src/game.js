import Buff from "../src/buff";
import Player from "../src/player";
import Spawner from "../src/spanwer";
import Score from "./hud";

export default class Game {
  constructor({ app, username }) {
    let paused = false;
    let muted = false;
    const mousePosition = { x: 0, y: 0 };
    const player = new Player({ app, mousePosition, username });
    const score = new Score({ app, player });
    const buff = new Buff({ app });
    const enemySpawner = new Spawner({ app, player });

    app.ticker.add(() => {
      score.update();
      if (player.lifes < 1) {
        app.stage.removeChildren();
        score.update();
      }

      player.update();
      buff.update(player);
      enemySpawner.update(player);
      enemySpawner.spawns.forEach((enemy) => {
        enemy.update(player, enemySpawner);
      });
      player.shooting.update(enemySpawner.spawns);
    });

    app.renderer.view.onmousemove = function (e) {
      player.setMousePosition(e.clientX, e.clientY);
    };

    app.renderer.view.onpointerdown = function (e) {
      if (paused) return;
      if (player.lifes < 1) return;

      player.shooting.shoot = true;
      player.shooting.update();
    };

    app.renderer.view.onpointerup = function (e) {
      if (paused) return;

      player.shooting.shoot = false;
      player.shooting.update();
    };

    window.addEventListener("keydown", (e) => {
      const ignoredKeys = [" ", "m"];
      if (!ignoredKeys.includes(e.key)) return;

      switch (e.key) {
        case " ":
          score.showPaused = !paused;
          player.shooting.shoot = false;
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
