(function() {

  var here;
  var directionService = new google.maps.DirectionsService();
  var geocoder = new google.maps.Geocoder();
  var autoOptions = {
    //types: ['establishment']
  };
  var autoComplete, map;
  // google maps styling credit: http://www.wherethefuckshouldigotoeat.com/
  //declare b&w google maps
  var lowSat = [{featureType: "all",stylers: [{ saturation: -100 }]}];
  //set map options
  var myOptions = {
    zoom: 16,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    styles: lowSat,
    mapTypeControl: false,
    panControl: false,
    zoomControl: false,
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    overviewMapControl: false
  };

  $(function() {
    setCurrentLocation();
    $('button').click(calculateTimes);
    autoComplete = new google.maps.places.Autocomplete(document.getElementById('there'), autoOptions);
  });

  function calculateTimes() {
    var there = document.getElementById('there').value;
    var when = document.getElementById('when').value;

    getDurationTo(there, function(seconds) {
      var duration = '';
      var result = 'From where ' + '<span class="location">you&apos;re sat</span>' + ', you&apos;ll ';

      if (when) {
        var arrival = Time.parseToDate(when);
        var departure = moment(arrival).subtract('seconds', seconds).format('h:mm a');
        result += 'need to leave around <span class="bold">' + departure + '</span>';
      } else {
        var arrival = moment().add('seconds', seconds).format('h:mm a');
        var durationSeconds = moment.duration(seconds, 'seconds').humanize();
        duration = '(about ' + durationSeconds + ')';
        result += 'get there around <span class="bold">' + arrival + '</span>';
      }

      $('#duration').text(duration);
      $('#time').html(result);
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
    var latlng = new google.maps.LatLng(here.coords.latitude, here.coords.longitude);
    geocoder.geocode({location:latlng}, function(results, status) {
      var bounds;
      for(var i=0; i<results.length; i++) {
        if (results[i].types.indexOf('locality') !== -1) {
          bounds = results[i].geometry.bounds;
        }
      }

      if (bounds != null) autoComplete.setBounds(bounds);

      myOptions.center = latlng;
      var map = new google.maps.Map(document.getElementById('map'), myOptions);
      var marker = new google.maps.Marker({
        position: latlng,
        map: map,
        title:'You are here!'
      });

      here.pretty = results[0].formatted_address;
    });
  }
})();
