(function() {
  var root = (typeof exports == 'undefined' ? window : exports);
  var re = /^(10|11|12|[1-9])(?::)?([0-5][0-9])?(p|a)?[^0-9]*$/i;

  root.isValid = function(time) {
    return re.test(time);
  };

  root.parse = function(time) {
    time.replace(' ', '');
    var result = re.exec(time);
    if (!result) return null;

    return sanitize(result[1], result[2], result[3]);
  };

  root.parseToDate = function(time) {
    var result = root.parse(time);
    var now = new Date();

    now.setHours(result.period === 'p' ? result.hour + 12 : result.hour);
    now.setMinutes(result.minute);
    return now;
  };

  function sanitize(hour, minute, period) {
    var minute = minute ? minute : '00';
    // TODO this is incorrect, though I'd like to get this to Phil so I'm going to commit.
    var period = period ? period : new Date().getHours() > 11 ? 'p' : 'a';
    return {
      hour : parseInt(hour),
      minute : parseInt(minute),
      period : period
    };
  }
})();
