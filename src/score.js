import getUrl from "./utils/get_url";

export default class Score {
  constructor({ app, menu }) {
    this.app = app;
    this.menu = menu;
    this.scoreContainer = new PIXI.Container();

    this.backButton();
    this.app.stage.addChild(this.scoreContainer);

    this.showScore().then(() => {
      this.app.stage.addChild(this.scoreContainer);
    });
  }

  backButton() {
    const x = this.app.screen.width / 2;
    const y = this.app.screen.height;
    const back = new PIXI.Sprite(PIXI.Texture.WHITE);

    back.tint = 0xffffff;
    back.anchor.set(0.5);
    back.position.set(x, y - 100);
    back.width = 160;
    back.height = 40;
    back.interactive = true;
    back.cursor = "pointer";
    back.on("click", () => {
      document.body.removeChild(document.getElementById("scoreboard"));
      this.app.stage.removeChild(this.scoreContainer);
      this.menu.show();
    });

    const backText = new PIXI.Text("Voltar", {
      fill: 0x000000,
      fontSize: 30,
    });
    backText.position.set(x, y - 100);
    backText.anchor.set(0.5);

    this.scoreContainer.addChild(back);
    this.scoreContainer.addChild(backText);
  }

  drawLoading() {
    const loading = document.createElement("h1");
    loading.innerText = "Carregando ScoreBoard....";
    loading.style.color = "white";
    loading.style.position = "absolute";
    loading.style.top = "5%";
    loading.style.left = "40%";
    loading.style.transform = "translate(-50%, -50%)";

    return loading;
  }

  async getScore() {
    const loading = this.drawLoading();
    document.body.appendChild(loading);

    const url = getUrl();
    const response = await fetch(url);
    const data = await response.json();

    document.body.removeChild(loading);

    return data;
  }

  drawTable() {
    const table = document.createElement("table");
    table.id = "scoreboard";
    table.style.fontSize = "30px";
    table.style.position = "absolute";
    table.style.top = "0";
    table.style.left = "320px";
    table.style.width = "640px";
    table.style.backgroundColor = "white";

    return table;
  }

  drawTableHead() {
    const headtr = document.createElement("tr");
    const rankth = document.createElement("th");
    const nameth = document.createElement("th");
    const pointsth = document.createElement("th");

    rankth.innerText = "Rank";
    nameth.innerText = "Nome";
    pointsth.innerText = "Pontos";

    headtr.appendChild(rankth);
    headtr.appendChild(nameth);
    headtr.appendChild(pointsth);

    return headtr;
  }

  drawTableLine(index, name, points) {
    const line = document.createElement("tr");
    const ranktd = document.createElement("td");
    const nametd = document.createElement("td");
    const pointstd = document.createElement("td");

    ranktd.style.textAlign = "center";
    ranktd.innerText = index;

    nametd.style.textAlign = "center";
    nametd.innerText = name;

    pointstd.style.textAlign = "center";
    pointstd.innerText = points;

    line.appendChild(ranktd);
    line.appendChild(nametd);
    line.appendChild(pointstd);

    return line;
  }

  async showScore() {
    const score = await this.getScore();

    const table = this.drawTable();
    table.appendChild(this.drawTableHead());

    score.map(({ name, points }, index) => {
      table.appendChild(this.drawTableLine(index + 1, name, points));
    });

    document.body.appendChild(table);
  }
}
