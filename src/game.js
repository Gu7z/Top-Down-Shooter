import Menu from "./menu.js";
import Player from "./player.js";
import Spawner from "./spanwer.js";
import Hud from "./hud.js";
import Effects from "./effects.js";
import { audio } from "./audio.js";
import Settings from "./settings.js";
import Controls from "./controls.js";
import RunSummary from "./run_summary.js";
import DroneSystem from "./drone.js";
import { createSkillTreeState } from "./progression/skill_tree_state.js";
import { deriveSkillEffects } from "./progression/skill_effects.js";
import { createRunStats, createRunSummary } from "./progression/run_stats.js";
import { RunUpgradeState } from './run_upgrades/run_upgrade_state.js';
import { RunUpgradeScreen } from './run_upgrades/run_upgrade_screen.js';

import EnemyBullet from "./enemy_bullet.js";
import WaveManager from "./wave_manager.js";

// Make it available globally for Enemy class without needing to alter deep tree constructor parameters excessively across 6 classes
if (typeof window !== "undefined") {
  window.EnemyBulletClass = EnemyBullet;
}

export default class Game {
  constructor({ app, username }) {
    this.app = app;
    let paused = false;
    let shooting = false;
    let settingsScreen = null;
    const keys = {};

    this.effects = new Effects({ app });
    this.skillState = createSkillTreeState();
    this.skillEffects = deriveSkillEffects(this.skillState.getPurchasedIds());
    this.runStats = createRunStats();
    this.upgradeState = new RunUpgradeState();
    this.upgradeScreen = new RunUpgradeScreen(app);
    this.viralClouds = [];
    this.runFinished = false;
    this.player = new Player({
      app,
      username,
      keys,
      skillEffects: this.skillEffects,
      runStats: this.runStats,
      effects: this.effects,
    });
    this.enemySpawner = new Spawner({ app, player: this.player });
    this.enemyBullets = [];
    
    this.hud = new Hud({ app, player: this.player });
    
    this.waveManager = new WaveManager({
      app,
      spawnerContainer: this.enemySpawner.spawnerContainer,
      enemyBullets: this.enemyBullets,
      renderBanner: (text, persist) => this.hud.showBanner(text, persist),
      updateBossHud: (bossRef, hp, maxHp, color, name) => this.hud.updateBossBar(bossRef, hp, maxHp, color, name),
      finishGame: (reason) => this.finishRun({ reason }),
      onBossDefeated: () => this._showUpgradeScreen(),
    });
    this.player.onEnemyKilledAt = (x, y) => {
      const eff = this.upgradeState.getActiveEffects();
      if (eff.viralCoreRadius <= 0) return;
      const visual = new PIXI.Graphics();
      visual.beginFill(0x00FF88, 0.18);
      visual.drawCircle(0, 0, eff.viralCoreRadius);
      visual.endFill();
      visual.lineStyle(1.5, 0x00FF88, 0.7);
      visual.drawCircle(0, 0, eff.viralCoreRadius);
      visual.position.set(x, y);
      this.effects.effectsContainer.addChild(visual);
      this.viralClouds.push({
        x, y,
        radius: eff.viralCoreRadius,
        damagePerTick: eff.viralCoreDamagePerTick,
        framesLeft: eff.viralCoreDuration,
        totalFrames: eff.viralCoreDuration,
        tickTimer: 60,
        visual,
      });
    };

    this.hud.openSettings = () => {
      if (settingsScreen) return;
      this.app.stage.removeChild(this.hud.hudContainer);
      settingsScreen = new Settings({
        app: this.app,
        onBack: () => {
          settingsScreen = null;
          this.app.stage.addChild(this.hud.hudContainer);
          this.app.render?.();
        },
      });
      this.app.render?.();
    };
    this.hud.openControls = () => {
      this.app.stage.removeChild(this.hud.hudContainer);
      new Controls({
        app: this.app,
        menu: {
          show: () => {
            this.app.stage.addChild(this.hud.hudContainer);
            this.app.render?.();
          },
        },
      });
      this.app.render?.();
    };
    this.app.stage.addChild(this.hud.hudContainer);

    this.droneSystem = new DroneSystem({
      app,
      player: this.player,
      skillEffects: this.skillEffects,
      runStats: this.runStats,
      effects: this.effects,
    });

    this.player.shooting.registerEffects(this.effects);

    this.handleMouseMove = (e) => {
      const rect = app.view.getBoundingClientRect();
      const scaleX = app.screen.width / rect.width;
      const scaleY = app.screen.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      this.player.setMousePosition(x, y);
    };

    this.handlePointerDown = () => {
      shooting = true;
      this.effects.shake(1.5);
    };

    this.handlePointerUp = () => {
      shooting = false;
    };

    this.handleKeyDown = (e) => {
      keys[e.key.toLowerCase()] = true;
    };

    this.handleKeyUp = (e) => {
      keys[e.key.toLowerCase()] = false;
    };

    this.handleSystemKeys = (e) => {
      const usedKeys = ["Escape", "m", "Shift"];
      if (!usedKeys.includes(e.key)) return;

      switch (e.key) {
        case "Escape":
          if (settingsScreen) {
            settingsScreen.close();
            break;
          }

          this.hud.showPaused = !paused;
          this.player.shooting.update();
          app.render();

          if (paused) {
            app.start();
          } else {
            app.stop();
          }

          paused = !paused;
          break;

        case "m":
          audio.toggleMute();
          break;

        case "Shift":
          this.player.tryDash(keys);
          break;

        default:
          break;
      }
    };

    this.clear = () => {
      this.player.shooting.interval?.clear?.();
      this.effects.destroy();
      this.waveManager.destroy?.();
      this.enemySpawner.destroy?.();
      this.app.ticker.remove(this.tick);
      this.app.renderer.view.onmousemove = null;
      window.removeEventListener("pointerdown", this.handlePointerDown);
      window.removeEventListener("pointerup", this.handlePointerUp);
      window.removeEventListener("keydown", this.handleKeyDown);
      window.removeEventListener("keyup", this.handleKeyUp);
      window.removeEventListener("keydown", this.handleSystemKeys);
      app.stage.removeChild(this.player.playerContainer);
      app.stage.removeChild(this.player.shooting.shootingContainer);
      app.stage.removeChild(this.enemySpawner.spawnerContainer);
      app.stage.removeChild(this.hud.hudContainer);
      this.enemyBullets.forEach(b => b.destroy());
      this.enemyBullets = [];
      this.viralClouds.forEach(c => { if (c.visual && !c.visual.destroyed) c.visual.destroy(); });
      this.viralClouds = [];
    };
    this.finishRun = ({ reason = "manual" } = {}) => {
      if (this.runFinished) return;
      this.runFinished = true;

      const snapshot = this.runStats.snapshot({
          score: this.player.points,
          now: Date.now(),
        });
      snapshot.survivedLowHp = this.player.survivedLowHp || false;
      const summary = createRunSummary(
        snapshot,
        this.skillEffects
      );
      this.skillState.addCredits(summary.credits.total);

      this.clear();
      this.app.stage.removeChildren();
      this.app.start();
      new RunSummary({
        app: this.app,
        username: this.player.username,
        summary,
        reason,
        onBackToMenu: () => {
          this.app.stage.removeChildren();
          new Menu({ app: this.app });
        },
      });
    };
    this.hud.resume = () => {
      if (!paused) return;
      this.hud.showPaused = false;
      this.player.shooting.update();
      app.start();
      paused = false;
    };
    this.hud.onRunEnded = this.finishRun;
    this.hud.endRun = () => this.finishRun({ reason: "manual" });

    this.tick = () => {
      this.hud.update(this.clear);
      this.player.update(keys);
      // Removed this.enemySpawner.update() because WaveManager manages spawning now
      this.waveManager.update(this.player, this.enemySpawner, this.effects);

      for (let i = this.viralClouds.length - 1; i >= 0; i--) {
        const cloud = this.viralClouds[i];
        cloud.framesLeft--;
        cloud.tickTimer--;
        if (cloud.tickTimer <= 0) {
          cloud.tickTimer = 60;
          const dmg = Math.ceil(cloud.damagePerTick);
          for (let j = this.enemySpawner.spawns.length - 1; j >= 0; j--) {
            const spawn = this.enemySpawner.spawns[j];
            const dist = Math.hypot(spawn.enemy.position.x - cloud.x, spawn.enemy.position.y - cloud.y);
            if (dist <= cloud.radius) {
              spawn.kill(this.enemySpawner.spawns, j, this.player, this.effects, dmg);
            }
          }
        }
        if (cloud.visual && !cloud.visual.destroyed) {
          const progress = cloud.framesLeft / cloud.totalFrames;
          cloud.visual.alpha = Math.max(0.05, Math.min(0.35, progress * 0.35));
        }
        if (cloud.framesLeft <= 0) {
          cloud.visual?.destroy();
          this.viralClouds.splice(i, 1);
        }
      }

      for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
        const bullet = this.enemyBullets[i];
        bullet.update();
        if (bullet.isOutOfBounds()) {
           bullet.destroy();
           this.enemyBullets.splice(i, 1);
           continue;
        }
        
        // Bullet collision with player
        if (this.player.collidesWithCircle(bullet.bullet.position.x, bullet.bullet.position.y, bullet.radius)) {
           const damageTaken = this.player.takeDamage(1, this.effects);
           if (damageTaken) this._triggerRetaliationPulse();
           bullet.destroy();
           this.enemyBullets.splice(i, 1);
           continue;
        }
        
        if (bullet.destroyed) {
           this.enemyBullets.splice(i, 1);
        }
      }
      
      this.player.shooting.update(shooting, this.enemySpawner, this.player);
      this.droneSystem.update(this.enemySpawner);
    };

    this._showUpgradeScreen = () => {
      if (!this.upgradeState.shouldShow()) return;
      this.app.ticker.remove(this.tick);
      this.upgradeScreen.show(this.upgradeState, (chosenIndex) => {
        this.upgradeState.applyChoice(chosenIndex);
        this.player.setRunUpgradeEffects(this.upgradeState.getActiveEffects());
        this.app.ticker.add(this.tick);
      });
    };

    this._triggerRetaliationPulse = () => {
      const eff = this.upgradeState.getActiveEffects();
      if (eff.retaliationPulseRadius === 0) return;
      const { x: px, y: py } = this.player.player.position;
      const isFullScreen = eff.retaliationPulseRadius === -1;
      const targets = isFullScreen
        ? [...this.enemySpawner.spawns]
        : this.enemySpawner.spawns.filter(spawn =>
            Math.hypot(spawn.enemy.position.x - px, spawn.enemy.position.y - py) <= eff.retaliationPulseRadius
          );
      const stunFrames = Math.ceil((eff.retaliationPulseStunMs / 1000) * 60);
      for (let i = targets.length - 1; i >= 0; i--) {
        const spawn = targets[i];
        const idx = this.enemySpawner.spawns.indexOf(spawn);
        if (idx === -1) continue;
        spawn.kill(this.enemySpawner.spawns, idx, this.player, this.effects, eff.retaliationPulseDamage);
        if (stunFrames > 0 && this.enemySpawner.spawns.includes(spawn)) {
          spawn.frozen = true;
          spawn.freezeTimer = stunFrames;
        }
      }
      if (isFullScreen) {
        this.effects.screenPulse(0xFF00FF);
      } else {
        const ring = new PIXI.Graphics();
        ring.lineStyle(3, 0xFF00FF, 1);
        ring.drawCircle(px, py, eff.retaliationPulseRadius);
        this.effects.effectsContainer.addChild(ring);
        let life = 18;
        const fade = () => {
          life--;
          ring.alpha = Math.max(0, life / 18);
          ring.scale.set(1 + (18 - life) * 0.03);
          if (life <= 0) { this.app.ticker.remove(fade); ring.destroy(); }
        };
        this.app.ticker.add(fade);
      }
    };

    this.ticker = app.ticker.add(this.tick);

    app.renderer.view.onmousemove = this.handleMouseMove;
    window.addEventListener("pointerdown", this.handlePointerDown);
    window.addEventListener("pointerup", this.handlePointerUp);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("keydown", this.handleSystemKeys);
  }
}
