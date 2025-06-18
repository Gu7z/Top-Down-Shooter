export default class Controls {
  constructor({ onBack }) {
    this.onBack = onBack;
    this.container = document.createElement('div');
    this.container.className = 'absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-gray-900 bg-opacity-80 text-white pointer-events-auto';

    const title = document.createElement('h1');
    title.textContent = 'Controls';
    title.className = 'text-3xl font-bold';
    this.container.appendChild(title);

    const instructions = [
      'Left click/Space - Shoot',
      'W - Move up',
      'S - Move down',
      'D - Move right',
      'A - Move left',
      'M - Mute/Unmute',
      'Esc - Pause',
    ];

    const list = document.createElement('ul');
    list.className = 'space-y-2 text-lg';
    instructions.forEach((text) => {
      const item = document.createElement('li');
      item.textContent = text;
      list.appendChild(item);
    });
    this.container.appendChild(list);

    this.container.appendChild(
      this.createButton('Back', () => {
        this.hide();
        this.onBack();
      })
    );
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
  }

  hide() {
    this.container.remove();
  }
}
