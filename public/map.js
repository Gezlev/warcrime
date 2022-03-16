const googleMap=function(){let n,a,t="https://maps.google.com/mapfiles/ms/icons/green-dot.png",s=45,i,r=0,l,o={},g,c=!1;function d(){"true"==l.getAttribute("latlng")&&(l.value=i.getPosition().toUrlValue()),void 0!==document.forms[o].lat&&(document.forms[o].lat.value=i.getPosition().lat()),void 0!==document.forms[o].lng&&(document.forms[o].lng.value=i.getPosition().lng()),c=!0}function m(e){e.address_components.forEach(e=>{void 0!==document.forms[o][e.types[0]]&&(document.forms[o][e.types[0]].value=e.long_name)}),c=!1}function u(e){g.geocode({address:e},function(e,o){o===google.maps.GeocoderStatus.OK&&(f(e[0].geometry.location),a.setCenter(e[0].geometry.location))})}function p(t){g.geocode({location:i.getPosition()},function(e,o){o===google.maps.GeocoderStatus.OK&&(m(e[0]),d(),t&&(l.value=e[0].formatted_address))})}function f(e){var o=new google.maps.Size(s,s);0!=r?i.setPosition(e):(i=new google.maps.Marker({position:e,map:a,draggable:!0,title:"Ти можеш мене рухати!",icon:{url:t,scaledSize:o}}),google.maps.event.addListener(i,"dragend",d),a.setCenter(e),a.getZoom()<12&&a.setZoom(12),i.setVisible(!0),r++)}function v(){navigator.geolocation&&navigator.geolocation.getCurrentPosition(function(e){e={lat:e.coords.latitude,lng:e.coords.longitude};f(e,a),d(),p(!0),a.setCenter(e),a.setZoom(12)},function(e){var o;o="error",e="Немає дозвілу на визначення місця розташування"+e.code,alert(o+":"+e)})}return{showMap:function(e){n=e;var o=new google.maps.LatLng(49.1261,31.6843);a=new google.maps.Map(document.getElementById(e),{zoom:6,center:o,scrollwheel:!0,mapTypeId:google.maps.MapTypeId.ROADMAP,streetViewControl:!1,mapTypeControl:!1}),google.maps.event.addListener(a,"click",function(e){f(e.latLng,a),d(),c=!0}),g=new google.maps.Geocoder;{const t=new IntersectionObserver((e,o)=>{e.forEach(e=>{!e.isIntersecting&&i&&p(!1)})},{threshold:0});return void t.observe(document.getElementById(n))}},initSearch:function(e,o){(l=document.getElementById(e)).addEventListener("keydown",function(e){"Enter"==e.key&&(e.preventDefault(),u(l.value))}),l.addEventListener("blur",function(){u(l.value)}),e=document.getElementById(o),google.maps.event.addDomListener(e,"click",v);let t=new google.maps.places.Autocomplete(l,{componentRestrictions:{country:"ua"}});t.bindTo("bounds",a),t.addListener("place_changed",function(){l.setAttribute("latlng",!1);var e=t.getPlace();e.geometry?(e.geometry.viewport?a.fitBounds(e.geometry.viewport):(a.setCenter(e.geometry.location),a.setZoom(17)),f(e.geometry.location,a),d(),m(e)):console.log("Autocomplete's returned place contains no geometry")})},setupFormAddressFields:function(e){o=e}}}();function initMap(){googleMap.showMap("map"),googleMap.setupFormAddressFields("google-sheet"),googleMap.initSearch("location","button-location")}export default initMap();