import test from 'node:test';
import assert from 'node:assert/strict';
import RunSummary from '../src/run_summary.js';
import { setupPixiMock, createAppMock } from './helpers.js';

setupPixiMock();

test('run summary renders stats and returns to menu', () => {
  let returned = false;
  const app = createAppMock();
  const screen = new RunSummary({
    app,
    username: 'player',
    summary: {
      score: 100,
      credits: { total: 42, breakdown: [{ label: 'Score', amount: 20 }] },
      accuracyPercent: 80,
      shotsFired: 10,
      shotsHit: 8,
      timeSurvivedSeconds: 60,
      killsByType: { chaser: 5 },
      bossKills: 1,
      highlights: ['HIGH ACCURACY'],
    },
    onBackToMenu: () => { returned = true; },
  });

  assert.ok(screen.container.children.length > 0);
  const buttons = screen.container.children.filter((child) => child.eventHandlers?.pointerdown);
  buttons.at(-1).eventHandlers.pointerdown();
  assert.equal(returned, true);
});

test('run summary shows victory title when final wave is cleared', () => {
  const app = createAppMock();
  const screen = new RunSummary({
    app,
    username: 'player',
    reason: 'victory',
    summary: {
      score: 100,
      credits: { total: 42, breakdown: [] },
      accuracyPercent: 80,
      shotsFired: 10,
      shotsHit: 8,
      timeSurvivedSeconds: 60,
      killsByType: {},
      bossKills: 4,
      highlights: [],
    },
  });

  const title = screen.container.children.find((child) => child.text === 'EMINÊNCIA SUPERADA');
  assert.ok(title);
});

test('run summary keeps stat rows separated on compact screens', () => {
  const app = {
    ...createAppMock(),
    screen: { width: 860, height: 453 },
  };
  const screen = new RunSummary({
    app,
    username: 'player',
    summary: {
      score: 100,
      credits: { total: 42, breakdown: [] },
      accuracyPercent: 80,
      shotsFired: 10,
      shotsHit: 8,
      timeSurvivedSeconds: 60,
      killsByType: {},
      bossKills: 1,
      highlights: [],
    },
  });
  const rowTexts = [
    'SCORE FINAL:',
    'CREDITOS GANHOS:',
    'PRECISAO:',
    'TIROS:',
    'TEMPO:',
    'BOSSES:',
  ];
  const yPositions = rowTexts.map((prefix) => (
    screen.container.children.find((child) => child.text?.startsWith(prefix)).position.y
  ));

  for (let index = 1; index < yPositions.length; index += 1) {
    assert.ok(yPositions[index] - yPositions[index - 1] >= 24);
  }
});

test('run summary destroy removes the container from stage', () => {
  const app = createAppMock();
  const screen = new RunSummary({
    app,
    username: 'player',
    summary: {
      score: 100,
      credits: { total: 42, breakdown: [] },
      accuracyPercent: 80,
      shotsFired: 10,
      shotsHit: 8,
      timeSurvivedSeconds: 60,
      killsByType: {},
      bossKills: 1,
      highlights: [],
    },
  });

  screen.destroy();

  assert.equal(app.stage.children.includes(screen.container), false);
});
