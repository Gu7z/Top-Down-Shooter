import getUrl from '../utils/get_url.js';

export default class Score {
  constructor() {
    this.el = document.getElementById('scoreboard');
    this.tableBody = document.getElementById('scoreTable');
    this.closeBtn = document.getElementById('closeScore');
  }

  async show() {
    const res = await fetch(getUrl());
    const data = await res.json();
    this.tableBody.innerHTML = data
      .map((s, i) => `<tr><td class='px-4'>${i + 1}</td><td class='px-4'>${s.name}</td><td class='px-4'>${s.points}</td></tr>`)
      .join('');
    this.el.classList.remove('hidden');
  }

  hide() {
    this.el.classList.add('hidden');
  }
}
