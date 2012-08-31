(function() {

  var here;
  var directionService = new google.maps.DirectionsService();
  var geocoder = new google.maps.Geocoder();

  $(function() {
    setCurrentLocation();
    $('button').click(calculateTimes);
  });

  function calculateTimes() {
    var there = document.getElementById('there').value;
    var when = document.getElementById('when').value;

    getDurationTo(there, function(seconds) {
      var duration;
      var result = "From where you're sat, you'll ";

      if (when) {
        var arrival = parseToDate(when);
        var departure = moment(arrival).subtract('seconds', seconds).format('h:mm a');
        result += 'need to leave around ' + departure;
      } else {
        var arrival = moment().add('seconds', seconds).format('h:mm a');
        duration = moment.duration(seconds, 'seconds').humanize();
        $('#duration').text('(about '+duration+')');
        result += 'get there around ' + arrival;
      }

      $('#time').text(result);
      $('#result').fadeIn();
    });
  }

  function getDurationTo(there, callback) {
    var request = buildRequest(there);
    directionService.route(request, function(result, status) {
      if (google.maps.DirectionsStatus.OK !== status) {
        callback('shucks. something is amiss');
      } else {
        var legs = result.routes[0].legs;
        var seconds = 0;

        for (var i = 0; i < legs.length; i++) {
          seconds += legs[i].duration.value;
        }

        callback(seconds);
      }
    });
  }

  function buildRequest(there) {
    return {
      destination : there,
      origin : here.coords.latitude + ',' + here.coords.longitude,
      travelMode : google.maps.TravelMode.DRIVING
    };
  }

  function setCurrentLocation() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        locationSuccess, locationError, {maximumAge:10000}
      );
    else
      console.log('location access denied');
  }

  function locationError(msg) {
    console.log(msg);
  }

  function locationSuccess(position) {
    here = position;
    var latlng = new google.maps.LatLng(
      here.coords.latitude, here.coords.longitude);
    geocoder.geocode({location:latlng}, function(result) {
      here.pretty = result[0].formatted_address;
    });
  }
})();
