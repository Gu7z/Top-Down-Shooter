import getUrl from "./utils/get_url.js";
import {
  UISkin,
  createBackdrop,
  createCard,
  createLabel,
  createPillButton,
} from "./ui_system.js";

export default class Score {
  constructor({ app, menu }) {
    this.app = app;
    this.menu = menu;
    this.scoreContainer = new PIXI.Container();
    this.root = document.getElementById?.("ui-root") || document.body;

    this.mountScene();
    this.app.stage.addChild(this.scoreContainer);
    this.showScore();
  }

  mountScene() {
    const x = this.app.screen.width / 2;
    const y = this.app.screen.height / 2;

    createBackdrop(this.scoreContainer, this.app);
    createCard({ container: this.scoreContainer, x, y, width: 980, height: 620 });

    createLabel({
      container: this.scoreContainer,
      text: "RANKING DE CAÇADORES",
      x,
      y: y - 248,
      fontSize: 48,
      color: UISkin.palette.highlight,
      bold: true,
      letterSpacing: 3,
    });

    createLabel({
      container: this.scoreContainer,
      text: "Quem sobrevive mais tempo domina o topo.",
      x,
      y: y - 206,
      fontSize: 22,
      color: UISkin.palette.textSecondary,
    });

    createPillButton({
      container: this.scoreContainer,
      x,
      y: this.app.screen.height - 78,
      text: "VOLTAR AO MENU",
      width: 280,
      onClick: () => {
        const table = document.getElementById?.("score-table");
        if (table) this.root.removeChild(table);
        this.app.stage.removeChild(this.scoreContainer);
        this.menu.show();
      },
    });
  }

  drawLoading() {
    const el = document.createElement("div");
    el.className = "absolute top-5 left-1/2 -translate-x-1/2 pointer-events-auto";
    el.innerText = "Carregando placar...";
    el.style.color = "#e2e8f0";
    el.style.fontSize = "20px";
    el.style.fontWeight = "700";
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
    table.style.marginTop = "160px";
    table.style.minWidth = "760px";
    table.style.background = "rgba(15, 23, 42, 0.96)";
    table.style.color = "#f8fafc";
    table.style.border = "2px solid #60a5fa";
    table.style.borderRadius = "12px";
    table.style.overflow = "hidden";
    table.style.textAlign = "left";
    table.style.fontSize = "22px";
    return table;
  }

  drawTableHead() {
    const row = document.createElement("tr");
    ["Posição", "Operador", "Pontos"].forEach((text) => {
      const th = document.createElement("th");
      th.className = "px-4 py-2";
      th.innerText = text;
      th.style.background = "#1d4ed8";
      th.style.color = "#eff6ff";
      th.style.textTransform = "uppercase";
      th.style.fontSize = "18px";
      th.style.letterSpacing = "1px";
      row.appendChild(th);
    });
    return row;
  }

  drawTableLine(index, name, points) {
    const row = document.createElement("tr");
    row.style.background = index % 2 ? "rgba(30, 41, 59, 0.95)" : "rgba(15, 23, 42, 0.95)";

    const rank = document.createElement("td");
    rank.className = "px-4 py-2";
    rank.innerText = index;
    rank.style.fontWeight = "700";
    rank.style.color = index < 4 ? "#22d3ee" : "#e2e8f0";

    const operator = document.createElement("td");
    operator.className = "px-4 py-2";
    operator.innerText = name;

    const score = document.createElement("td");
    score.className = "px-4 py-2";
    score.innerText = points;
    score.style.fontWeight = "700";

    row.appendChild(rank);
    row.appendChild(operator);
    row.appendChild(score);
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
