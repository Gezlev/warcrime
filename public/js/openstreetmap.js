const openstreetMap = (function(){
    let mapContainerId;
    let map;
    let marker_size = 44;
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
    
    function setupFormAddressFields(name) {
        formName = name;
    }

    function showMap(targetDivId) {
        map = L.map(targetDivId).setView({lon: 30.3920264, lat: 50.4354533}, 8);

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

    function showMessage(type, text) {
        alert(type + ":" + text);
    }

    function addMarker(location){
        if (marker_first !=0) {
          marker.setLatLng(location);
          return;
        }
      
        marker = L.marker(location, {
          draggable:true,
          title:"Ти можеш мене рухати!",
          icon: icon
        }).addTo(map);;
        
        marker.addEventListener("dragend", setAddress)
        /*
        google.maps.event.addListener(marker, 'dragend', setAddress);
        map.setCenter(location);
        if (map.getZoom() < 12) {map.setZoom(12);}
  */
        marker_first ++;


      
    }

    function setAddress() {

        if (inputLocation.getAttribute("latlng") == "true") {inputLocation.value = marker.getLatLng().lat + " " + marker.getLatLng().lng}
        if (typeof document.forms[formName]['lat'] !== 'undefined') {document.forms[formName]['lat'].value = marker.getLatLng().lat;}
        if (typeof document.forms[formName]['lng'] !== 'undefined') {document.forms[formName]['lng'].value = marker.getLatLng().lng;}
        needAddressDetailsChange  = true;

    }

    function getAddressByLatLng(changeInput) {

        axios.get("https://api.tomtom.com/search/2/reverseGeocode/" + marker.getLatLng().lat + "," + marker.getLatLng().lng + ".json?language=uk-UA&key=9yfKHHdqJTvbPMayQXNEZ0zWRg9ISG2K").then(function(res) {
            let result = "";
            if (typeof res.data.addresses[0].address.freeformAddress !== 'undefined') {

                result = res.data.addresses[0].address.freeformAddress;
            } else {
                result = pos.lat + " " + pos.lng;
            }
            inputLocation.value = result;
        })
    }


    function findLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
              var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              addMarker(pos);
              map.flyTo(pos);
              setAddress();
              getAddressByLatLng(true);
            }, function() {
                var pos = {
                    lat: 50.40348008980119,
                    lng: 30.536361693812072
                  };
                showMessage("error", "Немає дозвілу на визначення місця розташування");
            });
        } else {

        }
    } 


    function initSearch(inputId, findLocationID) {
        inputLocation = document.getElementById(inputId);
        let findLocationButton = document.getElementById(findLocationID);
        findLocationButton.addEventListener("click", findLocation);
        
    }
        


    return {
        showMap: showMap,
        initSearch: initSearch,
        setupFormAddressFields: setupFormAddressFields,
    }
})();

function initMap() {
    openstreetMap.showMap('map');
    openstreetMap.initSearch('location', 'button-location');
    openstreetMap.setupFormAddressFields('google-sheet');

}
initMap();



