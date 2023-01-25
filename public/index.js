import Menu from "../src/menu";
import { timeout, interval } from "./lib/pixi-timeout.js";

const canvas = document.getElementById("mycanvas");
const app = new PIXI.Application({
  view: canvas,
  width: 1280,
  height: 720,
});
timeout(app);
interval(app);

new Menu({ app });
