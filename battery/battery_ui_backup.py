#!/usr/bin/env python3
from flask import Flask, render_template, request, jsonify, Response
import json
import time
import threading
import sys
import os
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from battery.battery_system import BatterySystem
from price_monitor.price_monitor import PriceMonitor

app = Flask(__name__)

# Global variables
battery_system = None
price_monitor = None
is_running = False
decision_history = []
current_status = {}

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

def update_thresholds(charge_threshold, discharge_threshold):
    """Update battery system thresholds"""
    global battery_system
    if battery_system:
        battery_system.charge_threshold = float(charge_threshold)
        battery_system.discharge_threshold = float(discharge_threshold)

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

@app.route('/')
def index():
    """Main page"""
    return render_template('index.html')

@app.route('/api/start', methods=['POST'])
def start_monitoring():
    """Start the monitoring system"""
    global is_running, battery_system, price_monitor
    
    try:
        data = request.get_json()
        charge_threshold = float(data.get('charge_threshold', 1.7))
        discharge_threshold = float(data.get('discharge_threshold', 2.0))
        
        # Initialize systems
        initialize_systems()
        
        # Update thresholds
        update_thresholds(charge_threshold, discharge_threshold)
        
        # Start monitoring
        if not is_running:
            is_running = True
            monitor_thread = threading.Thread(target=monitor_loop, daemon=True)
            monitor_thread.start()
        
        return jsonify({
            "success": True,
            "message": "Monitoring started",
            "charge_threshold": charge_threshold,
            "discharge_threshold": discharge_threshold
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

@app.route('/api/stop', methods=['POST'])
def stop_monitoring():
    """Stop the monitoring system"""
    global is_running, price_monitor
    
    try:
        is_running = False
        if price_monitor:
            price_monitor.stop()
        
        return jsonify({
            "success": True,
            "message": "Monitoring stopped"
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

@app.route('/api/status')
def get_status():
    """Get current status"""
    global current_status, battery_system
    
    try:
        if battery_system:
            status = battery_system.get_status()
            return jsonify({
                "success": True,
                "status": status,
                "current_status": current_status,
                "battery_specs": LG_BATTERY_SPECS
            })
        else:
            return jsonify({
                "success": False,
                "message": "Battery system not initialized"
            })
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

@app.route('/api/decisions')
def get_decisions():
    """Get decision history"""
    global decision_history
    
    try:
        return jsonify({
            "success": True,
            "decisions": decision_history
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

@app.route('/api/update_thresholds', methods=['POST'])
def update_thresholds_api():
    """Update battery thresholds"""
    try:
        data = request.get_json()
        charge_threshold = float(data.get('charge_threshold', 1.7))
        discharge_threshold = float(data.get('discharge_threshold', 2.0))
        
        update_thresholds(charge_threshold, discharge_threshold)
        
        return jsonify({
            "success": True,
            "message": "Thresholds updated",
            "charge_threshold": charge_threshold,
            "discharge_threshold": discharge_threshold
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

@app.route('/api/reset_battery', methods=['POST'])
def reset_battery():
    """Reset battery to initial state"""
    global battery_system
    
    try:
        if battery_system:
            battery_system = BatterySystem(
                capacity_mwh=LG_BATTERY_SPECS["capacity_mwh"],
                max_charge_rate_mw=LG_BATTERY_SPECS["max_charge_rate_mw"],
                max_discharge_rate_mw=LG_BATTERY_SPECS["max_discharge_rate_mw"],
                efficiency=LG_BATTERY_SPECS["efficiency"],
                initial_charge=50.0
            )
        
        return jsonify({
            "success": True,
            "message": "Battery reset to initial state"
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

@app.route('/api/battery_info')
def get_battery_info():
    """Get detailed battery system information"""
    try:
        return jsonify({
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
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

if __name__ == '__main__':
    # Create templates directory if it doesn't exist
    templates_dir = os.path.join(os.path.dirname(__file__), 'templates')
    if not os.path.exists(templates_dir):
        os.makedirs(templates_dir)
    
    print("🚀 Starting Battery System UI...")
    print("🔋 Using LG Energy Solution ESS specifications")
    print(f"📊 Capacity: {LG_BATTERY_SPECS['capacity_mwh']} MWh")
    print(f"⚡ Max Power: {LG_BATTERY_SPECS['max_charge_rate_mw']} MW")
    print(f"🔄 Efficiency: {LG_BATTERY_SPECS['efficiency']*100}%")
    print("📱 Open http://localhost:5000 in your browser")
    app.run(debug=True, host='0.0.0.0', port=5000) 