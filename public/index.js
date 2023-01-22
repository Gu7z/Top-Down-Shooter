import Menu from "../src/menu";

const canvas = document.getElementById("mycanvas");
const app = new PIXI.Application({
  view: canvas,
  width: window.innerWidth,
  height: window.innerHeight,
});

new Menu({ app });
