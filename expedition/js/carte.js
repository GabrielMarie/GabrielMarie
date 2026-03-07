// carte.js
// Initialise la carte Leaflet et gère les waypoints + GPX

// Charger la carte
function initCarte() {
  var map = L.map('mini-map').setView([48.8584, 2.2945], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 18,
  }).addTo(map);

  // Waypoints depuis HTML
  document.querySelectorAll('[data-waypoint]').forEach(function(el) {
    var lat = parseFloat(el.getAttribute('data-lat'));
    var lng = parseFloat(el.getAttribute('data-lng'));
    var title = el.getAttribute('data-title') || 'Waypoint';
    L.marker([lat, lng]).addTo(map).bindPopup(title);
  });

  // GPX local
  var gpxPath = document.getElementById('mini-map').getAttribute('data-gpx');
  if (gpxPath) {
    var gpxLayer = new L.GPX(gpxPath, {
      async: true,
      marker_options: {
        startIconUrl: 'https://unpkg.com/leaflet-gpx@1.7.0/pin-icon-start.png',
        endIconUrl: 'https://unpkg.com/leaflet-gpx@1.7.0/pin-icon-end.png',
        shadowUrl: 'https://unpkg.com/leaflet-gpx@1.7.0/pin-shadow.png'
      }
    });
    gpxLayer.on('loaded', function(e) {
      map.fitBounds(e.target.getBounds());
    });
    gpxLayer.addTo(map);
  }
}

// Initialisation après chargement
window.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('mini-map')) {
    initCarte();
  }
});
