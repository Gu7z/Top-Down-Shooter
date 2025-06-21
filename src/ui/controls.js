export default class Controls {
  constructor() {
    this.el = document.getElementById('controls');
    this.closeBtn = document.getElementById('closeControls');
  }
  show() {
    this.el.classList.remove('hidden');
  }
  hide() {
    this.el.classList.add('hidden');
  }
}
