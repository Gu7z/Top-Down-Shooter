import test from "node:test";
import assert from "node:assert/strict";
import { interval, timeout } from "../public/lib/pixi-timeout.js";

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

test("interval.finish executes callback immediately and clearInterval delegates", () => {
  const pixi = createPixiMock();
  interval(pixi);

  let calls = 0;
  const timer = pixi.setInterval(() => {
    calls += 1;
  }, 10);

  timer.finish();
  assert.equal(calls, 1);

  pixi.clearInterval(timer);
  assert.equal(pixi.ticker.count(), 0);
});

test("timeout supports firing, finishing, and clearing", () => {
  const pixi = createPixiMock();
  timeout(pixi);

  let calls = 0;
  const timer = pixi.setTimeout(() => {
    calls += 1;
  }, 0.1);

  assert.equal(pixi.ticker.count(), 1);
  pixi.ticker.run(1, 6);
  assert.equal(calls, 0);

  pixi.ticker.run(1, 1);
  assert.equal(calls, 1);
  assert.equal(pixi.ticker.count(), 0);

  const finished = pixi.setTimeout(() => {
    calls += 1;
  }, 10);
  finished.finish();
  assert.equal(calls, 2);

  const cleared = pixi.setTimeout(() => {
    calls += 1;
  }, 10);
  pixi.clearTimeout(cleared);
  assert.equal(pixi.ticker.count(), 0);
});

test("interval stop branch removes stale listeners on the next tick and ignores finish after clear", () => {
  const listeners = [];
  let removeCalls = 0;
  const pixi = {
    ticker: {
      speed: 1,
      add(fn) {
        listeners.push(fn);
      },
      remove() {
        removeCalls += 1;
      },
      run(delta = 1) {
        listeners.forEach((fn) => fn(delta));
      },
    },
  };
  interval(pixi);

  let calls = 0;
  const timer = pixi.setInterval(() => {
    calls += 1;
  }, 10);

  timer.clear();
  timer.finish();
  pixi.ticker.run(1);

  assert.equal(calls, 0);
  assert.equal(removeCalls >= 2, true);
});
