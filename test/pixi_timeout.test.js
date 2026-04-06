import test from "node:test";
import assert from "node:assert/strict";
import { interval } from "../public/lib/pixi-timeout.js";

function createPixiMock(speed = 1) {
  const listeners = new Set();
  return {
    ticker: {
      speed,
      add(fn) {
        listeners.add(fn);
      },
      remove(fn) {
        listeners.delete(fn);
      },
      run(delta = 1, frames = 1) {
        for (let i = 0; i < frames; i += 1) {
          [...listeners].forEach((fn) => fn(delta));
        }
      },
      count() {
        return listeners.size;
      },
    },
  };
}

test("interval.clear removes ticker immediately", () => {
  const pixi = createPixiMock();
  interval(pixi);

  const timer = pixi.setInterval(() => {}, 0.3);
  assert.equal(pixi.ticker.count(), 1);

  timer.clear();
  assert.equal(pixi.ticker.count(), 0);
});

test("interval callback executes once per elapsed period", () => {
  const pixi = createPixiMock();
  interval(pixi);

  let calls = 0;
  pixi.setInterval(() => {
    calls += 1;
  }, 0.1);

  pixi.ticker.run(1, 5);
  assert.equal(calls, 0);

  pixi.ticker.run(1, 1);
  assert.equal(calls, 1);

  pixi.ticker.run(1, 6);
  assert.equal(calls, 2);
});
