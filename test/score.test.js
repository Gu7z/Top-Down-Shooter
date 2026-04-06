import test from 'node:test';
import assert from 'node:assert/strict';
import Score from '../src/score.js';
import { setupPixiMock, createAppMock } from './helpers.js';

setupPixiMock();

global.__SNOWPACK_ENV__ = {
  SNOWPACK_PUBLIC_API_URL_PROD: 'prod-url',
  SNOWPACK_PUBLIC_API_URL_DEV: 'dev-url',
  MODE: 'production'
};

global.fetch = async () => ({ json: async () => [{ name: 'a', points: 1 }] });

const createElement = (tag) => ({
  tag,
  children: [],
  style: {},
  textContent: '',
  innerText: '',
  id: '',
  position: {},
  appendChild(child) { this.children.push(child); return child; },
  removeChild(child) { this.children = this.children.filter(c => c !== child); },
  setAttribute() {},
});

global.document = {
  body: createElement('body'),
  getElementById() { return null; },
  createElement,
};

const app = createAppMock();
const menu = { show() {} };
Score.prototype.loadScore = async function() {};
const score = new Score({ app, menu });

test('score container exists', () => {
  assert.ok(score.scoreContainer);
});

test('makeLoader returns element', () => {
  const el = score.makeLoader();
  assert.ok(el.textContent.includes('CARREGANDO'));
});

test('buildTable returns leaderboard wrapper', () => {
  const table = score.buildTable([{ name: 'a', points: 1 }]);
  assert.strictEqual(table.id, 'score-table');
  assert.strictEqual(table.children.length, 1);
});
