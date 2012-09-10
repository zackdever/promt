(function() {
  var $there, activePage, autoComplete, hereMarker, thereMarker, map, pages, there;

  // goog objects
  var center            = new google.maps.LatLng(20, -95)
    , directionsDisplay = new google.maps.DirectionsRenderer()
    , directionsService = new google.maps.DirectionsService()
    , geocoder          = new google.maps.Geocoder();

  // configs
  var geoOptions = {maximumAge: 10000}
    , lowSat = [{featureType: 'all', stylers: [{saturation: -100 }]}]
    , mapOptions = {
          center             : center
        , mapTypeControl     : false
        , mapTypeId          : google.maps.MapTypeId.ROADMAP
        , overviewMapControl : false
        , panControl         : false
        , scaleControl       : false
        , streetViewControl  : false
        , styles             : lowSat
        , zoom               : 16
        , zoomControl        : false
      }
    , endIcon = '/images/trips-end.png'
    , startIcon = '/images/trips-start.png';

  // kick things off
  $(function() {
    $there = $('#there');

    initDocument();
    showManualHomeEntry();
    if (navigator.geolocation) setGeoLocation();
  });

  function initDocument() {
    var hereEl = document.getElementById('here');
    // init "pages"
    pages = {
        manual    : {
            selector : '#old-school, #phonehome'
          , onLoad   : function() { $('#where').focus(); }
        }
      , searching : { selector : '#searching' }
      , there     : {
            selector : '#there-input'
          , onLoad   : function() { $there.focus(); }
        }
    };

    // init manual location entry
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    var hereAuto = new google.maps.places.Autocomplete(hereEl, {});
    google.maps.event.addListener(hereAuto, 'place_changed', function() {
      var geometry = hereAuto.getPlace().geometry;
      setHere(geometry.location, geometry.bounds);
      $('#phonehome').prop('disabled', false);
      $('#phonehome').focus();
    });

    $('#phonehome').click(function() {
      showPage(pages.there);
    });

    // init 'there' elements
    autoComplete = new google.maps.places.Autocomplete($there[0], {});
    autoComplete.bindTo('bounds', map);
    google.maps.event.addListener(autoComplete, 'place_changed', onAutoSelectionChanged);
    bindAutoSelectOnEnterOrTab(hereEl);
    bindAutoSelectOnEnterOrTab($there[0]);
    $('.go').click(getDirections);
    $there.focusout(onThereLosesFocus);
  }

  function showPage(page, callback) {
    function show() {
      activePage = page;
      $(page.selector).fadeIn();
      $(page.selector).promise().done(function() {
        if (page.onLoad != undefined) page.onLoad();
        if (callback != undefined) callback();
      });
    }

    if (activePage != null) {
      $(activePage.selector).fadeOut();
      $(activePage.selector).promise().done(show);
    } else {
      show();
    }
  }

  function showManualHomeEntry() {
    clearHereMarker();
    map.setCenter(center);
    map.setZoom(1);
    showPage(pages.manual);
  }

  function clearHereMarker() {
    if (hereMarker != null) hereMarker.setMap(null);
  }

  function setHere(location, bounds) {
    if (bounds != null) autoComplete.setBounds(bounds);

    map.setCenter(location);
    map.setZoom(mapOptions.zoom);
    clearHereMarker();
    hereMarker = new google.maps.Marker({
        animation : google.maps.Animation.DROP
      , icon      : startIcon
      , map       : map
      , position  : location
      , title     : 'You are here!'
    });
  }

  function onThereLosesFocus() {
    if (there != undefined && there.text != $there.val()) {
      setTimeout(function() {
        $there.val(there.text);
      }, 0); // WTF. doesn't work if not inside a setTimeout.
    }
  }

  function onAutoSelectionChanged() {
    there = autoComplete.getPlace();
    there.text = $there.val();
    $('.go').prop('disabled', false);
  }

  function directionsSuccess(seconds, arrival) {
    var duration = ''
      , result = 'From where <span class="location">you&apos;re sat</span> you&apos;ll ';

    if (arrival != null) {
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

  function getDirections() {
    var request = buildRequest(there)
      , when = Time(document.getElementById('when').value).nextDate();

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

        directionsDisplay.suppressMarkers = true;
        directionsDisplay.setDirections(result);
        directionsDisplay.setMap(map);

        // place a marker on the destination
        thereMarker = new google.maps.Marker({
            animation : google.maps.Animation.DROP
          , icon      : endIcon
          , map       : map
          , position  : there.geometry.location
          , title     : "Your journey's conclusion"
        });

        directionsSuccess(seconds, when);
      }
    });
  }

  function buildRequest(there) {
    return {
        destination : there.geometry.location
      , origin      : hereMarker.position
      , travelMode  : google.maps.TravelMode.DRIVING
    };
  }

  function centerMapAtHome() {
    if (hereMarker != undefined) {
      directionsDisplay.setMap(null);
      map.setCenter(hereMarker.position);
      map.setZoom(mapOptions.zoom);
    }
  }

  function setGeoLocation() {
    navigator.geolocation.getCurrentPosition(function(position) {
      showPage(pages.searching, function() {
        var location = new google.maps.LatLng(position.coords.latitude
                                              , position.coords.longitude);
        geocoder.geocode({location: location}, function(results, status) {
          if (status != google.maps.GeocoderStatus.OK) {
            log(status);
          } else {
            showPage(pages.there, function() {
              // this gives better city wide results, but less localized
              setHere(location, getBounds(results, 'locality'));
                // in case they allowed access after getting directions
                if (thereMarker != null) getDirections();
            });
          }
        });
      });
    }, function(error) {
      log('navigator.geolocation.getCurrentPosition failed: ' + error);
    }, geoOptions);
  };

  // results: google maps geocoder.geocode results
  // type: the result type to be returned e.g. 'locality', 'country'
  function getBounds(results, type) {
    var bounds;

    for(var i = 0; i < results.length; i++) {
      if (results[i].types.indexOf(type) !== -1) {
        bounds = results[i].geometry.bounds;
      }
    }

    return bounds;
  }

  function log(message) {
    console.log(message);
  }

  function scrollToAnchor(aid) {
    var aTag = $("a[name='" + aid + "']");
    $('html, body').animate({ scrollTop: aTag.offset().top }, 'slow');
  }

  // credit: http://stackoverflow.com/a/11703018/962091
  function bindAutoSelectOnEnterOrTab(input) {
    // store the original event binding function
    var _addEventListener = (input.addEventListener) ?
      input.addEventListener : input.attachEvent;

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
