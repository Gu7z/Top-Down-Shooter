function safeCount(value) {
  return Number.isFinite(value) ? value : 0;
}

function totalKills(killsByType = {}) {
  return Object.values(killsByType).reduce((sum, count) => sum + safeCount(count), 0);
}

function accuracyPercent({ shotsFired, shotsHit }) {
  if (!shotsFired) return 0;
  return Math.round((shotsHit / shotsFired) * 100);
}

export function createRunStats({ now = Date.now } = {}) {
  const startTime = now();
  const stats = {
    shotsFired: 0,
    shotsHit: 0,
    killsByType: {},
    bossKills: 0,
  };

  function recordShotFired(amount = 1) {
    stats.shotsFired += amount;
  }

  function recordShotHit(amount = 1) {
    stats.shotsHit += amount;
  }

  function recordKill({ typeId = "unknown", isBoss = false } = {}) {
    stats.killsByType[typeId] = (stats.killsByType[typeId] || 0) + 1;
    if (isBoss) stats.bossKills += 1;
  }

  function snapshot({ score = 0, now: snapshotNow = now() } = {}) {
    const timeSurvivedSeconds = Math.max(0, Math.floor((snapshotNow - startTime) / 1000));
    return {
      score,
      timeSurvivedSeconds,
      shotsFired: stats.shotsFired,
      shotsHit: stats.shotsHit,
      accuracyPercent: accuracyPercent(stats),
      killsByType: { ...stats.killsByType },
      bossKills: stats.bossKills,
    };
  }

  return {
    recordShotFired,
    recordShotHit,
    recordKill,
    snapshot,
  };
}

export function calculateCredits(stats, effects = {}) {
  const score = safeCount(stats.score);
  const shotsFired = safeCount(stats.shotsFired);
  const shotsHit = safeCount(stats.shotsHit);
  const bossKills = safeCount(stats.bossKills);
  const timeSurvivedSeconds = safeCount(stats.timeSurvivedSeconds);
  const kills = totalKills(stats.killsByType);
  const accuracy = accuracyPercent({ shotsFired, shotsHit });
  const creditMultiplier = effects.creditMultiplier || 1;
  const bossCreditBonus = effects.bossCreditBonus || 0;
  const streakCreditBonus = effects.streakCreditBonus || 0;

  const scoreCredits = Math.floor(score / 5);
  const killCredits = kills * 2 + (kills >= 20 ? streakCreditBonus : 0);
  const accuracyCredits = shotsFired >= 10 && accuracy >= 75 ? 12 : 0;
  const bossCredits = bossKills * (20 + bossCreditBonus);
  const survivalCredits = Math.floor(timeSurvivedSeconds / 15) * 3;
  const preMultiplier =
    scoreCredits + killCredits + accuracyCredits + bossCredits + survivalCredits;
  const total = Math.floor(preMultiplier * creditMultiplier);

  return {
    total,
    breakdown: [
      { label: "Score", amount: scoreCredits },
      { label: "Kills", amount: killCredits },
      { label: "Accuracy", amount: accuracyCredits },
      { label: "Boss bounty", amount: bossCredits },
      { label: "Survival", amount: survivalCredits },
      { label: "Economy multiplier", amount: total - preMultiplier },
    ],
  };
}

export function createRunSummary(stats, effects = {}) {
  const accuracy = stats.accuracyPercent ?? accuracyPercent(stats);
  const kills = totalKills(stats.killsByType);
  const highlights = [];

  if (accuracy >= 75 && safeCount(stats.shotsFired) >= 10) highlights.push("HIGH ACCURACY");
  if (safeCount(stats.timeSurvivedSeconds) >= 90) highlights.push("LONG SURVIVAL");
  if (safeCount(stats.bossKills) > 0) highlights.push("BOSS DOWN");
  if (kills >= 20) highlights.push("CROWD BREAKER");
  if (safeCount(stats.score) >= 100) highlights.push("SCORE SPIKE");

  return {
    ...stats,
    accuracyPercent: accuracy,
    highlights,
    credits: calculateCredits(stats, effects),
  };
}
