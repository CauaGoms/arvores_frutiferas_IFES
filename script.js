document.addEventListener('DOMContentLoaded', () => {
    // Initialize Map
    // Start centered on the approximate location of the campus or a default view if data loads
    const map = L.map('map', {
        zoomControl: false // Disable default zoom control to add it later in a different position
    }).setView([-20.803, -41.155], 18); // Default to IFES Cachoeiro approx coords

    // Add Zoom Control to top-right to avoid conflict with sidebar toggle
    L.control.zoom({
        position: 'topright'
    }).addTo(map);

    // Add Tile Layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    // Variables
    const treeList = document.getElementById('tree-list');
    const infoCard = document.getElementById('info-card');
    const cardTitle = document.getElementById('card-title');
    const cardSpecies = document.getElementById('card-species');
    const cardDesc = document.getElementById('card-desc');
    const btnRoute = document.getElementById('btn-route');
    const routeStatus = document.getElementById('route-status');
    const closeCard = document.getElementById('close-card');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const searchInput = document.getElementById('search-input');

    let trees = [];
    let markers = {};
    let currentRouteControl = null;
    let selectedTree = null;

    // Helper: Determine Marker Style based on Tree Name
    function getTreeStyle(name) {
        const lowerName = name.toLowerCase();

        let style = { colorClass: 'marker-default', icon: 'fa-tree' };

        if (lowerName.includes('banana')) {
            style = { colorClass: 'marker-banana', icon: 'fa-leaf' };
        } else if (lowerName.includes('carambola')) {
            style = { colorClass: 'marker-carambola', icon: 'fa-star' };
        } else if (lowerName.includes('castanha')) {
            style = { colorClass: 'marker-castanha', icon: 'fa-seedling' };
        } else if (lowerName.includes('goiaba')) {
            style = { colorClass: 'marker-goiaba', icon: 'fa-apple-alt' };
        } else if (lowerName.includes('limo')) {
            style = { colorClass: 'marker-limao', icon: 'fa-lemon' };
        } else if (lowerName.includes('mangueira') || lowerName.includes('manga')) {
            style = { colorClass: 'marker-manga', icon: 'fa-cloud' }; // Shape somewhat like mango
        } else if (lowerName.includes('acerola')) {
            style = { colorClass: 'marker-acerola', icon: 'fa-circle' };
        } else if (lowerName.includes('coqueirinho') || lowerName.includes('butia')) {
            style = { colorClass: 'marker-coco', icon: 'fa-tree' };
        } else if (lowerName.includes('jambo')) {
            style = { colorClass: 'marker-jambo', icon: 'fa-tint' }; // Teardrop shape
        } else if (lowerName.includes('mamão')) {
            style = { colorClass: 'marker-mamao', icon: 'fa-leaf' };
        } else if (lowerName.includes('videira')) {
            style = { colorClass: 'marker-uva', icon: 'fa-wine-glass' };
        }

        return style;
    }

    // Helper: Create Custom DivIcon
    function createCustomIcon(style, isSelected = false) {
        return L.divIcon({
            className: `custom-tree-marker ${style.colorClass} ${isSelected ? 'selected' : ''}`,
            html: `<i class="fas ${style.icon}"></i>`,
            iconSize: [36, 36], // Slightly larger for better visibility
            iconAnchor: [18, 18],
            popupAnchor: [0, -20]
        });
    }

    // Helper: Parse CSV Line securely dealing with quotes
    function parseCSVLine(line) {
        const result = [];
        let startValueIndex = 0;
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') {
                inQuotes = !inQuotes;
            } else if (line[i] === ',' && !inQuotes) {
                let value = line.substring(startValueIndex, i).trim();
                // Remove surrounding quotes if they exist
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1);
                }
                // Unescape double quotes
                value = value.replace(/""/g, '"');
                result.push(value);
                startValueIndex = i + 1;
            }
        }
        // Push the last value
        let value = line.substring(startValueIndex).trim();
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
        }
        value = value.replace(/""/g, '"');
        result.push(value);

        return result;
    }

    // Helper: Parse DMS coordinates to Decimal Degrees
    function parseDMS(dmsStr) {
        if (!dmsStr) return null;
        // Expected format: 20°48'13.12"S or similar
        // Clean up the string first
        const cleanStr = dmsStr.replace(/\s/g, '').trim();

        // Regex to capture degrees, minutes, seconds and direction
        const regex = /(\d+)[°º](\d+)['’](\d+(?:\.\d+)?)["”]([NSWE])/i;
        const match = cleanStr.match(regex);

        if (match) {
            const degrees = parseFloat(match[1]);
            const minutes = parseFloat(match[2]);
            const seconds = parseFloat(match[3]);
            const direction = match[4].toUpperCase();

            let dd = degrees + minutes / 60 + seconds / 3600;

            if (direction === 'S' || direction === 'W') {
                dd = dd * -1;
            }
            return dd;
        }
        return null;
    }

    // Load Data
    fetch('arvores_frutiferas_IFES.csv')
        .then(response => {
            if (!response.ok) {
                throw new Error("Erro ao carregar o arquivo CSV.");
            }
            return response.text();
        })
        .then(csvText => {
            const lines = csvText.trim().split('\n');
            // Skip header (index 0)

            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;

                const cols = parseCSVLine(lines[i]);
                // Columns: [0] Espécie, [1] Nome Popular, [2] Descrição, [3] Coordenada 1, [4] Coordenada 2

                if (cols.length >= 5) {
                    const lat = parseDMS(cols[3]);
                    const lng = parseDMS(cols[4]);

                    if (lat && lng) {
                        const tree = {
                            id: i,
                            species: cols[0],
                            commonName: cols[1],
                            description: cols[2],
                            lat: lat,
                            lng: lng
                        };
                        trees.push(tree);
                        addMarker(tree);
                        addListItem(tree);
                    }
                }
            }
            // Fit bounds to show all markers
            if (trees.length > 0) {
                const group = new L.featureGroup(Object.values(markers));
                map.fitBounds(group.getBounds().pad(0.1));
            }
        })
        .catch(err => console.error("Erro:", err));

    function addMarker(tree) {
        const style = getTreeStyle(tree.commonName);
        const icon = createCustomIcon(style, false);

        const marker = L.marker([tree.lat, tree.lng], { icon: icon })
            .addTo(map)
            .bindPopup(`<b>${tree.commonName}</b><br>${tree.species}`);

        marker.on('click', () => {
            selectTree(tree);
        });

        // Store style for later use
        marker.treeStyle = style;
        markers[tree.id] = marker;
    }

    function addListItem(tree) {
        const li = document.createElement('li');
        li.className = 'tree-item';

        // Get icon for the list too
        const style = getTreeStyle(tree.commonName);

        li.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between;">
                <div>
                    <strong>${tree.commonName}</strong>
                    <small>${tree.species}</small>
                </div>
                <div class="custom-tree-marker ${style.colorClass}" style="position:relative; width:24px; height:24px; font-size:10px; border:1px solid white;">
                    <i class="fas ${style.icon}"></i>
                </div>
            </div>
            <p class="location"><i class="fas fa-map-marker-alt"></i> ${tree.description}</p>
        `;
        li.dataset.id = tree.id;
        li.addEventListener('click', () => {
            selectTree(tree);
            // On mobile, close sidebar after selection
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
            }
        });
        treeList.appendChild(li);
    }

    function selectTree(tree) {
        // Reset previously selected marker
        if (selectedTree && markers[selectedTree.id]) {
            const prevMarker = markers[selectedTree.id];
            prevMarker.setIcon(createCustomIcon(prevMarker.treeStyle, false));
            prevMarker.setZIndexOffset(0);
        }

        selectedTree = tree;

        // Update Info Card
        cardTitle.textContent = tree.commonName;
        cardSpecies.textContent = tree.species;
        cardDesc.textContent = tree.description;
        infoCard.classList.remove('hidden');

        // Update Marker
        if (markers[tree.id]) {
            const marker = markers[tree.id];
            marker.setIcon(createCustomIcon(marker.treeStyle, true));
            marker.setZIndexOffset(1000);
            map.flyTo([tree.lat, tree.lng], 19, {
                animate: true,
                duration: 1.5
            });
            marker.openPopup();
        }

        // Highlight in list
        document.querySelectorAll('.tree-item').forEach(item => {
            item.classList.remove('active');
            if (parseInt(item.dataset.id) === tree.id) {
                item.classList.add('active');
                item.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        // Clear route status/button
        routeStatus.textContent = "";
        btnRoute.disabled = false;
        btnRoute.textContent = "Traçar Rota";
    }

    // Search Logic
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const items = document.querySelectorAll('.tree-item');

        items.forEach(item => {
            const name = item.querySelector('strong').textContent.toLowerCase();
            const species = item.querySelector('small').textContent.toLowerCase();

            if (name.includes(term) || species.includes(term)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });

    // Routing Logic
    btnRoute.addEventListener('click', () => {
        if (!selectedTree) return;

        btnRoute.textContent = "Localizando você...";
        btnRoute.disabled = true;

        if (!navigator.geolocation) {
            alert("Seu navegador não suporta geolocalização.");
            btnRoute.textContent = "Erro de GPS";
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                btnRoute.textContent = "Traçando rota...";

                // Remove existing route
                if (currentRouteControl) {
                    map.removeControl(currentRouteControl);
                }

                // Create new route
                currentRouteControl = L.Routing.control({
                    waypoints: [
                        L.latLng(userLat, userLng),
                        L.latLng(selectedTree.lat, selectedTree.lng)
                    ],
                    routeWhileDragging: true,
                    lineOptions: {
                        styles: [{ color: '#6FA1EC', opacity: 1, weight: 5 }]
                    },
                    createMarker: function (i, wp, nWps) {
                        // Custom markers for start/end if needed, or null to obey default/markers
                        if (i === nWps - 1) {
                            return null; // Don't replace our destination marker
                        }
                        return L.marker(wp.latLng, {
                            draggable: true,
                            icon: L.icon({
                                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                                iconSize: [25, 41],
                                iconAnchor: [12, 41],
                                popupAnchor: [1, -34],
                                shadowSize: [41, 41]
                            })
                        }).bindPopup("Sua Localização");
                    },
                    addWaypoints: false,
                    draggableWaypoints: false,
                    fitSelectedRoutes: true,
                    show: false // Don't show the itinerary container by default
                }).addTo(map);

                // Handle Routing Errors
                currentRouteControl.on('routingerror', function (e) {
                    console.error('Routing error:', e);
                    alert("Não foi possível traçar a rota. Verifique se há caminhos mapeados até este local.");
                    btnRoute.textContent = "Erro na Rota";
                });

                currentRouteControl.on('routesfound', function (e) {
                    const routes = e.routes;
                    const summary = routes[0].summary;
                    // round to 1 decimal place
                    const dist = (summary.totalDistance / 1000).toFixed(2);
                    const time = Math.round(summary.totalTime / 60);
                    routeStatus.textContent = `Distância: ${dist} km | Tempo: ~${time} min`;
                    btnRoute.textContent = "Rota Traçada";

                    // Close card on mobile to see map
                    if (window.innerWidth <= 768) {
                        infoCard.classList.add('hidden');
                    }
                });
            },
            (error) => {
                console.error("Geolocation error:", error);
                let msg = "Erro ao obter localização.";
                if (error.code === 1) msg = "Permissão de localização negada.";
                else if (error.code === 2) msg = "Localização indisponível.";
                else if (error.code === 3) msg = "Tempo limite esgotado.";
                alert(msg);
                btnRoute.textContent = "Tentar Novamente";
                btnRoute.disabled = false;
            },
            { enableHighAccuracy: true }
        );
    });

    // UI Interactions
    closeCard.addEventListener('click', () => {
        infoCard.classList.add('hidden');
        if (selectedTree && markers[selectedTree.id]) {
            const marker = markers[selectedTree.id];
            marker.setIcon(createCustomIcon(marker.treeStyle, false));
            marker.setZIndexOffset(0);
            selectedTree = null;

            // Remove active class from list
            document.querySelectorAll('.tree-item').forEach(item => item.classList.remove('active'));
        }
    });

    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target) && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        }
    });
});