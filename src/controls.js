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
  { key: "Mouse1  /  Espaço",        action: "Disparo contínuo"      },
  { key: "ESC",                      action: "Pausar / Continuar"    },
  { key: "M",                        action: "Mutar / Demutar áudio" },
];

export default class Controls {
  constructor({ app, menu }) {
    this.app = app;
    this.controlsContainer = new PIXI.Container();

    const cx = app.screen.width  / 2;
    const cy = app.screen.height / 2;

    createBackdrop(this.controlsContainer, app);
    addScreenCorners(this.controlsContainer, app);

    createCard({
      container:   this.controlsContainer,
      x:           cx,
      y:           cy,
      width:       840,
      height:      558,
      chamfer:     16,
      bracketSize: 22,
    });

    createLabel({
      container:    this.controlsContainer,
      text:         "CONTROLES",
      x:            cx,
      y:            cy - 222,
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
      y:            cy - 176,
      fontSize:     13,
      color:        UISkin.palette.textSecondary,
      mono:         true,
      letterSpacing: 3,
    });

    // Divider under subtitle
    const div = new PIXI.Graphics();
    div.lineStyle(1, UISkin.palette.accent, 0.22);
    div.moveTo(cx - 310, cy - 157);
    div.lineTo(cx + 310, cy - 157);
    this.controlsContainer.addChild(div);

    // Binding rows
    let rowY = cy - 112;
    BINDINGS.forEach(({ key, action }, idx) => {
      // Alternating row tint
      const rowBg = new PIXI.Graphics();
      rowBg.beginFill(idx % 2 === 0 ? 0x080812 : 0x0A0A0F, 0.55);
      rowBg.lineStyle(1, UISkin.palette.accent, 0.08);
      rowBg.drawRect(cx - 340, rowY - 27, 680, 54);
      rowBg.endFill();
      this.controlsContainer.addChild(rowBg);

      // Left cyan accent strip
      const strip = new PIXI.Graphics();
      strip.beginFill(UISkin.palette.accent, 0.82);
      strip.drawRect(cx - 340, rowY - 27, 3, 54);
      strip.endFill();
      this.controlsContainer.addChild(strip);

      // Key badge
      createLabel({
        container:    this.controlsContainer,
        text:         key,
        x:            cx - 130,
        y:            rowY,
        fontSize:     18,
        color:        UISkin.palette.accent,
        bold:         true,
        letterSpacing: 2,
        mono:         true,
      });

      // Separator dot
      createLabel({
        container:    this.controlsContainer,
        text:         "›",
        x:            cx + 20,
        y:            rowY,
        fontSize:     20,
        color:        UISkin.palette.textSecondary,
        mono:         true,
      });

      // Action description
      createLabel({
        container:    this.controlsContainer,
        text:         action,
        x:            cx + 130,
        y:            rowY,
        fontSize:     17,
        color:        UISkin.palette.textPrimary,
        mono:         true,
        letterSpacing: 1,
      });

      rowY += 70;
    });

    createPillButton({
      container: this.controlsContainer,
      x:         cx,
      y:         cy + 218,
      text:      "↩   VOLTAR AO MENU",
      width:     300,
      height:    54,
      onClick:   () => {
        this.app.stage.removeChild(this.controlsContainer);
        menu.show();
      },
    });

    this.app.stage.addChild(this.controlsContainer);
  }
}
