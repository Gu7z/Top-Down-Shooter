import {
  MenuTheme,
  addMenuOverlay,
  addPanel,
  addSectionTitle,
  addSectionSubtitle,
  createMenuButton,
} from "./ui_theme.js";

export default class Controls {
  constructor({ app, menu }) {
    this.app = app;
    this.controlsContainer = new PIXI.Container();

    const x = this.app.screen.width / 2;
    const y = this.app.screen.height / 2;

    addMenuOverlay(this.controlsContainer, this.app);
    addPanel({
      container: this.controlsContainer,
      x,
      y,
      width: 760,
      height: 560,
      tint: MenuTheme.color.panel,
    });

    addSectionTitle(this.controlsContainer, "CONTROLES", x, y - 215, 52);
    addSectionSubtitle(
      this.controlsContainer,
      "Aprenda os atalhos para sobreviver mais tempo.",
      x,
      y - 170,
      20
    );

    const texts = [
      "Mouse1 / Espaço · Atirar",
      "W A S D · Movimento",
      "M · Mutar / Desmutar áudio",
      "ESC · Pausar / Continuar",
    ];

    let posY = y - 90;
    texts.forEach((text, index) => {
      this.addText(text, x, posY, index === 0 ? MenuTheme.color.accent : MenuTheme.color.text);
      posY += 58;
    });

    createMenuButton({
      container: this.controlsContainer,
      x,
      y: this.app.screen.height - 86,
      label: "VOLTAR",
      onClick: () => {
        this.app.stage.removeChild(this.controlsContainer);
        menu.show();
      },
      width: 220,
      height: 54,
    });

    this.app.stage.addChild(this.controlsContainer);
  }

  addText(text, x, y, fill = MenuTheme.color.text) {
    const rule = new PIXI.Text(text, {
      fill,
      fontSize: 30,
      fontWeight: "600",
      align: "center",
    });
    rule.position.set(x, y);
    rule.anchor.set(0.5);

    this.controlsContainer.addChild(rule);
  }
}
