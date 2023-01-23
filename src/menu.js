import Controls from "./controls";
import Game from "./game";
import Score from "./score";

export default class Menu {
  constructor({ app }) {
    this.x = app.screen.width / 2;
    this.y = app.screen.height / 6;
    this.app = app;
    this.menuContainer = new PIXI.Container();
    this.username = localStorage.getItem("username");

    this.drawNameInput();
    this.drawWelcomeText();
    this.drawMenuOptions();

    this.app.stage.addChild(this.menuContainer);
  }

  drawNameInput() {
    const input = new PIXI.TextInput({
      input: {
        fontSize: "25pt",
        padding: "14px",
        width: "200px",
        color: "#000000",
      },
      box: {
        default: {
          fill: 0xe8e9f3,
          rounded: 16,
          stroke: { color: 0xcbcee0, width: 4 },
        },
      },
    });

    if (this.username) {
      input.text = this.username;
      input.disabled = true;
    }
    input.placeholder = "Nome";
    input.x = this.x - 115;
    input.y = this.y + 50;
    input.on("input", (username) => {
      this.username = username;
      localStorage.setItem("username", username);
      if (username) {
        this.menuContainer.children[2].tint = 0xffffff;
        this.menuContainer.children[3].style.fill = 0x000000;
      } else {
        this.menuContainer.children[2].tint = 0xcccccc;
        this.menuContainer.children[3].style.fill = 0x666666;
      }
    });

    this.menuContainer.addChild(input);
    input.focus();
  }

  drawWelcomeText() {
    this.welcomeText = new PIXI.Text("Bem Vindo", {
      fill: 0xffffff,
      fontSize: 50,
    });
    this.welcomeText.position.set(this.x, this.y);
    this.welcomeText.anchor.set(0.5);
    this.menuContainer.addChild(this.welcomeText);
  }

  drawMenuButton(
    text,
    x,
    y,
    width,
    height,
    func,
    buttonColor = 0xffffff,
    textColor = 0x000000
  ) {
    const button = new PIXI.Sprite(PIXI.Texture.WHITE);
    button.tint = buttonColor;
    button.anchor.set(0.5);
    button.interactive = true;
    button.cursor = "pointer";
    button.position.set(x, y);
    button.width = width;
    button.height = height;
    button.on("click", func);

    const buttonText = new PIXI.Text(text, {
      fill: textColor,
      fontSize: 50,
    });
    buttonText.position.set(x, y);
    buttonText.anchor.set(0.5);

    this.menuContainer.addChild(button);
    this.menuContainer.addChild(buttonText);
  }

  drawMenuOptions() {
    this.drawMenuButton(
      "Jogar",
      this.x,
      this.y + 200,
      150,
      60,
      () => {
        if (!this.username) return;
        this.play();
      },
      this.username ? undefined : 0xcccccc,
      this.username ? undefined : 0x666666
    );

    this.drawMenuButton("Score", this.x, this.y + 300, 160, 60, () =>
      this.showScore()
    );

    this.drawMenuButton("Controles", this.x, this.y + 400, 220, 60, () =>
      this.showControls()
    );
  }

  hide() {
    this.app.stage.removeChild(this.menuContainer);
  }

  show() {
    this.app.stage.addChild(this.menuContainer);
  }

  play() {
    this.hide();
    new Game({ app: this.app, username: this.username });
  }

  showControls() {
    this.hide();
    new Controls({ app: this.app, menu: this });
  }

  showScore() {
    this.hide();
    new Score({ app: this.app, menu: this });
  }
}
