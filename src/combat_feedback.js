export function pickNumberStyle(damage, isCrit) {
  let fontSize;
  if (damage <= 3)       fontSize = 14;
  else if (damage <= 7)  fontSize = 18;
  else if (damage <= 14) fontSize = 22;
  else                   fontSize = 28;

  if (isCrit) {
    return { text: `CRIT ${damage}`, fontSize: fontSize + 6, color: 0xFF00FF };
  }

  const color =
    damage <= 3  ? 0x888888 :
    damage <= 7  ? 0x00FFFF :
    damage <= 14 ? 0xFF9900 :
                   0xFF00FF;

  return { text: String(damage), fontSize, color };
}

let _instance = null;

export function initCombatFeedback(app) {
  _instance = new CombatFeedback(app);
}

export function spawnDamageNumber(x, y, damage, isCrit) {
  _instance?.spawnDamageNumber(x, y, damage, isCrit);
}

export function spawnDeathEffect(x, y, color, isBoss) {
  _instance?.spawnDeathEffect(x, y, color, isBoss);
}

class CombatFeedback {
  constructor(app) {
    this.app = app;
    this._pool = [];
    this._active = [];
  }

  spawnDamageNumber() {}
  spawnDeathEffect() {}
}
