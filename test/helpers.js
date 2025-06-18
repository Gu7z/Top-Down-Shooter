export function setupPixiMock() {
  global.PIXI = {
    Container: class {
      constructor() { this.children = []; }
      addChild(child) { this.children.push(child); }
      removeChild(child) {}
      removeChildren() { this.children = []; }
    },
    Sprite: class {
      constructor(texture = {}) {
        this.texture = texture;
        this.x = 0;
        this.y = 0;
        this.position = {
          x: 0,
          y: 0,
          set: (x, y) => {
            this.position.x = x;
            this.position.y = y;
            this.x = x;
            this.y = y;
          },
        };
        this.anchor = { set() {} };
        this.scale = { x: 1, y: 1 };
        this.width = 0;
        this.height = 0;
        this.rotation = 0;
        this.visible = true;
        this.interactive = false;
        this.cursor = null;
        this.eventHandlers = {};
      }
      on(event, fn) { this.eventHandlers[event] = fn; }
      destroy() { this.destroyed = true; }
    },
    Graphics: class {
      constructor() {
        this.position = { x: 0, y: 0, set(x, y) { this.x = x; this.y = y; } };
      }
      beginFill() {}
      drawCircle() {}
      endFill() {}
      destroy() { this.destroyed = true; }
    },
    Text: class {
      constructor(text = '', style = {}) {
        this.text = text;
        this.style = style;
        this.position = { x: 0, y: 0, set(x, y) { this.x = x; this.y = y; } };
        this.anchor = { set() {} };
        this.visible = true;
      }
      destroy() { this.destroyed = true; }
    },
    Texture: { from: () => ({}), WHITE: {} },
    settings: {},
    SCALE_MODES: { NEAREST: 'nearest' },
    sound: { Sound: class { static from() { return { play() {}, volumeAll: 1 }; } }, volumeAll: 1 },
    TextInput: class {
      constructor() {
        this.text = '';
        this.disabled = false;
        this.placeholder = '';
        this.x = 0;
        this.y = 0;
        this.on = () => {};
      }
      focus() {}
    },
  };
}

export function createAppMock() {
  return {
    stage: { addChild() {}, removeChild() {}, removeChildren() {} },
    ticker: { add(fn) { this.fn = fn; return {}; } },
    screen: { width: 800, height: 600 },
    setInterval() { return { clear() {} }; },
    setTimeout() { return { clear() {} }; },
    renderer: { view: { onmousemove: null } },
    start() {},
    stop() {},
  };
}

export function setupDomMock() {
  global.document = {
    body: {
      appendChild() {},
      removeChild() {},
    },
    createElement() {
      return {
        className: '',
        textContent: '',
        style: {},
        appendChild() {},
        addEventListener() {},
        remove() {},
        focus() {},
      };
    },
    getElementById() {
      return { appendChild() {}, removeChild() {} };
    },
  };
}
