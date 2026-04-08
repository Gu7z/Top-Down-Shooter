import test from "node:test";
import assert from "node:assert/strict";
import Effects from "../src/effects.js";
import { setupPixiMock, createAppMock } from "./helpers.js";

setupPixiMock();

function createEffectsApp() {
  const app = createAppMock();
  app.stage.position = {
    x: 0,
    y: 0,
    set(x, y) {
      this.x = x;
      this.y = y;
    },
  };
  return app;
}

test("effects registers ticker and renders background/effects layers", () => {
  const app = createEffectsApp();
  const effects = new Effects({ app });

  assert.equal(app.ticker.fn, effects.tick);
  assert.ok(app.stage.children.includes(effects.backgroundContainer));
  assert.ok(app.stage.children.includes(effects.effectsContainer));
  assert.equal(effects.backgroundContainer.children.length, 2);
});

test("shake decays and resets stage position when exhausted", () => {
  const app = createEffectsApp();
  const effects = new Effects({ app });

  effects.shake(10);
  effects.updateShake();
  assert.ok(effects.shakePower < 10);

  effects.shakePower = 0.01;
  app.stage.position.set(5, 5);
  effects.updateShake();

  assert.equal(effects.shakePower, 0);
  assert.equal(app.stage.position.x, 0);
  assert.equal(app.stage.position.y, 0);
});

test("explosion particles move, fade, and are removed at end of life", () => {
  const app = createEffectsApp();
  const effects = new Effects({ app });

  effects.explosion(10, 20, 0xff0000, 2);

  assert.equal(effects.particles.length, 2);
  assert.equal(effects.effectsContainer.children.length, 2);

  const firstParticle = effects.particles[0];
  const startX = firstParticle.sprite.position.x;
  firstParticle.life = 1;
  effects.particles[1].life = 1;

  effects.updateParticles();

  assert.notEqual(firstParticle.sprite.position.x, startX);
  assert.equal(effects.particles.length, 0);
  assert.equal(firstParticle.sprite.destroyed, true);
});

test("active particles remain until life expires", () => {
  const app = createEffectsApp();
  const effects = new Effects({ app });

  effects.explosion(10, 20, 0xff0000, 1);
  const particle = effects.particles[0];
  particle.life = 2;

  effects.updateParticles();

  assert.equal(effects.particles.length, 1);
  assert.equal(particle.sprite.destroyed, undefined);
});

test("pulse tints temporarily and restores original tint", () => {
  const app = createEffectsApp();
  const effects = new Effects({ app });
  const target = new PIXI.Graphics();
  target.tint = 0x123456;

  effects.pulse(target, 0xff00ff, 2);
  effects.updatePulses();

  assert.equal(target.tint, 0xff00ff);
  assert.equal(effects.pulses.length, 1);

  effects.updatePulses();

  assert.equal(target.tint, 0x123456);
  assert.equal(effects.pulses.length, 0);
});

test("pulse drops destroyed targets without touching tint", () => {
  const app = createEffectsApp();
  const effects = new Effects({ app });
  const target = new PIXI.Graphics();
  target.tint = 0x123456;
  target.destroyed = true;

  effects.pulse(target, 0xff00ff, 2);
  effects.updatePulses();

  assert.equal(effects.pulses.length, 0);
  assert.equal(target.tint, 0x123456);
});

test("tick updates shake, particles, and pulses", () => {
  const app = createEffectsApp();
  const effects = new Effects({ app });
  const calls = [];

  effects.updateShake = () => calls.push("shake");
  effects.updateParticles = () => calls.push("particles");
  effects.updatePulses = () => calls.push("pulses");

  effects.tick();

  assert.deepEqual(calls, ["shake", "particles", "pulses"]);
});

test("chainLightning creates one visual bolt particle per target", () => {
  const app = createEffectsApp();
  const effects = new Effects({ app });

  effects.chainLightning(10, 20, [
    { x: 40, y: 50 },
    { x: 80, y: 90 },
  ]);

  assert.equal(effects.effectsContainer.children.length, 2);
  assert.equal(effects.particles.length, 2);
  assert.equal(effects.particles[0].gravity, 0);
  assert.equal(effects.particles[0].maxLife, 35);
});

test("screenPulse animates ring and flash to completion and invokes callback", () => {
  const app = createEffectsApp();
  const effects = new Effects({ app });
  let completed = 0;

  effects.screenPulse(0xff00ff, () => {
    completed += 1;
  });

  const ring = effects.effectsContainer.children[0];
  const flash = effects.effectsContainer.children[1];

  app.ticker.stepFrames(20);

  assert.equal(ring.destroyed, true);
  assert.equal(flash.destroyed, true);
  assert.equal(completed, 1);
});

test("destroy unregisters ticker and destroys effect containers", () => {
  const app = createEffectsApp();
  const effects = new Effects({ app });

  effects.destroy();

  assert.equal(app.ticker.removedFn, effects.tick);
  assert.equal(effects.backgroundContainer.destroyed, true);
  assert.equal(effects.effectsContainer.destroyed, true);
});
