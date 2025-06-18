export default class Menu {
  constructor({ start, showScore, showControls }) {
    this.start = start;
    this.showScore = showScore;
    this.showControls = showControls;

    this.container = document.createElement('div');
    this.container.className = 'absolute inset-0 flex flex-col items-center justify-center space-y-6 bg-gray-900 bg-opacity-80 pointer-events-auto';

    const title = document.createElement('h1');
    title.textContent = 'Top Down Shooter';
    title.className = 'text-5xl font-bold text-white';
    this.container.appendChild(title);

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.placeholder = 'Name';
    this.input.className = 'px-4 py-2 rounded text-gray-900';
    this.container.appendChild(this.input);

    this.container.appendChild(this.createButton('Play', () => {
      if (!this.input.value.trim()) return;
      this.hide();
      this.start(this.input.value.trim());
    }));

    this.container.appendChild(this.createButton('Score', () => {
      this.hide();
      this.showScore();
    }));

    this.container.appendChild(this.createButton('Controls', () => {
      this.hide();
      this.showControls();
    }));
  }

  createButton(text, onClick) {
    const btn = document.createElement('button');
    btn.className = 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded w-48';
    btn.textContent = text;
    btn.addEventListener('click', onClick);
    return btn;
  }

  show() {
    document.getElementById('ui-root').appendChild(this.container);
    this.input.focus();
  }

  hide() {
    this.container.remove();
  }
}
