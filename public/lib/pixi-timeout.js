// Based on https://github.com/brenwell/pixi-timeout

function timeout(pixi) {
  function setTimeout(secs, cb) {
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

function interval(app) {
  app.setInterval = (cb, time) => {
    const timer = app.setTimeout(time, () => {
      cb();
      timer.clear();
      app.setInterval(cb, time);
    });
  };
}

export { interval, timeout };
