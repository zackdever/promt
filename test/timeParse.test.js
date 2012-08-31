parser = require('../js/timeParser');

var hours=[], minutes=[], periods=[];

for (var i=1; i<13; i++) hours.push(i.toString());
for (var i=0; i<60; i++) minutes.push(('0' + i).slice(-2));

describe('timeParser', function() {
  describe('#isValid', function() {

    it('should pass all the hours 1-12', function() {
      var hour, result;
      for (var i=0; i<hours.length; i++) {
        hour = hours[i];
        parser.isValid(hour).should.be.ok;
        result = parser.parse(hours[i]);
        result.hour.should.equal(parseInt(hour));
        result.minute.should.equal(0);
      }
    });

    it('should fail made up hours e.g. 0, 13, 50', function() {
      parser.isValid('0').should.not.be.ok;
      parser.isValid('13').should.not.be.ok;
      parser.isValid('50').should.not.be.ok;
    });

    it('should fail made up hours e.g. 0:20, 13:12, 50:00', function() {
      parser.isValid('0:20').should.not.be.ok;
      parser.isValid('13:12').should.not.be.ok;
      parser.isValid('50:00').should.not.be.ok;
    });

    it('should pass all the hours with all the minutes 1:00 - 12:59', function() {
      var hour, minute, result, input;
      for (var i=0; i<hours.length; i++) {
        for (var j=0; j<minutes.length; j++) {
          hour = hours[i];
          minute = minutes[j];
          input = hour + ':' + minute;
          parser.isValid(input).should.be.ok;
          result = parser.parse(input);
          result.hour.should.equal(parseInt(hour));
          result.minute.should.equal(parseInt(minute));
        }
      }
    });

    it('should pass all the times without the colon 100 - 1259', function() {
      var hour, minute, result, input;
      for (var i=0; i<hours.length; i++) {
        for (var j=0; j<minutes.length; j++) {
          hour = hours[i];
          minute = minutes[j];
          input = hour +  minute;
          parser.isValid(input).should.be.ok;
          result = parser.parse(input);
          result.hour.should.equal(parseInt(hour));
          result.minute.should.equal(parseInt(minute));
        }
      }
    });

    it('should fail made up minutes e.g. 1:3, 1:60, 1:122', function() {
      parser.isValid('1:3').should.not.be.ok;
      parser.isValid('1:60').should.not.be.ok;
      parser.isValid('1:122').should.not.be.ok;
      parser.isValid('12:99').should.not.be.ok;
      parser.isValid('12:021').should.not.be.ok;
      parser.isValid('12:218').should.not.be.ok;
    });

    it('should fail made up minutes without the colon e.g. 13, 160', function() {
      parser.isValid('13').should.not.be.ok;
      parser.isValid('160').should.not.be.ok;
      parser.isValid('1299').should.not.be.ok;
      parser.isValid('12021').should.not.be.ok;
      parser.isValid('12218').should.not.be.ok;
    });
  });
});
