// EnemyRegistry: provides the shared container and active spawn list used by WaveManager.
// Spawning logic lives entirely in wave_manager.js.
export default class Spawner {
  constructor({ app }) {
    this.spawns = [];
    this.spawnerContainer = new PIXI.Container();
    app.stage.addChild(this.spawnerContainer);
  }

  reset() {
    this.spawns.forEach((spawn) => {
      if (spawn.forceKill) {
        spawn.forceKill();
      } else {
        spawn.enemy.visible = false;
        spawn.enemy.destroy?.();
      }
    });
    this.spawns = [];
  }

  destroy() {
    this.reset();
  }
}
