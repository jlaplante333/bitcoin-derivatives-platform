document.addEventListener('DOMContentLoaded', () => {
    let priceChart;
    
    // Initialize the dashboard
    initConsumersDashboard();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize price chart
    initPriceChart();
    
    // Start real-time updates
    startRealTimeUpdates();
    
    function initConsumersDashboard() {
        console.log('Initializing MARA Consumer Dashboard...');
        
        // Simulate real-time data updates
        updateMarketData();
        updateComputePrices();
        updateMiningData();
    }
    
    function setupEventListeners() {
        // Trading tabs
        const tradingTabs = document.querySelectorAll('.tab');
        tradingTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                switchTradingTab(targetTab);
            });
        });
        
        // Trading form inputs
        const buyInput = document.querySelector('#buy-content input[type="number"]');
        const sellInput = document.querySelector('#sell-content input[type="number"]');
        
        if (buyInput) {
            buyInput.addEventListener('input', (e) => {
                updateBuyTotal(e.target.value);
            });
        }
        
        if (sellInput) {
            sellInput.addEventListener('input', (e) => {
                updateSellTotal(e.target.value);
            });
        }
        
        // Trading buttons
        const buyBtn = document.querySelector('.buy-btn');
        const sellBtn = document.querySelector('.sell-btn');
        
        if (buyBtn) {
            buyBtn.addEventListener('click', handleBuyEnergy);
        }
        
        if (sellBtn) {
            sellBtn.addEventListener('click', handleSellEnergy);
        }
        
        // Chart time period buttons
        const timeButtons = document.querySelectorAll('.time-btn');
        timeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const period = btn.getAttribute('data-period');
                updateChartPeriod(period);
            });
        });
        
        // Refresh button
        const refreshBtn = document.querySelector('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', refreshMarketData);
        }
        
        // Quick action buttons
        const actionButtons = document.querySelectorAll('.action-btn');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', handleQuickAction);
        });
    }
    
    function switchTradingTab(tabName) {
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to selected tab and content
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-content`).classList.add('active');
        
        console.log(`Switched to ${tabName} tab`);
    }
    
    function updateBuyTotal(amount) {
        const price = 0.085; // Current buy price
        const total = (parseFloat(amount) || 0) * price;
        const totalElement = document.querySelector('.total-cost');
        if (totalElement) {
            totalElement.textContent = `$${total.toFixed(2)}`;
        }
    }
    
    function updateSellTotal(amount) {
        const price = 0.092; // Current sell price
        const total = (parseFloat(amount) || 0) * price;
        const totalElement = document.querySelector('.total-revenue');
        if (totalElement) {
            totalElement.textContent = `$${total.toFixed(2)}`;
        }
    }
    
    function handleBuyEnergy() {
        const amount = document.querySelector('#buy-content input[type="number"]').value;
        if (!amount || amount < 100) {
            showNotification('Please enter a valid amount (minimum 100 kWh)', 'error');
            return;
        }
        
        showNotification(`Buying ${amount} kWh of energy...`, 'info');
        
        // Simulate API call
        setTimeout(() => {
            showNotification(`Successfully purchased ${amount} kWh for $${(amount * 0.085).toFixed(2)}`, 'success');
            updateMarketData();
        }, 2000);
    }
    
    function handleSellEnergy() {
        const amount = document.querySelector('#sell-content input[type="number"]').value;
        if (!amount || amount < 50) {
            showNotification('Please enter a valid amount (minimum 50 kWh)', 'error');
            return;
        }
        
        showNotification(`Selling ${amount} kWh of energy...`, 'info');
        
        // Simulate API call
        setTimeout(() => {
            showNotification(`Successfully sold ${amount} kWh for $${(amount * 0.092).toFixed(2)}`, 'success');
            updateMarketData();
        }, 2000);
    }
    
    function updateChartPeriod(period) {
        // Remove active class from all time buttons
        document.querySelectorAll('.time-btn').forEach(btn => btn.classList.remove('active'));
        
        // Add active class to selected button
        document.querySelector(`[data-period="${period}"]`).classList.add('active');
        
        // Update chart data based on period
        updateChartData(period);
        
        console.log(`Updated chart to ${period} period`);
    }
    
    function initPriceChart() {
        const ctx = document.getElementById('priceChart');
        if (!ctx) return;
        
        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, 'rgba(78, 149, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(78, 149, 255, 0.0)');
        
        priceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: generateTimeLabels(24),
                datasets: [{
                    label: 'Energy Price',
                    data: generatePriceData(24),
                    borderColor: '#4E95FF',
                    backgroundColor: gradient,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#4E95FF',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#c0d0e0',
                            font: {
                                size: 10
                            }
                        }
                    },
                    y: {
                        display: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#c0d0e0',
                            font: {
                                size: 10
                            },
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                elements: {
                    point: {
                        hoverRadius: 6
                    }
                }
            }
        });
    }
    
    function generateTimeLabels(hours) {
        const labels = [];
        const now = new Date();
        
        for (let i = hours - 1; i >= 0; i--) {
            const time = new Date(now.getTime() - (i * 60 * 60 * 1000));
            labels.push(time.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            }));
        }
        
        return labels;
    }
    
    function generatePriceData(hours) {
        const data = [];
        let basePrice = 0.085;
        
        for (let i = 0; i < hours; i++) {
            // Add some realistic price variation
            const variation = (Math.random() - 0.5) * 0.02;
            const price = basePrice + variation;
            data.push(Math.max(0.05, Math.min(0.12, price)));
        }
        
        return data;
    }
    
    function updateChartData(period) {
        if (!priceChart) return;
        
        let hours, data;
        
        switch(period) {
            case '24h':
                hours = 24;
                data = generatePriceData(24);
                break;
            case '7d':
                hours = 168; // 7 days * 24 hours
                data = generatePriceData(168);
                break;
            case '30d':
                hours = 720; // 30 days * 24 hours
                data = generatePriceData(720);
                break;
            default:
                hours = 24;
                data = generatePriceData(24);
        }
        
        priceChart.data.labels = generateTimeLabels(hours);
        priceChart.data.datasets[0].data = data;
        priceChart.update('none');
    }
    
    function updateMarketData() {
        // Simulate real-time market data updates
        const metrics = [
            { value: '$0.087', change: '+1.2%', positive: true },
            { value: '2.4 GW', change: '+0.3%', positive: true },
            { value: '1,247', change: '+12', positive: true },
            { value: '$2.1M', change: '-3.1%', positive: false }
        ];
        
        const metricElements = document.querySelectorAll('.metric-change');
        metricElements.forEach((element, index) => {
            if (metrics[index]) {
                const icon = element.querySelector('i');
                const span = element.querySelector('span');
                
                if (icon) {
                    icon.className = metrics[index].positive ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
                }
                
                if (span) {
                    span.textContent = metrics[index].change;
                }
                
                element.className = `metric-change ${metrics[index].positive ? 'positive' : 'negative'}`;
            }
        });
    }
    
    function updateComputePrices() {
        // Simulate compute price updates
        const computeItems = document.querySelectorAll('.compute-item');
        computeItems.forEach(item => {
            const priceElement = item.querySelector('.compute-price');
            if (priceElement) {
                const currentPrice = parseFloat(priceElement.textContent.replace('$', '').replace('/kWh', ''));
                const variation = (Math.random() - 0.5) * 0.02;
                const newPrice = Math.max(0.30, Math.min(0.50, currentPrice + variation));
                priceElement.textContent = `$${newPrice.toFixed(2)}/kWh`;
            }
        });
    }
    
    function updateMiningData() {
        // Simulate mining data updates
        const bitcoinPrice = document.querySelector('.bitcoin-price span');
        if (bitcoinPrice) {
            const currentPrice = parseFloat(bitcoinPrice.textContent.replace('$', '').replace(',', ''));
            const variation = (Math.random() - 0.5) * 0.05;
            const newPrice = Math.max(40000, Math.min(50000, currentPrice * (1 + variation)));
            bitcoinPrice.textContent = `$${Math.round(newPrice).toLocaleString()}`;
        }
        
        // Update mining profitability
        const profitElements = document.querySelectorAll('.profit-value');
        profitElements.forEach(element => {
            const currentProfit = parseFloat(element.textContent.replace('$', '').replace(',', ''));
            const variation = (Math.random() - 0.5) * 0.1;
            const newProfit = Math.max(500, currentProfit * (1 + variation));
            element.textContent = `$${Math.round(newProfit).toLocaleString()}`;
        });
    }
    
    function refreshMarketData() {
        const refreshBtn = document.querySelector('.refresh-btn i');
        if (refreshBtn) {
            refreshBtn.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                refreshBtn.style.transform = 'rotate(0deg)';
            }, 1000);
        }
        
        updateMarketData();
        updateComputePrices();
        updateMiningData();
        
        showNotification('Market data refreshed', 'success');
    }
    
    function handleQuickAction() {
        const action = this.querySelector('span').textContent;
        showNotification(`${action} action triggered`, 'info');
        
        // Add specific functionality for each action
        switch(action) {
            case 'Add Compute':
                // Open compute configuration modal
                break;
            case 'Deposit Funds':
                // Open deposit modal
                break;
            case 'Withdraw':
                // Open withdrawal modal
                break;
            case 'Settings':
                // Open settings panel
                break;
            case 'Analytics':
                // Navigate to analytics page
                break;
            case 'Support':
                // Open support chat
                break;
        }
    }
    
    function startRealTimeUpdates() {
        // Update market data every 30 seconds
        setInterval(() => {
            updateMarketData();
        }, 30000);
        
        // Update compute prices every 60 seconds
        setInterval(() => {
            updateComputePrices();
        }, 60000);
        
        // Update mining data every 45 seconds
        setInterval(() => {
            updateMiningData();
        }, 45000);
        
        // Update chart data every 5 minutes
        setInterval(() => {
            if (priceChart) {
                const currentData = priceChart.data.datasets[0].data;
                const newPrice = currentData[currentData.length - 1] + (Math.random() - 0.5) * 0.01;
                currentData.push(Math.max(0.05, Math.min(0.12, newPrice)));
                currentData.shift();
                
                const now = new Date();
                const newLabel = now.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                });
                
                priceChart.data.labels.push(newLabel);
                priceChart.data.labels.shift();
                
                priceChart.update('none');
            }
        }, 300000);
    }
    
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            z-index: 10000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 5000);
    }
    
    function getNotificationIcon(type) {
        switch(type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    }
    
    function getNotificationColor(type) {
        switch(type) {
            case 'success': return 'linear-gradient(135deg, #50E3C2, #2ecc71)';
            case 'error': return 'linear-gradient(135deg, #ff6b6b, #e74c3c)';
            case 'warning': return 'linear-gradient(135deg, #ffd700, #f39c12)';
            default: return 'linear-gradient(135deg, #4E95FF, #3498db)';
        }
    }
    
    // Initialize with some sample data
    console.log('MARA Consumer Dashboard initialized successfully');
}); 