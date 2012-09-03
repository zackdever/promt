(function() {

  var autoComplete, directionsDisplay, here, map, mapEl, there, thereEl, whenEl;
  var directionsService = new google.maps.DirectionsService();
  var geocoder = new google.maps.Geocoder();
  var autoCompleteOptions = { /*types: ['establishment']*/ };

  // google maps styling credit: http://www.wherethefuckshouldigotoeat.com/
  // declare b&w google maps
  var lowSat = [{featureType: 'all', stylers: [{ saturation: -100 }]}];
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
    bindAutoSelectOnEnterOrTab(thereEl);
    $('button').click(calculateTimes);
    autoComplete = new google.maps.places.Autocomplete(thereEl, autoCompleteOptions);
    directionsDisplay = new google.maps.DirectionsRenderer();
    google.maps.event.addListener(autoComplete, 'place_changed', onThereChanged);
    $('#there').focusout(function() { $('.go').prop('disabled', this.value.length == 0); });
  });


  function onThereChanged() {
    there = autoComplete.getPlace();
    $('.go').prop('disabled', false);
  }

  function calculateTimes() {
    var when = whenEl.value;

    getDurationToThere(function(seconds) {
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

  function getDurationToThere(callback) {
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

        directionsDisplay.setDirections(result);
        callback(seconds);
      }
    });
  }

  function buildRequest(there) {
    return {
      destination : there.geometry.location,
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
      directionsDisplay.setMap(map);
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

  // credit: http://stackoverflow.com/a/11703018/962091
  function bindAutoSelectOnEnterOrTab(input) {
    // store the original event binding function
    var _addEventListener = (input.addEventListener) ? input.addEventListener : input.attachEvent;

    function addEventListenerWrapper(type, listener) {
      // Simulate a 'down arrow' keypress on hitting 'return' or 'tab'
      // when no pac suggestion is selected, and then trigger the original listener.
      if (type == 'keydown') {
        var orig_listener = listener;
        listener = function(event) {
          var suggestion_selected = $('.pac-item.pac-selected').length > 0;
          if ((event.which == 13 || event.which == 9) && !suggestion_selected) {
            var simulated_downarrow = $.Event('keydown', { keyCode: 40, which: 40 });
            orig_listener.apply(input, [simulated_downarrow]);
          }
          orig_listener.apply(input, [event]);
        };
      }
      _addEventListener.apply(input, [type, listener]);
    }
    input.addEventListener = addEventListenerWrapper;
    input.attachEvent = addEventListenerWrapper;
  }
})();
