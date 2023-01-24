export default class Controls {
  constructor({ app, menu }) {
    this.app = app;
    this.controlsContainer = new PIXI.Container();

    const x = this.app.screen.width / 2;
    const y = this.app.screen.height / 3;
    const square = new PIXI.Sprite(PIXI.Texture.WHITE);
    square.tint = 0xffffff;
    square.anchor.set(0.5);
    square.position.set(x, y);
    square.width = 380;
    square.height = 400;

    const back = new PIXI.Sprite(PIXI.Texture.WHITE);
    back.tint = 0xffffff;
    back.anchor.set(0.5);
    back.position.set(x, this.app.screen.height - 50);
    back.width = 160;
    back.height = 40;
    back.interactive = true;
    back.cursor = "pointer";
    back.on("click", () => {
      this.app.stage.removeChild(this.controlsContainer);
      menu.show();
    });

    this.controlsContainer.addChild(square);
    this.controlsContainer.addChild(back);
    this.addText("Voltar", x, this.app.screen.height - 50);

    const texts = [
      "Mouse1/Espaço - Pressione para Atirar",
      "W - Mover para cima",
      "S - Mover para baixo",
      "D - Mover para direita",
      "A - Mover para esquerda",
      "M - Mutar/Desmutar",
      "Esc - Pausar",
    ];

    let pos = { x, y: y - 150 };
    texts.forEach((text) => {
      this.addText(text, pos.x, pos.y);
      pos.y += 50;
    });

    this.app.stage.addChild(this.controlsContainer);
  }

  addText(text, x, y) {
    const rule = new PIXI.Text(text, {
      fill: 0x000000,
      fontSize: 30,
    });
    rule.position.set(x, y);
    rule.anchor.set(0.5);

    this.controlsContainer.addChild(rule);
  }
}
