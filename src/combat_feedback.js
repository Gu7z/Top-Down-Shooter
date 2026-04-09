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

const POOL_SIZE = 16;

class CombatFeedback {
  constructor(app) {
    this.app = app;
    this._pool = [];
    this._active = [];

    for (let i = 0; i < POOL_SIZE; i++) {
      const container = new PIXI.Container();
      const text = new PIXI.Text('', {
        fontFamily: 'JetBrains Mono, monospace',
        fontWeight: 'bold',
        fontSize: 18,
        fill: 0xffffff,
      });
      text.anchor.set(0.5);
      container.addChild(text);
      container.visible = false;
      container.alpha = 1;
      app.stage.addChild(container);
      this._pool.push({ container, text, active: false, frame: 0, vx: 0 });
    }

    this._update = this._update.bind(this);
    app.ticker.add(this._update);
  }

  _acquireSlot() {
    const free = this._pool.find(s => !s.active);
    if (free) return free;
    const oldest = this._active.shift();
    oldest.active = false;
    oldest.container.visible = false;
    return oldest;
  }

  spawnDamageNumber(x, y, damage, isCrit) {
    const slot = this._acquireSlot();
    const { text: label, fontSize, color } = pickNumberStyle(damage, isCrit);

    slot.text.text = label;
    slot.text.style.fontSize = fontSize;
    slot.text.style.fill = color;
    slot.container.position.set(x, y);
    slot.container.scale.set(0);
    slot.container.alpha = 1;
    slot.container.visible = true;
    slot.active = true;
    slot.frame = 1;  // was 0 — start at 1 so pop-in is visible immediately
    slot.vx = (Math.random() - 0.5) * 30;

    this._active.push(slot);
  }

  _update() {
    // Animation phases (50 frames total ~0.83s @ 60fps):
    //   frames  1-8:  pop-in  — scale 0→1.4→1.0
    //   frames  8-37: float   — rise 50px, horizontal drift
    //   frames 37-49: fade    — alpha 1→0, scale shrinks
    for (let i = this._active.length - 1; i >= 0; i--) {
      const slot = this._active[i];
      const f = slot.frame;

      if (f <= 7) {
        const scale = f <= 4
          ? (f / 4) * 1.4
          : 1.4 - ((f - 4) / 3) * 0.4;
        slot.container.scale.set(scale);
      } else if (f <= 37) {
        slot.container.scale.set(1.0);
        slot.container.position.y -= 50 / 30;
        slot.container.position.x += slot.vx / 30;
      } else if (f <= 49) {
        const t = (f - 37) / 12;
        slot.container.alpha = 1 - t;
        slot.container.scale.set(1.0 - t * 0.3);
      } else {
        slot.container.visible = false;
        slot.container.alpha = 1;
        slot.active = false;
        this._active.splice(i, 1);
        continue;
      }

      slot.frame++;
    }
  }

  spawnDeathEffect(x, y, color, isBoss) {
    this._spawnNovaRing(x, y, color, 0, 16, 52);
    if (isBoss) {
      this._spawnNovaRing(x, y, color, 4, 20, 72);
    }
  }

  _spawnNovaRing(x, y, color, delayFrames, startR, endR) {
    const ring = new PIXI.Graphics();
    this.app.stage.addChild(ring);
    let frame = 0;
    const maxFrames = 25;

    const update = () => {
      if (frame < delayFrames) { frame++; return; }
      const f = frame - delayFrames;
      if (f >= maxFrames) {
        ring.clear();
        this.app.stage.removeChild(ring);
        this.app.ticker.remove(update);
        return;
      }
      const t = f / maxFrames;
      const radius = startR + (endR - startR) * t;
      const alpha = 0.8 * (1 - t);
      const lineWidth = Math.max(1, 4 * (1 - t * 0.75));

      ring.clear();
      ring.lineStyle(lineWidth, color, alpha);
      ring.drawCircle(x, y, radius);

      frame++;
    };

    this.app.ticker.add(update);
  }
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
