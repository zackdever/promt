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

  function sanitize(hour, minute, period) {
    var minute = minute ? minute : '00';
    var period = period ? period : new Date().getHours() > 11 ? 'p' : 'a';
    return {
      hour : parseInt(hour),
      minute : parseInt(minute),
      period : period
    };
  }
})();
