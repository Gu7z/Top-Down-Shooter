function generateRandom(min, max) {
  var num = Math.random() * (max - min) + min;
  return Math.floor(num);
}

export default generateRandom;
