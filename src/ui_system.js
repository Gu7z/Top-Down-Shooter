export const UISkin = {
  palette: {
    background: 0x030712,
    haze: 0x0b1220,
    panel: 0x121a2b,
    panelSoft: 0x192235,
    highlight: 0x60a5fa,
    highlightStrong: 0x22d3ee,
    textPrimary: 0xf8fafc,
    textSecondary: 0x94a3b8,
    warning: 0xfb7185,
    ok: 0x4ade80,
    disabled: 0x334155,
    ink: 0x020617,
  },
};

export function createBackdrop(container, app) {
  const base = new PIXI.Sprite(PIXI.Texture.WHITE);
  base.tint = UISkin.palette.background;
  base.width = app.screen.width;
  base.height = app.screen.height;
  container.addChild(base);

  const hazeBands = [0.1, 0.18, 0.22];
  hazeBands.forEach((alpha, index) => {
    const band = new PIXI.Sprite(PIXI.Texture.WHITE);
    band.tint = UISkin.palette.haze;
    band.alpha = alpha;
    band.width = app.screen.width + 100;
    band.height = 120;
    band.anchor.set(0.5);
    band.position.set(app.screen.width / 2, 130 + index * 180);
    band.rotation = -0.06 + index * 0.03;
    container.addChild(band);
  });
}

export function createCard({ container, x, y, width, height, alpha = 0.96 }) {
  const card = new PIXI.Sprite(PIXI.Texture.WHITE);
  card.tint = UISkin.palette.panel;
  card.alpha = alpha;
  card.anchor.set(0.5);
  card.position.set(x, y);
  card.width = width;
  card.height = height;
  container.addChild(card);

  const accent = new PIXI.Sprite(PIXI.Texture.WHITE);
  accent.tint = UISkin.palette.highlight;
  accent.anchor.set(0.5);
  accent.position.set(x, y - height / 2 + 12);
  accent.width = width - 20;
  accent.height = 3;
  container.addChild(accent);

  return card;
}

export function createLabel({
  container,
  text,
  x,
  y,
  fontSize = 24,
  color = UISkin.palette.textPrimary,
  bold = false,
  anchor = 0.5,
  letterSpacing = 1,
}) {
  const label = new PIXI.Text(text, {
    fill: color,
    fontSize,
    fontWeight: bold ? "700" : "500",
    letterSpacing,
    stroke: UISkin.palette.ink,
    strokeThickness: fontSize > 30 ? 4 : 2,
  });
  label.anchor.set(anchor);
  label.position.set(x, y);
  container.addChild(label);
  return label;
}

export function createPillButton({
  container,
  x,
  y,
  text,
  width = 280,
  height = 56,
  primary = false,
  onClick,
}) {
  const bg = new PIXI.Sprite(PIXI.Texture.WHITE);
  bg.anchor.set(0.5);
  bg.position.set(x, y);
  bg.width = width;
  bg.height = height;
  bg.interactive = true;
  bg.cursor = "pointer";
  bg.tint = primary ? UISkin.palette.highlightStrong : UISkin.palette.panelSoft;

  const border = new PIXI.Sprite(PIXI.Texture.WHITE);
  border.anchor.set(0.5);
  border.position.set(x, y);
  border.width = width + 2;
  border.height = 2;
  border.tint = UISkin.palette.highlight;

  const label = createLabel({
    container,
    text,
    x,
    y,
    fontSize: 25,
    color: primary ? UISkin.palette.ink : UISkin.palette.textPrimary,
    bold: true,
  });

  const setHoverState = (isHover) => {
    bg.scale.x = isHover ? 1.03 : 1;
    bg.scale.y = isHover ? 1.03 : 1;
    border.alpha = isHover ? 1 : 0.8;
  };

  bg.on("click", onClick);
  bg.on("pointerover", () => setHoverState(true));
  bg.on("pointerout", () => setHoverState(false));

  container.addChild(bg);
  container.addChild(border);
  container.removeChild(label);
  container.addChild(label);

  return {
    bg,
    label,
    border,
    setEnabled(enabled) {
      bg.interactive = enabled;
      bg.cursor = enabled ? "pointer" : "default";
      bg.tint = enabled
        ? primary
          ? UISkin.palette.highlightStrong
          : UISkin.palette.panelSoft
        : UISkin.palette.disabled;
      label.alpha = enabled ? 1 : 0.6;
      border.alpha = enabled ? 0.8 : 0.35;
    },
  };
}
