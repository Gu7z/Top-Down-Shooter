import sendScore from "./utils/send_score.js";

export default class Hud {
  constructor({ app, onBack }) {
    this.app = app;
    this.onBack = onBack;
    this.player = null;
    this.deathSound = PIXI.sound.Sound.from('sound/death.mp3');

    this.container = document.createElement('div');
    this.container.className = 'absolute inset-0 pointer-events-none text-white text-lg';

    this.stats = document.createElement('div');
    this.stats.className = 'absolute top-2 left-2 space-y-1';
    this.container.appendChild(this.stats);

    this.textPoints = document.createElement('div');
    this.textLifes = document.createElement('div');
    this.stats.appendChild(this.textPoints);
    this.stats.appendChild(this.textLifes);

    this.instructions = document.createElement('div');
    this.instructions.className = 'absolute top-2 left-1/2 -translate-x-1/2 text-sm';
    this.instructions.textContent = 'Hold left click or space to shoot. Use WASD to move';
    this.container.appendChild(this.instructions);
    setTimeout(() => this.instructions.remove(), 10000);

    this.pausedText = document.createElement('div');
    this.pausedText.className = 'absolute inset-0 flex items-center justify-center text-5xl font-bold hidden';
    this.pausedText.textContent = 'Paused';
    this.container.appendChild(this.pausedText);

    this.endText = document.createElement('div');
    this.endText.className = 'absolute inset-0 flex items-center justify-center text-6xl font-bold hidden';
    this.endText.textContent = 'Game Over';
    this.container.appendChild(this.endText);

    this.backBtn = document.createElement('button');
    this.backBtn.className = 'absolute bottom-10 left-1/2 -translate-x-1/2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded hidden pointer-events-auto';
    this.backBtn.textContent = 'Back';
    this.backBtn.addEventListener('click', () => {
      this.hide();
      this.onBack();
    });
    this.container.appendChild(this.backBtn);

    document.getElementById('ui-root').appendChild(this.container);
  }

  setPlayer(player) {
    this.player = player;
  }

  set showPaused(val) {
    if (val) this.pausedText.classList.remove('hidden');
    else this.pausedText.classList.add('hidden');
  }

  endgameCheck(clear) {
    if (this.player.lifes < 1) {
      this.endText.classList.remove('hidden');
      this.backBtn.classList.remove('hidden');
      if (!this.dead) {
        this.dead = true;
        this.deathSound.play();
        clear();
        this.app.stop();
        sendScore({ name: this.player.username, points: this.player.points });
      }
    } else {
      this.dead = false;
    }
  }

  update(clear) {
    if (!this.player) return;
    this.textPoints.textContent = `Pontos: ${this.player.points}`;
    this.textLifes.textContent = `Vidas: ${this.player.lifes}`;
    this.endgameCheck(clear);
  }

  hide() {
    this.container.remove();
  }
}
