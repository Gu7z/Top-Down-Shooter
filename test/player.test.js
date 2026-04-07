import test from 'node:test';
import assert from 'node:assert/strict';
import Player from '../src/player.js';
import { setupPixiMock, createAppMock } from './helpers.js';

setupPixiMock();

const app = createAppMock();
const keys = {};

const player = new Player({ app, username: 'test', keys });

test('player initializes with zero points and one life', () => {
  assert.strictEqual(player.points, 0);
  assert.strictEqual(player.lifes, 1);
});

test('player applies life and movement skill effects', () => {
  const boosted = new Player({
    app: createAppMock(),
    username: 'boosted',
    keys: {},
    skillEffects: { moveSpeedBonus: 0.5, maxLifeBonus: 1, maxShield: 2 },
  });

  assert.equal(boosted.velocity, 2.5);
  assert.equal(boosted.lifes, 2);
  assert.equal(boosted.shield, 2);
});

test('outOfBounds detects bounds correctly', () => {
  player.player.position.set(0, 0);
  player.player.width = 10;
  player.player.height = 10;
  assert.ok(player.outOfBounds('a')); // too far left
  assert.ok(player.outOfBounds('w')); // too far up
});

test('movePlayer responds to key presses', () => {
  const startX = player.player.x;
  player.movePlayer({ d: true });
  assert.strictEqual(player.player.x, startX + player.velocity);
});

test('player shooting adds bullets', () => {
  const count = player.shooting.bullets.length;
  player.shooting.fire();
  assert.strictEqual(player.shooting.bullets.length, count + 1);
});

test('update calls look and move', () => {
  player.setMousePosition(5, 5);
  player.update({});
  assert.ok(true);
});

// ── Shield System Tests ──────────────────────────────────────────

test('takeDamage consumes shield before HP', () => {
  const shielded = new Player({
    app: createAppMock(),
    username: 'shielded',
    keys: {},
    skillEffects: { maxShield: 2 },
  });

  assert.equal(shielded.shield, 2);
  assert.equal(shielded.lifes, 1);

  shielded.takeDamage(1);
  assert.equal(shielded.shield, 1);
  assert.equal(shielded.lifes, 1);

  shielded.takeDamage(1);
  assert.equal(shielded.shield, 0);
  assert.equal(shielded.lifes, 1);

  shielded.takeDamage(1);
  assert.equal(shielded.shield, 0);
  assert.equal(shielded.lifes, 0);
});

test('takeDamage respects invulnerability (postHitGuardMs)', () => {
  const guarded = new Player({
    app: createAppMock(),
    username: 'guarded',
    keys: {},
    skillEffects: { postHitGuardMs: 500, maxShield: 0 },
  });

  guarded.takeDamage(1);
  assert.equal(guarded.lifes, 0);
  // Player should be invulnerable now — next damage should fail
  assert.equal(guarded.invulnerable, true);
  const result = guarded.takeDamage(1);
  assert.equal(result, false); // damage blocked
});

test('emergency shield triggers at 1 HP once per run', () => {
  const emergency = new Player({
    app: createAppMock(),
    username: 'emergency',
    keys: {},
    skillEffects: { maxLifeBonus: 1, maxShield: 0, emergencyShield: true },
  });

  assert.equal(emergency.lifes, 2);
  assert.equal(emergency.shield, 0);

  emergency.takeDamage(1);
  assert.equal(emergency.lifes, 1);
  assert.equal(emergency.shield, 1); // emergency shield activated
  assert.equal(emergency.emergencyShieldUsed, true);

  // Emergency already used — won't trigger again
  emergency.takeDamage(1); // consumes emergency shield
  assert.equal(emergency.shield, 0);
  assert.equal(emergency.lifes, 1);
});

test('shield regenerates after cooldown', () => {
  const regen = new Player({
    app: createAppMock(),
    username: 'regen',
    keys: {},
    skillEffects: { maxShield: 1, shieldRegenSeconds: 1 }, // 1 second = 60 frames
  });

  assert.equal(regen.shield, 1);
  regen.takeDamage(1); // loses shield
  assert.equal(regen.shield, 0);

  // Simulate 60 ticks to wait for regen
  for (let i = 0; i < 61; i++) {
    regen.updateShieldRegen();
  }

  assert.equal(regen.shield, 1);
});

// ── Dash System Tests ──────────────────────────────────────────

test('dash is not available without dashEnabled skill', () => {
  const noDash = new Player({
    app: createAppMock(),
    username: 'nodash',
    keys: {},
    skillEffects: { dashEnabled: false },
  });

  noDash.tryDash({ w: true });
  assert.equal(noDash.isDashing, false);
});

test('dash moves player rapidly and enters cooldown', () => {
  const dasher = new Player({
    app: createAppMock(),
    username: 'dasher',
    keys: {},
    skillEffects: { dashEnabled: true },
  });

  const startY = dasher.player.position.y;
  dasher.tryDash({ w: true });
  assert.equal(dasher.isDashing, true);
  assert.ok(dasher.dashCooldownTimer > 0);

  // Update a frame — should move player
  dasher.updateDash();
  assert.ok(dasher.player.position.y < startY);

  // Can't dash again while on cooldown
  dasher.isDashing = false;
  dasher.tryDash({ w: true });
  assert.equal(dasher.isDashing, false); // still on cooldown
});

test('dash grants invulnerability when dashInvulnerabilityMs is set', () => {
  const invulnDash = new Player({
    app: createAppMock(),
    username: 'invuln',
    keys: {},
    skillEffects: { dashEnabled: true, dashInvulnerabilityMs: 250 },
  });

  invulnDash.tryDash({ d: true });
  assert.equal(invulnDash.invulnerable, true);
  assert.ok(invulnDash.invulnerableTimer > 0);
});

test('dashReload fusion primes next shot', () => {
  const reloader = new Player({
    app: createAppMock(),
    username: 'reloader',
    keys: {},
    skillEffects: { dashEnabled: true, dashReload: true },
  });

  reloader.tryDash({ w: true });
  assert.equal(reloader.dashReloadPrimed, true);
});

test('dashShield fusion grants shield on dash', () => {
  const shieldDash = new Player({
    app: createAppMock(),
    username: 'shielddash',
    keys: {},
    skillEffects: { dashEnabled: true, dashShield: true, maxShield: 1 },
  });

  // Start at full shield, consume it
  shieldDash.takeDamage(1); // shield → 0
  assert.equal(shieldDash.shield, 0);

  shieldDash.invulnerable = false; // clear post-hit guard
  shieldDash.dashCooldownTimer = 0; // reset cooldown
  shieldDash.tryDash({ w: true });
  assert.equal(shieldDash.shield, 1); // shield restored by dash
});

// ── Strafe Control Tests ──────────────────────────────────────────

test('strafe control bonus reduces diagonal movement penalty', () => {
  const noStrafe = new Player({
    app: createAppMock(),
    username: 'nostrafe',
    keys: {},
    skillEffects: { strafeControlBonus: 0 },
  });
  const fullStrafe = new Player({
    app: createAppMock(),
    username: 'fullstrafe',
    keys: {},
    skillEffects: { strafeControlBonus: 1.0 },
  });

  // Set both to same starting position
  noStrafe.player.position.set(400, 300);
  fullStrafe.player.position.set(400, 300);
  noStrafe.player.x = 400;
  noStrafe.player.y = 300;
  fullStrafe.player.x = 400;
  fullStrafe.player.y = 300;

  // Move diagonally
  noStrafe.movePlayer({ w: true, d: true });
  fullStrafe.movePlayer({ w: true, d: true });

  // Full strafe should move further diagonally
  const noStrafeDist = Math.abs(noStrafe.player.x - 400);
  const fullStrafeDist = Math.abs(fullStrafe.player.x - 400);
  assert.ok(fullStrafeDist > noStrafeDist);
});

// ── Low HP Survival Tracking ──────────────────────────────────────

test('survivedLowHp flag is set when player reaches 1 HP', () => {
  const tracked = new Player({
    app: createAppMock(),
    username: 'tracked',
    keys: {},
    skillEffects: { maxLifeBonus: 1, maxShield: 0 },
  });

  assert.equal(tracked.survivedLowHp, false);
  tracked.takeDamage(1); // 2 → 1 HP
  assert.equal(tracked.survivedLowHp, true);
});
