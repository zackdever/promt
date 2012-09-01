(function() {
  var root = (typeof exports == 'undefined' ? window : exports);
  var re = /^(10|11|12|[1-9])(?::|\.)?([0-5][0-9])?$/;

  root.isValid = function(time) {
    return re.test(time);
  };

  root.parse = function(time) {
    time.replace(' ', '');
    var result = re.exec(time);
    if (!result) return null;

    var minute = result[2] ? parseInt(result[2]) : 0;
    return { hour: parseInt(result[1]), minute: minute};
  };

  root.parseToDate = function(time) {
    var result = root.parse(time);
    return toDate(result.hour, result.minute);
  }

  function toDate(hour, minute) {
    if (hour === 12) hour = 0; // this lets us uniformly handle am/pm adjustments

    var d = new Date();
    d.setMinutes(minute);
    d.setHours(hour);

    // if it has already passed, add 12 hours at a time until it's in the future
    while (new Date() > d) d.setHours(d.getHours() + 12);

    return d;
  }
})();
