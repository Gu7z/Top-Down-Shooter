import test from "node:test";
import assert from "node:assert/strict";
import {
  createBackdrop,
  createLabel,
  createPillButton,
} from "../src/ui_system.js";
import { setupPixiMock, createAppMock } from "./helpers.js";

setupPixiMock();

test("ui_system backdrop builds the layered background scaffold", () => {
  const app = createAppMock();
  const container = new PIXI.Container();

  createBackdrop(container, app);

  assert.equal(container.children.length, 4);
});

test("ui_system glow labels keep halo position and visibility in sync", () => {
  const container = new PIXI.Container();
  const label = createLabel({
    container,
    text: "SYNC",
    x: 10,
    y: 20,
    glow: true,
  });

  label.position.set(40, 50);
  label.visible = false;

  assert.equal(label.glowHalo.position.x, 40);
  assert.equal(label.glowHalo.position.y, 50);
  assert.equal(label.glowHalo.visible, false);

  label.visible = true;
  assert.equal(label.glowHalo.visible, true);
});

test("ui_system pill buttons expose user interactions and disabled state", () => {
  const container = new PIXI.Container();
  let clicks = 0;
  const button = createPillButton({
    container,
    x: 100,
    y: 120,
    text: "CLICK",
    onClick: () => { clicks += 1; },
  });

  button.bg.eventHandlers.pointerdown();
  button.setEnabled(false);

  assert.equal(clicks, 1);
  assert.equal(button.bg.interactive, false);
  assert.equal(button.bg.cursor, "default");
  assert.equal(button.label.alpha, 0.38);
});
