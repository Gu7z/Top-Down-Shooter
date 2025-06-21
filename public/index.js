import { timeout, interval } from "./lib/pixi-timeout.js";
import Game from "../src/game.js";
import Menu from "../src/ui/menu.js";
import Hud from "../src/ui/hud.js";
import Controls from "../src/ui/controls.js";
import Score from "../src/ui/score.js";

const canvas = document.getElementById("mycanvas");
const app = new PIXI.Application({ view: canvas, width: 1280, height: 720 });

timeout(app);
interval(app);

const menu = new Menu();
const hud = new Hud();
const controls = new Controls();
const score = new Score();

let game;

menu.playBtn.addEventListener("click", () => {
  menu.hide();
  canvas.classList.remove("hidden");
  game = new Game({ app, username: menu.username.value });
});

menu.controlsBtn.addEventListener("click", () => {
  menu.hide();
  controls.show();
});

controls.closeBtn.addEventListener("click", () => {
  controls.hide();
  menu.show();
});

menu.scoreBtn.addEventListener("click", () => {
  menu.hide();
  score.show();
});

score.closeBtn.addEventListener("click", () => {
  score.hide();
  menu.show();
});

hud.backBtn.addEventListener("click", () => {
  hud.gameOverEl.classList.add("hidden");
  canvas.classList.add("hidden");
  game.clear();
  menu.show();
});

app.ticker.add(() => {
  if (game) {
    hud.update(game.player, () => {});
  }
});
