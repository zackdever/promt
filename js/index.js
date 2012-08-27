(function() {

  var directionService, here;

  $(function() {
    getLocation();
    directionService = new google.maps.DirectionsService();
    $('button').click(getTimeToThere);
  });

  function getTimeToThere() {
    var there = document.getElementById('there').value;
    getDurationTo(there, function(duration) {
      document.getElementById('result').innerHTML = duration;
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

        callback(buildResultString(request, seconds));
      }
    });
  }

  function buildRequest(there) {
    return {
      destination : there,
      origin : here.latitude + ',' + here.longitude,
      travelMode : google.maps.TravelMode.DRIVING
    };
  }

  function buildResultString(request, seconds) {
    var minutes = Math.round(seconds / 60);
    var hours = Math.floor(minutes / 60);
    minutes -= hours * 60;
    var time = minutes + ' minutes';
    if (hours > 0) time = hours + ' hours and ' + time;
    return time + ' to ' + request.destination;
  }

  function getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        locationSuccess, locationError, {maximumAge:10000}
      );
    } else {
      console.log('snap');
    }
  }

  function locationError(msg) {
    console.log(msg);
  }

  function locationSuccess(position) {
    here = position.coords;
    var latlng = new google.maps.LatLng(here.latitude, here.longitude);
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({location:latlng}, function(result) {
      here.pretty = result[0].formatted_address;
    });
  }
  })();