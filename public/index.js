import Menu from "../src/menu";
import Controls from "../src/controls";
import Score from "../src/score";
import Hud from "../src/hud";
import Game from "../src/game";
import { timeout, interval } from "./lib/pixi-timeout.js";

const canvas = document.getElementById("mycanvas");
const app = new PIXI.Application({
  view: canvas,
  width: 1280,
  height: 720,
});

timeout(app);
interval(app);

let hud;
let game;

function showMenu() {
  const menu = new Menu({
    start: (username) => {
      menu.hide();
      hud = new Hud({ app, onBack: showMenu });
      game = new Game({ app, username, hud });
    },
    showScore: () => {
      const score = new Score({ onBack: showMenu });
      score.show();
    },
    showControls: () => {
      const controls = new Controls({ onBack: showMenu });
      controls.show();
    },
  });
  menu.show();
}

showMenu();
