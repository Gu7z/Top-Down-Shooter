import getUrl from "./utils/get_url.js";
import {
  MenuTheme,
  addMenuOverlay,
  addPanel,
  addSectionTitle,
  addSectionSubtitle,
  createMenuButton,
} from "./ui_theme.js";

export default class Score {
  constructor({ app, menu }) {
    this.app = app;
    this.menu = menu;
    this.scoreContainer = new PIXI.Container();
    this.root = document.getElementById?.("ui-root") || document.body;

    this.drawBackground();
    this.createBackButton();
    this.app.stage.addChild(this.scoreContainer);
    this.showScore();
  }

  drawBackground() {
    const x = this.app.screen.width / 2;
    const y = this.app.screen.height / 2;

    addMenuOverlay(this.scoreContainer, this.app);
    addPanel({
      container: this.scoreContainer,
      x,
      y,
      width: 820,
      height: 620,
      tint: MenuTheme.color.panel,
    });

    addSectionTitle(this.scoreContainer, "PLACAR GLOBAL", x, y - 250, 50);
    addSectionSubtitle(
      this.scoreContainer,
      "Top jogadores da sessão online.",
      x,
      y - 206,
      20
    );
  }

  createBackButton() {
    const x = this.app.screen.width / 2;
    const y = this.app.screen.height - 80;

    createMenuButton({
      container: this.scoreContainer,
      x,
      y,
      label: "VOLTAR",
      onClick: () => {
        const table = document.getElementById?.("score-table");
        if (table) this.root.removeChild(table);
        this.app.stage.removeChild(this.scoreContainer);
        this.menu.show();
      },
      width: 220,
      height: 54,
    });
  }

  drawLoading() {
    const el = document.createElement("div");
    el.className = "absolute top-5 left-1/2 -translate-x-1/2 pointer-events-auto";
    el.innerText = "Carregando placar...";
    el.style.color = "#e2e8f0";
    el.style.fontSize = "20px";
    el.style.fontWeight = "700";
    el.style.letterSpacing = "1px";
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
    table.className = "pointer-events-auto mx-auto";
    table.style.marginTop = "170px";
    table.style.minWidth = "640px";
    table.style.background = "rgba(15, 23, 42, 0.95)";
    table.style.border = "2px solid #22d3ee";
    table.style.borderRadius = "12px";
    table.style.overflow = "hidden";
    table.style.color = "#e2e8f0";
    table.style.fontSize = "22px";
    table.style.textAlign = "left";
    return table;
  }

  drawTableHead() {
    const head = document.createElement("tr");
    ["Rank", "Nome", "Pontos"].forEach((h) => {
      const th = document.createElement("th");
      th.className = "px-4 py-2";
      th.innerText = h;
      th.style.background = "#0e7490";
      th.style.color = "#ecfeff";
      th.style.fontSize = "19px";
      th.style.textTransform = "uppercase";
      th.style.letterSpacing = "1px";
      head.appendChild(th);
    });
    return head;
  }

  drawTableLine(index, name, points) {
    const row = document.createElement("tr");
    row.className = index % 2 ? "bg-gray-100" : "";
    row.style.background = index % 2 ? "rgba(30, 41, 59, 0.9)" : "rgba(15, 23, 42, 0.92)";

    const rank = document.createElement("td");
    rank.className = "px-4 py-2";
    rank.innerText = index;
    rank.style.fontWeight = "700";
    rank.style.color = "#67e8f9";

    const user = document.createElement("td");
    user.className = "px-4 py-2";
    user.innerText = name;

    const pts = document.createElement("td");
    pts.className = "px-4 py-2";
    pts.innerText = points;
    pts.style.fontWeight = "700";

    row.appendChild(rank);
    row.appendChild(user);
    row.appendChild(pts);
    return row;
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
