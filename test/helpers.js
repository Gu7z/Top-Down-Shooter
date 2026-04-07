export function setupPixiMock() {
  global.PIXI = {
    Container: class {
      constructor() {
        this.children = [];
        this.position = { x: 0, y: 0, set(x, y) { this.x = x; this.y = y; } };
        this.scale = { x: 1, y: 1, set(x, y = x) { this.x = x; this.y = y; } };
        this.interactive = false;
        this.cursor = null;
        this.eventHandlers = {};
      }
      addChild(child) {
        this.children = this.children.filter(c => c !== child);
        this.children.push(child);
        child.parent = this;
      }
      removeChild(child) {
        this.children = this.children.filter(c => c !== child);
        if (child.parent === this) child.parent = null;
      }
      removeChildren() {
        this.children.forEach(child => { if (child.parent === this) child.parent = null; });
        this.children = [];
      }
      on(event, fn) { this.eventHandlers[event] = fn; return this; }
      off(event) {
        delete this.eventHandlers[event];
        return this;
      }
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
        this.alpha = 1;
        this.visible = true;
        this.interactive = false;
        this.cursor = null;
        this.position = { x: 0, y: 0, set(x, y) { this.x = x; this.y = y; } };
        this.eventHandlers = {};
      }
      beginFill()  { return this; }
      endFill()    { return this; }
      lineStyle()  { return this; }
      moveTo()     { return this; }
      lineTo()     { return this; }
      closePath()  { return this; }
      drawRect()   { return this; }
      drawRoundedRect() { return this; }
      drawPolygon() { return this; }
      drawEllipse(){ return this; }
      drawCircle() { return this; }
      arc()        { return this; }
      clear()      { return this; }
      on(event, fn)  { this.eventHandlers[event] = fn; return this; }
      off(event) {
        delete this.eventHandlers[event];
        return this;
      }
      destroy() { this.destroyed = true; }
    },
    Text: class {
      constructor(text = '', style = {}) {
        this.text = text;
        this.style = style;
        this.position = { x: 0, y: 0, set(x, y) { this.x = x; this.y = y; } };
        this.anchor = { set() {} };
        this.visible = true;
        this.alpha = 1;
      }
      destroy() { this.destroyed = true; }
    },
    Rectangle: class {
      constructor(x = 0, y = 0, w = 0, h = 0) { this.x = x; this.y = y; this.width = w; this.height = h; }
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
    stage: {
      children: [],
      addChild(child) {
        this.children = this.children.filter(c => c !== child);
        this.children.push(child);
        child.parent = this;
      },
      removeChild(child) {
        this.children = this.children.filter(c => c !== child);
        if (child.parent === this) child.parent = null;
      },
      removeChildren() {
        this.children.forEach(child => { if (child.parent === this) child.parent = null; });
        this.children = [];
      },
      _events: {},
      on(ev, fn) { this._events[ev] = fn; },
      off(ev) { delete this._events[ev]; },
    },
    ticker: {
      fn: null,
      removedFn: null,
      add(fn) { this.fn = fn; return {}; },
      remove(fn) { this.removedFn = fn; },
    },
    screen: { width: 800, height: 600 },
    setInterval() { return { clear() {} }; },
    setTimeout() { return { clear() {} }; },
    renderer: { view: { onmousemove: null } },
    view: {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
    },
    render() {},
    start() {},
    stop() {},
  };
}
