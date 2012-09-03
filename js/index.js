(function() {

  var autoComplete, directionsDisplay, here, map, mapEl, thereEl, whenEl;
  var directionsService = new google.maps.DirectionsService();
  var geocoder = new google.maps.Geocoder();
  var autoCompleteOptions = { /*types: ['establishment']*/ };

  // google maps styling credit: http://www.wherethefuckshouldigotoeat.com/
  // declare b&w google maps
  var lowSat = [{featureType: "all",stylers: [{ saturation: -100 }]}];
  // set map options
  var mapOptions = {
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
    thereEl = document.getElementById('there');
    mapEl   = document.getElementById('map');
    whenEl  = document.getElementById('when');

    setCurrentLocation();
    $('button').click(calculateTimes);
    autoComplete = new google.maps.places.Autocomplete(thereEl, autoCompleteOptions);
  });

  function calculateTimes() {
    var there = thereEl.value;
    var when = whenEl.value;

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
    directionsService.route(request, function(result, status) {
      if (google.maps.DirectionsStatus.OK !== status) {
        callback('shucks. something is amiss');
      } else {
        var legs = result.routes[0].legs;
        var seconds = 0;

        for (var i = 0; i < legs.length; i++) {
          seconds += legs[i].duration.value;
        }

        //directionsDisplay.setDirections(result);
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

      mapOptions.center = latlng;
      var map = new google.maps.Map(mapEl, mapOptions);
      var marker = new google.maps.Marker({
        position: latlng,
        animation: google.maps.Animation.DROP,
        //icon:'/images/you-are-here.png',
        map: map,
        title:'You are here!'
      });

      here.pretty = results[0].formatted_address;
    });
  }
})();
