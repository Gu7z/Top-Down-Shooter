import BossEnemy from "./boss_enemy.js";
import Enemy from "./enemy.js";

// Arena wave definitions
const WAVES = {
  1: { count: 3, type: "sentinela" },
  2: { count: 5, type: "sentinela" },
  3: { count: 6, mix: ["sentinela", "cacador"] },
  4: { count: 8, mix: ["sentinela", "cacador"] },
  5: { isBoss: true, bossId: "guardiao" },
  6: { count: 9, mix: ["sentinela", "cacador", "atirador"] },
  7: { count: 11, mix: ["cacador", "atirador"] },
  8: { count: 12, mix: ["cacador", "atirador", "artilheiro"] },
  9: { count: 14, mix: ["sentinela", "corredor", "atirador", "artilheiro"] },
  10: { isBoss: true, bossId: "sniper" },
  11: { count: 16, mix: ["corredor", "atirador", "artilheiro"], speedMod: 1.05 },
  12: { count: 18, mix: ["cacador", "corredor", "atirador"], speedMod: 1.05 },
  13: { count: 20, mix: ["sentinela", "corredor", "artilheiro"], speedMod: 1.1 },
  14: { count: 24, mix: ["corredor", "sprinter", "atirador", "artilheiro"], speedMod: 1.1 },
  15: { isBoss: true, bossId: "colosso" },
  16: { count: 25, mix: ["cacador", "sprinter", "atirador"], hpMod: 1.1 },
  17: { count: 28, mix: ["corredor", "sprinter", "artilheiro"], hpMod: 1.1 },
  18: { count: 30, mix: ["sprinter", "atirador", "artilheiro"], hpMod: 1.15 },
  19: { count: 35, mix: ["cacador", "corredor", "sprinter", "atirador", "artilheiro"], hpMod: 1.15 },
  20: { isBoss: true, bossId: "supremo" },
  // --- Beyond the Supremo ---
  21: { count: 35, mix: ["corredor", "sprinter", "artilheiro", "infiltrador"], speedMod: 1.1, hpMod: 1.2 },
  22: { count: 38, mix: ["sprinter", "infiltrador", "atirador", "artilheiro"], speedMod: 1.1, hpMod: 1.2 },
  23: { count: 40, mix: ["titan", "corredor", "atirador", "infiltrador"], hpMod: 1.15 },
  24: { count: 42, mix: ["sprinter", "infiltrador", "artilheiro", "espectre"], speedMod: 1.15, hpMod: 1.2 },
  25: { isBoss: true, bossId: "predador" },
  26: { count: 45, mix: ["titan", "infiltrador", "artilheiro", "devastador"], hpMod: 1.25 },
  27: { count: 48, mix: ["corredor", "sprinter", "infiltrador", "espectre", "devastador"], speedMod: 1.2, hpMod: 1.25 },
  28: { count: 50, mix: ["titan", "espectre", "artilheiro", "devastador"], speedMod: 1.1, hpMod: 1.3 },
  29: { count: 55, mix: ["titan", "sprinter", "infiltrador", "espectre", "devastador"], speedMod: 1.2, hpMod: 1.35 },
  30: { isBoss: true, bossId: "apocalipse" },
};

// Enemy base definitions maps to Enemy attributes
const ENEMY_DEFS = {
  "sentinela":  { color: 0x0302fc, enemyRadius: 18, life: 4,  speed: 0.50, value: 1, typeId: "sentinela",  behaviorType: "melee"  },
  "cacador":    { color: 0x63009e, enemyRadius: 17, life: 3,  speed: 1.00, value: 1, typeId: "cacador",    behaviorType: "melee"  },
  "corredor":   { color: 0xfe0002, enemyRadius: 15, life: 1,  speed: 1.90, value: 1, typeId: "corredor",   behaviorType: "melee"  },
  "sprinter":   { color: 0xffffff, enemyRadius: 14, life: 1,  speed: 2.30, value: 2, typeId: "sprinter",   behaviorType: "melee"  },
  "atirador":   { color: 0xff8800, enemyRadius: 16, life: 3,  speed: 0.60, value: 3, typeId: "atirador",   behaviorType: "ranged" },
  "artilheiro": { color: 0xffdd00, enemyRadius: 20, life: 6,  speed: 0.30, value: 5, typeId: "artilheiro", behaviorType: "ranged" },
  // --- New enemy types (waves 21-30) ---
  // Infiltrador: fast ranged assassin, low HP, precise single shot
  "infiltrador":{ color: 0x00ffcc, enemyRadius: 13, life: 2,  speed: 1.80, value: 3, typeId: "infiltrador",behaviorType: "ranged" },
  // Titan: slow melee brute, very high HP (>10 → heavy contact)
  "titan":      { color: 0x0066ff, enemyRadius: 22, life: 12, speed: 0.35, value: 6, typeId: "titan",      behaviorType: "melee"  },
  // Espectre: medium ranged, fires 2-bullet split every 3s
  "espectre":   { color: 0x88ff00, enemyRadius: 15, life: 3,  speed: 1.00, value: 4, typeId: "espectre",   behaviorType: "ranged" },
  // Devastador: heavy slow ranged, fires 5-bullet wide arc
  "devastador": { color: 0xff4400, enemyRadius: 23, life: 9,  speed: 0.28, value: 7, typeId: "devastador", behaviorType: "ranged" },
};

const BOSS_DEFS = {
  "guardiao":   { color: 0xffc0cb, enemyRadius: 30, life: 45,  speed: 0.8, value: 20,  typeId: "boss_guardiao"   },
  "sniper":     { color: 0x7a6cff, enemyRadius: 35, life: 75,  speed: 0.62, value: 40,  typeId: "boss_sniper"    },
  "colosso":    { color: 0xff2222, enemyRadius: 40, life: 100, speed: 0.5, value: 80,  typeId: "boss_colosso"    },
  "supremo":    { color: 0x880000, enemyRadius: 50, life: 140, speed: 0.5, value: 150, typeId: "boss_supremo"    },
  // --- New bosses (waves 25 and 30) ---
  // Predador: fast aggressive hunter, burst + wide arc + spin
  "predador":   { color: 0x00ff88, enemyRadius: 45, life: 200, speed: 1.1, value: 200, typeId: "boss_predador"   },
  // Apocalipse: final boss, all attack patterns combined at peak aggression
  "apocalipse": { color: 0xff0066, enemyRadius: 55, life: 350, speed: 0.8, value: 400, typeId: "boss_apocalipse" },
};

const MAX_PROCEDURAL_ENEMY_COUNT = 90;

export default class WaveManager {
  constructor({ app, spawnerContainer, enemyBullets, renderBanner, updateBossHud, finishGame, onBossDefeated }) {
    this.app = app;
    this.container = spawnerContainer;
    this.enemyBullets = enemyBullets;
    this.renderBanner = renderBanner; // callback(text, persist)
    this.updateBossHud = updateBossHud; // callback(bossRef, hp, maxHp, color, name)
    this.finishGame = finishGame;
    this.onBossDefeated = onBossDefeated ?? null;
    
    this.currentWave = 1;
    this.enemiesToSpawn = [];
    this.state = "STARTING"; // STARTING, SPAWNING, CLEARING, INTERWAVE, ENDGAME
    this.interWaveTimer = 0;
    
    this.spawnTimer = 0;
    this.spawnRate = 60; // 1 second per enemy (instead of 0.75s)
    
    this.activeBoss = null;
    this.finishGameTimer = null;
    
    this.startWave(this.currentWave);
  }

  startWave(waveIndex) {
    let composition = WAVES[waveIndex];
    
    // Procedural scaled random waves after authored wave definitions.
    if (!composition) {
       const scalingLimit = Math.min(waveIndex * 3, MAX_PROCEDURAL_ENEMY_COUNT);
       composition = {
         count: scalingLimit,
         mix: ["sprinter", "atirador", "artilheiro"],
         hpMod: 1 + (waveIndex * 0.05),
         speedMod: 1 + (waveIndex * 0.02)
       };
    }

    this.enemiesToSpawn = [];
    this.activeBoss = null;

    if (composition.isBoss) {
      this.enemiesToSpawn.push({ isBoss: true, ...BOSS_DEFS[composition.bossId] });
      this.renderBanner(`B O S S  W A V E`, false); // show only ~2s
    } else {
      for (let i = 0; i < composition.count; i++) {
        let eType = composition.type || composition.mix[Math.floor(Math.random() * composition.mix.length)];
        let def = { ...ENEMY_DEFS[eType] };
        
        if (composition.hpMod) def.life = Math.ceil(def.life * composition.hpMod);
        if (composition.speedMod) def.speed *= composition.speedMod;
        
        this.enemiesToSpawn.push(def);
      }
      this.renderBanner(`W A V E  ${waveIndex}`, false);
    }
    
    this.state = "SPAWNING";
    this.spawnTimer = 0;
  }

  spawnSingleEnemy(spanwer) {
    if (this.enemiesToSpawn.length === 0) return;
    
    const def = this.enemiesToSpawn.pop();
    
    let spawn;
    if (def.isBoss) {
      spawn = new BossEnemy({
        app: this.app,
        container: this.container,
        enemyBullets: this.enemyBullets,
        ...def
      });
      this.activeBoss = spawn;
    } else {
      spawn = new Enemy({
        app: this.app,
        container: this.container,
        enemyBullets: this.enemyBullets,
        ...def
      });
    }

    spanwer.spawns.push(spawn);
  }

  update(player, spanwer, effects) {
    spanwer.spawns.forEach(spawn => {
      spawn.update(player, spanwer, effects);
    });

    if (this.state === "STARTING") return;

    if (this.activeBoss) {
      // Manage HUD update
      if (this.activeBoss.enemy.destroyed || this.activeBoss.life <= 0) {
        this.updateBossHud(null);
        this.activeBoss = null;
      } else {
         let nameStr = this.activeBoss.typeId.toUpperCase().replace("BOSS_", "");
         this.updateBossHud(this.activeBoss, this.activeBoss.life, BOSS_DEFS[nameStr.toLowerCase()].life, this.activeBoss.color, nameStr);
      }
    }

    if (this.state === "INTERWAVE") {
      this.interWaveTimer -= 1;
      if (this.interWaveTimer <= 0) {
        this.currentWave += 1;
        this.startWave(this.currentWave);
      }
      return;
    }

    if (this.state === "SPAWNING") {
      // Don't spawn minions over boss cap limits
      if (spanwer.spawns.length < 25) {
        this.spawnTimer -= 1;
        if (this.spawnTimer <= 0) {
           this.spawnSingleEnemy(spanwer);
           this.spawnTimer = this.spawnRate;
        }
      }
      
      if (this.enemiesToSpawn.length === 0) {
        this.state = "CLEARING";
      }
    }

    if (this.state === "CLEARING") {
      if (spanwer.spawns.length === 0) {
        // Wave over
        const isCompletedBoss = WAVES[this.currentWave]?.isBoss;
        
        // Final victory logic if wave 30
        if (this.currentWave === 30) {
          player.points += 1000; // Big bonus

          this.renderBanner(`A P O C A L I P S E   D E R R O T A D O`, true);
          this.state = "ENDGAME"; // halt progression gently, then call finish Game
          this.finishGameTimer = this.app.setTimeout(() => {
             this.finishGame("victory");
             this.finishGameTimer = null;
          }, 4);
          return;
        }

        this.renderBanner(`WAVE ${this.currentWave} COMPLETA`, false);
        this.state = "INTERWAVE";
        this.interWaveTimer = isCompletedBoss ? 300 : 240; // 5s or 4s at 60fps
        
        // Track completed
        if (player.runStats) {
          player.runStats.recordWaveCompleted?.(this.currentWave);
        }
        if (isCompletedBoss) {
          this.onBossDefeated?.();
        }
      }
    }
  }

  destroy() {
    this.finishGameTimer?.clear?.();
    this.finishGameTimer = null;
  }
}
