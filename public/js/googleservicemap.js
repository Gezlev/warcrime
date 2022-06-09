const googleMap = (function () {
    let mapContainerId;
    let map;
    let marker_size = 45;
    let marker, marker_first = 0;
    let inputLocation;
    let formName = {}
    let geocoder;
    let needAddressDetailsChange = false;
    let icon =  L.icon({
        iconUrl: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
        iconSize: [marker_size, marker_size],
        iconAnchor: [22, 44],
    });
    const translates = {
        "markerCanMove": {
            "ua": "Ти можеш мене рухати!",
            "en": "You can move me!"
        }, 
        "noPermission": {
            "ua": "Немає дозволу для визначення місцеположення",
            "en": "No permission to determine location"
        }
    }
    let lang = document.location.pathname.split("/")[1] == "en" ? "en" : "ua";

    function setupFormAddressFields(name) {
        formName = name;
    }

    function mapObserver() {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting && marker) {
                    getAddressByLatLng(false);
                    getAddressByLatLngTomTom(false);
                }
            });

        }, { threshold: 0 })

        observer.observe(document.getElementById(mapContainerId));
    }

    function showMap(targetDivId) {
        mapContainerId = targetDivId;

        map = L.map(targetDivId).setView({lon: 31.6843, lat: 49.1261}, 6);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        }).addTo(map);
        L.control.scale({imperial: true, metric: true}).addTo(map);
    
        map.on("click", function(pos) {
            addMarker(pos.latlng);
            setAddress();
            needAddressDetailsChange = true;
        });
        geocoder  = new google.maps.Geocoder;
        mapObserver();      



    }

    function setAddress() {
        if (inputLocation.getAttribute("latlng") == "true") {inputLocation.value = marker.getLatLng().lat + " " + marker.getLatLng().lng}
        if (typeof document.forms[formName]['lat'] !== 'undefined') {document.forms[formName]['lat'].value = marker.getLatLng().lat;}
        if (typeof document.forms[formName]['lng'] !== 'undefined') {document.forms[formName]['lng'].value = marker.getLatLng().lng;}
        needAddressDetailsChange  = true;

    }
    function setAddressFields(result) {
        console.log('setadd', result)
        result.forEach(element => {
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
                let c = new L.latLng(results[0].geometry.location.lat(), results[0].geometry.location.lng());
                addMarker(c);
                map.flyTo(c);
            }
        });
    }

    function getAddressByLatLng(changeInput) {
        geocoder.geocode({'location': marker.getLatLng()}, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                setAddressFields(results[0].address_components);
                setAddress();
                if (changeInput) {
                    inputLocation.value = results[0].formatted_address;
                }
            }
        });
    }

    function getAddressByLatLngTomTom(changeInput) {
        axios.get("https://api.tomtom.com/search/2/reverseGeocode/" + marker.getLatLng().lat + "," + marker.getLatLng().lng + ".json?language=uk-UA&key=9yfKHHdqJTvbPMayQXNEZ0zWRg9ISG2K").then(function(result) {
            console.log(result.data);
            if (result.data?.addresses[0]?.address) {
                let a = result.data?.addresses[0]?.address;
                let b = {
                    "country": undefined || a.country, 
                    "administrative_area_level_2":  undefined ||  a.countrySecondarySubdivision, 
                    "administrative_area_level_1":  undefined || a.countrySubdivision,
                    "locality":  undefined || a.municipalitySubdivision,
                    "route":  undefined || a.streetName, 
                    "street_number":  undefined || a.streetNumber,
                };
                let c = [];
                Object.entries(b).forEach(entry => {
                    const [key, value] = entry;
                    c.push({long_name: value, types: [key]})
                  });
                //console.log(c);
                setAddressFields(c);
            }

        });



    }


    function addMarker(location) {
        if (marker_first !=0) {
            marker.setLatLng(location);
            return;
          }
        
          marker = L.marker(location, {
            draggable:true,
            title: translates["markerCanMove"][lang],
            icon: icon
          }).addTo(map);;
          
          marker.addEventListener("dragend", setAddress)

        map.flyTo(location);

        marker_first ++;

    }


    function findLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                addMarker(pos);
                setAddress();
           //     getAddressByLatLng(true)
                getAddressByLatLngTomTom(true);

                map.flyTo(pos, 14);
            }, function(error) {
                showMessage("error", translates["noPermission"][lang] + error.code);
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
     //   autocomplete.bindTo('bounds', map);

        autocomplete.addListener('place_changed', function() {
            inputLocation.setAttribute("latlng", false);
            let place = autocomplete.getPlace();
            if (!place.geometry) {
                console.log("Autocomplete's returned place contains no geometry");
                return;
            }
            let c = new L.latLng(place.geometry.location.lat(), place.geometry.location.lng());
            addMarker(c);
            map.flyTo(c, 14);
            setAddress();
            setAddressFields(place.address_components);
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
