import * as PIXI from "pixi.js";
import Buff from "./core/buff";
import Player from "./core/player";
import Spawner from "./core/spanwer";
import bulletHit from "./utils/bullet_hit";
import Score from "./core/score";

const canvas = document.getElementById("mycanvas");
const app = new PIXI.Application({
  view: canvas,
  width: window.innerWidth,
  height: window.innerHeight,
});

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
    enemySpawner.enemyRadius,
    player
  );
});

app.renderer.view.onmousemove = function (e) {
  player.setMousePosition(e.clientX, e.clientY);
};

app.renderer.view.onpointerdown = function (e) {
  if (player.lifes < 1) return;

  player.shooting.shoot = true;
  player.shooting.update();
};

app.renderer.view.onpointerup = function (e) {
  player.shooting.shoot = false;
  player.shooting.update();
};

export { app, player };
