document.addEventListener('DOMContentLoaded', function() {
    flatpickr("#expiry-date", {
        altInput: true,
        altFormat: "F j, Y",
        dateFormat: "Y-m-d",
        theme: "dark"
    });

    const analyzeBtn = document.getElementById('analyze-btn');
    const analysisSummary = document.getElementById('analysis-summary');
    const confirmTradeBtn = document.getElementById('confirm-trade-btn');

    // --- Modal Logic ---
    const successModal = document.getElementById('success-modal');
    const modalCloseBtn = successModal.querySelector('.modal-close-btn');

    function showSuccessModal() {
        successModal.classList.remove('hidden');
    }

    function hideSuccessModal() {
        successModal.classList.add('hidden');
    }

    confirmTradeBtn.addEventListener('click', function() {
        // In a real app, you'd send the trade block to the server here
        console.log('Executing trade block...');
        showSuccessModal();
    });

    modalCloseBtn.addEventListener('click', hideSuccessModal);

    successModal.addEventListener('click', function(event) {
        if (event.target === successModal) {
            hideSuccessModal();
        }
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && !successModal.classList.contains('hidden')) {
            hideSuccessModal();
        }
    });

    const executeAITradesBtn = document.getElementById('execute-ai-trades-btn');
    if (executeAITradesBtn) {
        executeAITradesBtn.addEventListener('click', function() {
            console.log('Executing AI-recommended trade block...');
            showSuccessModal();
        });
    }

    function createFutureForecastChart() {
        const ctx = document.getElementById('futureForecastChart').getContext('2d');
        
        const labels = ['-2Y', '-1Y', 'Now', '+1Y', '+2Y'];
        const historicalData = [20, 45, 60, null, null];
        const forecastA = [null, null, 60, 90, 150];
        const forecastB = [null, null, 60, 80, 110];
        const forecastC = [null, null, 60, 70, 85];

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Historical Return',
                        data: historicalData,
                        borderColor: '#00ffff',
                        borderWidth: 3,
                        tension: 0.1,
                        pointRadius: 0
                    },
                    {
                        label: 'Best Case',
                        data: forecastA,
                        borderColor: '#ffbe86',
                        borderWidth: 3,
                        tension: 0.2,
                        pointRadius: 0
                    },
                    {
                        label: 'Medium Case',
                        data: forecastB,
                        borderColor: '#ffbe86',
                        borderWidth: 3,
                        tension: 0.2,
                        pointRadius: 0
                    },
                    {
                        label: 'Worst Case',
                        data: forecastC,
                        borderColor: '#ffbe86',
                        borderWidth: 3,
                        tension: 0.2,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { display: false },
                        ticks: { display: false }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false },
                    annotation: {
                        annotations: {
                            line1: {
                                type: 'line',
                                xMin: 'Now',
                                xMax: 'Now',
                                borderColor: 'rgba(255, 255, 255, 0.5)',
                                borderWidth: 2,
                                borderDash: [6, 6]
                            },
                            labelA: {
                                type: 'label',
                                xValue: labels[labels.length - 1],
                                yValue: forecastA[forecastA.length -1],
                                content: ['Best Case'],
                                color: '#ffbe86',
                                font: { size: 14, weight: 'bold' }
                            },
                            labelB: {
                                type: 'label',
                                xValue: labels[labels.length - 1],
                                yValue: forecastB[forecastB.length -1],
                                content: ['Medium Case'],
                                color: '#ffbe86',
                                font: { size: 14, weight: 'bold' }
                            },
                            labelC: {
                                type: 'label',
                                xValue: labels[labels.length - 1],
                                yValue: forecastC[forecastC.length -1],
                                content: ['Worst Case'],
                                color: '#ffbe86',
                                font: { size: 14, weight: 'bold' }
                            }
                        }
                    }
                }
            }
        });
    }

    function createMonteCarloChart() {
        const ctx = document.getElementById('monteCarloChart').getContext('2d');
        const simulations = 100;
        const timeHorizon = 12; // months
        const initialValue = 5.03; // Start with the last known market cap in Billions
        const drift = 0.15 / 12; // Assumed annual return
        const volatility = 0.80 / Math.sqrt(12); // Assumed annual volatility

        const datasets = [];
        const scenarios = [];

        for (let i = 0; i < simulations; i++) {
            const path = [initialValue];
            for (let t = 1; t < timeHorizon; t++) {
                const z = Math.sqrt(-2.0 * Math.log(Math.random())) * Math.cos(2.0 * Math.PI * Math.random()); // Standard normal random variable
                const nextValue = path[t-1] * Math.exp(drift - 0.5 * Math.pow(volatility, 2) + volatility * z);
                path.push(nextValue);
            }
            scenarios.push(path);
            datasets.push({
                label: `Simulation ${i + 1}`,
                data: path,
                borderColor: 'rgba(0, 255, 255, 0.1)',
                borderWidth: 1,
                pointRadius: 0,
                fill: false,
                tension: 0.3
            });
        }
        
        const labels = Array.from({length: timeHorizon}, (_, i) => `Month ${i+1}`);

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { 
                            color: '#ccc',
                            callback: function(value) { return '$' + value.toFixed(2) + 'B'; }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { 
                            color: '#ccc',
                            callback: function(value, index, values) {
                                const month = index + 1;
                                if (month % 3 === 0) {
                                    return `Month ${month}`;
                                }
                                return null;
                            }
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });

        return scenarios;
    }

    function create3dSurfacePlot() {
        const x = Array.from({length: 36}, (_, i) => i); // Time (months)
        const y = Array.from({length: 80}, (_, i) => i + 20); // Stock Price ($)
        const z = [];

        // Simulate a wavy surface for portfolio value
        for (let i = 0; i < x.length; i++) {
            const z_row = [];
            for (let j = 0; j < y.length; j++) {
                const value = Math.sin(x[i]/5) * Math.cos(y[j]/10) * 200 + (y[j] * 1.5) + (x[i] * 10);
                z_row.push(value);
            }
            z.push(z_row);
        }

        const data = [{
            z: z,
            x: x,
            y: y,
            type: 'surface',
            colorscale: 'Viridis'
        }];

        const layout = {
            title: 'Call Option Portfolio Sensitivity',
            scene: {
                xaxis: {title: 'Time (months)'},
                yaxis: {title: 'Stock Price ($)'},
                zaxis: {title: 'Gamma'}
            },
            autosize: true,
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: {
                color: '#f0f0f0'
            },
            margin: { l: 0, r: 0, b: 0, t: 40 }
        };

        Plotly.newPlot('portfolioSensitivityChart', data, layout, {responsive: true});
    }

    // --- Black-Scholes Implementation ---
    // Standard Normal C.D.F. (approximation)
    function CND(x) {
        let a1 = 0.319381530, a2 = -0.356563782, a3 = 1.781477937, a4 = -1.821255978, a5 = 1.330274429;
        let L = Math.abs(x);
        let k = 1.0 / (1.0 + 0.2316419 * L);
        let w = 1.0 - 1.0 / Math.sqrt(2 * Math.PI) * Math.exp(-L * L / 2) * (a1 * k + a2 * k * k + a3 * k * k * k + a4 * k * k * k * k + a5 * k * k * k * k * k);
        if (x < 0) {
            return 1.0 - w;
        }
        return w;
    }

    function blackScholes(S, K, T, r, v, type) {
        let d1 = (Math.log(S / K) + (r + v * v / 2) * T) / (v * Math.sqrt(T));
        let d2 = d1 - v * Math.sqrt(T);
        if (type === "Call") {
            return S * CND(d1) - K * Math.exp(-r * T) * CND(d2);
        } else { // Put
            return K * Math.exp(-r * T) * CND(-d2) - S * CND(-d1);
        }
    }
    // --- End of Black-Scholes ---

    let compositePayoffChart;
    let allContracts;

    function generateContracts() {
        const btcOptions = [];
        const btcFutures = [];
        const electricityOptions = [];
        const electricityFutures = [];
        const today = new Date();

        // Generate Bitcoin Options (10 call, 40 put)
        for (let i = 0; i < 50; i++) {
            const expiry = new Date(today);
            expiry.setDate(today.getDate() + 30 + (i * 15)); // Staggered expiries
            btcOptions.push({
                id: `BTC-OPT-${i + 1}`,
                asset: 'BTC',
                type: i < 10 ? 'Call' : 'Put',
                expiry: expiry.toISOString().split('T')[0],
                strike: 65000 + (i * 250 - 5000),
                forward: 65100 + (i * 250 - 5000),
                iv: 0.75 + Math.random() * 0.1
            });
        }

        // Generate Bitcoin Futures
        for (let i = 0; i < 20; i++) {
            const expiry = new Date(today);
            expiry.setDate(today.getDate() + 60 + (i * 30));
            btcFutures.push({
                id: `BTC-FUT-${i + 1}`,
                asset: 'BTC',
                type: 'Future',
                expiry: expiry.toISOString().split('T')[0],
                strike: 68000 + (i * 500),
                forward: 68150 + (i * 500)
            });
        }

        // Generate Electricity Options (10 call, 40 put)
        for (let i = 0; i < 50; i++) {
            const expiry = new Date(today);
            expiry.setDate(today.getDate() + 30 + (i * 15)); // Staggered expiries
            electricityOptions.push({
                id: `E-OPT-${i + 1}`,
                asset: 'Electricity',
                type: i < 10 ? 'Call' : 'Put',
                expiry: expiry.toISOString().split('T')[0],
                strike: (45 + (i * 0.5 - 5)).toFixed(2), // Price in $/MWh
                forward: (45.5 + (i * 0.5 - 5)).toFixed(2),
                iv: 0.35 + Math.random() * 0.1
            });
        }

        // Generate Electricity Futures
        for (let i = 0; i < 20; i++) {
            const expiry = new Date(today);
            expiry.setDate(today.getDate() + 60 + (i * 30));
            electricityFutures.push({
                id: `E-FUT-${i + 1}`,
                asset: 'Electricity',
                type: 'Future',
                expiry: expiry.toISOString().split('T')[0],
                strike: (50 + (i * 1.5)).toFixed(2), // Price in $/MWh
                forward: (50.5 + (i * 1.5)).toFixed(2)
            });
        }

        return { btcOptions, btcFutures, electricityOptions, electricityFutures };
    }

    function populateCompositeDashboard(contracts) {
        const optionsBody = document.getElementById('options-contracts-body');
        const futuresBody = document.getElementById('futures-contracts-body');
        optionsBody.innerHTML = '';
        futuresBody.innerHTML = '';

        contracts.btcOptions.forEach(c => {
            optionsBody.innerHTML += `
                <tr>
                    <td>${c.id}</td>
                    <td>${c.asset}</td>
                    <td>${c.type}</td>
                    <td>${c.expiry}</td>
                    <td>$${c.strike.toLocaleString()}</td>
                    <td>$${c.forward.toLocaleString()}</td>
                    <td>${(c.iv * 100).toFixed(2)}%</td>
                </tr>
            `;
        });

        contracts.btcFutures.forEach(c => {
            futuresBody.innerHTML += `
                <tr>
                    <td>${c.id}</td>
                    <td>${c.asset}</td>
                    <td>${c.type}</td>
                    <td>${c.expiry}</td>
                    <td>$${c.strike.toLocaleString()}</td>
                    <td>$${c.forward.toLocaleString()}</td>
                </tr>
            `;
        });
    }

    function populateElectricityDashboard(contracts) {
        const optionsBody = document.getElementById('electricity-options-contracts-body');
        const futuresBody = document.getElementById('electricity-futures-contracts-body');
        optionsBody.innerHTML = '';
        futuresBody.innerHTML = '';

        contracts.electricityOptions.forEach(c => {
            optionsBody.innerHTML += `
                <tr>
                    <td>${c.id}</td>
                    <td>${c.asset}</td>
                    <td>${c.type}</td>
                    <td>${c.expiry}</td>
                    <td>$${c.strike}/MWh</td>
                    <td>$${c.forward}/MWh</td>
                    <td>${(c.iv * 100).toFixed(2)}%</td>
                </tr>
            `;
        });

        contracts.electricityFutures.forEach(c => {
            futuresBody.innerHTML += `
                <tr>
                    <td>${c.id}</td>
                    <td>${c.asset}</td>
                    <td>${c.type}</td>
                    <td>${c.expiry}</td>
                    <td>$${c.strike}/MWh</td>
                    <td>$${c.forward}/MWh</td>
                </tr>
            `;
        });
    }
    
    function createCompositePayoffChart(contracts, btcPriceScenarios) {
        const ctx = document.getElementById('compositePayoffChart').getContext('2d');
        const timeHorizon = 12; // months
        const r = 0.05; // Assumed risk-free rate
        
        const datasets = [];

        btcPriceScenarios.forEach(scenario => {
            const portfolioValuePath = [];
            for (let t = 0; t < timeHorizon; t++) {
                const T = (timeHorizon - t) / 12.0; // Time to expiry in years for this step
                const currentBtcPrice = scenario[t] * 1e9 / 45000; // Convert market cap to a single BTC price
                
                let portfolioValue = 0;
                contracts.btcOptions.forEach(c => {
                    const timeToContractExpiry = (new Date(c.expiry) - new Date()) / (1000 * 60 * 60 * 24 * 365);
                    const T_eff = Math.max(0, timeToContractExpiry - t/12.0);
                    if (T_eff > 0) {
                        portfolioValue += blackScholes(currentBtcPrice, c.strike, T_eff, r, c.iv, c.type);
                    }
                });
                contracts.btcFutures.forEach(c => {
                    const timeToContractExpiry = (new Date(c.expiry) - new Date()) / (1000 * 60 * 60 * 24 * 365);
                     if (timeToContractExpiry > t/12.0) {
                        if (c.type === 'Long') {
                            portfolioValue += currentBtcPrice - c.strike;
                        } else { // Short
                            portfolioValue += c.strike - currentBtcPrice;
                        }
                     }
                });
                portfolioValuePath.push(portfolioValue);
            }

            datasets.push({
                label: `Scenario`,
                data: portfolioValuePath,
                borderColor: 'rgba(0, 255, 255, 0.1)',
                borderWidth: 1.5,
                pointRadius: 0,
                fill: false
            });
        });

        const labels = Array.from({length: timeHorizon}, (_, i) => `Month ${i+1}`);

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        title: { display: true, text: 'Portfolio Value ($)', color: '#ccc' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { 
                            color: '#ccc',
                            callback: function(value) { return '$' + value.toLocaleString(); }
                        }
                    },
                    x: {
                        title: { display: true, text: 'Time', color: '#ccc' },
                        grid: { display: false },
                        ticks: { color: '#ccc' }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false },
                }
            }
        });
    }

    function createElectricityHedgingChart(contracts, electricityPriceScenarios) {
        const ctx = document.getElementById('electricityHedgingChart').getContext('2d');
        const timeHorizon = 12; // months
        const r = 0.05; // Assumed risk-free rate

        const datasets = [];

        electricityPriceScenarios.forEach(scenario => {
            const portfolioValuePath = [];
            for (let t = 0; t < timeHorizon; t++) {
                // The electricity monte carlo now simulates market cap. We need to derive a $/MWh price from it.
                // This is a simplified, hypothetical relationship for visualization.
                const basePriceMWh = 45; // Base price for electricity in $/MWh
                const priceSensitivity = 15; // How much the price changes with market cap
                const marketCapRatio = scenario[t] / 5.03; // Compare to a baseline market cap
                const currentElectricityPrice = basePriceMWh + (marketCapRatio - 1) * priceSensitivity;
                
                let portfolioValue = 0;

                contracts.electricityOptions.forEach(c => {
                    const timeToContractExpiry = (new Date(c.expiry) - new Date()) / (1000 * 60 * 60 * 24 * 365);
                    const T_eff = Math.max(0, timeToContractExpiry - t/12.0);
                    if (T_eff > 0) {
                        portfolioValue += blackScholes(currentElectricityPrice, parseFloat(c.strike), T_eff, r, c.iv, c.type);
                    }
                });

                contracts.electricityFutures.forEach(c => {
                    const timeToContractExpiry = (new Date(c.expiry) - new Date()) / (1000 * 60 * 60 * 24 * 365);
                     if (timeToContractExpiry > t/12.0) {
                        // Assuming all futures are 'Long' for this calculation
                        portfolioValue += currentElectricityPrice - parseFloat(c.strike);
                     }
                });
                portfolioValuePath.push(portfolioValue);
            }

            datasets.push({
                label: `Scenario`,
                data: portfolioValuePath,
                borderColor: 'rgba(255, 215, 0, 0.4)',
                borderWidth: 1.5,
                pointRadius: 0,
                fill: false
            });
        });

        const labels = Array.from({length: timeHorizon}, (_, i) => `Month ${i+1}`);

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        title: { display: true, text: 'Portfolio Value ($)', color: '#ccc' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: {
                            color: '#ccc',
                            callback: function(value) { return '$' + value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}); }
                        }
                    },
                    x: {
                        title: { display: true, text: 'Time', color: '#ccc' },
                        grid: { display: false },
                        ticks: { color: '#ccc' }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false },
                }
            }
        });
    }

    function createElectricityMonteCarloChart() {
        const ctx = document.getElementById('electricityMonteCarloChart').getContext('2d');
        const simulations = 100;
        const timeHorizon = 12; // months
        const initialValue = 5.03; // $/kWh -> Start with the last known market cap in Billions
        const drift = 0.15 / 12; 
        const volatility = 0.80 / Math.sqrt(12);

        const datasets = [];
        const scenarios = [];

        for (let i = 0; i < simulations; i++) {
            const path = [initialValue];
            for (let t = 1; t < timeHorizon; t++) {
                const z = Math.sqrt(-2.0 * Math.log(Math.random())) * Math.cos(2.0 * Math.PI * Math.random());
                const nextValue = path[t-1] * Math.exp(drift - 0.5 * Math.pow(volatility, 2) + volatility * z);
                path.push(nextValue);
            }
            scenarios.push(path);
            // Glow effect
            datasets.push({
                data: path,
                borderColor: 'rgba(255, 255, 0, 0.2)',
                borderWidth: 5,
                pointRadius: 0,
                fill: false,
                tension: 0.2
            });
            // Main line
            datasets.push({
                label: `Simulation ${i + 1}`,
                data: path,
                borderColor: 'rgba(255, 255, 150, 0.8)',
                borderWidth: 1.5,
                pointRadius: 0,
                fill: false,
                tension: 0.2
            });
        }
        
        const labels = Array.from({length: timeHorizon}, (_, i) => `Month ${i+1}`);

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: { color: 'rgba(255, 255, 0, 0.1)' },
                        ticks: { 
                            color: '#ccc',
                            callback: function(value) { return '$' + value.toFixed(2) + 'B'; }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#ccc',
                            callback: function(value, index, values) {
                                const month = index + 1;
                                if (month % 3 === 0) {
                                    return `Month ${month}`;
                                }
                                return null;
                            }
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });

        return scenarios;
    }

    function createCompositeBitcoinChart(contracts, btcPriceScenarios) {
        const ctx = document.getElementById('compositeBitcoinChart').getContext('2d');
        const timeHorizon = 12;
        const r = 0.05;
        const labels = Array.from({length: timeHorizon}, (_, i) => `Month ${i+1}`);

        // Calculate portfolio paths and then the combined value
        const combinedPaths = btcPriceScenarios.map(scenario => {
            const combinedValuePath = [];
            for (let t = 0; t < timeHorizon; t++) {
                const currentBtcPrice = scenario[t] * 1e9 / 45000;
                let portfolioValue = 0;
                contracts.btcOptions.forEach(c => {
                    const timeToContractExpiry = (new Date(c.expiry) - new Date()) / (31536000000);
                    const T_eff = Math.max(0, timeToContractExpiry - t/12.0);
                    if (T_eff > 0) portfolioValue += blackScholes(currentBtcPrice, c.strike, T_eff, r, c.iv, c.type);
                });
                contracts.btcFutures.forEach(c => {
                    const timeToContractExpiry = (new Date(c.expiry) - new Date()) / (31536000000);
                     if (timeToContractExpiry > t/12.0) {
                        if (c.type === 'Long') portfolioValue += currentBtcPrice - c.strike;
                        else portfolioValue += c.strike - currentBtcPrice;
                     }
                });
                // Add portfolio value (in billions) to market cap (in billions)
                const combinedValue = scenario[t] + (portfolioValue / 1e9);
                combinedValuePath.push(combinedValue);
            }
            return combinedValuePath;
        });

        const datasets = combinedPaths.map(path => ({
            label: 'Combined Value',
            data: path,
            borderColor: 'rgba(0, 255, 255, 0.2)',
            borderWidth: 1.5,
            pointRadius: 0,
        }));

        new Chart(ctx, {
            type: 'line',
            data: { labels: labels, datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#ccc',
                            callback: function(value, index, values) {
                                const month = index + 1;
                                if (month % 3 === 0) {
                                    return `Month ${month}`;
                                }
                                return null;
                            }
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Combined Value ($B)', color: '#00ffff' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#00ffff', callback: value => '$' + value.toFixed(2) + 'B' }
                    }
                }
            }
        });
    }

    function createCompositeElectricityChart(contracts, electricityPriceScenarios) {
        const ctx = document.getElementById('compositeElectricityChart').getContext('2d');
        const timeHorizon = 12;
        const r = 0.05;
        const labels = Array.from({length: timeHorizon}, (_, i) => `Month ${i+1}`);

        // Calculate portfolio paths and then the combined value
        const combinedPaths = electricityPriceScenarios.map(scenario => {
            const combinedValuePath = [];
            for (let t = 0; t < timeHorizon; t++) {
                const basePriceMWh = 45, priceSensitivity = 15;
                const marketCapRatio = scenario[t] / 5.03;
                const currentElectricityPrice = basePriceMWh + (marketCapRatio - 1) * priceSensitivity;
                let portfolioValue = 0;
                contracts.electricityOptions.forEach(c => {
                    const timeToContractExpiry = (new Date(c.expiry) - new Date()) / (31536000000);
                    const T_eff = Math.max(0, timeToContractExpiry - t/12.0);
                    if (T_eff > 0) portfolioValue += blackScholes(currentElectricityPrice, parseFloat(c.strike), T_eff, r, c.iv, c.type);
                });
                contracts.electricityFutures.forEach(c => {
                    const timeToContractExpiry = (new Date(c.expiry) - new Date()) / (31536000000);
                    if (timeToContractExpiry > t/12.0) portfolioValue += currentElectricityPrice - parseFloat(c.strike);
                });
                
                // Add portfolio value (in billions) to market cap (in billions)
                const combinedValue = scenario[t] + (portfolioValue / 1e9);
                combinedValuePath.push(combinedValue);
            }
            return combinedValuePath;
        });

        const datasets = combinedPaths.map(path => ({
            label: 'Combined Value',
            data: path,
            borderColor: 'rgba(255, 215, 0, 0.5)',
            borderWidth: 1.5,
            pointRadius: 0,
        }));

        new Chart(ctx, {
            type: 'line',
            data: { labels: labels, datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#ccc' }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Combined Value ($B)', color: '#ffd700' },
                        grid: { color: 'rgba(255, 255, 0, 0.1)' },
                        ticks: { color: '#ffd700', callback: value => '$' + value.toFixed(2) + 'B' }
                    }
                }
            }
        });
    }

    analyzeBtn.addEventListener('click', function() {
        analysisSummary.classList.remove('hidden');
        // In a real app, the summary would be more dynamic
    });

    function loadMarketData() {
        fetch('/market_data')
            .then(response => response.json())
            .then(data => {
                // We only need the latest data point for the widget
                if (data.length > 0) {
                    const latestData = data[0];
                    const energyPriceEl = document.getElementById('energy-price-widget');
                    const hashPriceEl = document.getElementById('hash-price-widget');
                    const tokenPriceEl = document.getElementById('token-price-widget');

                    if (energyPriceEl) {
                        energyPriceEl.textContent = `$${latestData.energy_price.toFixed(4)}`;
                    }
                    if (hashPriceEl) {
                        hashPriceEl.textContent = `$${latestData.hash_price.toFixed(4)}`;
                    }
                    if (tokenPriceEl) {
                        tokenPriceEl.textContent = `$${latestData.token_price.toFixed(4)}`;
                    }
                }
            })
            .catch(error => console.error('Error fetching market data:', error));
    }

    function populateAiStrategyTable() {
        const tableBody = document.getElementById('ai-strategy-input-body');
        if (!tableBody) return;

        const timeHorizons = [
            { horizon: '1-Day', exposure: '2%', delta: '0.1 | 0.05', vega: '500' },
            { horizon: '1-Week', exposure: '5%', delta: '0.2 | 0.1', vega: '1,200' },
            { horizon: '2-Weeks', exposure: '8%', delta: '0.3 | 0.15', vega: '2,000' },
            { horizon: '1-Month', exposure: '10%', delta: '0.4 | 0.2', vega: '3,500' },
            { horizon: '6-Weeks', exposure: '12%', delta: '0.5 | 0.25', vega: '4,500' },
            { horizon: '2-Months', exposure: '15%', delta: '0.6 | 0.3', vega: '6,000' },
            { horizon: '3-Months', exposure: '20%', delta: '0.7 | 0.4', vega: '8,000' },
            { horizon: '6-Months', exposure: '30%', delta: '0.8 | 0.5', vega: '15,000' }
        ];

        tableBody.innerHTML = ''; // Clear existing rows

        timeHorizons.forEach(params => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${params.horizon}</td>
                <td>${params.exposure}</td>
                <td>${params.delta}</td>
                <td>${params.vega}</td>
                <td>
                    <button class="execute-ai-row-btn" 
                            data-horizon="${params.horizon}" 
                            data-exposure="${params.exposure}" 
                            data-delta="${params.delta}" 
                            data-vega="${params.vega}">
                        Analyze
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Add event listeners to new buttons
        document.querySelectorAll('.execute-ai-row-btn').forEach(button => {
            button.addEventListener('click', handleAiAnalysis);
        });
    }

    async function handleAiAnalysis(event) {
        const button = event.currentTarget;
        const dataset = button.dataset;

        // Disable button and show loading state
        button.disabled = true;
        button.textContent = 'Analyzing...';

        const recommendationContainer = document.getElementById('ai-recommendation-dashboard');
        const recommendationBody = document.getElementById('ai-recommendation-body');
        const executeBtn = document.getElementById('execute-ai-trades-btn');

        recommendationBody.innerHTML = '<p>Generating AI strategy... please wait.</p>';
        recommendationContainer.classList.remove('hidden');
        
        // --- Data Wrangling ---
        // 1. Parse Horizon
        let timeHorizonDays;
        const horizonStr = dataset.horizon.toLowerCase();
        if (horizonStr.includes('day')) {
            timeHorizonDays = parseInt(horizonStr);
        } else if (horizonStr.includes('week')) {
            timeHorizonDays = parseInt(horizonStr) * 7;
        } else if (horizonStr.includes('month')) {
            timeHorizonDays = parseInt(horizonStr) * 30;
        } else {
            timeHorizonDays = 30; // Default
        }

        // 2. Parse Deltas
        const [btcDelta, energyDelta] = dataset.delta.split('|').map(s => parseFloat(s.trim()));

        // 3. Clean other inputs
        const exposure = parseFloat(dataset.exposure.replace('%', ''));
        const vega = parseFloat(dataset.vega.replace(/,/g, ''));


        try {
            const response = await fetch('/ai_analysis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    time_horizon: timeHorizonDays,
                    exposure: exposure,
                    btc_delta: btcDelta,
                    energy_delta: energyDelta,
                    vega: vega
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.error) {
                recommendationBody.innerHTML = `<p style="color: #ff8c8c;">Error: ${result.error}</p>`;
                executeBtn.classList.add('hidden');
            } else {
                // Use the keys from the AI response: justification, positions
                recommendationBody.innerHTML = `
                    <p>${result.justification.replace(/\\n/g, '<br>')}</p>
                    <div class="table-container" style="margin-top: 20px;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Asset</th>
                                    <th>Type</th>
                                    <th>Action</th>
                                    <th>Quantity</th>
                                    <th>Strike</th>
                                    <th>Expiry</th>
                                    <th>Delta</th>
                                    <th>Vega</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${result.positions.map(pos => `
                                    <tr>
                                        <td>${pos.Asset}</td>
                                        <td>${pos.Type}</td>
                                        <td>${pos.Action}</td>
                                        <td>${pos.Quantity}</td>
                                        <td>${pos['Strike Price']}</td>
                                        <td>${pos['Expiry Date']}</td>
                                        <td>${pos.Delta}</td>
                                        <td>${pos.Vega}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                executeBtn.classList.remove('hidden');
            }

        } catch (error) {
            console.error('AI analysis error:', error);
            recommendationBody.innerHTML = `<p style="color: #ff8c8c;">Failed to retrieve AI analysis. Please check the console for details.</p>`;
            executeBtn.classList.add('hidden');
        } finally {
            // Re-enable button
            button.disabled = false;
            button.textContent = 'Analyze';
        }
    }

    function populateExchangeContracts() {
        const contracts = [
            { quantity: 1000, period: 'July 2025', location: 'ERCOT North', price: 58.50 },
            { quantity: 500, period: 'July 2025', location: 'PJM West', price: 62.10 },
            { quantity: 2000, period: 'August 2025', location: 'ERCOT North', price: 61.75 },
            { quantity: 750, period: 'Q3 2025', location: 'MISO Indiana', price: 55.20 },
            { quantity: 1500, period: 'Q3 2025', location: 'SPP South', price: 51.90 },
            { quantity: 1200, period: 'September 2025', location: 'ERCOT Houston', price: 60.15 },
        ];

        const tableBody = document.getElementById('exchange-contracts-body');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        contracts.forEach(c => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${c.quantity.toLocaleString()}</td>
                <td>${c.period}</td>
                <td>${c.location}</td>
                <td>$${c.price.toFixed(2)}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    allContracts = generateContracts();
    populateCompositeDashboard(allContracts);
    populateElectricityDashboard(allContracts);
    const btcPriceScenarios = createMonteCarloChart();
    const electricityPriceScenarios = createElectricityMonteCarloChart();
    createCompositePayoffChart(allContracts, btcPriceScenarios);
    createElectricityHedgingChart(allContracts, electricityPriceScenarios);
    createCompositeBitcoinChart(allContracts, btcPriceScenarios);
    createCompositeElectricityChart(allContracts, electricityPriceScenarios);
    create3dSurfacePlot();
    loadMarketData();
    setInterval(loadMarketData, 5000); // Refresh every 5 seconds
    
    // Initial call to populate the AI strategy table
    populateAiStrategyTable();
    populateExchangeContracts();
});