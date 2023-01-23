import Menu from "../src/menu";
import { timeout, interval } from "./lib/pixi-timeout.js";

const canvas = document.getElementById("mycanvas");
const app = new PIXI.Application({
  view: canvas,
  width: window.innerWidth,
  height: window.innerHeight,
});
timeout(app);
interval(app);

new Menu({ app });
