// Based on https://github.com/brenwell/pixi-timeout

function timeout(pixi) {
  function setTimeout(cb, secs) {
    var progress = 0;

    var ticker = function ticker(delta) {
      progress += delta;
      var elapsed = progress / (60 * pixi.ticker.speed);
      if (elapsed > secs) end(true);
    };

    var end = function end(fire) {
      pixi.ticker.remove(ticker);
      if (fire) cb();
    };

    var clear = function clear() {
      end(false);
    };

    var finish = function finish() {
      end(true);
    };

    pixi.ticker.add(ticker);
    return {
      clear: clear,
      finish: finish,
    };
  }

  function clearTimeout(timerObj) {
    timerObj.clear();
  }

  pixi.setTimeout = setTimeout;
  pixi.clearTimeout = clearTimeout;
}

function interval(pixi) {
  function setInterval(cb, secs) {
    let stop = false;
    let progress = 0;

    var ticker = function ticker(delta) {
      progress += delta;
      var elapsed = (progress / (60 * pixi.ticker.speed)).toFixed(2);
      if ((elapsed * 100) % (secs * 100) === 0) end(true);
    };

    var end = function end(fire) {
      if (stop) {
        pixi.ticker.remove(ticker);
      } else {
        if (fire) cb();
      }
    };

    var clear = function clear() {
      end(false);
      stop = true;
    };

    var finish = function finish() {
      end(true);
    };

    pixi.ticker.add(ticker);
    return {
      clear: clear,
      finish: finish,
    };
  }

  function clearInterval(timerObj) {
    timerObj.clear();
  }

  pixi.setInterval = setInterval;
  pixi.clearInterval = clearInterval;
}

export { interval, timeout };
