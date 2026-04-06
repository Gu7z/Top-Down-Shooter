export const MenuTheme = {
  color: {
    overlay: 0x020617,
    panel: 0x0f172a,
    panelMuted: 0x111827,
    border: 0x38bdf8,
    borderSoft: 0x1d4ed8,
    title: 0xe2e8f0,
    subtitle: 0x94a3b8,
    accent: 0x22d3ee,
    accentStrong: 0x06b6d4,
    disabled: 0x334155,
    textOnAccent: 0x020617,
    text: 0xe2e8f0,
    textDim: 0xcbd5e1,
    danger: 0xfb7185,
  },
};

export function addMenuOverlay(container, app) {
  const overlay = new PIXI.Sprite(PIXI.Texture.WHITE);
  overlay.tint = MenuTheme.color.overlay;
  overlay.alpha = 0.75;
  overlay.width = app.screen.width;
  overlay.height = app.screen.height;
  overlay.position.set(0, 0);
  container.addChild(overlay);
}

export function addPanel({
  container,
  x,
  y,
  width,
  height,
  tint = MenuTheme.color.panel,
  alpha = 0.95,
}) {
  const panel = new PIXI.Sprite(PIXI.Texture.WHITE);
  panel.tint = tint;
  panel.alpha = alpha;
  panel.width = width;
  panel.height = height;
  panel.anchor.set(0.5);
  panel.position.set(x, y);
  container.addChild(panel);

  const border = new PIXI.Sprite(PIXI.Texture.WHITE);
  border.tint = MenuTheme.color.border;
  border.alpha = 0.8;
  border.width = width + 4;
  border.height = 3;
  border.anchor.set(0.5);
  border.position.set(x, y - height / 2 + 14);
  container.addChild(border);

  return panel;
}

export function addSectionTitle(container, text, x, y, fontSize = 56) {
  const title = new PIXI.Text(text, {
    fill: MenuTheme.color.title,
    fontSize,
    fontWeight: "bold",
    letterSpacing: 2,
    stroke: 0x020617,
    strokeThickness: 6,
  });
  title.anchor.set(0.5);
  title.position.set(x, y);
  container.addChild(title);
  return title;
}

export function addSectionSubtitle(container, text, x, y, fontSize = 21) {
  const subtitle = new PIXI.Text(text, {
    fill: MenuTheme.color.subtitle,
    fontSize,
    fontWeight: "500",
  });
  subtitle.anchor.set(0.5);
  subtitle.position.set(x, y);
  container.addChild(subtitle);
  return subtitle;
}

export function createMenuButton({
  container,
  x,
  y,
  label,
  onClick,
  width = 260,
  height = 56,
  isPrimary = false,
}) {
  const bg = new PIXI.Sprite(PIXI.Texture.WHITE);
  bg.tint = isPrimary ? MenuTheme.color.accentStrong : MenuTheme.color.panelMuted;
  bg.alpha = isPrimary ? 1 : 0.9;
  bg.anchor.set(0.5);
  bg.position.set(x, y);
  bg.width = width;
  bg.height = height;
  bg.interactive = true;
  bg.cursor = "pointer";

  const border = new PIXI.Sprite(PIXI.Texture.WHITE);
  border.tint = MenuTheme.color.border;
  border.alpha = 0.95;
  border.anchor.set(0.5);
  border.position.set(x, y);
  border.width = width + 4;
  border.height = 2;

  const text = new PIXI.Text(label, {
    fill: isPrimary ? MenuTheme.color.textOnAccent : MenuTheme.color.text,
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: 1,
  });
  text.anchor.set(0.5);
  text.position.set(x, y);

  const setHover = (hovered) => {
    bg.scale.x = hovered ? 1.03 : 1;
    bg.scale.y = hovered ? 1.03 : 1;
    text.alpha = hovered ? 1 : 0.95;
    border.alpha = hovered ? 1 : 0.85;
  };

  bg.on("click", onClick);
  bg.on("pointerover", () => setHover(true));
  bg.on("pointerout", () => setHover(false));

  container.addChild(bg);
  container.addChild(border);
  container.addChild(text);

  return {
    bg,
    border,
    text,
    setEnabled(enabled) {
      bg.interactive = enabled;
      bg.cursor = enabled ? "pointer" : "default";
      bg.tint = enabled
        ? isPrimary
          ? MenuTheme.color.accentStrong
          : MenuTheme.color.panelMuted
        : MenuTheme.color.disabled;
      text.alpha = enabled ? 1 : 0.65;
      border.alpha = enabled ? 0.95 : 0.4;
    },
  };
}
