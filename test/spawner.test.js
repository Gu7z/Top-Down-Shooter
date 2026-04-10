import test from 'node:test';
import assert from 'node:assert/strict';
import Spawner from '../src/spanwer.js';
import { setupPixiMock, createAppMock } from './helpers.js';

setupPixiMock();

test('spawner initializes an empty registry and attaches its container to the stage', () => {
  const app = createAppMock();
  const spawner = new Spawner({ app });

  assert.deepEqual(spawner.spawns, []);
  assert.ok(app.stage.children.includes(spawner.spawnerContainer));
});

test('reset force-kills managed enemies and falls back to hiding raw enemy entries', () => {
  const app = createAppMock();
  const spawner = new Spawner({ app });
  let forceKilled = 0;
  const enemy = {
    visible: true,
    destroyCalls: 0,
    destroy() {
      this.destroyCalls += 1;
    },
  };

  spawner.spawns = [
    { forceKill() { forceKilled += 1; } },
    { enemy },
  ];

  spawner.reset();

  assert.equal(forceKilled, 1);
  assert.equal(enemy.visible, false);
  assert.equal(enemy.destroyCalls, 1);
  assert.deepEqual(spawner.spawns, []);
});

test('destroy delegates to reset and clears tracked spawns', () => {
  const app = createAppMock();
  const spawner = new Spawner({ app });
  let forceKilled = 0;

  spawner.spawns = [
    { forceKill() { forceKilled += 1; } },
  ];

  spawner.destroy();

  assert.equal(forceKilled, 1);
  assert.deepEqual(spawner.spawns, []);
});
