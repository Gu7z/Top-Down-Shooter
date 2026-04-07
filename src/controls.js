import {
  UISkin,
  createBackdrop,
  createCard,
  createLabel,
  createPillButton,
  addScreenCorners,
} from "./ui_system.js";

const BINDINGS = [
  { key: "W  /  A  /  S  /  D",     action: "Movimentação"          },
  { key: "Shift",                    action: "Dash"                  },
  { key: "Mouse1  /  Espaço",        action: "Disparo contínuo"      },
  { key: "ESC",                      action: "Pausar / Continuar"    },
  { key: "M",                        action: "Mutar / Demutar áudio" },
];

const ROW_H   = 54;
const ROW_GAP = 70;

export default class Controls {
  constructor({ app, menu }) {
    this.app = app;
    this.controlsContainer = new PIXI.Container();

    const sw = app.screen.width;
    const sh = app.screen.height;
    const cx = sw / 2;
    const cy = sh / 2;

    // Card dimensions responsive to screen
    const cardW = Math.min(sw - 40, 840);
    const cardH = Math.min(sh - 60, 700);
    const cardTop    = cy - cardH / 2;
    const cardBottom = cy + cardH / 2;

    // Fixed vertical offsets from cardTop / cardBottom
    const titleY    = cardTop  + 57;
    const subtitleY = cardTop  + 103;
    const dividerY  = cardTop  + 122;
    const scrollTop = cardTop  + 142;
    const backBtnY  = cardBottom - 44;
    const scrollBottom = backBtnY - ROW_H / 2 - 10;
    const scrollH   = scrollBottom - scrollTop;

    // Total height the list needs
    const totalListH = (BINDINGS.length - 1) * ROW_GAP + ROW_H;
    const maxScroll  = Math.max(0, totalListH - scrollH);

    createBackdrop(this.controlsContainer, app);
    addScreenCorners(this.controlsContainer, app);

    createCard({
      container:   this.controlsContainer,
      x:           cx,
      y:           cy,
      width:       cardW,
      height:      cardH,
      chamfer:     16,
      bracketSize: 22,
    });

    createLabel({
      container:    this.controlsContainer,
      text:         "CONTROLES",
      x:            cx,
      y:            titleY,
      fontSize:     50,
      color:        UISkin.palette.accent,
      bold:         true,
      letterSpacing: 6,
      glow:         true,
    });

    createLabel({
      container:    this.controlsContainer,
      text:         "▸  CONFIGURAÇÕES DE ENTRADA  ◂",
      x:            cx,
      y:            subtitleY,
      fontSize:     13,
      color:        UISkin.palette.textSecondary,
      mono:         true,
      letterSpacing: 3,
    });

    const div = new PIXI.Graphics();
    div.lineStyle(1, UISkin.palette.accent, 0.22);
    div.moveTo(cx - cardW / 2 + 30, dividerY);
    div.lineTo(cx + cardW / 2 - 30, dividerY);
    this.controlsContainer.addChild(div);

    // ── Scrollable list ──────────────────────────────────────────────
    const halfW = cardW / 2 - 20; // list half-width inside the card

    const listContainer = new PIXI.Container();
    listContainer.y = scrollTop;
    this.controlsContainer.addChild(listContainer);

    // Clip mask
    const mask = new PIXI.Graphics();
    mask.beginFill(0xffffff);
    mask.drawRect(cx - halfW, scrollTop, halfW * 2, scrollH);
    mask.endFill();
    this.controlsContainer.addChild(mask);
    listContainer.mask = mask;

    BINDINGS.forEach(({ key, action }, idx) => {
      const localY = idx * ROW_GAP; // top-left of this row in listContainer space

      const rowBg = new PIXI.Graphics();
      rowBg.beginFill(idx % 2 === 0 ? 0x080812 : 0x0A0A0F, 0.55);
      rowBg.lineStyle(1, UISkin.palette.accent, 0.08);
      rowBg.drawRect(cx - halfW, localY, halfW * 2, ROW_H);
      rowBg.endFill();
      listContainer.addChild(rowBg);

      const strip = new PIXI.Graphics();
      strip.beginFill(UISkin.palette.accent, 0.82);
      strip.drawRect(cx - halfW, localY, 3, ROW_H);
      strip.endFill();
      listContainer.addChild(strip);

      const rowCenterY = localY + ROW_H / 2;

      createLabel({
        container:    listContainer,
        text:         key,
        x:            cx - halfW * 0.38,
        y:            rowCenterY,
        fontSize:     18,
        color:        UISkin.palette.accent,
        bold:         true,
        letterSpacing: 2,
        mono:         true,
      });

      createLabel({
        container:    listContainer,
        text:         "›",
        x:            cx + halfW * 0.06,
        y:            rowCenterY,
        fontSize:     20,
        color:        UISkin.palette.textSecondary,
        mono:         true,
      });

      createLabel({
        container:    listContainer,
        text:         action,
        x:            cx + halfW * 0.38,
        y:            rowCenterY,
        fontSize:     17,
        color:        UISkin.palette.textPrimary,
        mono:         true,
        letterSpacing: 1,
      });
    });

    // ── Scrollbar (visible only when content overflows) ──────────────
    let scrollbarThumb = null;
    if (maxScroll > 0) {
      const sbX     = cx + halfW + 8;
      const sbTrackH = scrollH;
      const thumbH  = Math.max(30, scrollH * (scrollH / totalListH));

      const sbTrack = new PIXI.Graphics();
      sbTrack.beginFill(UISkin.palette.accent, 0.08);
      sbTrack.drawRoundedRect(sbX, scrollTop, 4, sbTrackH, 2);
      sbTrack.endFill();
      this.controlsContainer.addChild(sbTrack);

      scrollbarThumb = new PIXI.Graphics();
      scrollbarThumb.beginFill(UISkin.palette.accent, 0.45);
      scrollbarThumb.drawRoundedRect(0, 0, 4, thumbH, 2);
      scrollbarThumb.endFill();
      scrollbarThumb.x = sbX;
      scrollbarThumb.y = scrollTop;
      this.controlsContainer.addChild(scrollbarThumb);
    }

    // ── Scroll state ─────────────────────────────────────────────────
    let scrollOffset = 0;

    const applyScroll = () => {
      listContainer.y = scrollTop - scrollOffset;

      if (scrollbarThumb && maxScroll > 0) {
        const thumbH   = scrollbarThumb.height;
        const trackRange = scrollH - thumbH;
        scrollbarThumb.y = scrollTop + (scrollOffset / maxScroll) * trackRange;
      }
    };

    const onWheel = (e) => {
      if (maxScroll <= 0) return;
      scrollOffset = Math.max(0, Math.min(maxScroll, scrollOffset + e.deltaY * 0.5));
      applyScroll();
    };

    app.view.addEventListener("wheel", onWheel);

    // ── Back button ──────────────────────────────────────────────────
    createPillButton({
      container: this.controlsContainer,
      x:         cx,
      y:         backBtnY,
      text:      "↩   VOLTAR AO MENU",
      width:     300,
      height:    ROW_H,
      onClick:   () => {
        app.view.removeEventListener("wheel", onWheel);
        this.app.stage.removeChild(this.controlsContainer);
        menu.show();
      },
    });

    this.app.stage.addChild(this.controlsContainer);
  }
}
