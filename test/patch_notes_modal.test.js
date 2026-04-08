import test from 'node:test';
import assert from 'node:assert/strict';
import PatchNotesModal from '../src/patch_notes/patch_notes_modal.js';
import { setupPixiMock, createAppMock } from './helpers.js';

setupPixiMock();

function installTextHeightMock(height = 80) {
  const OriginalText = PIXI.Text;

  PIXI.Text = class extends OriginalText {
    constructor(text = '', style = {}) {
      super(text, style);
      this.height = height;
    }
  };

  return {
    restore() {
      PIXI.Text = OriginalText;
    },
  };
}

test('patch notes modal shows a scrollbar and tracks wheel scrolling when content overflows', () => {
  global.localStorage = {
    storage: {},
    getItem(key) { return this.storage[key]; },
    setItem(key, value) { this.storage[key] = value; },
  };

  const textMock = installTextHeightMock(90);
  try {
    const app = createAppMock();
    const modal = new PatchNotesModal({
      app,
      notes: {
        title: 'PATCH NOTES',
        date: '2026-04-08',
        items: ['a', 'b', 'c', 'd', 'e'],
      },
    });

    assert.ok(modal.scrollbarTrack);
    assert.ok(modal.scrollbarThumb);
    assert.ok(modal._wheelHandler);
    assert.ok(app.view.eventListeners.wheel);

    const initialThumbY = modal.scrollbarThumb.y;
    app.view.eventListeners.wheel({ deltaY: 120 });

    assert.ok(modal.scrollbarThumb.y > initialThumbY);

    modal.destroy();
    assert.equal(modal._wheelHandler, null);
  } finally {
    textMock.restore();
  }
});

test('patch notes modal leaves bottom breathing room so the last line is fully visible at max scroll', () => {
  global.localStorage = {
    storage: {},
    getItem(key) { return this.storage[key]; },
    setItem(key, value) { this.storage[key] = value; },
  };

  const textMock = installTextHeightMock(90);
  try {
    const app = createAppMock();
    const modal = new PatchNotesModal({
      app,
      notes: {
        title: 'PATCH NOTES',
        date: '2026-04-08',
        items: ['a', 'b', 'c', 'd', 'e'],
      },
    });

    app.view.eventListeners.wheel({ deltaY: 9999 });

    const lastChild = modal.contentContainer.children.at(-1);
    const visibleBottom = modal.contentContainer.y + lastChild.position.y + lastChild.height;
    const maskBottom = modal.layout.contentTop + modal.layout.visibleHeight;

    assert.ok(maskBottom - visibleBottom >= modal.layout.bottomPadding);
   } finally {
    textMock.restore();
  }
});

test('patch notes modal grows for longer text, stays compact for short text, and remains inside the viewport', () => {
  global.localStorage = {
    storage: {},
    getItem(key) { return this.storage[key]; },
    setItem(key, value) { this.storage[key] = value; },
  };

  const textMock = installTextHeightMock(90);
  try {
    const compactApp = createAppMock();
    compactApp.screen = { width: 1280, height: 720 };
    const compactModal = new PatchNotesModal({
      app: compactApp,
      notes: {
        title: 'PATCH NOTES',
        date: '2026-04-08',
        items: ['curto'],
      },
    });

    const longApp = createAppMock();
    longApp.screen = { width: 1280, height: 720 };
    const longModal = new PatchNotesModal({
      app: longApp,
      notes: {
        title: 'PATCH NOTES',
        date: '2026-04-08',
        items: ['1', '2', '3', '4', '5', '6', '7', '8'],
      },
    });

    const narrowApp = createAppMock();
    narrowApp.screen = { width: 480, height: 720 };
    const narrowModal = new PatchNotesModal({
      app: narrowApp,
      notes: {
        title: 'PATCH NOTES',
        date: '2026-04-08',
        items: ['1', '2', '3', '4', '5', '6', '7', '8'],
      },
    });

    assert.equal(compactModal._wheelHandler, null);
    assert.ok(longModal.layout.cardHeight > compactModal.layout.cardHeight);
    assert.ok(longModal.layout.buttonY > compactModal.layout.buttonY);
    assert.ok(longModal._wheelHandler);
    assert.ok(longModal.layout.cardHeight <= longApp.screen.height - (longModal.layout.safeMarginY * 2));
    assert.ok(narrowModal.layout.cardWidth <= narrowApp.screen.width - (narrowModal.layout.safeMarginX * 2));
  } finally {
    textMock.restore();
  }
});
