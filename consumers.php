<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MARA Consumer Dashboard</title>
    
    <!-- External Libraries -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    
    <!-- Custom Stylesheet -->
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="consumers.css">
</head>
<body>

    <div id="dashboard-content">
        <!-- Background Pattern -->
        <div class="background-pattern"></div>
        
        <div class="ui-panel top-bar">
            <img src="logos/mara_logo.svg" alt="MARA Energy Map" class="top-bar-logo">
            <div class="top-bar-subtitle">Consumer Dashboard</div>
            <div class="top-bar-icons">
                <i class="fas fa-search"></i>
                <i class="fas fa-bell"></i>
                <i class="fas fa-cog"></i>
                <i class="fas fa-user-circle"></i>
            </div>
        </div>

        <!-- Navigation -->
        <div class="ui-panel navigation-panel">
            <a href="index.php" class="nav-item">
                <i class="fas fa-map"></i>
                <span>Energy Map</span>
            </a>
            <a href="consumers.php" class="nav-item active">
                <i class="fas fa-users"></i>
                <span>Consumers</span>
            </a>
            <a href="index.php" class="nav-item">
                <i class="fas fa-store"></i>
                <span>Marketplace</span>
            </a>
            <a href="#" class="nav-item">
                <i class="fas fa-chart-line"></i>
                <span>Analytics</span>
            </a>
            <a href="#" class="nav-item">
                <i class="fas fa-wallet"></i>
                <span>Wallet</span>
            </a>
        </div>

        <!-- Main Content Grid -->
        <div class="content-grid">
            <!-- Compute Prices Panel -->
            <div class="ui-panel compute-prices-panel">
                <div class="panel-header">
                    <i class="fas fa-microchip"></i>
                    <h3>Compute Prices</h3>
                    <div class="price-trend up">
                        <i class="fas fa-arrow-up"></i>
                        <span>+2.4%</span>
                    </div>
                </div>
                <div class="compute-grid">
                    <div class="compute-item">
                        <div class="compute-icon">
                            <i class="fas fa-brain"></i>
                        </div>
                        <div class="compute-details">
                            <div class="compute-name">AI Training</div>
                            <div class="compute-price">$0.42/kWh</div>
                            <div class="compute-availability">High Availability</div>
                        </div>
                        <div class="compute-status available"></div>
                    </div>
                    <div class="compute-item">
                        <div class="compute-icon">
                            <i class="fab fa-bitcoin"></i>
                        </div>
                        <div class="compute-details">
                            <div class="compute-name">Bitcoin Mining</div>
                            <div class="compute-price">$0.38/kWh</div>
                            <div class="compute-availability">Medium Availability</div>
                        </div>
                        <div class="compute-status limited"></div>
                    </div>
                    <div class="compute-item">
                        <div class="compute-icon">
                            <i class="fas fa-server"></i>
                        </div>
                        <div class="compute-details">
                            <div class="compute-name">Data Processing</div>
                            <div class="compute-price">$0.35/kWh</div>
                            <div class="compute-availability">High Availability</div>
                        </div>
                        <div class="compute-status available"></div>
                    </div>
                    <div class="compute-item">
                        <div class="compute-icon">
                            <i class="fas fa-cube"></i>
                        </div>
                        <div class="compute-details">
                            <div class="compute-name">3D Rendering</div>
                            <div class="compute-price">$0.45/kWh</div>
                            <div class="compute-availability">Low Availability</div>
                        </div>
                        <div class="compute-status busy"></div>
                    </div>
                </div>
            </div>

            <!-- Energy Trading Panel -->
            <div class="ui-panel energy-trading-panel">
                <div class="panel-header">
                    <i class="fas fa-bolt"></i>
                    <h3>Energy Trading</h3>
                    <div class="market-status live">
                        <div class="status-dot"></div>
                        <span>LIVE</span>
                    </div>
                </div>
                <div class="trading-section">
                    <div class="trading-tabs">
                        <div class="tab active" data-tab="buy">
                            <i class="fas fa-shopping-cart"></i>
                            <span>Buy Energy</span>
                        </div>
                        <div class="tab" data-tab="sell">
                            <i class="fas fa-tags"></i>
                            <span>Sell Energy</span>
                        </div>
                    </div>
                    <div class="trading-content">
                        <div class="tab-content active" id="buy-content">
                            <div class="price-display">
                                <div class="current-price">
                                    <span class="price-label">Current Market Price</span>
                                    <span class="price-value">$0.085/kWh</span>
                                </div>
                                <div class="price-change">
                                    <i class="fas fa-arrow-down"></i>
                                    <span>-0.02</span>
                                </div>
                            </div>
                            <div class="trading-form">
                                <div class="form-group">
                                    <label>Amount (kWh)</label>
                                    <input type="number" placeholder="1000" min="100" step="100">
                                </div>
                                <div class="form-group">
                                    <label>Total Cost</label>
                                    <div class="total-cost">$85.00</div>
                                </div>
                                <button class="trading-btn buy-btn">
                                    <i class="fas fa-shopping-cart"></i>
                                    Buy Energy
                                </button>
                            </div>
                        </div>
                        <div class="tab-content" id="sell-content">
                            <div class="price-display">
                                <div class="current-price">
                                    <span class="price-label">Sell Price</span>
                                    <span class="price-value">$0.092/kWh</span>
                                </div>
                                <div class="price-change">
                                    <i class="fas fa-arrow-up"></i>
                                    <span>+0.01</span>
                                </div>
                            </div>
                            <div class="trading-form">
                                <div class="form-group">
                                    <label>Amount (kWh)</label>
                                    <input type="number" placeholder="500" min="50" step="50">
                                </div>
                                <div class="form-group">
                                    <label>Total Revenue</label>
                                    <div class="total-revenue">$46.00</div>
                                </div>
                                <button class="trading-btn sell-btn">
                                    <i class="fas fa-tags"></i>
                                    Sell Energy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Mining Prices Panel -->
            <div class="ui-panel mining-prices-panel">
                <div class="panel-header">
                    <i class="fas fa-hammer"></i>
                    <h3>Mining Prices</h3>
                    <div class="bitcoin-price">
                        <i class="fab fa-bitcoin"></i>
                        <span>$43,250</span>
                    </div>
                </div>
                <div class="mining-grid">
                    <div class="mining-item">
                        <div class="mining-header">
                            <i class="fab fa-bitcoin"></i>
                            <span>Bitcoin</span>
                        </div>
                        <div class="mining-stats">
                            <div class="stat">
                                <span class="label">Hash Rate</span>
                                <span class="value">140 EH/s</span>
                            </div>
                            <div class="stat">
                                <span class="label">Difficulty</span>
                                <span class="value">72.5T</span>
                            </div>
                            <div class="stat">
                                <span class="label">Reward</span>
                                <span class="value">6.25 BTC</span>
                            </div>
                        </div>
                        <div class="mining-profitability">
                            <span class="profit-label">Daily Profit</span>
                            <span class="profit-value positive">$2,847</span>
                        </div>
                    </div>
                    <div class="mining-item">
                        <div class="mining-header">
                            <i class="fab fa-ethereum"></i>
                            <span>Ethereum</span>
                        </div>
                        <div class="mining-stats">
                            <div class="stat">
                                <span class="label">Hash Rate</span>
                                <span class="value">850 TH/s</span>
                            </div>
                            <div class="stat">
                                <span class="label">Difficulty</span>
                                <span class="value">12.8P</span>
                            </div>
                            <div class="stat">
                                <span class="label">Reward</span>
                                <span class="value">2 ETH</span>
                            </div>
                        </div>
                        <div class="mining-profitability">
                            <span class="profit-label">Daily Profit</span>
                            <span class="profit-value positive">$1,234</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Market Overview Panel -->
            <div class="ui-panel market-overview-panel">
                <div class="panel-header">
                    <i class="fas fa-chart-line"></i>
                    <h3>Market Overview</h3>
                    <div class="refresh-btn">
                        <i class="fas fa-sync-alt"></i>
                    </div>
                </div>
                <div class="market-metrics">
                    <div class="metric-item">
                        <div class="metric-icon">
                            <i class="fas fa-globe"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value">$0.087</div>
                            <div class="metric-label">Global Avg Price</div>
                        </div>
                        <div class="metric-change positive">
                            <i class="fas fa-arrow-up"></i>
                            <span>+1.2%</span>
                        </div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-icon">
                            <i class="fas fa-industry"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value">2.4 GW</div>
                            <div class="metric-label">Total Capacity</div>
                        </div>
                        <div class="metric-change positive">
                            <i class="fas fa-arrow-up"></i>
                            <span>+0.3%</span>
                        </div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value">1,247</div>
                            <div class="metric-label">Active Users</div>
                        </div>
                        <div class="metric-change positive">
                            <i class="fas fa-arrow-up"></i>
                            <span>+12</span>
                        </div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-icon">
                            <i class="fas fa-exchange-alt"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value">$2.1M</div>
                            <div class="metric-label">24h Volume</div>
                        </div>
                        <div class="metric-change negative">
                            <i class="fas fa-arrow-down"></i>
                            <span>-3.1%</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Price Chart Panel -->
            <div class="ui-panel price-chart-panel">
                <div class="panel-header">
                    <i class="fas fa-chart-area"></i>
                    <h3>Price History</h3>
                    <div class="chart-controls">
                        <button class="time-btn active" data-period="24h">24H</button>
                        <button class="time-btn" data-period="7d">7D</button>
                        <button class="time-btn" data-period="30d">30D</button>
                    </div>
                </div>
                <div class="chart-container">
                    <canvas id="priceChart"></canvas>
                </div>
            </div>

            <!-- Quick Actions Panel -->
            <div class="ui-panel quick-actions-panel">
                <div class="panel-header">
                    <i class="fas fa-rocket"></i>
                    <h3>Quick Actions</h3>
                </div>
                <div class="actions-grid">
                    <button class="action-btn">
                        <i class="fas fa-plus"></i>
                        <span>Add Compute</span>
                    </button>
                    <button class="action-btn">
                        <i class="fas fa-wallet"></i>
                        <span>Deposit Funds</span>
                    </button>
                    <button class="action-btn">
                        <i class="fas fa-download"></i>
                        <span>Withdraw</span>
                    </button>
                    <button class="action-btn">
                        <i class="fas fa-cog"></i>
                        <span>Settings</span>
                    </button>
                    <button class="action-btn">
                        <i class="fas fa-chart-bar"></i>
                        <span>Analytics</span>
                    </button>
                    <button class="action-btn">
                        <i class="fas fa-headset"></i>
                        <span>Support</span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script src="consumers.js"></script>
</body>
</html> 