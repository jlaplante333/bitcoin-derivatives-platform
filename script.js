document.addEventListener('DOMContentLoaded', () => {
    let map;
    let efficiencyChart;
    let siteMarkers = [];
    let allSitesData = [];
    let currentBestSite;
    let markerGroup;

    const siteDetailsPanel = document.getElementById('site-details-panel');
    const locationAnalysisPanel = document.getElementById('location-analysis-panel');
    const closeDetailsBtn = document.getElementById('close-details-btn');
    const updateDataBtn = document.getElementById('update-data-btn');
    const loadingToast = document.getElementById('loading-toast');
    const siteInfoPanel = document.getElementById('site-info-panel');
    const apiLogBox = document.getElementById('api-log-box');
    const apiLogContent = document.getElementById('api-log-content');
    const closeApiLogBtn = document.getElementById('close-api-log');
    const miniSatelliteIcon = document.getElementById('mini-satellite-icon');
    const aiActionButton = document.querySelector('.ai-action-btn');
    const aiConversationBox = document.getElementById('ai-conversation-box');
    
    closeDetailsBtn.addEventListener('click', () => {
        console.log('Close button clicked');
        hideSiteDetails();
    });

    aiActionButton.addEventListener('click', handleAIChat);

    closeApiLogBtn.addEventListener('click', () => {
        apiLogBox.classList.remove('show');
        // Show mini satellite icon when feed is closed
        miniSatelliteIcon.classList.add('show');
    });

    // Add click event for mini satellite icon to reopen the feed
    miniSatelliteIcon.addEventListener('click', () => {
        apiLogBox.classList.add('show');
        miniSatelliteIcon.classList.remove('show');
    });

    updateDataBtn.addEventListener('click', () => {
        console.log('Update data button clicked');
        updateDataWithRealTime();
    });

    const siteLocations = [
        { name: "Garden City, TX", lat: 31.8640, lon: -101.4812 },
        { name: "McCamey, TX", lat: 31.7833, lon: -102.2046 },
        { name: "Wolf Hollow, TX", lat: 32.3357, lon: -97.7335 },
        { name: "Texas Oil Field", lat: 31.0000, lon: -101.0000 },
        { name: "Ellendale, ND", lat: 46.1416, lon: -98.4662 },
        { name: "Jamestown, ND", lat: 46.9103, lon: -98.7039 },
        { name: "ND Oil Field", lat: 46.0000, lon: -102.0000 },
        { name: "Nebraska Solar", lat: 41.5000, lon: -99.6800 },
        { name: "Kearney, NE", lat: 40.6995, lon: -99.0819 },
        { name: "Murray, KY", lat: 36.6000, lon: -88.3121 },
        { name: "Hannibal, OH", lat: 40.7334, lon: -80.9430 },
        { name: "Hopedale, OH", lat: 40.3137, lon: -80.7530 },
        { name: "Findlay, OH", lat: 41.0442, lon: -83.6499 },
        { name: "Paraguay Hydro", lat: -25.4078, lon: -54.5892 },
        { name: "Granbury, TX", lat: 32.3357, lon: -97.7335 },
        { name: "Finland Pilot", lat: 60.1700, lon: 24.9400 },
        { name: "Masdar City, Abu Dhabi", lat: 24.4539, lon: 54.3773 },
        { name: "Mina Zayed, Abu Dhabi", lat: 24.5149, lon: 54.3900 }
    ];

    function initDashboard() {
        // --- Initialize Map ---
        map = L.map('maraMap', {
            zoomControl: false,
            attributionControl: false
        }).setView([20, 0], 2); // Start with a global view

        L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
            maxZoom: 20,
            attribution: '© Stadia Maps, © OpenMapTiles © OpenStreetMap contributors'
        }).addTo(map);

        // Close details panel when map is clicked
        map.on('click', () => {
            console.log('Map clicked, closing panel');
            hideSiteDetails();
        });

        // Initialize marker group
        markerGroup = L.featureGroup().addTo(map);

        // --- Initialize Chart ---
        const efficiencyCtx = document.getElementById('efficiencyChart').getContext('2d');
        efficiencyChart = new Chart(efficiencyCtx, {
            type: 'doughnut',
            data: { datasets: [{ data: [0, 100], backgroundColor: ['grey', 'rgba(0,0,0,0.2)'], borderWidth: 0 }] },
            options: { cutout: '85%', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }
        });
        
        // Load data (will use saved data if available, or fetch once if not)
        updateData();
        setInterval(updateData, 300000);
    }

    function updateData() {
        setLoadingMarkers();
        loadingToast.classList.add('show'); // Show loading toast
        apiLogBox.classList.add('show'); // Show API log box
        miniSatelliteIcon.classList.remove('show'); // Hide mini satellite icon
        addLogEntry('system', 'Initializing satellite uplink...');

        fetch('api.php')
            .then(response => { 
                if (!response.ok) throw new Error('Network response was not ok'); 
                addLogEntry('connection', 'Satellite connection established');
                return response.json(); 
            })
            .then(data => {
                allSitesData = data.sites;
                currentBestSite = data.bestSite;
                addLogEntry('data', `Received telemetry from ${data.sites.length} ground stations`);
                addLogEntry('success', `Primary station: ${data.bestSite.name} - Optimal performance detected`);
                
                setupSiteMarkers();
            })
            .catch(error => {
                console.error("Failed to load dashboard data:", error);
                addLogEntry('error', `Satellite uplink failure: ${error.message}`);
                clearMarkers();
            })
            .finally(() => {
                setTimeout(() => {
                    loadingToast.classList.remove('show'); // Hide loading toast
                }, 500); // Keep it visible for a moment longer
            });
    }

    function updateDataWithRealTime() {
        apiLogContent.innerHTML = ''; // Clear previous log entries
        // Show updating state on button
        updateDataBtn.classList.add('updating');
        updateDataBtn.querySelector('span').textContent = 'Updating...';
        
        // Get the current site name if panel is open
        const currentSiteName = document.getElementById('site-name-label').textContent;
        const isPanelOpen = siteDetailsPanel.classList.contains('show');
        
        // Build the API URL with parameters
        let apiUrl = 'api.php?force_refresh=true';
        if (isPanelOpen && currentSiteName) {
            apiUrl += `&site_name=${encodeURIComponent(currentSiteName)}`;
        }
        
        setLoadingMarkers(isPanelOpen && currentSiteName ? currentSiteName : null);
        loadingToast.classList.add('show');
        apiLogBox.classList.add('show');
        miniSatelliteIcon.classList.remove('show'); // Hide mini satellite icon
        addLogEntry('satellite', `Initiating real-time data transmission${isPanelOpen && currentSiteName ? ` to ${currentSiteName}` : ''}...`);

        fetch(apiUrl)
            .then(response => { 
                if (!response.ok) throw new Error('Network response was not ok'); 
                addLogEntry('nasa', 'NASA POWER API: Weather data transmission successful');
                addLogEntry('weather', 'Open-Meteo: Atmospheric conditions updated');
                return response.json(); 
            })
            .then(data => {
                allSitesData = data.sites;
                currentBestSite = data.bestSite;
                addLogEntry('data', `Real-time telemetry: ${data.sites.length} stations reporting`);
                addLogEntry('success', `Performance analysis complete - ${data.bestSite.name} leading`);
                
                // Update the currently displayed site if panel is open
                if (isPanelOpen && currentSiteName) {
                    const updatedSite = allSitesData.find(site => site.name === currentSiteName);
                    if (updatedSite) {
                        displaySiteData(updatedSite);
                        addLogEntry('info', `Display updated for station ${currentSiteName}`);
                    }
                }
                
                setupSiteMarkers();
                console.log('Data updated with real-time information');
                
                // Show success message
                const updateMessage = isPanelOpen && currentSiteName 
                    ? `Updated data for ${currentSiteName}`
                    : 'Fresh data loaded successfully';
                showToast('Data Updated', updateMessage);
            })
            .catch(error => {
                console.error("Failed to update data:", error);
                addLogEntry('error', `Transmission error: ${error.message}`);
                clearMarkers();
            })
            .finally(() => {
                // Reset button state
                updateDataBtn.classList.remove('updating');
                updateDataBtn.querySelector('span').textContent = 'Refresh Metrics';
                
                setTimeout(() => {
                    loadingToast.classList.remove('show');
                }, 500);
            });
    }

    function setLoadingMarkers(specificSiteName = null) {
        const loadingIcon = L.divIcon({ html: '<div class="marker-spinner"></div>', className: '', iconSize: [32, 32], iconAnchor: [16, 16] });

        if (specificSiteName) {
            // Only update the icon for the specific site being refreshed
            const markerToUpdate = siteMarkers.find(m => m.options.siteName === specificSiteName);
            if (markerToUpdate) {
                markerToUpdate.setIcon(loadingIcon);
            }
        } else {
            // Default behavior: clear all and show loading for all sites (initial load)
            clearMarkers();
            siteLocations.forEach(site => {
                const marker = L.marker([site.lat, site.lon], { icon: loadingIcon });
                siteMarkers.push(marker);
                markerGroup.addLayer(marker);
            });
        }
    }
    
    function setupSiteMarkers() {
        clearMarkers();
        const bestSiteColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-yellow').trim();

        allSitesData.forEach(site => {
            const isBest = site.name === currentBestSite.name;
            const iconData = getEnergyIcon(site.energy_type);

            // Create a div element for the icon, apply classes
            const markerEl = document.createElement('div');
            markerEl.innerHTML = iconData.icon;
            markerEl.className = 'custom-map-marker';
            
            if (isBest) {
                markerEl.style.color = bestSiteColor;
                markerEl.style.borderColor = bestSiteColor;
                markerEl.style.filter = `drop-shadow(0 0 12px ${bestSiteColor}B3)`;
                markerEl.classList.add('is-best');
                
                // Add mini star for best site
                const starIcon = document.createElement('div');
                starIcon.innerHTML = '<i class="fas fa-star"></i>';
                starIcon.className = 'best-site-star';
                starIcon.style.cssText = `
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: ${bestSiteColor};
                    color: white;
                    border-radius: 50%;
                    width: 16px;
                    height: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 8px;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    z-index: 1000;
                `;
                markerEl.appendChild(starIcon);
            } else {
                markerEl.style.color = iconData.color;
                markerEl.style.borderColor = iconData.color;
                markerEl.style.filter = `drop-shadow(0 0 10px ${iconData.color}99)`;
            }
            
            const customIcon = L.divIcon({
                html: markerEl.outerHTML,
                className: '', // Use our own styling, not leaflet's default
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });
            
            const marker = L.marker([site.lat, site.lon], { icon: customIcon, siteName: site.name })
                .on('click', (e) => {
                    L.DomEvent.stopPropagation(e); // Prevent map click from firing
                    displaySiteData(site)
                });
            
            siteMarkers.push(marker);
            markerGroup.addLayer(marker);
        });

        if (siteMarkers.length > 0) {
            map.flyToBounds(markerGroup.getBounds(), { 
                paddingTopLeft: L.point(50, 50),
                paddingBottomRight: L.point(-280, 50), // Increased right padding to shift focus left
                duration: 2.5 
            });
        }
    }

    function displaySiteData(site) {
        console.log('Displaying site data:', site);
        
        // --- Populate Panel ---
        const { name, avg_daily_kwh, weather, energy_type, performance_score, annual_kwh_yr, recommendation, hardware } = site;
        
        const iconData = getEnergyIcon(energy_type);

        // --- Populate Main Circular Panel (efficiency-display) ---
        const siteIconContainer = document.getElementById('site-icon-container');
        siteIconContainer.innerHTML = iconData.icon;
        siteIconContainer.style.color = iconData.color;

        document.getElementById('energy-type-label').textContent = energy_type;
        document.getElementById('site-main-value').textContent = Math.round(avg_daily_kwh);
        document.getElementById('site-main-value-unit').textContent = "kWh";
        
        // --- Populate Right-Side Info Panel (site-info-panel) ---
        document.getElementById('site-name-label').textContent = name;
        const siteInfoIcon = document.getElementById('site-info-icon');
        siteInfoIcon.innerHTML = iconData.icon;
        siteInfoIcon.style.color = iconData.color;
        document.getElementById('site-info-energy-type').textContent = energy_type;

        if (performance_score !== undefined && performance_score !== null) {
            document.getElementById('site-score-value').textContent = performance_score.toFixed(1);
        } else {
            document.getElementById('site-score-value').textContent = 'N/A';
        }

        // --- Populate Hardware Stats ---
        if (hardware) {
            document.getElementById('gpu-used-value').textContent = hardware.gpu_used.toLocaleString();
            document.getElementById('gpu-total-value').textContent = hardware.gpu_total.toLocaleString();
            document.getElementById('battery-capacity-value').textContent = hardware.battery_capacity_mwh;
        } else {
            document.getElementById('gpu-used-value').textContent = 'N/A';
            document.getElementById('gpu-total-value').textContent = '';
            document.getElementById('battery-capacity-value').textContent = 'N/A';
        }

        // --- Update Location Analysis Panel ---
        document.getElementById('location-kwh-value').textContent = Math.round(annual_kwh_yr).toLocaleString();
        document.getElementById('recommendation-text').textContent = recommendation;

        // Add a check for weather data to prevent errors
        if (weather && weather.current) {
            const tempValueEl = document.getElementById('site-temp-value');
            const cloudValueEl = document.getElementById('site-cloud-value');

            const temp = weather.current.temperature_2m;
            tempValueEl.textContent = `${temp}°C`;
            cloudValueEl.textContent = `${weather.current.cloud_cover}%`;

            document.getElementById('location-wind-value').textContent = weather.current.wind_speed_10m;
            document.getElementById('location-cloud-value').textContent = `${weather.current.cloud_cover}%`;

            // Example of dynamic styling
            if (temp > 30) {
                tempValueEl.classList.add('hot');
            } else {
                tempValueEl.classList.remove('hot');
            }
        } else {
            document.getElementById('site-temp-value').textContent = 'N/A';
            document.getElementById('site-cloud-value').textContent = 'N/A';
            document.getElementById('location-wind-value').textContent = 'N/A';
            document.getElementById('location-cloud-value').textContent = 'N/A';
        }
        
        // --- Update Chart ---
        const efficiencyValue = (avg_daily_kwh / currentBestSite.avg_daily_kwh) * 100;
        
        // Use the same color as the energy type icon for the chart
        efficiencyChart.data.datasets[0].data = [efficiencyValue, 100 - efficiencyValue];
        efficiencyChart.data.datasets[0].backgroundColor = [iconData.color, 'rgba(0,0,0,0.2)'];
        efficiencyChart.update();

        // --- Show Panel ---
        const panel = document.getElementById('site-details-panel');
        panel.classList.add('show');

        // --- Show Location Analysis Panel ---
        locationAnalysisPanel.classList.add('show');

        siteInfoPanel.classList.add('show');
    }

    function hideSiteDetails() {
        siteDetailsPanel.classList.remove('show');
        siteInfoPanel.classList.remove('show');
        locationAnalysisPanel.classList.remove('show');
    }

    function getEnergyIcon(type) {
        const energy = type.toLowerCase();
        const style = getComputedStyle(document.documentElement);

        if (energy.includes('wind')) return { 
            icon: '<i class="fas fa-wind"></i>', 
            color: style.getPropertyValue('--accent-cyan').trim()
        };
        if (energy.includes('solar')) return {
            icon: '<i class="fas fa-solar-panel"></i>',
            color: style.getPropertyValue('--accent-yellow').trim()
        };
        if (energy.includes('hydro')) return {
            icon: '<i class="fas fa-water"></i>',
            color: style.getPropertyValue('--accent-yellow').trim()
        };
        if (energy.includes('gas') || energy.includes('flaring')) return {
            icon: '<i class="fas fa-fire-flame-simple"></i>',
            color: style.getPropertyValue('--accent-orange').trim()
        };
        if (energy.includes('recycle')) return {
            icon: '<i class="fas fa-recycle"></i>',
            color: style.getPropertyValue('--accent-green').trim()
        };
        if (energy.includes('grid')) return {
            icon: '<i class="fas fa-plug"></i>',
            color: style.getPropertyValue('--accent-green').trim()
        };
        
        return { // Default
            icon: '<i class="fas fa-bolt"></i>',
            color: style.getPropertyValue('--text-secondary').trim()
        };
    }
    
    function clearMarkers() {
        if (markerGroup) {
            markerGroup.clearLayers();
        }
        siteMarkers = [];
    }

    function showToast(title, message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification show';
        toast.innerHTML = `
            <div class="toast-message">
                <strong>${title}</strong><br>
                <span class="toast-sources">${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }

    function addLogEntry(type, message) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        
        // Define icons for different message types
        const icons = {
            'system': 'fas fa-satellite',
            'success': 'fas fa-check-circle',
            'error': 'fas fa-exclamation-triangle',
            'warning': 'fas fa-exclamation-circle',
            'info': 'fas fa-info-circle',
            'nasa': 'fas fa-rocket',
            'weather': 'fas fa-cloud-sun',
            'satellite': 'fas fa-satellite-dish',
            'data': 'fas fa-database',
            'connection': 'fas fa-wifi'
        };
        
        // Determine which icon to use based on message content
        let iconType = type;
        if (message.toLowerCase().includes('nasa')) iconType = 'nasa';
        else if (message.toLowerCase().includes('weather') || message.toLowerCase().includes('meteo')) iconType = 'weather';
        else if (message.toLowerCase().includes('satellite')) iconType = 'satellite';
        else if (message.toLowerCase().includes('data')) iconType = 'data';
        else if (message.toLowerCase().includes('connection') || message.toLowerCase().includes('fetch')) iconType = 'connection';
        
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `
            <span class="log-time">${timeString}</span>
            <span class="log-message">
                <i class="${icons[iconType] || icons[type]}"></i>
                ${message}
            </span>
        `;
        
        apiLogContent.appendChild(logEntry);
        
        // Auto-scroll to bottom
        apiLogContent.scrollTop = apiLogContent.scrollHeight;
        
        // Keep only last 20 entries
        const entries = apiLogContent.querySelectorAll('.log-entry');
        if (entries.length > 20) {
            entries[0].remove();
        }
    }

    function handleAIChat() {
        const userMessage = "Find Location with Mara AI";
        addMessageToConversation('user', userMessage);
        
        // Disable button to prevent multiple requests
        aiActionButton.disabled = true;
        aiActionButton.style.cursor = 'not-allowed';
        
        // Show typing indicator
        const typingIndicator = addMessageToConversation('assistant', '<div class="spinner"></div><div class="spinner"></div><div class="spinner"></div>', true);

        // Prepare data to send to the backend
        const postData = {
            sites: allSitesData,
            bestSite: currentBestSite
        };

        fetch('api.php?action=get_ai_recommendation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData),
        })
            .then(response => response.json())
            .then(data => {
                typingIndicator.remove(); // Remove typing indicator
                if (data.recommendation) {
                    addMessageToConversation('assistant', data.recommendation);
                } else {
                    addMessageToConversation('assistant', 'Sorry, I could not get a recommendation.');
                }
            })
            .catch(error => {
                console.error("AI Chat Error:", error);
                typingIndicator.remove();
                addMessageToConversation('assistant', 'There was an error connecting to the AI service.');
            })
            .finally(() => {
                // Re-enable button
                aiActionButton.disabled = false;
                aiActionButton.style.cursor = 'pointer';
            });
    }

    function addMessageToConversation(sender, message, isTyping = false) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('ai-message', sender);
        if (isTyping) {
            messageElement.innerHTML = message;
        } else {
            messageElement.textContent = message;
        }
        aiConversationBox.appendChild(messageElement);
        // Scroll to the latest message
        aiConversationBox.scrollTop = aiConversationBox.scrollHeight;
        return messageElement;
    }

    initDashboard();
});