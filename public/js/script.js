const socket = io();
const userList = document.getElementById("user-list");

// Ask user for their name
const userName = prompt("Enter your name:") || "Anonymous";

// Check if geolocation is available
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            socket.emit("send-location", { name: userName, latitude, longitude });
        },
        (error) => {
            console.error(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 2000,
            maximumAge: 0,
        }
    );
}

// Initialize the map
const map = L.map("map").setView([20, 78], 5);  // Default center on India

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Real Time Tracker",
}).addTo(map);

setTimeout(() => {
    map.invalidateSize();
}, 500);

// Custom user icon
const userIcon = L.icon({
    iconUrl: "/images/user-marker.png", // Add a custom marker image in public/images
    iconSize: [35, 35], 
    iconAnchor: [17, 35], 
    popupAnchor: [0, -30]
});

const markers = {};

// Listen for location updates from other users
socket.on("recieve-location", (data) => {
    const { id, name, latitude, longitude } = data;

    if (!markers[id]) {
        // Add user to the sidebar list
        let userItem = document.createElement("li");
        userItem.id = `user-${id}`;
        userItem.textContent = name;
        userList.appendChild(userItem);
    }

    if (markers[id]) {
        // Update marker position
        markers[id].setLatLng([latitude, longitude]);
    
        // Update popup content and reopen it
        markers[id]
            .bindPopup(`<b>${name}<br>Latitude = ${latitude}<br>Longitude = ${longitude}</b>`)
            .openPopup();
    } else {
        // Create new marker
        markers[id] = L.marker([latitude, longitude], { icon: userIcon }).addTo(map);
    
        // Bind and open popup
        markers[id]
            .bindPopup(`<b>${name}<br>Latitude = ${latitude}<br>Longitude = ${longitude}</b>`)
            .openPopup();
    }    
});

// Remove disconnected users from the map and sidebar
socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }

    // Remove user from the list
    const userItem = document.getElementById(`user-${id}`);
    if (userItem) {
        userItem.remove();
    }
});

// Add button to center the map on the user
const centerButton = document.getElementById("center-map");

centerButton.addEventListener("click", () => {
    
    if (navigator.geolocation) {
        centerButton.textContent = "Loading...";
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latlng = [position.coords.latitude, position.coords.longitude];

                // Set map view only once
                map.setView(latlng, 10);
            },
            (error) => {
                console.error("Geolocation error:", error);
                centerButton.textContent = "Center on Me";
            },
            {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 5000
            }
        );
    }
});



document.getElementById("menu-toggle").addEventListener("click", function () {
    document.getElementById("sidebar").classList.toggle("active");
});
