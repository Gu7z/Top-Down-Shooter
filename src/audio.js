export const audio = {
  volume: 0.7,
  muted: false,

  load() {
    const savedVolume = localStorage.getItem("volume");
    const savedMuted = localStorage.getItem("muted");

    this.volume = savedVolume !== null ? parseFloat(savedVolume) : 0.7;
    this.muted = savedMuted === "true";
    this.apply();
  },

  apply() {
    PIXI.sound.volumeAll = this.muted ? 0 : this.volume * 0.1;
  },

  setVolume(value) {
    this.volume = Math.min(1, Math.max(0, value));
    localStorage.setItem("volume", String(this.volume));
    this.apply();
  },

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem("muted", String(this.muted));
    this.apply();
  },
};
