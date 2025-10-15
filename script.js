// Health centers data - Major hospitals in Kampala
const healthCenters = [
    {
        name: "Mulago National Referral Hospital",
        type: "Hospital",
        lat: 0.3476,
        lng: 32.5825,
        contact: "Phone: +256 414 532 000",
        description: "National referral hospital with specialized services"
    },
    {
        name: "Rubaga Hospital",
        type: "Hospital",
        lat: 0.3028,
        lng: 32.5506,
        contact: "Phone: +256 414 270 621",
        description: "Private hospital on Rubaga Hill"
    },
    {
        name: "Mengo Hospital",
        type: "Hospital",
        lat: 0.2997,
        lng: 32.5569,
        contact: "Phone: +256 414 274 893",
        description: "Private not-for-profit hospital"
    },
    {
        name: "Nsambya Hospital",
        type: "Hospital",
        lat: 0.2897,
        lng: 32.6103,
        contact: "Phone: +256 414 510 221",
        description: "Private hospital with emergency services"
    },
    {
        name: "Kawempe General Hospital",
        type: "Hospital",
        lat: 0.3786,
        lng: 32.5667,
        contact: "Phone: +256 414 661 000",
        description: "Public hospital in Kawempe Division"
    },
    {
        name: "Kibuli Hospital",
        type: "Hospital",
        lat: 0.3131,
        lng: 32.5875,
        contact: "Phone: +256 414 273 000",
        description: "Private hospital near Kibuli Mosque"
    }
];

// Global variables
let map;
let markers = [];
let userLocationMarker = null;
let userLocationCircle = null;
let selectedHospital = null;
let routeLine = null;
let watchId = null;
const initialView = [0.3476, 32.5825];
const initialZoom = 12;

// Custom hospital icon
const hospitalIcon = L.divIcon({
    className: 'hospital-marker',
    html: '<i class="fas fa-hospital" style="color: #dc2626; font-size: 20px;"></i>',
    iconSize: [25, 25],
    iconAnchor: [12, 12]
});

// DOM elements
const elements = {
    map: null,
    searchInput: null,
    desktopSearchInput: null,
    healthCentersList: null,
    currentLocationBtn: null,
    navigateBtn: null,
    resetViewBtn: null,
    locationStatus: null,
    userLocationInfo: null,
    selectedHospitalInfo: null,
    mobileMenuBtn: null,
    closePanelBtn: null,
    searchPanel: null,
    togglePanelBtn: null,
    locateMeBtn: null
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    initializeMap();
    setupEventListeners();
    loadHealthCentersList();
    checkGeolocationSupport();
});

// Initialize DOM elements
function initializeElements() {
    elements.map = document.getElementById('map');
    elements.searchInput = document.getElementById('search-input');
    elements.desktopSearchInput = document.getElementById('desktop-search-input');
    elements.healthCentersList = document.getElementById('health-centers-list');
    elements.currentLocationBtn = document.getElementById('current-location-btn');
    elements.navigateBtn = document.getElementById('navigate-btn');
    elements.resetViewBtn = document.getElementById('reset-view-btn');
    elements.locationStatus = document.getElementById('location-status');
    elements.userLocationInfo = document.getElementById('user-location-info');
    elements.selectedHospitalInfo = document.getElementById('selected-hospital-info');
    elements.mobileMenuBtn = document.getElementById('mobile-menu-btn');
    elements.closePanelBtn = document.getElementById('close-panel-btn');
    elements.searchPanel = document.getElementById('search-panel');
    elements.togglePanelBtn = document.getElementById('toggle-panel-btn');
    elements.locateMeBtn = document.getElementById('locate-me-btn');
}

// Initialize the map
function initializeMap() {
    // Initialize map with better options for responsiveness
    map = L.map('map', {
        zoomControl: false,
        gestureHandling: true
    }).setView(initialView, initialZoom);

    // Add zoom control with better position
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
        minZoom: 10
    }).addTo(map);

    // Fix map size on load
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    elements.searchInput.addEventListener('input', handleSearch);
    elements.desktopSearchInput.addEventListener('input', handleSearch);
    
    // Location buttons
    elements.currentLocationBtn.addEventListener('click', getCurrentLocation);
    elements.navigateBtn.addEventListener('click', navigateToHospital);
    elements.resetViewBtn.addEventListener('click', resetMapView);
    elements.locateMeBtn.addEventListener('click', getCurrentLocation);
    
    // Mobile menu and panel controls
    elements.mobileMenuBtn.addEventListener('click', toggleMobilePanel);
    elements.closePanelBtn.addEventListener('click', toggleMobilePanel);
    elements.togglePanelBtn.addEventListener('click', toggleMobilePanel);
    
    // Map events
    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);
    
    // Window resize handling
    window.addEventListener('resize', handleResize);
}

// Load health centers list (no markers initially)
function loadHealthCentersList() {
    populateHealthCentersList(healthCenters);
}

// Populate health centers list
function populateHealthCentersList(centers) {
    elements.healthCentersList.innerHTML = '';
    
    if (centers.length === 0) {
        elements.healthCentersList.innerHTML = '<div class="health-center-item" style="text-align: center; color: #666;">No hospitals found</div>';
        return;
    }
    
    centers.forEach(center => {
        const item = document.createElement('div');
        item.className = 'health-center-item';
        item.innerHTML = `
            <div class="health-center-name">${center.name}</div>
            <div class="health-center-type">${center.type}</div>
            <div class="health-center-description">${center.contact}</div>
        `;
        
        item.addEventListener('click', function() {
            // Remove previous selection
            document.querySelectorAll('.health-center-item').forEach(el => {
                el.classList.remove('selected');
            });
            
            // Add selection to clicked item
            item.classList.add('selected');
            
            // Set selected hospital
            selectedHospital = center;
            
            // Show hospital on map
            showHospitalOnMap(center);
            
            // Enable navigate button if user location is available
            updateNavigateButtonState();
            
            // Show selected hospital info
            showSelectedHospitalInfo(center);
        });
        
        elements.healthCentersList.appendChild(item);
    });
}

// Update navigate button state based on conditions
function updateNavigateButtonState() {
    if (selectedHospital && userLocationMarker) {
        elements.navigateBtn.disabled = false;
    } else {
        elements.navigateBtn.disabled = true;
    }
}

// Show hospital on map when selected
function showHospitalOnMap(hospital) {
    // Clear previous markers
    clearHospitalMarkers();
    
    // Add marker for selected hospital
    const marker = L.marker([hospital.lat, hospital.lng], {
        icon: hospitalIcon
    }).addTo(map);
    
    const popupContent = `
        <div class="popup-content">
            <div class="popup-title">${hospital.name}</div>
            <div class="popup-type">${hospital.type}</div>
            <div class="popup-contact">${hospital.contact}</div>
            <div class="popup-contact">${hospital.description}</div>
        </div>
    `;
    
    marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'health-center-popup'
    }).openPopup();
    
    // Store hospital data with marker
    marker.hospital = hospital;
    markers.push(marker);
    
    // Center map on hospital
    map.setView([hospital.lat, hospital.lng], 15, {
        animate: true,
        duration: 1
    });
}

// Clear hospital markers from map
function clearHospitalMarkers() {
    markers.forEach(marker => {
        map.removeLayer(marker);
    });
    markers = [];
    
    // Clear route line if exists
    if (routeLine) {
        map.removeLayer(routeLine);
        routeLine = null;
    }
}

// Show selected hospital info
function showSelectedHospitalInfo(hospital) {
    elements.selectedHospitalInfo.innerHTML = `
        <h4><i class="fas fa-hospital"></i> Selected Hospital</h4>
        <div><strong>${hospital.name}</strong></div>
        <div>${hospital.type}</div>
        <div>${hospital.contact}</div>
        <div style="margin-top: 8px; font-size: 0.8rem;">
            <i class="fas fa-info-circle"></i> Get your location first, then click "Navigate"
        </div>
    `;
    elements.selectedHospitalInfo.classList.add('active');
}

// Search functionality
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        populateHealthCentersList(healthCenters);
        clearHospitalMarkers();
        elements.selectedHospitalInfo.classList.remove('active');
        selectedHospital = null;
        elements.navigateBtn.disabled = true;
        return;
    }
    
    const filteredCenters = healthCenters.filter(center => 
        center.name.toLowerCase().includes(searchTerm)
    );
    
    populateHealthCentersList(filteredCenters);
    
    // If only one result, automatically select it
    if (filteredCenters.length === 1) {
        const item = elements.healthCentersList.querySelector('.health-center-item');
        if (item) {
            item.click();
        }
    } else {
        clearHospitalMarkers();
        elements.selectedHospitalInfo.classList.remove('active');
        selectedHospital = null;
        elements.navigateBtn.disabled = true;
    }
}

// Current location functionality
function getCurrentLocation() {
    if (!navigator.geolocation) {
        updateLocationStatus('Geolocation is not supported by your browser', 'error');
        return;
    }
    
    updateLocationStatus('Getting your location...', 'loading');
    elements.currentLocationBtn.disabled = true;
    elements.currentLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Locating...';
    
    // Stop any previous watching
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
    }
    
    // Get current position
    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
    };
    
    watchId = navigator.geolocation.watchPosition(
        onLocationSuccess,
        onLocationError,
        options
    );
}

function onLocationSuccess(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const accuracy = position.coords.accuracy;
    
    updateLocationStatus('Location found!', 'success');
    showUserLocation(lat, lng, accuracy);
    
    // Update button state
    elements.currentLocationBtn.disabled = false;
    elements.currentLocationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Update My Location';
    
    // Enable navigate button if hospital is selected
    updateNavigateButtonState();
}

function onLocationError(error) {
    let message = 'Unable to retrieve your location';
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message = 'Location access denied. Please enable location services.';
            break;
        case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable.';
            break;
        case error.TIMEOUT:
            message = 'Location request timed out.';
            break;
        default:
            message = 'An unknown error occurred.';
            break;
    }
    
    updateLocationStatus(message, 'error');
    
    // Reset button state
    elements.currentLocationBtn.disabled = false;
    elements.currentLocationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Show My Current Location';
}

function showUserLocation(lat, lng, accuracy) {
    // Remove previous location markers
    if (userLocationMarker) {
        map.removeLayer(userLocationMarker);
    }
    if (userLocationCircle) {
        map.removeLayer(userLocationCircle);
    }
    
    // Add accuracy circle
    userLocationCircle = L.circle([lat, lng], {
        color: '#4CAF50',
        fillColor: '#4CAF50',
        fillOpacity: 0.2,
        radius: accuracy
    }).addTo(map);
    
    // Add user location marker
    userLocationMarker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'user-location-marker',
            html: '<i class="fas fa-user" style="color: #4CAF50; font-size: 20px;"></i>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        })
    }).addTo(map).bindPopup('Your current location<br>Accuracy: ' + Math.round(accuracy) + ' meters').openPopup();
    
    // Update user location info
    updateUserLocationInfo(lat, lng, accuracy);
    
    // Update navigate button state
    updateNavigateButtonState();
}

function updateUserLocationInfo(lat, lng, accuracy) {
    elements.userLocationInfo.innerHTML = `
        <h4><i class="fas fa-check-circle"></i> Your Location</h4>
        <div>Latitude: ${lat.toFixed(6)}</div>
        <div>Longitude: ${lng.toFixed(6)}</div>
        <div>Accuracy: ${Math.round(accuracy)} meters</div>
        <div style="margin-top: 8px; font-size: 0.8rem; color: #4CAF50;">
            <i class="fas fa-check"></i> Ready for navigation
        </div>
    `;
}

// Navigate to selected hospital - FIXED FUNCTION
function navigateToHospital() {
    if (!selectedHospital) {
        updateLocationStatus('Please select a hospital first', 'error');
        return;
    }
    
    if (!userLocationMarker) {
        updateLocationStatus('Please get your current location first', 'error');
        return;
    }
    
    const userLat = userLocationMarker.getLatLng().lat;
    const userLng = userLocationMarker.getLatLng().lng;
    const hospitalLat = selectedHospital.lat;
    const hospitalLng = selectedHospital.lng;
    
    // Calculate distance
    const distance = calculateDistance(userLat, userLng, hospitalLat, hospitalLng);
    
    // Draw route line
    if (routeLine) {
        map.removeLayer(routeLine);
    }
    
    routeLine = L.polyline([
        [userLat, userLng],
        [hospitalLat, hospitalLng]
    ], {
        color: '#4CAF50',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10',
        className: 'route-line'
    }).addTo(map);
    
    // Update hospital popup with distance
    markers.forEach(marker => {
        if (marker.hospital && marker.hospital.name === selectedHospital.name) {
            const popupContent = `
                <div class="popup-content">
                    <div class="popup-title">${selectedHospital.name}</div>
                    <div class="popup-type">${selectedHospital.type}</div>
                    <div class="popup-contact">${selectedHospital.contact}</div>
                    <div class="popup-contact">${selectedHospital.description}</div>
                    <div class="popup-distance">Distance from you: ${distance} km</div>
                </div>
            `;
            marker.bindPopup(popupContent).openPopup();
        }
    });
    
    // Fit map to show both locations
    const bounds = L.latLngBounds([
        [userLat, userLng],
        [hospitalLat, hospitalLng]
    ]);
    map.fitBounds(bounds, { padding: [20, 20] });
    
    updateLocationStatus(`Navigation to ${selectedHospital.name} - Distance: ${distance} km`, 'success');
}

// Calculate distance between two points in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance.toFixed(1);
}

function updateLocationStatus(message, type) {
    const statusElement = elements.locationStatus;
    statusElement.textContent = `Location: ${message}`;
    
    // Remove previous classes
    statusElement.className = 'location-status';
    
    // Add appropriate class
    switch(type) {
        case 'loading':
            statusElement.classList.add('status-loading');
            break;
        case 'success':
            statusElement.classList.add('status-success');
            break;
        case 'error':
            statusElement.classList.add('status-error');
            break;
    }
}

// Reset map view
function resetMapView() {
    map.setView(initialView, initialZoom, {
        animate: true,
        duration: 1
    });
    
    // Close all popups
    map.closePopup();
    
    // Clear hospital markers and route
    clearHospitalMarkers();
    elements.selectedHospitalInfo.classList.remove('active');
    selectedHospital = null;
    elements.navigateBtn.disabled = true;
    
    // Clear search
    elements.searchInput.value = '';
    elements.desktopSearchInput.value = '';
    populateHealthCentersList(healthCenters);
    
    updateLocationStatus('Map view reset', 'success');
}

// Mobile panel controls
function toggleMobilePanel() {
    elements.searchPanel.classList.toggle('active');
    
    // Update toggle button icon
    const icon = elements.togglePanelBtn.querySelector('i');
    if (elements.searchPanel.classList.contains('active')) {
        icon.className = 'fas fa-map';
    } else {
        icon.className = 'fas fa-list';
    }
}

// Check geolocation support
function checkGeolocationSupport() {
    if (!navigator.geolocation) {
        updateLocationStatus('Geolocation not supported', 'error');
        elements.currentLocationBtn.disabled = true;
        elements.currentLocationBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Location Not Supported';
    }
}

// Handle window resize
function handleResize() {
    // Refresh map on resize to fix rendering issues
    setTimeout(() => {
        if (map) {
            map.invalidateSize();
        }
    }, 150);
}

// Leaflet location events
function onLocationFound(e) {
    console.log('Location found via map.locate:', e.latlng);
}

function onLocationError(e) {
    console.log('Location error via map.locate:', e.message);
}