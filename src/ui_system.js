// ─────────────────────────────────────────────────────────────
//  UI SYSTEM — Cyberpunk HUD Design Language
//  Palette: void black / neon cyan / magenta / danger red
//  Typography: Orbitron (headings) · JetBrains Mono (data/body)
//  Shapes: chamfered 45° corners · HUD corner brackets
// ─────────────────────────────────────────────────────────────

export const UISkin = {
  palette: {
    void:        0x0A0A0F,
    card:        0x0C0C1A,
    accent:      0x00FFFF,  // cyan — primary
    accentAlt:   0xFF00FF,  // magenta — secondary
    accentGreen: 0x00FF88,  // neon green — ok / health
    textPrimary: 0xCCEEFF,
    textSecondary: 0x4A6888,
    danger:      0xFF3366,
    disabled:    0x1C1C2E,
    ink:         0x000308,
    grid:        0x003355,
  },
};

// ── Internal: draw chamfered octagon path centred at (cx, cy) ──
function chamferedPath(g, cx, cy, w, h, c) {
  const x0 = cx - w / 2, x1 = cx + w / 2;
  const y0 = cy - h / 2, y1 = cy + h / 2;
  g.moveTo(x0 + c, y0);
  g.lineTo(x1 - c, y0);
  g.lineTo(x1,     y0 + c);
  g.lineTo(x1,     y1 - c);
  g.lineTo(x1 - c, y1);
  g.lineTo(x0 + c, y1);
  g.lineTo(x0,     y1 - c);
  g.lineTo(x0,     y0 + c);
  g.closePath();
}

// ── Backdrop: void bg + grid + radial glow + scanlines ─────────
export function createBackdrop(container, app) {
  const W = app.screen.width, H = app.screen.height;

  const bg = new PIXI.Graphics();
  bg.beginFill(UISkin.palette.void);
  bg.drawRect(0, 0, W, H);
  bg.endFill();
  container.addChild(bg);

  // Subtle grid
  const grid = new PIXI.Graphics();
  const step = 64;
  grid.lineStyle(1, UISkin.palette.grid, 0.045);
  for (let x = step; x < W; x += step) { grid.moveTo(x, 0);   grid.lineTo(x, H); }
  for (let y = step; y < H; y += step) { grid.moveTo(0, y);   grid.lineTo(W, y); }
  container.addChild(grid);

  // Centre radial blue glow
  const glow = new PIXI.Graphics();
  glow.beginFill(0x001020, 0.55);
  glow.drawEllipse(W / 2, H / 2, W * 0.44, H * 0.37);
  glow.endFill();
  container.addChild(glow);

  // Scanlines
  const scan = new PIXI.Graphics();
  scan.beginFill(0x000000, 0.13);
  for (let y = 0; y < H; y += 4) scan.drawRect(0, y, W, 2);
  scan.endFill();
  container.addChild(scan);
}

// ── Screen-corner HUD brackets (decorative) ────────────────────
export function addScreenCorners(container, app, alpha = 0.22) {
  const W = app.screen.width, H = app.screen.height;
  const len = 72;
  const g = new PIXI.Graphics();
  g.lineStyle(1.5, UISkin.palette.accent, alpha);
  // TL
  g.moveTo(len, 0); g.lineTo(0, 0); g.lineTo(0, len);
  // TR
  g.moveTo(W - len, 0); g.lineTo(W, 0); g.lineTo(W, len);
  // BL
  g.moveTo(0, H - len); g.lineTo(0, H); g.lineTo(len, H);
  // BR
  g.moveTo(W, H - len); g.lineTo(W, H); g.lineTo(W - len, H);
  container.addChild(g);
}

// ── Card-corner brackets ────────────────────────────────────────
export function addCornerBrackets(container, cx, cy, w, h, size = 20, color = UISkin.palette.accent, alpha = 0.88) {
  const g = new PIXI.Graphics();
  g.lineStyle(2, color, alpha);
  const x0 = cx - w / 2, y0 = cy - h / 2;
  const x1 = cx + w / 2, y1 = cy + h / 2;
  // TL
  g.moveTo(x0 + size, y0); g.lineTo(x0, y0); g.lineTo(x0, y0 + size);
  // TR
  g.moveTo(x1 - size, y0); g.lineTo(x1, y0); g.lineTo(x1, y0 + size);
  // BL
  g.moveTo(x0, y1 - size); g.lineTo(x0, y1); g.lineTo(x0 + size, y1);
  // BR
  g.moveTo(x1, y1 - size); g.lineTo(x1, y1); g.lineTo(x1 - size, y1);
  container.addChild(g);
  return g;
}

// ── Chamfered card panel ────────────────────────────────────────
export function createCard({
  container, x, y, width, height,
  alpha = 0.97, chamfer = 14, brackets = true,
  bracketSize = 20, accentLine = true,
}) {
  const g = new PIXI.Graphics();

  // Fill + border in one draw call
  g.beginFill(UISkin.palette.card, alpha);
  g.lineStyle(1.5, UISkin.palette.accent, 0.8);
  chamferedPath(g, x, y, width, height, chamfer);
  g.endFill();

  container.addChild(g);

  // Top visor accent line
  if (accentLine) {
    const line = new PIXI.Graphics();
    const lw = width - (chamfer + 14) * 2;
    line.lineStyle(2, UISkin.palette.accent, 0.9);
    line.moveTo(x - lw / 2, y - height / 2 + 1);
    line.lineTo(x + lw / 2, y - height / 2 + 1);
    container.addChild(line);
  }

  if (brackets) {
    addCornerBrackets(container, x, y, width, height, bracketSize);
  }

  return g;
}

// ── Text label with optional glow halo ─────────────────────────
export function createLabel({
  container, text, x, y,
  fontSize = 24, color = UISkin.palette.textPrimary,
  bold = false, anchor = 0.5, letterSpacing = 2,
  glow = false, mono = false,
}) {
  const fontFamily = mono
    ? "'JetBrains Mono', 'Courier New', monospace"
    : "'Orbitron', 'Arial Narrow', sans-serif";

  // Glow halo layer (duplicated text with wide stroke at low alpha)
  let halo = null;
  if (glow) {
    halo = new PIXI.Text(text, {
      fontFamily,
      fill: color,
      fontSize,
      fontWeight: "900",
      letterSpacing,
      stroke: color,
      strokeThickness: Math.max(8, Math.round(fontSize * 0.24)),
    });
    halo.anchor.set(anchor);
    halo.position.set(x, y);
    halo.alpha = 0.16;
    container.addChild(halo);
  }

  const label = new PIXI.Text(text, {
    fontFamily,
    fill: color,
    fontSize,
    fontWeight: bold ? "900" : mono ? "500" : "700",
    letterSpacing,
    stroke: UISkin.palette.ink,
    strokeThickness: fontSize > 40 ? 4 : 2,
  });
  label.anchor.set(anchor);
  label.position.set(x, y);
  container.addChild(label);

  if (halo) {
    label.glowHalo = halo;

    const setPosition = label.position.set.bind(label.position);
    label.position.set = (nextX, nextY) => {
      setPosition(nextX, nextY);
      halo.position.set(nextX, nextY);
    };

    let visible = label.visible;
    Object.defineProperty(label, "visible", {
      get: () => visible,
      set: (value) => {
        visible = value;
        halo.visible = value;
      },
      configurable: true,
    });
  }

  return label;
}

// ── Chamfered button ────────────────────────────────────────────
export function createPillButton({
  container, x, y, text,
  width = 280, height = 56,
  primary = false, onClick,
}) {
  const c = 8;
  const fillColor  = primary ? UISkin.palette.accent     : UISkin.palette.card;
  const borderColor = primary ? UISkin.palette.accent    : UISkin.palette.accentAlt;
  const textColor  = primary ? UISkin.palette.ink        : UISkin.palette.textPrimary;

  const bg = new PIXI.Graphics();
  let disabled = false;

  function draw(hover) {
    bg.clear();
    const ww = hover ? width  * 1.018 : width;
    const hh = hover ? height * 1.018 : height;
    const bc = disabled ? UISkin.palette.disabled : borderColor;
    const fc = disabled ? UISkin.palette.disabled : fillColor;
    const bA = disabled ? 0.25 : hover ? 1 : 0.72;
    const fA = disabled ? 0.35 : primary ? 1 : hover ? 0.9 : 0.78;

    bg.beginFill(fc, fA);
    bg.lineStyle(1.5, bc, bA);
    chamferedPath(bg, x, y, ww, hh, c);
    bg.endFill();
  }

  draw(false);
  bg.interactive = true;
  bg.cursor = "pointer";

  const label = createLabel({
    container, text, x, y,
    fontSize: 18,
    color: textColor,
    bold: true,
    letterSpacing: 3,
  });

  bg.on("pointerdown", onClick);
  bg.on("pointerover", () => { if (!disabled) draw(true); });
  bg.on("pointerout",  () => draw(false));

  // Bring label in front of button background
  container.addChild(bg);
  container.removeChild(label);
  container.addChild(label);

  return {
    bg,
    label,
    setEnabled(enabled) {
      disabled = !enabled;
      bg.interactive = enabled;
      bg.cursor = enabled ? "pointer" : "default";
      draw(false);
      label.alpha = enabled ? 1 : 0.38;
    },
  };
}
