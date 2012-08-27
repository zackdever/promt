(function() {

  var directionService, here;

  $(function() {
    getLocation();
    directionService = new google.maps.DirectionsService();
    $('button').click(getArrivalTime);
  });

  function getArrivalTime() {
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
    return moment()
      .add('seconds', seconds)
      .format('h:mm a');
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
