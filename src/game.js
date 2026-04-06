import Menu from "./menu.js";
import Player from "./player.js";
import Spawner from "./spanwer.js";
import Hud from "./hud.js";
import Effects from "./effects.js";
import { audio } from "./audio.js";
import Settings from "./settings.js";
import RunSummary from "./run_summary.js";
import { createSkillTreeState } from "./progression/skill_tree_state.js";
import { deriveSkillEffects } from "./progression/skill_effects.js";
import { createRunStats, createRunSummary } from "./progression/run_stats.js";

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
    this.runFinished = false;
    this.player = new Player({
      app,
      username,
      keys,
      skillEffects: this.skillEffects,
      runStats: this.runStats,
    });
    this.enemySpawner = new Spawner({ app, player: this.player });
    this.hud = new Hud({ app, player: this.player });
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
    this.app.stage.addChild(this.hud.hudContainer);

    this.player.shooting.registerEffects(this.effects);

    this.handleMouseMove = (e) => {
      this.player.setMousePosition(e.clientX, e.clientY);
    };

    this.handlePointerDown = () => {
      shooting = true;
      this.effects.shake(1.5);
    };

    this.handlePointerUp = () => {
      shooting = false;
    };

    this.handleKeyDown = (e) => {
      keys[e.key] = true;
    };

    this.handleKeyUp = (e) => {
      keys[e.key] = false;
    };

    this.handleSystemKeys = (e) => {
      const usedKeys = ["Escape", "m"];
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

        default:
          break;
      }
    };

    this.clear = () => {
      this.player.shooting.interval.clear();
      this.effects.destroy();
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
    };
    this.finishRun = ({ reason = "manual" } = {}) => {
      if (this.runFinished) return;
      this.runFinished = true;

      const summary = createRunSummary(
        this.runStats.snapshot({
          score: this.player.points,
          now: Date.now(),
        }),
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
    this.hud.onRunEnded = this.finishRun;
    this.hud.endRun = () => this.finishRun({ reason: "manual" });

    this.tick = () => {
      this.hud.update(this.clear);
      this.player.update(keys);
      this.enemySpawner.update(this.player);
      this.enemySpawner.spawns.forEach((enemy) => {
        enemy.update(this.player, this.enemySpawner, this.effects);
      });
      this.player.shooting.update(shooting, this.enemySpawner, this.player);
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
