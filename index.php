<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MARA Energy Map</title>
    
    <!-- External Libraries -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    
    <!-- Custom Stylesheet -->
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <div id="dashboard-content">
        <div id="map-wrapper">
            <div id="maraMap"></div>
        </div>
        
        <!-- Mini Satellite Icon (shown when feed is closed) -->
        <div id="mini-satellite-icon" class="mini-satellite-icon">
            <i class="fas fa-satellite-dish"></i>
            <i class="fas fa-plus"></i>
        </div>
        
        <div class="ui-panel top-bar">
            <img src="logos/mara_logo.svg" alt="MARA Energy Map" class="top-bar-logo">
            <div class="top-bar-subtitle">Smart Energy Panel</div>
            <div class="top-bar-icons">
                <i class="fas fa-search"></i>
                <i class="fas fa-bell"></i>
                <i class="fas fa-cog"></i>
                <i class="fas fa-user-circle"></i>
            </div>
        </div>

        <!-- AI Side Panel -->
        <div class="ui-panel side-panel">
            <div class="side-panel-item" id="ai-location-btn">
                <i class="fas fa-map-marker-alt"></i>
                <span>Find Location with Mara AI</span>
            </div>
            <div class="side-panel-item" id="ai-facility-btn">
                <i class="fas fa-building"></i>
                <span>Find New Location for Facility</span>
            </div>
            <div class="side-panel-item" id="ai-analysis-btn">
                <i class="fas fa-chart-bar"></i>
                <span>AI Energy Analysis</span>
            </div>
        </div>
        
        <div class="ui-panel efficiency-display" id="site-details-panel">
            <div class="close-btn" id="close-details-btn">
                <i class="fas fa-times"></i>
                <span>Close</span>
            </div>
            <div id="efficiencyChartContainer">
                
                <canvas id="efficiencyChart"></canvas>
                <div class="chart-center-text">
                    <div id="site-icon-container"></div>
                    <span class="label" id="energy-type-label"></span>
                    <div class="main-value-container">
                        <span class="value" id="site-main-value"></span>
                        <span class="unit" id="site-main-value-unit"></span>
                    </div>
                </div>

                
                <div class="update-btn" id="update-data-btn">
                    <i class="fas fa-sync-alt"></i>
                    <span>Refresh Metrics</span>
                </div>
                <div class="progress-meter-label">Efficiency</div>
            </div>
        </div>

        <div class="ui-panel site-info-panel" id="site-info-panel">
            <div id="site-name-label"></div>
            <div class="info-grid">
                <div class="grid-item main-stat">
                    <div id="site-info-icon"></div>
                    <div class="value" id="site-info-energy-type"></div>
                </div>
                <div class="grid-item">
                    <div class="label"><i class="fas fa-server"></i> GPUs Active</div>
                    <div class="value">
                        <span id="gpu-used-value">-</span> / <span id="gpu-total-value">-</span>
                    </div>
                </div>
                <div class="grid-item">
                    <div class="label"><i class="fas fa-battery-full"></i> Battery</div>
                    <div class="value">
                        <span id="battery-capacity-value">-</span> MWh
                    </div>
                </div>
                <div class="grid-item">
                    <div class="label"><i class="fas fa-star"></i> Perf. Score</div>
                    <div class="value" id="site-score-value">-</div>
                </div>
                <div class="grid-item">
                    <div class="label"><i class="fas fa-thermometer-half"></i> Temp.</div>
                    <div class="value" id="site-temp-value">-</div>
                </div>
                <div class="grid-item">
                    <div class="label"><i class="fas fa-cloud"></i> Clouds</div>
                    <div class="value" id="site-cloud-value">-</div>
                </div>
            </div>
            
            <!-- Operation Mode Switches -->
            <div class="operation-switches">
                <div class="switch-item active" data-mode="mining">
                    <i class="fab fa-bitcoin"></i>
                    <span>Mining</span>
                </div>
                <div class="switch-item" data-mode="ai">
                    <i class="fas fa-brain"></i>
                    <span>AI</span>
                </div>
                <div class="switch-item" data-mode="buy">
                    <i class="fas fa-bolt"></i>
                    <span>Buy</span>
                </div>
                <div class="switch-item" data-mode="sell">
                    <i class="fas fa-plug"></i>
                    <span>Sell</span>
                </div>
                <div class="switch-item" data-mode="stock">
                    <i class="fas fa-battery-three-quarters"></i>
                    <span>Store</span>
                </div>
            </div>
        </div>

        <div class="ui-panel location-analysis" id="location-analysis-panel">
            <div class="location-stats" id="location-stats-container">
                <div class="location-stat">
                    <i class="fas fa-paper-plane"></i>
                    <div class="value" id="location-wind-value">-</div>
                    <div class="label">Wind (km/h)</div>
                </div>
                <div class="location-stat">
                    <i class="fas fa-solar-panel"></i>
                    <div class="value" id="location-kwh-value">-</div>
                    <div class="label">Solar kWh/yr</div>
                </div>
                 <div class="location-stat">
                    <i class="fas fa-cloud"></i>
                    <div class="value" id="location-cloud-value">-</div>
                    <div class="label">Cloud Cover</div>
                </div>
            </div>
            <div class="recommendation-text" id="recommendation-text">Select a site to see analysis.</div>
        </div>

        <div class="ui-panel ai-chatbot">
            <div class="chatbot-header">
                <p>Find optimal places for LG Battery installation</p>
                <div class="header-icons">
                    <img src="logos/lg_logo.svg" alt="LG Logo" class="header-logo">
                    <i class="fas fa-battery-full"></i>
                </div>
            </div>
            <div class="ai-conversation-box" id="ai-conversation-box">
                <!-- AI responses will be injected here -->
            </div>
            <button class="ai-action-btn">
                Find Location with Mara AI
                <i class="fas fa-arrow-right"></i>
            </button>
        </div>
    </div>

    <div id="loading-toast" class="toast-notification">
        <div class="toast-spinner"></div>
        <div class="toast-message">
            Loading data...<br>
            <span class="toast-sources">Using saved data or fetching from NASA POWER, Open-Meteo</span>
        </div>
    </div>

    <div id="api-log-box" class="api-log-notification">
        <div class="api-log-header">
            <div class="api-log-title">
                <i class="fas fa-satellite-dish"></i>
                <span>Satellite Feed</span>
                <div class="connection-status">
                    <div class="status-indicator active"></div>
                    <span>LIVE</span>
                </div>
            </div>
            <button id="close-api-log" class="close-api-log-btn">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="api-log-content" id="api-log-content">
            <div class="log-entry system">
                <span class="log-time">15:04:28</span>
                <span class="log-message">
                    <i class="fas fa-satellite"></i>
                    System initialized - Satellite connection established
                </span>
            </div>
        </div>
        <div class="api-log-footer">
            <div class="data-sources">
                <div class="source-item">
                    <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwIDJMMTIuNjEgNi4yNkwyMCA3LjI3TDE1IDEwLjc3TDE2LjE4IDE4LjAyTDEwIDE0Ljc3TDMuODIgMTguMDJMNSAxMC43N0wwIDcuMjdMNy4zOSA2LjI2TDEwIDJaIiBmaWxsPSIjRkZENzAwIi8+Cjwvc3ZnPgo=" alt="NASA" class="source-icon">
                    <span>NASA POWER</span>
                </div>
                <div class="source-item">
                    <i class="fas fa-cloud-sun"></i>
                    <span>Open-Meteo</span>
                </div>
            </div>
            <div class="signal-strength">
                <i class="fas fa-signal"></i>
                <div class="signal-bars">
                    <div class="bar active"></div>
                    <div class="bar active"></div>
                    <div class="bar active"></div>
                    <div class="bar active"></div>
                    <div class="bar"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Mara Mining Battery Management Button -->
    <div class="mara-button-box" id="mining-battery-btn">
        <div class="button-header">
            <i class="fas fa-battery-full"></i>
            <span>Mara Mining Battery Management</span>
        </div>
        <div class="button-content">
            <i class="fas fa-arrow-right"></i>
        </div>
    </div>

    <!-- Mara Hedging Panel Button -->
    <div class="mara-button-box" id="hedging-panel-btn">
        <div class="button-header">
            <i class="fas fa-chart-line"></i>
            <span>Mara Hedging Panel</span>
        </div>
        <div class="button-content">
            <i class="fas fa-arrow-right"></i>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>
