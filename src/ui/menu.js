export default class Menu {
  constructor() {
    this.el = document.getElementById('menu');
    this.playBtn = document.getElementById('playBtn');
    this.scoreBtn = document.getElementById('scoreBtn');
    this.controlsBtn = document.getElementById('controlsBtn');
    this.username = document.getElementById('username');
  }
  hide() {
    this.el.classList.add('hidden');
  }
  show() {
    this.el.classList.remove('hidden');
  }
}
