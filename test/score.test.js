import test from 'node:test';
import assert from 'node:assert/strict';
import Score from '../src/score.js';
import { setupPixiMock, createAppMock, setupDomMock } from './helpers.js';

setupPixiMock();
setupDomMock();

global.__SNOWPACK_ENV__ = {
  SNOWPACK_PUBLIC_API_URL_PROD: 'prod-url',
  SNOWPACK_PUBLIC_API_URL_DEV: 'dev-url',
  MODE: 'production'
};

global.fetch = async () => ({ json: async () => [{ name: 'a', points: 1 }] });


const app = createAppMock();
const menu = { show() {} };
Score.prototype.showScore = async function() {};
const score = new Score({ app, menu });

test('score container exists', () => {
  assert.ok(score.scoreContainer);
});

test('drawLoading returns element', () => {
  const el = score.drawLoading();
  assert.ok(el.innerText.includes('Carregando'));
});

test('drawTable functions return elements', async () => {
  const table = score.drawTable();
  table.appendChild(score.drawTableHead());
  table.appendChild(score.drawTableLine(1,'a',1));
  assert.ok(table);
  await score.getScore();
});
