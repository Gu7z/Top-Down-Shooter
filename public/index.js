import Menu from "../src/menu";
import { audio } from "../src/audio.js";
import { timeout, interval } from "./lib/pixi-timeout.js";

const canvas = document.getElementById("mycanvas");
const app = new PIXI.Application({
  view:            canvas,
  width:           1280,
  height:          720,
  backgroundColor: 0x0A0A0F,
});
timeout(app);
interval(app);

// Wait for Orbitron + JetBrains Mono to load before rendering any text
document.fonts.ready.then(() => {
  audio.load();
  new Menu({ app });
});
