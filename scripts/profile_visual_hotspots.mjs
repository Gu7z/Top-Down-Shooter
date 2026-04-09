import { setupPixiMock, createAppMock } from "../test/helpers.js";
import EnemyBullet from "../src/enemy_bullet.js";
import Effects from "../src/effects.js";

setupPixiMock();

const FRAME_COUNT = 60;
const BULLET_COUNT = 40;

function createProbeApp() {
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

function withDeterministicRandom(fn) {
  const originalRandom = Math.random;
  const sequence = [0.13, 0.37, 0.59, 0.83, 0.21, 0.47, 0.71, 0.95];
  let index = 0;
  Math.random = () => sequence[index++ % sequence.length];
  try {
    return fn();
  } finally {
    Math.random = originalRandom;
  }
}

const app = createProbeApp();

const createdTimers = [];
app.setInterval = (fn, delay) => {
  const timer = {
    fn,
    delay,
    cleared: false,
    clear() {
      this.cleared = true;
    },
  };
  createdTimers.push(timer);
  return timer;
};

const bullets = Array.from({ length: BULLET_COUNT }, (_, index) => {
  const column = index % 10;
  const row = Math.floor(index / 10);
  return new EnemyBullet({
    app,
    position: {
      x: 80 + column * 45,
      y: 80 + row * 35,
    },
    targetPosition: {
      x: 720,
      y: 520,
    },
    color: 0xffcc00,
  });
});

for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
  for (const bullet of bullets) {
    bullet.update();
  }
}

const effects = withDeterministicRandom(() => {
  const effectsInstance = new Effects({ app });
  effectsInstance.explosion(50, 50, 0xff0000, 24);
  effectsInstance.explosion(90, 70, 0x00ffff, 16);
  effectsInstance.chainLightning(10, 10, [
    { x: 120, y: 40 },
    { x: 160, y: 80 },
    { x: 220, y: 120 },
  ]);
  return effectsInstance;
});

const summary = {
  enemyBullet: {
    bullets: bullets.length,
    framesSimulated: FRAME_COUNT,
    timersCreated: createdTimers.length,
    // Required field name from the plan; this is the current aggregate timer count.
    activeTrailTimers: bullets.reduce(
      (total, bullet) => total + (bullet.trailTimers?.size ?? 0),
      0,
    ),
    trailGraphics: bullets.reduce((total, bullet) => total + bullet.trailContainer.children.length, 0),
  },
  effects: {
    particles: effects.particles.length,
    pulses: effects.pulses.length,
    effectChildren: effects.effectsContainer.children.length,
  },
};

console.log(JSON.stringify(summary, null, 2));
