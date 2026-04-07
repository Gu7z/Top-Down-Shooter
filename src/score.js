import getUrl from "./utils/get_url.js";
import {
  UISkin,
  createBackdrop,
  createLabel,
  createPillButton,
  addScreenCorners,
} from "./ui_system.js";

export default class Score {
  constructor({ app, menu }) {
    this.app   = app;
    this.menu  = menu;
    this.scoreContainer = new PIXI.Container();
    this.root  = document.getElementById?.("ui-root") || document.body;

    this.mountScene();
    this.app.stage.addChild(this.scoreContainer);
    this.loadScore();
  }

  // ── PIXI background layer ──────────────────────────────────────
  mountScene() {
    const x = this.app.screen.width  / 2;
    const H = this.app.screen.height;

    createBackdrop(this.scoreContainer, this.app);
    addScreenCorners(this.scoreContainer, this.app);

    // Title
    createLabel({
      container:    this.scoreContainer,
      text:         "RANKING  NEURAL",
      x,
      y:            58,
      fontSize:     50,
      color:        UISkin.palette.accent,
      bold:         true,
      letterSpacing: 6,
      glow:         true,
    });

    createLabel({
      container:    this.scoreContainer,
      text:         "▸  OPERADORES MAIS LETAIS DA REDE  ◂",
      x,
      y:            106,
      fontSize:     13,
      color:        UISkin.palette.textSecondary,
      mono:         true,
      letterSpacing: 3,
    });

    // Divider
    const div = new PIXI.Graphics();
    div.lineStyle(1, UISkin.palette.accent, 0.28);
    div.moveTo(x - 340, 126);
    div.lineTo(x + 340, 126);
    this.scoreContainer.addChild(div);

    // Back button
    createPillButton({
      container: this.scoreContainer,
      x,
      y: H - 50,
      text:   "↩   VOLTAR AO MENU",
      width:  300,
      height: 54,
      onClick: () => {
        const table = document.getElementById("score-table");
        if (table) this.root.removeChild(table);
        this.app.stage.removeChild(this.scoreContainer);
        this.menu.show();
      },
    });
  }

  // ── Load & render leaderboard ──────────────────────────────────
  async loadScore() {
    const loader = this.makeLoader();
    this.root.appendChild(loader);

    try {
      const res  = await fetch(getUrl());
      const data = await res.json();
      this.root.removeChild(loader);
      this.root.appendChild(this.buildTable(data));
    } catch (_) {
      loader.textContent  = "ERRO  //  SERVIDOR INDISPONÍVEL";
      loader.style.color  = "#FF3366";
    }
  }

  makeLoader() {
    const el = document.createElement("div");
    el.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #00FFFF;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 16px;
      letter-spacing: 4px;
      pointer-events: none;
      animation: hud-blink 1s step-end infinite;
    `;
    el.textContent = "▶  CARREGANDO DADOS...";
    return el;
  }

  buildTable(data) {
    const wrap = document.createElement("div");
    wrap.id = "score-table";
    wrap.style.cssText = `
      position: absolute;
      top: 144px;
      left: 50%;
      transform: translateX(-50%);
      width: 860px;
      pointer-events: auto;
    `;

    const table = document.createElement("table");
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 15px;
      color: #CCEEFF;
      border: 1px solid rgba(0,255,255,0.18);
    `;

    // Header
    const thead = document.createElement("thead");
    const hr    = document.createElement("tr");
    [
      { label: "POS",       align: "center" },
      { label: "OPERADOR",  align: "left"   },
      { label: "PONTUAÇÃO", align: "right"  },
    ].forEach(({ label, align }) => {
      const th = document.createElement("th");
      th.textContent   = label;
      th.style.cssText = `
        padding: 13px 22px;
        text-align: ${align};
        color: #00FFFF;
        font-size: 12px;
        letter-spacing: 4px;
        font-weight: 700;
        border-bottom: 1px solid rgba(0,255,255,0.3);
        background: rgba(0,10,18,0.72);
        text-transform: uppercase;
      `;
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement("tbody");
    const medals = ["#FFD700", "#C0C0C0", "#CD7F32"];

    data.forEach(({ name, points }, i) => {
      const rank    = i + 1;
      const top3    = rank <= 3;
      const rankCol = top3 ? medals[i] : "#4A6888";
      const rowBg   = i % 2 === 0
        ? "rgba(12,12,26,0.72)"
        : "rgba(8,8,16,0.72)";

      const row = document.createElement("tr");
      row.style.background  = rowBg;
      row.style.borderBottom = "1px solid rgba(0,255,255,0.06)";
      row.style.transition   = "background 0.15s";
      row.onmouseenter = () => { row.style.background = "rgba(0,255,255,0.05)"; };
      row.onmouseleave = () => { row.style.background = rowBg; };

      const cells = [
        {
          text: `#${rank}`,
          style: `
            text-align: center;
            font-weight: 700;
            color: ${rankCol};
            font-size: 14px;
            ${top3 ? `text-shadow: 0 0 10px ${rankCol}55;` : ""}
          `,
        },
        {
          text: name,
          style: `
            text-align: left;
            color: ${top3 ? "#CCE8FF" : "#7A99AA"};
            font-weight: ${top3 ? "700" : "400"};
            letter-spacing: 1px;
          `,
        },
        {
          text: typeof points === "number" ? points.toLocaleString("pt-BR") : points,
          style: `
            text-align: right;
            font-weight: 700;
            color: ${top3 ? "#00FF88" : "#2A7050"};
            font-size: 15px;
            letter-spacing: 2px;
          `,
        },
      ];

      cells.forEach(({ text, style }) => {
        const td = document.createElement("td");
        td.textContent   = text;
        td.style.cssText = `padding: 12px 22px; ${style}`;
        row.appendChild(td);
      });

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }
}
