import getUrl from "./utils/get_url.js";

export default class Score {
  constructor({ app, menu }) {
    this.app = app;
    this.menu = menu;
    this.scoreContainer = new PIXI.Container();
    this.root = document.getElementById?.("ui-root") || document.body;
    this.createBackButton();
    this.app.stage.addChild(this.scoreContainer);
    this.showScore();
  }

  createBackButton() {
    const x = this.app.screen.width / 2;
    const y = this.app.screen.height - 80;

    const bg = new PIXI.Sprite(PIXI.Texture.WHITE);
    bg.tint = 0xffffff;
    bg.anchor.set(0.5);
    bg.position.set(x, y);
    bg.width = 160;
    bg.height = 48;
    bg.interactive = true;
    bg.cursor = "pointer";
    bg.on("click", () => {
      const table = document.getElementById?.("score-table");
      if (table) this.root.removeChild(table);
      this.app.stage.removeChild(this.scoreContainer);
      this.menu.show();
    });

    const text = new PIXI.Text("Voltar", { fill: 0x000000, fontSize: 28 });
    text.anchor.set(0.5);
    text.position.set(x, y);

    this.scoreContainer.addChild(bg);
    this.scoreContainer.addChild(text);
  }

  async fetchScore() {
    const loading = document.createElement("div");
    loading.className =
      "text-white absolute top-5 left-1/2 -translate-x-1/2 pointer-events-auto";
    loading.innerText = "Carregando placar...";
    this.root.appendChild(loading);
    const url = getUrl();
    const response = await fetch(url);
    const data = await response.json();
    this.root.removeChild(loading);
    return data;
  }

  // Compatibility with tests
  drawLoading() {
    const el = document.createElement("div");
    el.className =
      "text-white absolute top-5 left-1/2 -translate-x-1/2 pointer-events-auto";
    el.innerText = "Carregando placar...";
    return el;
  }

  async getScore() {
    const loading = this.drawLoading();
    this.root.appendChild(loading);
    const url = getUrl();
    const response = await fetch(url);
    const data = await response.json();
    this.root.removeChild(loading);
    return data;
  }

  drawTable() {
    const table = document.createElement("table");
    table.id = "score-table";
    table.className =
      "pointer-events-auto mx-auto mt-4 text-xl text-center bg-white text-gray-800";
    return table;
  }

  drawTableHead() {
    const head = document.createElement("tr");
    ["Rank", "Nome", "Pontos"].forEach((h) => {
      const th = document.createElement("th");
      th.className = "px-4 py-2 bg-gray-800 text-white";
      th.innerText = h;
      head.appendChild(th);
    });
    return head;
  }

  drawTableLine(index, name, points) {
    const row = document.createElement("tr");
    row.className = index % 2 ? "bg-gray-100" : "";
    const rank = document.createElement("td");
    rank.className = "px-4 py-2";
    rank.innerText = index;
    const user = document.createElement("td");
    user.className = "px-4 py-2";
    user.innerText = name;
    const pts = document.createElement("td");
    pts.className = "px-4 py-2";
    pts.innerText = points;
    row.appendChild(rank);
    row.appendChild(user);
    row.appendChild(pts);
    return row;
  }

  createTable(scores) {
    const table = document.createElement("table");
    table.id = "score-table";
    table.className =
      "pointer-events-auto mx-auto mt-4 text-xl text-center bg-white text-gray-800";
    const header = document.createElement("tr");
    ["Rank", "Nome", "Pontos"].forEach((h) => {
      const th = document.createElement("th");
      th.className = "px-4 py-2 bg-gray-800 text-white";
      th.innerText = h;
      header.appendChild(th);
    });
    table.appendChild(header);

    scores.forEach(({ name, points }, index) => {
      const row = document.createElement("tr");
      row.className = index % 2 ? "bg-gray-100" : "";
      const rank = document.createElement("td");
      rank.className = "px-4 py-2";
      rank.innerText = index + 1;
      const user = document.createElement("td");
      user.className = "px-4 py-2";
      user.innerText = name;
      const pts = document.createElement("td");
      pts.className = "px-4 py-2";
      pts.innerText = points;
      row.appendChild(rank);
      row.appendChild(user);
      row.appendChild(pts);
      table.appendChild(row);
    });

    return table;
  }

  async showScore() {
    const score = await this.getScore();
    const table = this.drawTable();
    table.appendChild(this.drawTableHead());
    score.forEach(({ name, points }, i) => {
      table.appendChild(this.drawTableLine(i + 1, name, points));
    });
    this.root.appendChild(table);
  }
}
