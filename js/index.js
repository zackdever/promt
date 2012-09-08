(function() {

  var autoComplete, here, map, mapEl,
      there, thereMarker, thereEl, thereText, whenEl;
  var directionsService = new google.maps.DirectionsService();
  var directionsDisplay = new google.maps.DirectionsRenderer();
  var geocoder = new google.maps.Geocoder();
  var autoCompleteOptions = { /*types: ['establishment']*/ };
  var geoOptions = {maximumAge: 10000};

  // b&w google maps styling credit: http://www.wherethefuckshouldigotoeat.com
  var lowSat = [{featureType: 'all',
    stylers: [{saturation: -100 }]}];
  var mapOptions = {
    zoom: 16,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    styles: lowSat,
    mapTypeControl: false,
    panControl: false,
    zoomControl: false,
    scaleControl: false,
    streetViewControl: false,
    overviewMapControl: false
  };

  // kick things off
  $(function() {
    thereEl = document.getElementById('there');
    mapEl   = document.getElementById('map');
    whenEl  = document.getElementById('when');

    setCurrentLocation(function(success) {
      if (success) {
        bindAutoSelectOnEnterOrTab(thereEl);
        $('button').click(getDirections);
        google.maps.event.addListener(autoComplete, 'place_changed', onAutoSelectionChanged);
        $('#there').focusout(onThereLosesFocus);
      } else {
        log('current location was not set');
      }
    });
  });

  function onThereLosesFocus() {
    if (there != undefined && thereText != thereEl.value) {
      setTimeout(function() {
        thereEl.value = thereText;
      }, 0); // WTF. doesn't work if not inside a setTimeout.
    }
  }

  function onAutoSelectionChanged() {
    there = autoComplete.getPlace();
    thereText = thereEl.value;
    $('.go').prop('disabled', false);
  }

  function directionsSuccess(seconds) {
    var when = whenEl.value;
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
    $('#traffic').show();
    $('#result').fadeIn('slow','');
    scrollToAnchor('no-fluff');
  }

  function directionsFail(error) {
    centerMapAtHome();
    $('#duration').hide();
    $('#time').html('Uh... we have no idea how to get there. Good luck!');
    $('#traffic').hide();
    $('#result').fadeIn('slow','');
    scrollToAnchor('no-fluff');
  }

  function scrollToAnchor(aid){
    var aTag = $("a[name='"+ aid +"']");
    $('html,body').animate({scrollTop: aTag.offset().top},'slow');
  }

  function getDirections() {
    var request = buildRequest(there);
    directionsService.route(request, function(result, status) {
      // clear the old destination marker if it exists
      if (thereMarker != null) thereMarker.setMap(null);

      if (google.maps.DirectionsStatus.OK !== status) {
        directionsFail(google.maps.DirectionsStatus);
      } else {
        var legs = result.routes[0].legs;
        var seconds = 0;

        for (var i = 0; i < legs.length; i++) {
          seconds += legs[i].duration.value;
        }

        directionsDisplay.setDirections(result);
        // place a marker on the destination
        thereMarker = new google.maps.Marker({
          position: there.geometry.location,
          animation: google.maps.Animation.DROP,
          icon:'/images/you-are-here.png',
          map: map,
          title:"Your journey's conclusion"
        });

        directionsSuccess(seconds);
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

  function setCurrentLocation(callback) {
    if (navigator.geolocation) {
      setGeoLocation(callback);
    } else {
      log('geo location not supported');
      callback(false);
    }
  }

  function centerMapAtHome() {
    if (here != undefined) {
      directionsDisplay.setMap(null);
      map.setCenter(here.latlng);
      map.setZoom(mapOptions.zoom);
    }
  }

  function setGeoLocation(callback) {
    navigator.geolocation.getCurrentPosition(function(position) {
      here = position;
      here.latlng = new google.maps.LatLng(here.coords.latitude, here.coords.longitude);
      geocoder.geocode({location: here.latlng}, function(results, status) {
        if (status != google.maps.GeocoderStatus.OK) {
          log(status);
          callback(false);
        } else {
          autoComplete = new google.maps.places.Autocomplete(thereEl, autoCompleteOptions);
          setAutoCompleteBounds(results, 'locality');

          // build the map
          mapOptions.center = here.latlng;
          map = new google.maps.Map(mapEl, mapOptions);

          // show the map
          directionsDisplay.suppressMarkers = true;
          directionsDisplay.setMap(map);

          // place a marker on the current location
          var marker = new google.maps.Marker({
            position: here.latlng,
            animation: google.maps.Animation.DROP,
            icon:'/images/you-are-here.png',
            map: map,
            title:'You are here!'
          });

          here.pretty = results[0].formatted_address;
          callback(true);
        }
      });
    }, function(error) {
      log('navigator.geolocation.getCurrentPosition failed: ' + error);
      callback(false);
    }, geoOptions);
  };

  // sets the bounds on the auto complete box.
  // this gives preferences to places inside the bounds.
  //
  // results: google maps geocoder.geocode results
  // type: the result type to use as a bound e.g. 'locality', 'country'
  function setAutoCompleteBounds(results, type) {
    var bounds;

    for(var i = 0; i < results.length; i++) {
      if (results[i].types.indexOf(type) !== -1) {
        bounds = results[i].geometry.bounds;
      }
    }

    if (bounds != null) autoComplete.setBounds(bounds);
  }

  function log(message) {
    console.log(message);
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
