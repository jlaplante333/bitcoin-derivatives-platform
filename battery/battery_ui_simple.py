#!/usr/bin/env python3
import http.server
import socketserver
import json
import time
import threading
import sys
import os
from datetime import datetime
import urllib.parse

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from battery.battery_system import BatterySystem
from price_monitor.price_monitor import PriceMonitor

# LG Energy Solution Battery Specifications
# Based on LG Energy Solution's commercial battery systems for industrial applications
LG_BATTERY_SPECS = {
    "model": "LG Energy Solution RESU16H Prime ESS (Energy Storage System)",
    "capacity_mwh": 100.0,  # 100 MWh total capacity (scaled for industrial use)
    "max_charge_rate_mw": 25.0,  # 25 MW maximum charge rate
    "max_discharge_rate_mw": 25.0,  # 25 MW maximum discharge rate
    "efficiency": 0.92,  # 92% round-trip efficiency
    "cycle_life": 4000,  # 4000 cycles at 80% depth of discharge
    "warranty": "10 years",
    "temperature_range": "-20°C to +60°C",
    "footprint": "Approximately 40ft x 20ft container",
    "weight": "~50 tons",
    "voltage": "1500V DC system",
    "cell_chemistry": "NCM (Nickel Cobalt Manganese)",
    "applications": "Grid stabilization, peak shaving, renewable integration, mining operations"
}

# Global variables
battery_system = None
price_monitor = None
is_running = False
decision_history = []
current_status = {}

# Thresholds
charge_threshold = 1.7
discharge_threshold = 2.0
sell_threshold = 80.0  # Sell when battery charge level > 80%

def initialize_systems():
    """Initialize battery and price monitor systems with LG battery specifications"""
    global battery_system, price_monitor
    
    if battery_system is None:
        battery_system = BatterySystem(
            capacity_mwh=LG_BATTERY_SPECS["capacity_mwh"],
            max_charge_rate_mw=LG_BATTERY_SPECS["max_charge_rate_mw"],
            max_discharge_rate_mw=LG_BATTERY_SPECS["max_discharge_rate_mw"],
            efficiency=LG_BATTERY_SPECS["efficiency"],
            initial_charge=50.0
        )
    
    if price_monitor is None:
        price_monitor = PriceMonitor()
        price_monitor.start()

def update_thresholds(charge_threshold_val, discharge_threshold_val, sell_threshold_val=None):
    """Update global thresholds"""
    global charge_threshold, discharge_threshold, sell_threshold
    charge_threshold = charge_threshold_val
    discharge_threshold = discharge_threshold_val
    if sell_threshold_val is not None:
        sell_threshold = sell_threshold_val
    
    if battery_system:
        battery_system.update_thresholds(charge_threshold, discharge_threshold, sell_threshold)

def monitor_loop():
    """Background monitoring loop"""
    global battery_system, price_monitor, is_running, decision_history, current_status
    
    while is_running:
        try:
            if price_monitor and battery_system:
                latest_prices = price_monitor.get_latest_prices()
                
                if latest_prices:
                    # Make battery decision
                    decision = battery_system.make_decision(
                        energy_price=latest_prices['energy_price'],
                        hash_price=latest_prices['hash_price'],
                        token_price=latest_prices['token_price']
                    )
                    
                    # Get battery status
                    status = battery_system.get_status()
                    
                    # Create decision record
                    decision_record = {
                        "timestamp": datetime.now().isoformat(),
                        "energy_price": latest_prices['energy_price'],
                        "hash_price": latest_prices['hash_price'],
                        "token_price": latest_prices['token_price'],
                        "decision": decision,
                        "battery_status": status
                    }
                    
                    # Update global state
                    decision_history.append(decision_record)
                    current_status = {
                        "latest_decision": decision_record,
                        "battery_status": status,
                        "price_data": latest_prices
                    }
                    
                    # Keep only last 50 decisions
                    if len(decision_history) > 50:
                        decision_history = decision_history[-50:]
            
            time.sleep(10)  # Update every 10 seconds
            
        except Exception as e:
            print(f"Error in monitor loop: {e}")
            time.sleep(10)

class BatteryRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/':
            self.path = '/index.html'
        elif self.path.startswith('/api/'):
            self.handle_api_get()
            return
        
        return http.server.SimpleHTTPRequestHandler.do_GET(self)
    
    def do_POST(self):
        """Handle POST requests"""
        if self.path.startswith('/api/'):
            self.handle_api_post()
            return
        
        self.send_error(404, "Not found")
    
    def handle_api_get(self):
        """Handle API GET requests"""
        global current_status, battery_system, decision_history
        
        if self.path == '/api/status':
            try:
                if battery_system:
                    status = battery_system.get_status()
                    response = {
                        "success": True,
                        "status": status,
                        "current_status": current_status,
                        "battery_specs": LG_BATTERY_SPECS
                    }
                else:
                    response = {
                        "success": False,
                        "message": "Battery system not initialized"
                    }
                
                self.send_json_response(response)
            except Exception as e:
                self.send_json_response({
                    "success": False,
                    "error": str(e)
                }, 400)
        
        elif self.path == '/api/decisions':
            try:
                response = {
                    "success": True,
                    "decisions": decision_history
                }
                self.send_json_response(response)
            except Exception as e:
                self.send_json_response({
                    "success": False,
                    "error": str(e)
                }, 400)
        
        elif self.path == '/api/battery_info':
            try:
                response = {
                    "success": True,
                    "battery_specs": LG_BATTERY_SPECS,
                    "description": """
                    This simulation uses specifications based on LG Energy Solution's RESU16H Prime 
                    Energy Storage System (ESS) designed for industrial applications including 
                    Bitcoin mining operations. The system provides grid stabilization, peak 
                    shaving, and energy arbitrage capabilities to optimize mining profitability 
                    by charging during low-cost periods and discharging during high-cost periods.
                    
                    Key benefits for Bitcoin mining:
                    - Reduces energy costs by 20-40% through arbitrage
                    - Provides backup power during grid outages
                    - Smooths power consumption for grid stability
                    - Enables mining during peak profitability periods
                    - Reduces carbon footprint through renewable integration
                    """
                }
                self.send_json_response(response)
            except Exception as e:
                self.send_json_response({
                    "success": False,
                    "error": str(e)
                }, 400)
        
        else:
            self.send_error(404, "API endpoint not found")
    
    def handle_api_post(self):
        """Handle API POST requests"""
        global is_running, battery_system, price_monitor
        
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            if self.path == '/api/start':
                charge_threshold = float(data.get('charge_threshold', 1.7))
                discharge_threshold = float(data.get('discharge_threshold', 2.0))
                sell_threshold = float(data.get('sell_threshold', 80.0))
                
                # Initialize systems
                initialize_systems()
                
                # Update thresholds
                update_thresholds(charge_threshold, discharge_threshold, sell_threshold)
                
                # Start monitoring
                if not is_running:
                    is_running = True
                    monitor_thread = threading.Thread(target=monitor_loop, daemon=True)
                    monitor_thread.start()
                
                response = {
                    "success": True,
                    "message": "Monitoring started",
                    "charge_threshold": charge_threshold,
                    "discharge_threshold": discharge_threshold,
                    "sell_threshold": sell_threshold
                }
                
                self.send_json_response(response)
            
            elif self.path == '/api/stop':
                is_running = False
                if price_monitor:
                    price_monitor.stop()
                
                response = {
                    "success": True,
                    "message": "Monitoring stopped"
                }
                
                self.send_json_response(response)
            
            elif self.path == '/api/update_thresholds':
                charge_threshold = float(data.get('charge_threshold', 1.7))
                discharge_threshold = float(data.get('discharge_threshold', 2.0))
                sell_threshold = float(data.get('sell_threshold', 80.0))
                
                update_thresholds(charge_threshold, discharge_threshold, sell_threshold)
                
                response = {
                    "success": True,
                    "message": "Thresholds updated",
                    "charge_threshold": charge_threshold,
                    "discharge_threshold": discharge_threshold,
                    "sell_threshold": sell_threshold
                }
                
                self.send_json_response(response)
            
            elif self.path == '/api/reset_battery':
                if battery_system:
                    battery_system = BatterySystem(
                        capacity_mwh=LG_BATTERY_SPECS["capacity_mwh"],
                        max_charge_rate_mw=LG_BATTERY_SPECS["max_charge_rate_mw"],
                        max_discharge_rate_mw=LG_BATTERY_SPECS["max_discharge_rate_mw"],
                        efficiency=LG_BATTERY_SPECS["efficiency"],
                        initial_charge=50.0
                    )
                
                response = {
                    "success": True,
                    "message": "Battery reset to initial state"
                }
                
                self.send_json_response(response)
            
            else:
                self.send_error(404, "API endpoint not found")
                
        except Exception as e:
            self.send_json_response({
                "success": False,
                "error": str(e)
            }, 400)
    
    def send_json_response(self, data, status_code=200):
        """Send JSON response"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

def main():
    """Main function"""
    # Change to the battery directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Create a simple HTML file if it doesn't exist
    if not os.path.exists('index.html'):
        create_simple_html()
    
    PORT = 8000
    
    with socketserver.TCPServer(("", PORT), BatteryRequestHandler) as httpd:
        print(f"🚀 Starting Battery System UI...")
        print(f"🔋 Using LG Energy Solution ESS specifications")
        print(f"📊 Capacity: {LG_BATTERY_SPECS['capacity_mwh']} MWh")
        print(f"⚡ Max Power: {LG_BATTERY_SPECS['max_charge_rate_mw']} MW")
        print(f"🔄 Efficiency: {LG_BATTERY_SPECS['efficiency']*100}%")
        print(f"📱 Open http://localhost:{PORT} in your browser")
        print(f"🔋 Battery system ready for Bitcoin mining operations!")
        httpd.serve_forever()

def create_simple_html():
    """Create a simple HTML file for the UI with LG battery information"""
    html_content = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    <title>MARA Real-time Bitcoin mining & AI computation operations</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f0f2f5; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #2c3e50; margin-bottom: 10px; }
        .header p { color: #7f8c8d; }
        .battery-info { background: #e8f4fd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3498db; }
        .battery-info h3 { color: #2c3e50; margin-bottom: 15px; }
        .battery-specs { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px; }
        .spec-item { background: white; padding: 10px; border-radius: 4px; border: 1px solid #bdc3c7; }
        .spec-label { font-weight: bold; color: #2c3e50; font-size: 0.9em; }
        .spec-value { color: #34495e; margin-top: 5px; }
        .control-panel { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
        .form-group input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .button-group { display: flex; gap: 10px; flex-wrap: wrap; }
        .btn { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
        .btn-primary { background: #007bff; color: white; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-success { background: #28a745; color: white; }
        .btn-warning { background: #ffc107; color: black; }
        .btn-info { background: #17a2b8; color: white; }
        .status-panel { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .status-card { background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #dee2e6; }
        .status-card h3 { margin-bottom: 10px; color: #2c3e50; }
        .status-item { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
        .status-item:last-child { border-bottom: none; }
        .decision-history { background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #dee2e6; }
        .decision-item { background: white; padding: 10px; margin-bottom: 10px; border-radius: 4px; border-left: 4px solid #007bff; }
        .decision-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .decision-action { padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
        .action-charge { background: #d4edda; color: #155724; }
        .action-discharge { background: #f8d7da; color: #721c24; }
        .action-sell { background: #fff3cd; color: #856404; }
        .action-hold { background: #d1ecf1; color: #0c5460; }
        .loading { text-align: center; padding: 20px; color: #6c757d; }
        .message { padding: 10px; border-radius: 4px; margin-bottom: 15px; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>MARA Real-time Bitcoin mining & AI computation operations</h1>
            <p>🔋 Using LG Energy Solution Battery System</p>
        </div>

        <div class="battery-info">
            <h3>🔧 LG Energy Solution ESS Specifications</h3>
            <div class="battery-specs">
                <div class="spec-item">
                    <div class="spec-label">Model</div>
                    <div class="spec-value">LG Energy Solution RESU16H Prime ESS</div>
                </div>
                <div class="spec-item">
                    <div class="spec-label">Capacity</div>
                    <div class="spec-value">100 MWh</div>
                </div>
                <div class="spec-item">
                    <div class="spec-label">Max Power</div>
                    <div class="spec-value">25 MW</div>
                </div>
                <div class="spec-item">
                    <div class="spec-label">Efficiency</div>
                    <div class="spec-value">92%</div>
                </div>
                <div class="spec-item">
                    <div class="spec-label">Cycle Life</div>
                    <div class="spec-value">4000 cycles</div>
                </div>
                <div class="spec-item">
                    <div class="spec-label">Warranty</div>
                    <div class="spec-value">10 years</div>
                </div>
                <div class="spec-item">
                    <div class="spec-label">Temperature Range</div>
                    <div class="spec-value">-20°C to +60°C</div>
                </div>
                <div class="spec-item">
                    <div class="spec-label">Footprint</div>
                    <div class="spec-value">40ft x 20ft container</div>
                </div>
            </div>
            <div class="info">
                <strong>Bitcoin Mining Benefits:</strong> Reduces energy costs by 20-40% through arbitrage, 
                provides backup power during outages, smooths power consumption, and enables mining during 
                peak profitability periods.
            </div>
        </div>

        <div class="control-panel">
            <h2>🎛️ Control Panel</h2>
            <div class="form-group">
                <label for="chargeThreshold">Charge Threshold (Energy Price)</label>
                <input type="number" id="chargeThreshold" value="1.7" step="0.1" min="0">
            </div>
            <div class="input-group">
                <label for="dischargeThreshold">Discharge Threshold (Energy Price)</label>
                <input type="number" id="dischargeThreshold" value="2.0" step="0.1" min="0">
            </div>
            <div class="input-group">
                <label for="sellThreshold">Sell Threshold (Battery Charge %)</label>
                <input type="number" id="sellThreshold" value="80.0" step="1" min="0" max="100">
            </div>
            <div class="button-group">
                <button class="btn btn-primary" onclick="startMonitoring()">🚀 Start Monitoring</button>
                <button class="btn btn-danger" onclick="stopMonitoring()">🛑 Stop Monitoring</button>
                <button class="btn btn-success" onclick="updateThresholds()">⚙️ Update Thresholds</button>
                <button class="btn btn-warning" onclick="resetBattery()">🔄 Reset Battery</button>
                <button class="btn btn-info" onclick="showBatteryInfo()">ℹ️ Battery Info</button>
            </div>
        </div>

        <div class="status-panel">
            <div class="status-card">
                <h3>🔋 Battery Status</h3>
                <div id="batteryStatus">
                    <div class="loading">Loading battery status...</div>
                </div>
            </div>

            <div class="status-card">
                <h3>📊 Price Data</h3>
                <div id="priceData">
                    <div class="loading">Loading price data...</div>
                </div>
            </div>

            <div class="status-card">
                <h3>🎯 Latest Decision</h3>
                <div id="latestDecision">
                    <div class="loading">Waiting for decisions...</div>
                </div>
            </div>
        </div>

        <div class="decision-history">
            <h2>📈 Decision History</h2>
            <div id="decisionHistory">
                <div class="loading">No decisions yet. Start monitoring to see decisions.</div>
            </div>
        </div>
    </div>

    <script>
        let isMonitoring = false;
        let updateInterval;

        async function startMonitoring() {
            const chargeThreshold = document.getElementById('chargeThreshold').value;
            const dischargeThreshold = document.getElementById('dischargeThreshold').value;
            const sellThreshold = document.getElementById('sellThreshold').value;

            try {
                const response = await fetch('/api/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        charge_threshold: parseFloat(chargeThreshold),
                        discharge_threshold: parseFloat(dischargeThreshold),
                        sell_threshold: parseFloat(sellThreshold)
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    showMessage('Monitoring started successfully!', 'success');
                    isMonitoring = true;
                    startUpdates();
                } else {
                    showMessage('Failed to start monitoring: ' + data.error, 'error');
                }
            } catch (error) {
                showMessage('Error starting monitoring: ' + error.message, 'error');
            }
        }

        async function stopMonitoring() {
            try {
                const response = await fetch('/api/stop', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await response.json();
                
                if (data.success) {
                    showMessage('Monitoring stopped successfully!', 'success');
                    isMonitoring = false;
                    stopUpdates();
                } else {
                    showMessage('Failed to stop monitoring: ' + data.error, 'error');
                }
            } catch (error) {
                showMessage('Error stopping monitoring: ' + error.message, 'error');
            }
        }

        async function updateThresholds() {
            const chargeThreshold = document.getElementById('chargeThreshold').value;
            const dischargeThreshold = document.getElementById('dischargeThreshold').value;
            const sellThreshold = document.getElementById('sellThreshold').value;

            try {
                const response = await fetch('/api/update_thresholds', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        charge_threshold: parseFloat(chargeThreshold),
                        discharge_threshold: parseFloat(dischargeThreshold),
                        sell_threshold: parseFloat(sellThreshold)
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    showMessage('Thresholds updated successfully!', 'success');
                } else {
                    showMessage('Failed to update thresholds: ' + data.error, 'error');
                }
            } catch (error) {
                showMessage('Error updating thresholds: ' + error.message, 'error');
            }
        }

        async function resetBattery() {
            try {
                const response = await fetch('/api/reset_battery', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await response.json();
                
                if (data.success) {
                    showMessage('Battery reset successfully!', 'success');
                    updateStatus();
                } else {
                    showMessage('Failed to reset battery: ' + data.error, 'error');
                }
            } catch (error) {
                showMessage('Error resetting battery: ' + error.message, 'error');
            }
        }

        async function showBatteryInfo() {
            try {
                const response = await fetch('/api/battery_info');
                const data = await response.json();
                
                if (data.success) {
                    const info = data.description;
                    showMessage('LG Energy Solution ESS: ' + info, 'info');
                }
            } catch (error) {
                showMessage('Error fetching battery info: ' + error.message, 'error');
            }
        }

        async function updateStatus() {
            try {
                const response = await fetch('/api/status');
                const data = await response.json();
                
                if (data.success) {
                    updateBatteryStatus(data.status);
                    updatePriceData(data.current_status.price_data);
                    updateLatestDecision(data.current_status.latest_decision);
                }
            } catch (error) {
                console.error('Error updating status:', error);
            }
        }

        async function updateDecisionHistory() {
            try {
                const response = await fetch('/api/decisions');
                const data = await response.json();
                
                if (data.success) {
                    displayDecisionHistory(data.decisions);
                }
            } catch (error) {
                console.error('Error updating decision history:', error);
            }
        }

        function updateBatteryStatus(status) {
            const container = document.getElementById('batteryStatus');
            container.innerHTML = `
                <div class="status-item">
                    <span>Charge Level:</span>
                    <span>${status.charge_level_percent.toFixed(1)}%</span>
                </div>
                <div class="status-item">
                    <span>Available Energy:</span>
                    <span>${status.available_energy_mwh.toFixed(2)} MWh</span>
                </div>
                <div class="status-item">
                    <span>Capacity:</span>
                    <span>${status.capacity_mwh.toFixed(1)} MWh</span>
                </div>
                <div class="status-item">
                    <span>Can Charge:</span>
                    <span>${status.can_charge ? '✅' : '❌'}</span>
                </div>
                <div class="status-item">
                    <span>Can Discharge:</span>
                    <span>${status.can_discharge ? '✅' : '❌'}</span>
                </div>
            `;
        }

        function updatePriceData(priceData) {
            if (!priceData) return;
            
            const container = document.getElementById('priceData');
            container.innerHTML = `
                <div class="status-item">
                    <span>Energy Price:</span>
                    <span>${priceData.energy_price.toFixed(4)}</span>
                </div>
                <div class="status-item">
                    <span>Hash Price:</span>
                    <span>${priceData.hash_price.toFixed(4)}</span>
                </div>
                <div class="status-item">
                    <span>Token Price:</span>
                    <span>${priceData.token_price.toFixed(4)}</span>
                </div>
                <div class="status-item">
                    <span>Timestamp:</span>
                    <span>${new Date(priceData.timestamp).toLocaleString()}</span>
                </div>
            `;
        }

        function updateLatestDecision(decision) {
            if (!decision) return;
            
            const container = document.getElementById('latestDecision');
            const action = decision.decision.action;
            const actionClass = action === 'charge' ? 'action-charge' : 
                              action === 'discharge' ? 'action-discharge' : 
                              action === 'sell_to_grid' ? 'action-sell' : 'action-hold';
            
            container.innerHTML = `
                <div class="status-item">
                    <span>Action:</span>
                    <span><span class="decision-action ${actionClass}">${action.toUpperCase()}</span></span>
                </div>
                <div class="status-item">
                    <span>Reason:</span>
                    <span>${decision.decision.reason}</span>
                </div>
                <div class="status-item">
                    <span>Energy Price:</span>
                    <span>${decision.energy_price.toFixed(4)}</span>
                </div>
                <div class="status-item">
                    <span>Time:</span>
                    <span>${new Date(decision.timestamp).toLocaleString()}</span>
                </div>
            `;
        }

        function displayDecisionHistory(decisions) {
            const container = document.getElementById('decisionHistory');
            
            if (decisions.length === 0) {
                container.innerHTML = '<div class="loading">No decisions yet. Start monitoring to see decisions.</div>';
                return;
            }

            const decisionsHtml = decisions.slice(-10).reverse().map(decision => {
                const action = decision.decision.action;
                const actionClass = action === 'charge' ? 'action-charge' : 
                                  action === 'discharge' ? 'action-discharge' : 
                                  action === 'sell_to_grid' ? 'action-sell' : 'action-hold';
                
                return `
                    <div class="decision-item">
                        <div class="decision-header">
                            <span>${new Date(decision.timestamp).toLocaleString()}</span>
                            <span class="decision-action ${actionClass}">${action.toUpperCase()}</span>
                        </div>
                        <div>Energy: ${decision.energy_price.toFixed(4)} | Hash: ${decision.hash_price.toFixed(4)} | Token: ${decision.token_price.toFixed(4)} | Battery: ${decision.battery_status.charge_level_percent.toFixed(1)}%</div>
                    </div>
                `;
            }).join('');

            container.innerHTML = decisionsHtml;
        }

        function showMessage(message, type) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}`;
            messageDiv.textContent = message;
            
            const content = document.querySelector('.container');
            content.insertBefore(messageDiv, content.firstChild);
            
            setTimeout(() => messageDiv.remove(), 8000);
        }

        function startUpdates() {
            updateInterval = setInterval(() => {
                updateStatus();
                updateDecisionHistory();
            }, 5000);
        }

        function stopUpdates() {
            if (updateInterval) {
                clearInterval(updateInterval);
                updateInterval = null;
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            updateStatus();
            updateDecisionHistory();
        });
    </script>
</body>
</html>'''
    
    with open('index.html', 'w') as f:
        f.write(html_content)

if __name__ == '__main__':
    main() 