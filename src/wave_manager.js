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
  10: { isBoss: true, bossId: "destruidor" },
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
};

// Enemy base definitions maps to Enemy attributes
const ENEMY_DEFS = {
  "sentinela": { color: 0x0302fc, enemyRadius: 18, life: 4, speed: 0.5, value: 1, typeId: "sentinela", behaviorType: "melee" },
  "cacador":   { color: 0x63009e, enemyRadius: 17, life: 3, speed: 1.0, value: 1, typeId: "cacador", behaviorType: "melee" },
  "corredor":  { color: 0xfe0002, enemyRadius: 15, life: 1, speed: 1.9, value: 1, typeId: "corredor", behaviorType: "melee" },
  "sprinter":  { color: 0xffffff, enemyRadius: 14, life: 1, speed: 2.3, value: 2, typeId: "sprinter", behaviorType: "melee" },
  "atirador":  { color: 0xff8800, enemyRadius: 16, life: 3, speed: 0.6, value: 3, typeId: "atirador", behaviorType: "ranged" },
  "artilheiro":{ color: 0xffdd00, enemyRadius: 20, life: 6, speed: 0.3, value: 5, typeId: "artilheiro", behaviorType: "ranged" },
};

const BOSS_DEFS = {
  "guardiao":   { color: 0xffc0cb, enemyRadius: 30, life: 30, speed: 0.8, value: 20, typeId: "boss_guardiao" },
  "destruidor": { color: 0xff00ff, enemyRadius: 35, life: 50, speed: 0.6, value: 40, typeId: "boss_destruidor" },
  "colosso":    { color: 0xff2222, enemyRadius: 40, life: 80, speed: 0.5, value: 80, typeId: "boss_colosso" },
  "supremo":    { color: 0x880000, enemyRadius: 50, life: 120,speed: 0.5, value: 150,typeId: "boss_supremo" },
};

export default class WaveManager {
  constructor({ app, spawnerContainer, enemyBullets, renderBanner, updateBossHud, finishGame }) {
    this.app = app;
    this.container = spawnerContainer;
    this.enemyBullets = enemyBullets;
    this.renderBanner = renderBanner; // callback(text, persist)
    this.updateBossHud = updateBossHud; // callback(bossRef, hp, maxHp, color, name)
    this.finishGame = finishGame;
    
    this.currentWave = 1;
    this.enemiesToSpawn = [];
    this.state = "STARTING"; // STARTING, SPAWNING, CLEARING, INTERWAVE, ENDGAME
    this.interWaveTimer = 0;
    
    this.spawnTimer = 0;
    this.spawnRate = 60; // 1 second per enemy (instead of 0.75s)
    
    this.activeBoss = null;
    
    this.startWave(this.currentWave);
  }

  startWave(waveIndex) {
    let composition = WAVES[waveIndex];
    
    // Procedural scaled random waves after 20
    if (!composition) {
       const scalingLimit = waveIndex * 3;
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
        
        // Final victory logic if wave 20
        if (this.currentWave === 20) {
          player.points += 500; // Big bonus
          
          this.renderBanner(`E M I N Ê N C I A   S U P E R A D A`, true);
          this.state = "ENDGAME"; // halt progression gently, then call finish Game
          setTimeout(() => {
             this.finishGame("victory");
          }, 4000);
          return;
        }

        this.renderBanner(`WAVE ${this.currentWave} COMPLETA`, false);
        this.state = "INTERWAVE";
        this.interWaveTimer = isCompletedBoss ? 300 : 240; // 5s or 4s at 60fps
        
        // Track completed
        if (player.runStats) {
          player.runStats.recordWaveCompleted?.(this.currentWave);
        }
      }
    }
  }
}
