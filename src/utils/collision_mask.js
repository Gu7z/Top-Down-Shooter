export default class CollisionMask {
  constructor(imageSource, width, height) {
    this.width = width;
    this.height = height;
    this.mask = new Uint8Array(width * height);
    
    if (!imageSource) return;

    // Cross-origin image drawing might taint the canvas if running on external hosts, 
    // but locally it generally works fine since they share same origin.
    try {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(imageSource, 0, 0, width, height);
      
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      
      for (let i = 0; i < width * height; i++) {
        // threshold alpha of 10 out of 255
        this.mask[i] = data[i * 4 + 3] > 10 ? 1 : 0;
      }
    } catch(e) {
      console.warn("Failed to generate pixel mask.", e);
    }
  }

  isSolid(x, y) {
    const rx = Math.floor(x);
    const ry = Math.floor(y);
    if (rx < 0 || rx >= this.width || ry < 0 || ry >= this.height) return false;
    return this.mask[ry * this.width + rx] === 1;
  }
}
