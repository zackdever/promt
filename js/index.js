(function() {

  var here;
  var directionService = new google.maps.DirectionsService();
  var geocoder = new google.maps.Geocoder();

  $(function() {
    setCurrentLocation();
    $('button').click(getArrivalTime);
  });

  function getArrivalTime() {
    var there = document.getElementById('there').value;
    getDurationTo(there, function(duration) {
      $('#arrival-time').text(duration);
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

        callback(moment().add('seconds', seconds).format('h:mm a'));
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
