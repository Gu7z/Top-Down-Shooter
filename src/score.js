import getUrl from "./utils/get_url.js";

export default class Score {
  constructor({ onBack }) {
    this.onBack = onBack;
    this.container = document.createElement('div');
    this.container.className = 'absolute inset-0 bg-gray-900 bg-opacity-80 flex flex-col items-center pt-10 space-y-6 text-white pointer-events-auto';

    const title = document.createElement('h1');
    title.textContent = 'Scoreboard';
    title.className = 'text-3xl font-bold';
    this.container.appendChild(title);

    this.table = document.createElement('table');
    this.table.className = 'text-left text-lg border-collapse';
    this.container.appendChild(this.table);

    this.container.appendChild(
      this.createButton('Back', () => {
        this.hide();
        this.onBack();
      })
    );

    this.showScore();
  }

  createButton(text, onClick) {
    const btn = document.createElement('button');
    btn.className = 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded w-48';
    btn.textContent = text;
    btn.addEventListener('click', onClick);
    return btn;
  }

  async getScore() {
    const url = getUrl();
    const response = await fetch(url);
    return response.json();
  }

  drawTableHead() {
    const head = document.createElement('tr');
    ['Rank', 'Name', 'Points'].forEach((t) => {
      const th = document.createElement('th');
      th.textContent = t;
      th.className = 'px-4 py-2';
      head.appendChild(th);
    });
    this.table.appendChild(head);
  }

  drawLine(index, name, points) {
    const tr = document.createElement('tr');
    [index, name, points].forEach((t) => {
      const td = document.createElement('td');
      td.textContent = t;
      td.className = 'px-4 py-2 text-center';
      tr.appendChild(td);
    });
    this.table.appendChild(tr);
  }

  async showScore() {
    const data = await this.getScore();
    this.table.innerHTML = '';
    this.drawTableHead();
    data.forEach(({ name, points }, i) => this.drawLine(i + 1, name, points));
  }

  show() {
    document.getElementById('ui-root').appendChild(this.container);
  }

  hide() {
    this.container.remove();
  }
}
