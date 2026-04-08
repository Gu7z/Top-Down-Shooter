import CURRENT_PATCH_NOTES from './current_patch_notes.js';
import { markPatchNotesSeen } from './patch_notes_state.js';
import {
  UISkin,
  createCard,
  createLabel,
  createPillButton,
} from '../ui_system.js';

export default class PatchNotesModal {
  constructor({ app, notes = CURRENT_PATCH_NOTES, onConfirm = null }) {
    this.app = app;
    this.notes = notes;
    this.onConfirm = onConfirm;
    this.container = new PIXI.Container();
    this.contentContainer = new PIXI.Container();
    this.listMask = null;
    this._wheelHandler = null;
    this.confirmButton = null;
    this.scrollbarTrack = null;
    this.scrollbarThumb = null;
    this.layout = null;
    this.cardBackground = null;

    this._build();
  }

  _createBullet(item, contentWidth, fontSize, lineHeight) {
    return new PIXI.Text(`• ${item}`, {
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      fill: UISkin.palette.textPrimary,
      fontSize,
      wordWrap: true,
      wordWrapWidth: contentWidth,
      lineHeight,
    });
  }

  _getBaseMetrics() {
    const W = this.app.screen.width;
    const H = this.app.screen.height;
    const safeMarginX = Math.max(16, Math.round(W * 0.03));
    const safeMarginY = Math.max(16, Math.round(H * 0.04));
    const maxWidth = Math.max(280, W - (safeMarginX * 2));
    const preferredWidth = Math.min(920, Math.round(W * 0.72));
    const cardWidth = Math.min(maxWidth, Math.max(360, preferredWidth));
    const compact = cardWidth < 520;
    const sidePadding = compact ? 22 : 34;
    const titleFontSize = compact ? 22 : 26;
    const bodyFontSize = compact ? 14 : 15;
    const lineHeight = compact ? 22 : 24;
    const headerHeight = this.notes.date ? (compact ? 78 : 86) : (compact ? 52 : 58);
    const topPadding = compact ? 22 : 28;
    const buttonHeight = 54;
    const buttonWidth = Math.min(220, Math.max(140, cardWidth - (sidePadding * 2)));
    const itemGap = compact ? 10 : 12;
    const contentBottomPadding = compact ? 14 : 16;
    const scrollbarGutter = 16;
    const actionTopGap = compact ? 20 : 24;
    const actionBottomPadding = compact ? 20 : 26;
    const minCardHeight = compact ? 260 : 300;
    const maxCardHeight = H - (safeMarginY * 2);
    const contentWidth = Math.max(220, cardWidth - (sidePadding * 2) - scrollbarGutter);

    return {
      W,
      H,
      safeMarginX,
      safeMarginY,
      cardWidth,
      sidePadding,
      titleFontSize,
      bodyFontSize,
      lineHeight,
      headerHeight,
      topPadding,
      buttonHeight,
      buttonWidth,
      itemGap,
      contentBottomPadding,
      scrollbarGutter,
      actionTopGap,
      actionBottomPadding,
      minCardHeight,
      maxCardHeight,
      contentWidth,
    };
  }

  _resolveLayout(baseMetrics, measuredContentHeight) {
    const {
      W,
      H,
      safeMarginX,
      safeMarginY,
      cardWidth,
      topPadding,
      headerHeight,
      buttonHeight,
      buttonWidth,
      actionTopGap,
      actionBottomPadding,
      minCardHeight,
      maxCardHeight,
      contentWidth,
      contentBottomPadding,
      titleFontSize,
    } = baseMetrics;
    const cx = W / 2;
    const cy = H / 2;
    const totalScrollableHeight = measuredContentHeight + contentBottomPadding;
    const maxVisibleHeight = Math.max(
      120,
      maxCardHeight - topPadding - headerHeight - actionTopGap - buttonHeight - actionBottomPadding,
    );
    const visibleHeight = Math.min(totalScrollableHeight, maxVisibleHeight);
    const cardHeight = Math.max(
      minCardHeight,
      Math.min(
        maxCardHeight,
        topPadding + headerHeight + visibleHeight + actionTopGap + buttonHeight + actionBottomPadding,
      ),
    );
    const cardTop = cy - (cardHeight / 2);
    const titleY = cardTop + topPadding + (titleFontSize / 2);
    const dateY = titleY + Math.round(titleFontSize * 0.92);
    const contentTop = cardTop + topPadding + headerHeight;
    const contentX = cx - (contentWidth / 2);
    const buttonY = cardTop + cardHeight - actionBottomPadding - (buttonHeight / 2);

    return {
      ...baseMetrics,
      cx,
      cy,
      cardTop,
      cardHeight,
      titleY,
      dateY,
      contentTop,
      contentX,
      visibleHeight,
      totalScrollableHeight,
      bottomPadding: contentBottomPadding,
      buttonY,
      buttonWidth,
      safeMarginX,
      safeMarginY,
    };
  }

  _build() {
    const baseMetrics = this._getBaseMetrics();
    const { W, H } = baseMetrics;
    const cx = W / 2;
    const cy = H / 2;
    const bulletViews = this.notes.items.map((item) =>
      this._createBullet(item, baseMetrics.contentWidth, baseMetrics.bodyFontSize, baseMetrics.lineHeight)
    );
    const measuredContentHeight = bulletViews.reduce((sum, bullet, index) => (
      sum + bullet.height + (index === bulletViews.length - 1 ? 0 : baseMetrics.itemGap)
    ), 0);
    this.layout = this._resolveLayout(baseMetrics, measuredContentHeight);

    const backdrop = new PIXI.Sprite(PIXI.Texture.WHITE);
    backdrop.tint = 0x000000;
    backdrop.alpha = 0.7;
    backdrop.width = W;
    backdrop.height = H;
    backdrop.interactive = true;
    backdrop.cursor = 'default';
    this.container.addChild(backdrop);

    this.cardBackground = createCard({
      container: this.container,
      x: cx,
      y: cy,
      width: this.layout.cardWidth,
      height: this.layout.cardHeight,
      chamfer: 16,
      bracketSize: 22,
    });

    createLabel({
      container: this.container,
      text: this.notes.title,
      x: cx,
      y: this.layout.titleY,
      fontSize: this.layout.titleFontSize,
      color: UISkin.palette.accent,
      bold: true,
      glow: true,
      letterSpacing: 6,
    });

    if (this.notes.date) {
      createLabel({
        container: this.container,
        text: this.notes.date,
        x: cx,
        y: this.layout.dateY,
        fontSize: 12,
        color: UISkin.palette.textSecondary,
        mono: true,
        letterSpacing: 2,
      });
    }

    this.contentContainer.position.set(this.layout.contentX, this.layout.contentTop);
    this.contentContainer.x = this.layout.contentX;
    this.contentContainer.y = this.layout.contentTop;
    this.container.addChild(this.contentContainer);

    let offsetY = 0;
    bulletViews.forEach((bullet, index) => {
      bullet.position.set(0, offsetY);
      this.contentContainer.addChild(bullet);
      offsetY += bullet.height + (index === bulletViews.length - 1 ? 0 : this.layout.itemGap);
    });

    this.listMask = new PIXI.Graphics();
    this.listMask.beginFill(0xffffff, 1);
    this.listMask.drawRect(
      this.layout.contentX,
      this.layout.contentTop,
      this.layout.contentWidth,
      this.layout.visibleHeight,
    );
    this.listMask.endFill();
    this.container.addChild(this.listMask);
    this.contentContainer.mask = this.listMask;

    this.confirmButton = createPillButton({
      container: this.container,
      x: cx,
      y: this.layout.buttonY,
      text: 'OK',
      primary: true,
      width: this.layout.buttonWidth,
      height: this.layout.buttonHeight,
      onClick: () => this.confirm(),
    });

    this._bindScroll();
  }

  _bindScroll() {
    const { totalScrollableHeight: totalHeight, visibleHeight } = this.layout;
    if (totalHeight <= visibleHeight) return;

    const baseY = this.layout.contentTop;
    const scrollbarX = this.layout.contentX + this.layout.contentWidth + 10;
    const trackWidth = 2;
    const thumbWidth = 4;
    const thumbHeight = Math.max(20, Math.round(visibleHeight * (visibleHeight / totalHeight)));
    const thumbTravel = visibleHeight - thumbHeight;

    this.scrollbarTrack = new PIXI.Graphics();
    this.scrollbarTrack.beginFill(UISkin.palette.textSecondary, 0.2);
    this.scrollbarTrack.drawRect(0, 0, trackWidth, visibleHeight);
    this.scrollbarTrack.endFill();
    this.scrollbarTrack.position.set(scrollbarX, baseY);
    this.scrollbarTrack.x = scrollbarX;
    this.scrollbarTrack.y = baseY;
    this.container.addChild(this.scrollbarTrack);

    this.scrollbarThumb = new PIXI.Graphics();
    this.scrollbarThumb.beginFill(UISkin.palette.accent, 0.7);
    this.scrollbarThumb.drawRect(0, 0, thumbWidth, thumbHeight);
    this.scrollbarThumb.endFill();
    this.scrollbarThumb.position.set(scrollbarX - 1, baseY);
    this.scrollbarThumb.x = scrollbarX - 1;
    this.scrollbarThumb.y = baseY;
    this.container.addChild(this.scrollbarThumb);

    const updateThumb = () => {
      const scrolled = baseY - this.contentContainer.y;
      const ratio = scrolled / (totalHeight - visibleHeight);
      this.scrollbarThumb.y = baseY + Math.round(ratio * thumbTravel);
      this.scrollbarThumb.position.y = this.scrollbarThumb.y;
    };

    this._wheelHandler = (event) => {
      const minY = baseY - (totalHeight - visibleHeight);
      const maxY = baseY;
      this.contentContainer.y = Math.max(minY, Math.min(maxY, this.contentContainer.y - event.deltaY * 0.35));
      this.contentContainer.position.y = this.contentContainer.y;
      updateThumb();
    };
    this.app.view.addEventListener('wheel', this._wheelHandler);
  }

  show(parent) {
    parent.addChild(this.container);
  }

  confirm() {
    markPatchNotesSeen();
    this.onConfirm?.();
    this.destroy();
  }

  destroy() {
    if (this._wheelHandler) {
      this.app.view.removeEventListener('wheel', this._wheelHandler);
      this._wheelHandler = null;
    }
    this.scrollbarTrack = null;
    this.scrollbarThumb = null;
    this.container.parent?.removeChild?.(this.container);
    this.container.destroy({ children: true });
  }
}
