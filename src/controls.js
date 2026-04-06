import {
  UISkin,
  createBackdrop,
  createCard,
  createLabel,
  createPillButton,
} from "./ui_system.js";

export default class Controls {
  constructor({ app, menu }) {
    this.app = app;
    this.controlsContainer = new PIXI.Container();

    const x = this.app.screen.width / 2;
    const y = this.app.screen.height / 2;

    createBackdrop(this.controlsContainer, this.app);
    createCard({
      container: this.controlsContainer,
      x,
      y,
      width: 820,
      height: 560,
    });

    createLabel({
      container: this.controlsContainer,
      text: "COMANDOS DA RUN",
      x,
      y: y - 210,
      fontSize: 50,
      color: UISkin.palette.highlight,
      bold: true,
      letterSpacing: 3,
    });

    const rows = [
      { key: "W A S D", action: "Movimentação" },
      { key: "Mouse1 ou Espaço", action: "Disparo contínuo" },
      { key: "ESC", action: "Pausar / Continuar" },
      { key: "M", action: "Mutar áudio" },
    ];

    let lineY = y - 120;
    rows.forEach((row) => {
      createCard({
        container: this.controlsContainer,
        x,
        y: lineY,
        width: 620,
        height: 64,
        alpha: 0.8,
      });

      createLabel({
        container: this.controlsContainer,
        text: row.key,
        x: x - 210,
        y: lineY,
        fontSize: 26,
        color: UISkin.palette.highlightStrong,
        bold: true,
      });

      createLabel({
        container: this.controlsContainer,
        text: row.action,
        x: x + 40,
        y: lineY,
        fontSize: 24,
        color: UISkin.palette.textPrimary,
      });

      lineY += 78;
    });

    createPillButton({
      container: this.controlsContainer,
      x,
      y: this.app.screen.height - 80,
      text: "VOLTAR AO MENU",
      width: 280,
      onClick: () => {
        this.app.stage.removeChild(this.controlsContainer);
        menu.show();
      },
    });

    this.app.stage.addChild(this.controlsContainer);
  }

  addText(text, x, y, fill = UISkin.palette.textPrimary) {
    createLabel({
      container: this.controlsContainer,
      text,
      x,
      y,
      fontSize: 28,
      color: fill,
    });
  }
}
