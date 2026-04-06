import { audio } from "./audio.js";
import {
  UISkin,
  createCard,
  createLabel,
  createPillButton,
} from "./ui_system.js";

export default class Settings {
  constructor({ app, onBack }) {
    this.app = app;
    this.onBack = onBack;
    this.container = new PIXI.Container();
    this._dragging = false;

    this.backdrop = new PIXI.Sprite(PIXI.Texture.WHITE);
    this.backdrop.tint = 0x000000;
    this.backdrop.alpha = 0.55;
    this.backdrop.width = app.screen.width;
    this.backdrop.height = app.screen.height;
    this.container.addChild(this.backdrop);

    this.cx = app.screen.width / 2;
    this.cy = app.screen.height / 2;

    createCard({
      container: this.container,
      x: this.cx,
      y: this.cy,
      width: 460,
      height: 320,
      chamfer: 14,
      bracketSize: 18,
    });

    createLabel({
      container: this.container,
      text: "⚙  CONFIGURAÇÕES",
      x: this.cx,
      y: this.cy - 128,
      fontSize: 26,
      color: UISkin.palette.accent,
      bold: true,
      letterSpacing: 5,
    });

    createLabel({
      container: this.container,
      text: "▸  AJUSTES DE ÁUDIO  ◂",
      x: this.cx,
      y: this.cy - 94,
      fontSize: 12,
      color: UISkin.palette.textSecondary,
      mono: true,
      letterSpacing: 3,
    });

    this.buildSlider();
    this.buildMuteToggle();
    this.buildBackButton();

    app.stage.addChild(this.container);
    this.render();
  }

  buildSlider() {
    const { cx, cy } = this;
    const trackW = 380;
    const trackH = 6;
    const trackX = cx - trackW / 2;
    const trackY = cy - 34;

    createLabel({
      container: this.container,
      text: "VOLUME",
      x: trackX,
      y: trackY - 22,
      fontSize: 13,
      color: UISkin.palette.accent,
      bold: true,
      letterSpacing: 3,
      anchor: 0,
    });

    this.volValue = createLabel({
      container: this.container,
      text: String(Math.round(audio.volume * 100)),
      x: cx + trackW / 2,
      y: trackY - 22,
      fontSize: 18,
      color: UISkin.palette.accent,
      bold: true,
      letterSpacing: 2,
      anchor: 1,
    });

    const track = new PIXI.Graphics();
    track.beginFill(UISkin.palette.disabled, 1);
    track.drawRect(trackX, trackY, trackW, trackH);
    track.endFill();
    track.interactive = true;
    track.cursor = "pointer";
    this.container.addChild(track);

    this.sliderFill = new PIXI.Graphics();
    this.container.addChild(this.sliderFill);

    this.sliderThumb = new PIXI.Graphics();
    this.sliderThumb.interactive = true;
    this.sliderThumb.cursor = "pointer";
    this.container.addChild(this.sliderThumb);

    this._track = { x: trackX, y: trackY, w: trackW, h: trackH };

    this.redrawSlider(audio.volume);

    const startDrag = (e) => {
      this._dragging = true;
      this._updateFromPointer(e);
      this.app.stage.on("pointermove", this._onDrag);
      this.app.stage.on("pointerup", this._onDrop);
    };
    this._onDrag = (e) => {
      if (this._dragging) this._updateFromPointer(e);
    };
    this._onDrop = () => {
      this._dragging = false;
      this.app.stage.off("pointermove", this._onDrag);
      this.app.stage.off("pointerup", this._onDrop);
    };

    track.on("pointerdown", startDrag);
    this.sliderThumb.on("pointerdown", startDrag);
  }

  _updateFromPointer(e) {
    const { x, w } = this._track;
    const pointerX = e.global?.x ?? e.data?.global?.x ?? 0;
    const nextVolume = Math.min(1, Math.max(0, (pointerX - x) / w));
    audio.setVolume(nextVolume);
    this.redrawSlider(nextVolume);
    this.render();
  }

  redrawSlider(value) {
    const { x, y, w, h } = this._track;
    const fillW = Math.max(0, value * w);
    const thumbX = x + fillW;
    const thumbSize = 16;

    this.sliderFill.clear();
    this.sliderFill.beginFill(UISkin.palette.accent, 1);
    this.sliderFill.drawRect(x, y, fillW, h);
    this.sliderFill.endFill();

    this.sliderThumb.clear();
    this.sliderThumb.beginFill(UISkin.palette.accent, 1);
    this.sliderThumb.lineStyle(2, UISkin.palette.ink, 1);
    this.sliderThumb.drawRect(
      thumbX - thumbSize / 2,
      y + h / 2 - thumbSize / 2,
      thumbSize,
      thumbSize,
    );
    this.sliderThumb.endFill();

    this.volValue.text = String(Math.round(value * 100));
  }

  buildMuteToggle() {
    const { cx, cy } = this;

    createLabel({
      container: this.container,
      text: "MUDO",
      x: cx - 190,
      y: cy + 30,
      fontSize: 13,
      color: UISkin.palette.textPrimary,
      bold: true,
      letterSpacing: 3,
      anchor: 0,
    });

    createLabel({
      container: this.container,
      text: "tecla M também alterna",
      x: cx - 190,
      y: cy + 50,
      fontSize: 11,
      color: UISkin.palette.textSecondary,
      mono: true,
      letterSpacing: 1,
      anchor: 0,
    });

    this.muteBtn = createPillButton({
      container: this.container,
      x: cx + 150,
      y: cy + 38,
      width: 80,
      height: 32,
      primary: audio.muted,
      text: audio.muted ? "ON" : "OFF",
      onClick: () => this.toggleMute(),
    });
  }

  toggleMute() {
    audio.toggleMute();
    this.container.removeChild(this.muteBtn.bg);
    this.container.removeChild(this.muteBtn.label);

    this.muteBtn = createPillButton({
      container: this.container,
      x: this.cx + 150,
      y: this.cy + 38,
      width: 80,
      height: 32,
      primary: audio.muted,
      text: audio.muted ? "ON" : "OFF",
      onClick: () => this.toggleMute(),
    });
    this.render();
  }

  buildBackButton() {
    createPillButton({
      container: this.container,
      x: this.cx,
      y: this.cy + 120,
      width: 360,
      height: 52,
      text: "↩   VOLTAR",
      onClick: () => this.close(),
    });
  }

  close() {
    this.app.stage.off("pointermove", this._onDrag);
    this.app.stage.off("pointerup", this._onDrop);
    this.app.stage.removeChild(this.container);
    this.onBack();
    this.render();
  }

  render() {
    this.app.render?.();
  }
}
