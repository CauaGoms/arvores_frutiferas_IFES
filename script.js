document.addEventListener('DOMContentLoaded', () => {
    // Initialize Map
    const map = L.map('map', {
        zoomControl: false
    }).setView([-20.803, -41.155], 18);

    L.control.zoom({
        position: 'topright'
    }).addTo(map);

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
    const seasonBadge = document.getElementById('season-badge');
    const seasonText = document.getElementById('season-text');
    const seasonMonths = document.getElementById('season-months');
    const benefitsText = document.getElementById('benefits-text');
    const btnRoute = document.getElementById('btn-route');
    const routeStatus = document.getElementById('route-status');
    const closeCard = document.getElementById('close-card');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const searchInput = document.getElementById('search-input');
    const tabs = document.querySelectorAll('.tab-btn');

    let treesData = [];
    let markers = {};
    let currentRouteControl = null;
    let selectedTree = null;
    let currentTab = 'all'; // 'all' or 'inseason'

    // Get current month (1-12)
    const currentMonth = new Date().getMonth() + 1;

    // Helper: Check if tree is in season
    function isTreeInSeason(tree) {
        return tree.harvestSeason.months.includes(currentMonth);
    }

    // Helper: Determine Marker Style
    function getTreeStyle(commonName) {
        const lowerName = commonName.toLowerCase();
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
            style = { colorClass: 'marker-manga', icon: 'fa-cloud' };
        } else if (lowerName.includes('acerola')) {
            style = { colorClass: 'marker-acerola', icon: 'fa-circle' };
        } else if (lowerName.includes('coqueirinho') || lowerName.includes('butia')) {
            style = { colorClass: 'marker-coco', icon: 'fa-tree' };
        } else if (lowerName.includes('jambo')) {
            style = { colorClass: 'marker-jambo', icon: 'fa-tint' };
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
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -20]
        });
    }

    // Load data from JSON
    fetch('trees-data.json')
        .then(response => {
            if (!response.ok) throw new Error('Erro ao carregar dados');
            return response.json();
        })
        .then(data => {
            treesData = data.trees;

            // Add markers to map
            treesData.forEach(tree => {
                addMarker(tree);
            });

            // Add items to list
            updateTreeList();

            // Fit bounds
            if (Object.keys(markers).length > 0) {
                const group = new L.featureGroup(Object.values(markers));
                map.fitBounds(group.getBounds().pad(0.1));
            }
        })
        .catch(err => console.error('Erro:', err));

    function addMarker(tree) {
        const style = getTreeStyle(tree.commonName);
        const icon = createCustomIcon(style, false);

        const marker = L.marker([tree.latitude, tree.longitude], { icon: icon })
            .addTo(map)
            .bindPopup(`<b>${tree.commonName}</b><br><small>${tree.species}</small>`);

        marker.on('click', () => {
            selectTree(tree);
        });

        marker.treeStyle = style;
        marker.treeId = tree.id;
        markers[tree.id] = marker;
    }

    function updateTreeList() {
        treeList.innerHTML = '';

        treesData.forEach(tree => {
            // Filter based on current tab
            if (currentTab === 'inseason' && !isTreeInSeason(tree)) {
                return;
            }

            const li = document.createElement('li');
            li.className = 'tree-item';
            li.dataset.id = tree.id;
            li.dataset.inSeason = isTreeInSeason(tree) ? 'true' : 'false';

            const style = getTreeStyle(tree.commonName);
            const inSeason = isTreeInSeason(tree);

            li.innerHTML = `
                <div class="tree-item-content">
                    <strong>${tree.commonName}</strong>
                    <small>${tree.species}</small>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <div class="tree-item-icon ${style.colorClass}">
                        <i class="fas ${style.icon}"></i>
                    </div>
                    <div class="season-badge-item ${inSeason ? 'in-season' : 'out-season'}"></div>
                </div>
            `;

            li.addEventListener('click', () => {
                selectTree(tree);
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                }
            });

            treeList.appendChild(li);
        });
    }

    function selectTree(tree) {
        // Reset previous marker
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
        benefitsText.textContent = tree.benefits;

        // Update Season Badge
        const inSeason = isTreeInSeason(tree);
        seasonBadge.className = `season-badge ${inSeason ? 'in-season' : 'out-season'}`;
        seasonText.textContent = tree.harvestSeason.pt;
        seasonMonths.textContent = tree.harvestSeason.pt;

        infoCard.classList.remove('hidden');

        // Update Marker
        if (markers[tree.id]) {
            const marker = markers[tree.id];
            marker.setIcon(createCustomIcon(marker.treeStyle, true));
            marker.setZIndexOffset(1000);
            map.flyTo([tree.latitude, tree.longitude], 19, {
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

        // Reset route button
        routeStatus.textContent = '';
        btnRoute.disabled = false;
        btnRoute.textContent = 'Traçar Rota';
    }

    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            updateTreeList();
        });
    });

    // Search
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

    // Routing
    btnRoute.addEventListener('click', () => {
        if (!selectedTree) return;

        btnRoute.textContent = 'Localizando você...';
        btnRoute.disabled = true;

        if (!navigator.geolocation) {
            alert('Seu navegador não suporta geolocalização.');
            btnRoute.textContent = 'Erro de GPS';
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                btnRoute.textContent = 'Traçando rota...';

                if (currentRouteControl) {
                    map.removeControl(currentRouteControl);
                }

                currentRouteControl = L.Routing.control({
                    waypoints: [
                        L.latLng(userLat, userLng),
                        L.latLng(selectedTree.latitude, selectedTree.longitude)
                    ],
                    routeWhileDragging: true,
                    lineOptions: {
                        styles: [{ color: '#27ae60', opacity: 1, weight: 5 }]
                    },
                    createMarker: function (i, wp, nWps) {
                        if (i === nWps - 1) return null;
                        return L.marker(wp.latLng, {
                            draggable: true,
                            icon: L.icon({
                                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                                iconSize: [25, 41],
                                iconAnchor: [12, 41],
                                popupAnchor: [1, -34],
                                shadowSize: [41, 41]
                            })
                        }).bindPopup('Sua Localização');
                    },
                    addWaypoints: false,
                    draggableWaypoints: false,
                    fitSelectedRoutes: true,
                    show: false
                }).addTo(map);

                currentRouteControl.on('routingerror', function (e) {
                    console.error('Routing error:', e);
                    alert('Não foi possível traçar a rota. Verifique se há caminhos mapeados até este local.');
                    btnRoute.textContent = 'Erro na Rota';
                });

                currentRouteControl.on('routesfound', function (e) {
                    const routes = e.routes;
                    const summary = routes[0].summary;
                    const dist = (summary.totalDistance / 1000).toFixed(2);
                    const time = Math.round(summary.totalTime / 60);
                    routeStatus.textContent = `📍 ${dist} km | ⏱️ ~${time} min`;
                    btnRoute.textContent = 'Rota Traçada';

                    if (window.innerWidth <= 768) {
                        infoCard.classList.add('hidden');
                    }
                });
            },
            (error) => {
                console.error('Geolocation error:', error);
                let msg = 'Erro ao obter localização.';
                if (error.code === 1) msg = 'Permissão de localização negada.';
                else if (error.code === 2) msg = 'Localização indisponível.';
                else if (error.code === 3) msg = 'Tempo limite esgotado.';
                alert(msg);
                btnRoute.textContent = 'Tentar Novamente';
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
            document.querySelectorAll('.tree-item').forEach(item => item.classList.remove('active'));
        }
    });

    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target) && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        }
    });
});
