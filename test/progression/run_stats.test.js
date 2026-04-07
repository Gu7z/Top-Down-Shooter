import test from "node:test";
import assert from "node:assert/strict";
import {
  createRunStats,
  calculateCredits,
  createRunSummary,
} from "../../src/progression/run_stats.js";

test("run stats records shots, hits, kills, boss kills, and time", () => {
  const stats = createRunStats({ now: () => 1000 });

  stats.recordShotFired();
  stats.recordShotFired();
  stats.recordShotHit();
  stats.recordKill({ typeId: "runner", value: 1, isBoss: false });
  stats.recordKill({ typeId: "boss", value: 10, isBoss: true });

  const summary = stats.snapshot({ score: 55, now: 31000 });

  assert.equal(summary.shotsFired, 2);
  assert.equal(summary.shotsHit, 1);
  assert.equal(summary.accuracyPercent, 50);
  assert.equal(summary.timeSurvivedSeconds, 30);
  assert.equal(summary.killsByType.runner, 1);
  assert.equal(summary.killsByType.boss, 1);
  assert.equal(summary.bossKills, 1);
});

test("credit calculation is explainable and affected by economy effects", () => {
  const credits = calculateCredits(
    {
      score: 120,
      timeSurvivedSeconds: 75,
      shotsFired: 10,
      shotsHit: 8,
      killsByType: { chaser: 12 },
      bossKills: 1,
    },
    { creditMultiplier: 1.1, bossCreditBonus: 15 }
  );

  assert.equal(credits.total, 74);
  assert.deepEqual(credits.breakdown.map((row) => row.label), [
    "Score",
    "Abates",
    "Precisão",
    "Recompensa de chefes",
    "Sobrevivência",
    "Ondas concluídas",
    "Sobrevivência (HP Baixo)",
    "Multiplicador financeiro",
  ]);
});

test("summary includes achievement-style highlights", () => {
  const summary = createRunSummary(
    {
      score: 120,
      timeSurvivedSeconds: 90,
      shotsFired: 10,
      shotsHit: 9,
      killsByType: { chaser: 20 },
      bossKills: 1,
    },
    { creditMultiplier: 1 }
  );

  assert.ok(summary.highlights.includes("HIGH ACCURACY"));
  assert.ok(summary.highlights.includes("BOSS DOWN"));
  assert.ok(summary.highlights.includes("LONG SURVIVAL"));
  assert.equal(summary.credits.total > 0, true);
});

test("lowHpCreditBonus is awarded when player survived with low HP", () => {
  const withBonus = calculateCredits(
    {
      score: 50,
      timeSurvivedSeconds: 30,
      shotsFired: 5,
      shotsHit: 3,
      killsByType: { runner: 3 },
      bossKills: 0,
      survivedLowHp: true,
    },
    { lowHpCreditBonus: 20 }
  );

  const withoutBonus = calculateCredits(
    {
      score: 50,
      timeSurvivedSeconds: 30,
      shotsFired: 5,
      shotsHit: 3,
      killsByType: { runner: 3 },
      bossKills: 0,
      survivedLowHp: false,
    },
    { lowHpCreditBonus: 20 }
  );

  assert.equal(withBonus.total - withoutBonus.total, 20);
});
