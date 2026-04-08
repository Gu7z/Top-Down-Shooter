import test from "node:test";
import assert from "node:assert/strict";
import { RunUpgradeScreen } from "../../src/run_upgrades/run_upgrade_screen.js";
import { UPGRADE_REGISTRY } from "../../src/run_upgrades/run_upgrade_data.js";
import { setupPixiMock, createAppMock } from "../helpers.js";

setupPixiMock();

function createUpgradeApp() {
  const app = createAppMock();
  app.screen = { width: 1280, height: 720 };
  return app;
}

function buildCards() {
  return [
    { upgrade: UPGRADE_REGISTRY.find((upgrade) => upgrade.id === "boss_hunter"), level: 0, index: 0 },
    { upgrade: UPGRADE_REGISTRY.find((upgrade) => upgrade.id === "viral_core"), level: 2, index: 1 },
  ];
}

function findCardContainers(screen) {
  return screen.container.children.filter((child) =>
    child.children?.some((nested) => nested.eventHandlers?.pointerdown)
  );
}

function findCardBackground(cardContainer) {
  return cardContainer.children.find((child) => child.eventHandlers?.pointerdown);
}

test("run upgrade screen builds interactive cards and reacts to hover", () => {
  const screen = new RunUpgradeScreen(createUpgradeApp());

  screen._build(buildCards(), () => {});

  const [firstCard] = findCardContainers(screen);
  const bg = findCardBackground(firstCard);

  bg.eventHandlers.pointerover();
  assert.equal(firstCard.scale.x, 1.03);

  bg.eventHandlers.pointerout();
  assert.equal(firstCard.scale.x, 1);

  screen.app.ticker.stepFrames(40);
  assert.equal(screen._animTicker, null);
});

test("run upgrade screen show completes selection flow and removes the overlay", () => {
  const app = createUpgradeApp();
  const screen = new RunUpgradeScreen(app);
  let chosenIndex = null;

  screen.show(
    {
      getCardsToShow() {
        return buildCards();
      },
    },
    (index) => {
      chosenIndex = index;
    },
  );

  app.ticker.stepFrames(40);

  const [firstCard] = findCardContainers(screen);
  const bg = findCardBackground(firstCard);
  const overlayContainer = screen.container;

  bg.eventHandlers.pointerdown();
  app.ticker.stepFrames(40);

  assert.equal(chosenIndex, 0);
  assert.equal(screen.container, null);
  assert.equal(app.stage.children.includes(overlayContainer), false);
});
