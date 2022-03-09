const warMap = function(target) {
    this.map = L.map(target).setView({lon: 24, lat: 51}, 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(this.map);
    L.control.scale({imperial: true, metric: true}).addTo(this.map);

    this.map.on("click", function(pos) {
        console.log(pos);
        getAddressName(pos.latlng)
    });
}


