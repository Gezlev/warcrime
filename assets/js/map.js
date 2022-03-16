const googleMap = (function () {
    let mapContainerId;
    let map;
    let marker_default_url = 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';
    let marker_size = 45;
    let marker, marker_first = 0;
    let inputLocation;
    let formName = {}
    let geocoder;
    let needAddressDetailsChange = false;

    function setupFormAddressFields(name) {
        formName = name;
    }

    function mapObserver() {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting && marker) {
                    getAddressByLatLng(false);
                }
            });

        }, { threshold: 0 })

        observer.observe(document.getElementById(mapContainerId));
    }

    function showMap(targetDivId) {
        mapContainerId = targetDivId;
        let center = new google.maps.LatLng(49.1261, 31.6843);
        map = new google.maps.Map(document.getElementById(targetDivId), {
            zoom: 6,
            center: center,
            scrollwheel: true,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            streetViewControl: false,
            mapTypeControl: false
        });
        google.maps.event.addListener(map, 'click', function(event) {
            addMarker(event.latLng, map);
            setAddress();
            needAddressDetailsChange = true;
        });
        geocoder  = new google.maps.Geocoder;
        mapObserver();

    }

    function setAddress() {
        if (inputLocation.getAttribute("latlng") == "true") {inputLocation.value = marker.getPosition().toUrlValue();}
        if (typeof document.forms[formName]['lat'] !== 'undefined') {document.forms[formName]['lat'].value = marker.getPosition().lat();}
        if (typeof document.forms[formName]['lng'] !== 'undefined') {document.forms[formName]['lng'].value = marker.getPosition().lng();}
        needAddressDetailsChange  = true;

    }
    function setAddressFields(result) {
        result.address_components.forEach(element => {
            if (typeof document.forms[formName][element.types[0]] !== 'undefined') {document.forms[formName][element.types[0]].value = element.long_name }
        });
        needAddressDetailsChange = false;
    }

    function showMessage(type, text) {
        alert(type + ":" + text);
    }

    function getAddressByQuery(query) {
        geocoder.geocode({'address': query}, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                addMarker(results[0].geometry.location);
                map.setCenter(results[0].geometry.location);
            }
        });
    }

    function getAddressByLatLng(changeInput) {
        geocoder.geocode({'location': marker.getPosition()}, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                setAddressFields(results[0]);
                setAddress();
                if (changeInput) {
                    inputLocation.value = results[0].formatted_address;
                }
            }
        });
    }

    function addMarker(location) {

        let size = new google.maps.Size(marker_size, marker_size);
        if (marker_first !=0) {
            marker.setPosition(location);
            return;
        }

        marker = new google.maps.Marker({
            position: location,
            map: map,
            draggable:true,
            title:"Ти можеш мене рухати!",
            icon: {
                url: marker_default_url,
                scaledSize: size
            }
        });
        google.maps.event.addListener(marker, 'dragend', setAddress);
        map.setCenter(location);
        if (map.getZoom() < 12) {map.setZoom(12);}

        marker.setVisible(true);
        marker_first ++;

    }


    function findLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                addMarker(pos, map);
                setAddress();
                getAddressByLatLng(true);

                map.setCenter(pos);
                map.setZoom(12);
            }, function(error) {
                showMessage("error", "Немає дозвілу на визначення місця розташування" + error.code);
            });
        }
    }



    function initSearch(inputId, findLocationID) {
        inputLocation = document.getElementById(inputId);
        inputLocation.addEventListener("keydown", function(e) {
            if (e.key == 'Enter') {
                e.preventDefault();
                getAddressByQuery(inputLocation.value);
            }
        });
        inputLocation.addEventListener("blur", function(){
            getAddressByQuery(inputLocation.value);
        })
        let findLocationButton = document.getElementById(findLocationID);


        google.maps.event.addDomListener(findLocationButton, "click", findLocation);

        let autocomplete = new google.maps.places.Autocomplete(inputLocation, {
            componentRestrictions: {country: 'ua'}
        });
        autocomplete.bindTo('bounds', map);

        autocomplete.addListener('place_changed', function() {
            inputLocation.setAttribute("latlng", false);
            let place = autocomplete.getPlace();
            if (!place.geometry) {
                console.log("Autocomplete's returned place contains no geometry");
                return;
            }

            // If the place has a geometry, then present it on a map.
            if (place.geometry.viewport) {
                map.fitBounds(place.geometry.viewport);
            } else {
                map.setCenter(place.geometry.location);
                map.setZoom(17);  // Why 17? Because it looks good.
            }

            addMarker(place.geometry.location, map);
            setAddress();
            setAddressFields(place);
        });
    }



    return {
        showMap: showMap,
        initSearch: initSearch,
        setupFormAddressFields: setupFormAddressFields,
    }
})();


function initMap() {
    googleMap.showMap('map');
    googleMap.setupFormAddressFields('google-sheet');
    googleMap.initSearch('location', 'button-location');
}
