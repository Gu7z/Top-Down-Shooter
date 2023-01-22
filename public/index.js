import Buff from "../src/buff";
import Player from "../src/player";
import Spawner from "../src/spanwer";
import bulletHit from "../src/utils/bullet_hit";
import Score from "../src/score";

const canvas = document.getElementById("mycanvas");
const app = new PIXI.Application({
  view: canvas,
  width: window.innerWidth,
  height: window.innerHeight,
});

let paused = false;
const mousePosition = { x: 0, y: 0 };
const player = new Player({ app, mousePosition });
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
  enemySpawner.spawns.forEach((enemy) => enemy.update(player, enemySpawner));

  bulletHit(
    player.shooting.bullets,
    enemySpawner.spawns,
    player.shooting.bulletRadius,
    player
  );
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
  if (e.key !== " ") return;

  score.showPaused = !paused;
  app.render();

  if (paused) {
    app.start();
  } else {
    app.stop();
  }

  paused = !paused;
});

export { app, player };
