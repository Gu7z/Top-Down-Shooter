export default class Hud {
  constructor() {
    this.el = document.getElementById('hud');
    this.pointsEl = document.getElementById('points');
    this.lifesEl = document.getElementById('lifes');
    this.gameOverEl = document.getElementById('gameOver');
    this.backBtn = document.getElementById('backBtn');
    this.dead = false;
  }

  update(player, clear) {
    this.pointsEl.textContent = `Points: ${player.points}`;
    this.lifesEl.textContent = `Lifes: ${player.lifes}`;
    if (player.lifes < 1 && !this.dead) {
      this.dead = true;
      this.gameOverEl.classList.remove('hidden');
      this.backBtn.onclick = () => clear();
    }
  }
}
