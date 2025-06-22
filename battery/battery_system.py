#!/usr/bin/env python3
import json
import time
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import sys
import os

# Add parent directory to path to import price_monitor
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from price_monitor.price_monitor import PriceMonitor

@dataclass
class BatteryState:
    """Represents the current state of the battery"""
    charge_level: float  # Current charge level (0-100%)
    capacity: float      # Total capacity in MWh
    max_charge_rate: float  # Maximum charge rate in MW
    max_discharge_rate: float  # Maximum discharge rate in MW
    efficiency: float    # Charge/discharge efficiency (0-1)
    last_updated: datetime
    total_energy_stored: float  # Total energy stored in MWh
    total_energy_used: float    # Total energy used in MWh

class BatterySystem:
    def __init__(self, 
                 capacity_mwh: float = 100.0,
                 max_charge_rate_mw: float = 20.0,
                 max_discharge_rate_mw: float = 20.0,
                 efficiency: float = 0.9,
                 initial_charge: float = 50.0):
        """
        Initialize the battery system
        
        Args:
            capacity_mwh: Total battery capacity in MWh
            max_charge_rate_mw: Maximum charge rate in MW
            max_discharge_rate_mw: Maximum discharge rate in MW
            efficiency: Charge/discharge efficiency (0-1)
            initial_charge: Initial charge level (0-100%)
        """
        self.capacity_mwh = capacity_mwh
        self.max_charge_rate_mw = max_charge_rate_mw
        self.max_discharge_rate_mw = max_discharge_rate_mw
        self.efficiency = efficiency
        
        # Initialize battery state
        self.state = BatteryState(
            charge_level=initial_charge,
            capacity=capacity_mwh,
            max_charge_rate=max_charge_rate_mw,
            max_discharge_rate=max_discharge_rate_mw,
            efficiency=efficiency,
            last_updated=datetime.now(),
            total_energy_stored=0.0,
            total_energy_used=0.0
        )
        
        # Price thresholds for decision making
        self.charge_threshold = 1.7  # Charge when energy price < 1.5
        self.discharge_threshold = 2.0  # Discharge when energy price > 2.0
        self.sell_threshold = 80.0  # Sell when battery charge level > 80%
        
        # Energy demand for mining/inference
        self.mining_demand_mw = 15.0  # Energy demand for mining operations
        self.inference_demand_mw = 10.0  # Energy demand for inference operations
        
        # Threading
        self.is_running = False
        self.thread = None
        self.lock = threading.Lock()
        
        # History tracking
        self.operation_history: List[Dict] = []
        
    def get_available_energy_mwh(self) -> float:
        """Get available energy in MWh"""
        return (self.state.charge_level / 100.0) * self.capacity_mwh
    
    def can_charge(self, duration_hours: float = 1.0) -> bool:
        """Check if battery can charge for given duration"""
        available_capacity = (100.0 - self.state.charge_level) / 100.0 * self.capacity_mwh
        max_charge_energy = self.max_charge_rate_mw * duration_hours * self.efficiency
        return available_capacity >= max_charge_energy
    
    def can_discharge(self, duration_hours: float = 1.0) -> bool:
        """Check if battery can discharge for given duration"""
        available_energy = self.get_available_energy_mwh()
        max_discharge_energy = self.max_discharge_rate_mw * duration_hours
        return available_energy >= max_discharge_energy
    
    def charge(self, power_mw: float, duration_hours: float = 1.0) -> Dict:
        """Charge the battery"""
        with self.lock:
            if not self.can_charge(duration_hours):
                return {"success": False, "reason": "Insufficient capacity"}
            
            energy_to_store = power_mw * duration_hours * self.efficiency
            charge_increase = (energy_to_store / self.capacity_mwh) * 100.0
            
            old_charge = self.state.charge_level
            self.state.charge_level = min(100.0, self.state.charge_level + charge_increase)
            self.state.total_energy_stored += energy_to_store
            self.state.last_updated = datetime.now()
            
            operation = {
                "timestamp": datetime.now().isoformat(),
                "type": "charge",
                "power_mw": power_mw,
                "duration_hours": duration_hours,
                "energy_stored_mwh": energy_to_store,
                "charge_before": old_charge,
                "charge_after": self.state.charge_level
            }
            self.operation_history.append(operation)
            
            return {
                "success": True,
                "energy_stored": energy_to_store,
                "charge_increase": charge_increase,
                "new_charge_level": self.state.charge_level
            }
    
    def discharge(self, power_mw: float, duration_hours: float = 1.0) -> Dict:
        """Discharge the battery"""
        with self.lock:
            if not self.can_discharge(duration_hours):
                return {"success": False, "reason": "Insufficient energy"}
            
            energy_to_use = power_mw * duration_hours
            charge_decrease = (energy_to_use / self.capacity_mwh) * 100.0
            
            old_charge = self.state.charge_level
            self.state.charge_level = max(0.0, self.state.charge_level - charge_decrease)
            self.state.total_energy_used += energy_to_use
            self.state.last_updated = datetime.now()
            
            operation = {
                "timestamp": datetime.now().isoformat(),
                "type": "discharge",
                "power_mw": power_mw,
                "duration_hours": duration_hours,
                "energy_used_mwh": energy_to_use,
                "charge_before": old_charge,
                "charge_after": self.state.charge_level
            }
            self.operation_history.append(operation)
            
            return {
                "success": True,
                "energy_used": energy_to_use,
                "charge_decrease": charge_decrease,
                "new_charge_level": self.state.charge_level
            }
    
    def sell_to_grid(self, power_mw: float, duration_hours: float = 1.0) -> Dict:
        """Sell energy back to the grid"""
        with self.lock:
            if not self.can_discharge(duration_hours):
                return {"success": False, "reason": "Insufficient energy"}
            
            energy_to_sell = power_mw * duration_hours
            charge_decrease = (energy_to_sell / self.capacity_mwh) * 100.0
            
            old_charge = self.state.charge_level
            self.state.charge_level = max(0.0, self.state.charge_level - charge_decrease)
            self.state.total_energy_used += energy_to_sell
            self.state.last_updated = datetime.now()
            
            operation = {
                "timestamp": datetime.now().isoformat(),
                "type": "sell_to_grid",
                "power_mw": power_mw,
                "duration_hours": duration_hours,
                "energy_sold_mwh": energy_to_sell,
                "charge_before": old_charge,
                "charge_after": self.state.charge_level
            }
            self.operation_history.append(operation)
            
            return {
                "success": True,
                "energy_sold": energy_to_sell,
                "charge_decrease": charge_decrease,
                "new_charge_level": self.state.charge_level
            }
    
    def make_decision(self, energy_price: float, hash_price: float, token_price: float) -> Dict:
        """Make charging/discharging decision based on current prices"""
        current_demand = self.mining_demand_mw + self.inference_demand_mw
        
        # Check if we should sell energy back to grid (highest priority)
        if self.state.charge_level > self.sell_threshold and self.can_discharge():
            # Battery is well charged, sell excess energy back to grid
            sell_power = min(self.max_discharge_rate_mw, 10.0)  # Sell up to 10 MW or max rate
            result = self.sell_to_grid(sell_power, 1.0)
            return {
                "action": "sell_to_grid",
                "reason": f"Battery charge level ({self.state.charge_level:.1f}%) above sell threshold ({self.sell_threshold}%)",
                "result": result
            }
        
        # Decision logic for charging/discharging
        elif energy_price < self.charge_threshold and self.can_charge():
            # Energy is cheap, charge the battery
            charge_power = min(self.max_charge_rate_mw, current_demand)
            result = self.charge(charge_power, 1.0)
            return {
                "action": "charge",
                "reason": f"Energy price ({energy_price:.2f}) below threshold ({self.charge_threshold})",
                "result": result
            }
        
        elif energy_price > self.discharge_threshold and self.can_discharge():
            # Energy is expensive, use battery
            discharge_power = min(self.max_discharge_rate_mw, current_demand)
            result = self.discharge(discharge_power, 1.0)
            return {
                "action": "discharge",
                "reason": f"Energy price ({energy_price:.2f}) above threshold ({self.discharge_threshold})",
                "result": result
            }
        
        else:
            # No action needed
            return {
                "action": "hold",
                "reason": f"Energy price ({energy_price:.2f}) within normal range",
                "result": {"success": True}
            }
    
    def get_status(self) -> Dict:
        """Get current battery status"""
        with self.lock:
            return {
                "charge_level_percent": self.state.charge_level,
                "available_energy_mwh": self.get_available_energy_mwh(),
                "capacity_mwh": self.capacity_mwh,
                "max_charge_rate_mw": self.max_charge_rate_mw,
                "max_discharge_rate_mw": self.max_discharge_rate_mw,
                "efficiency": self.efficiency,
                "last_updated": self.state.last_updated.isoformat(),
                "total_energy_stored_mwh": self.state.total_energy_stored,
                "total_energy_used_mwh": self.state.total_energy_used,
                "can_charge": self.can_charge(),
                "can_discharge": self.can_discharge()
            }
    
    def display_status(self):
        """Display formatted battery status"""
        status = self.get_status()
        
        print("🔋 Battery System Status:")
        print(f"   Charge Level: {status['charge_level_percent']:.1f}%")
        print(f"   Available Energy: {status['available_energy_mwh']:.2f} MWh")
        print(f"   Capacity: {status['capacity_mwh']:.1f} MWh")
        print(f"   Max Charge Rate: {status['max_charge_rate_mw']:.1f} MW")
        print(f"   Max Discharge Rate: {status['max_discharge_rate_mw']:.1f} MW")
        print(f"   Efficiency: {status['efficiency']:.1%}")
        print(f"   Total Energy Stored: {status['total_energy_stored_mwh']:.2f} MWh")
        print(f"   Total Energy Used: {status['total_energy_used_mwh']:.2f} MWh")
        print(f"   Can Charge: {'✅' if status['can_charge'] else '❌'}")
        print(f"   Can Discharge: {'✅' if status['can_discharge'] else '❌'}")
    
    def save_history(self, filename: str = "battery_history.json"):
        """Save operation history to file"""
        with self.lock:
            try:
                with open(filename, 'w') as f:
                    json.dump(self.operation_history, f, indent=2)
                print(f"💾 Battery history saved to {filename}")
            except Exception as e:
                print(f"❌ Error saving battery history: {e}")
    
    def update_thresholds(self, charge_threshold: float, discharge_threshold: float, sell_threshold: Optional[float] = None):
        """Update decision thresholds"""
        self.charge_threshold = charge_threshold
        self.discharge_threshold = discharge_threshold
        if sell_threshold is not None:
            self.sell_threshold = sell_threshold

def main():
    """Example usage of the BatterySystem"""
    print("🚀 Initializing Battery System...")
    
    # Create battery system
    battery = BatterySystem(
        capacity_mwh=100.0,
        max_charge_rate_mw=20.0,
        max_discharge_rate_mw=20.0,
        efficiency=0.9,
        initial_charge=50.0
    )
    
    # Create price monitor
    price_monitor = PriceMonitor()
    price_monitor.start()
    
    try:
        print("🔋 Battery System Ready!")
        print("Press Ctrl+C to stop...")
        
        while True:
            # Get latest prices
            latest_prices = price_monitor.get_latest_prices()
            
            if latest_prices:
                # Make battery decision
                decision = battery.make_decision(
                    energy_price=latest_prices['energy_price'],
                    hash_price=latest_prices['hash_price'],
                    token_price=latest_prices['token_price']
                )
                
                # Display status
                print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Battery Decision:")
                print(f"   Action: {decision['action'].upper()}")
                print(f"   Reason: {decision['reason']}")
                
                if decision['action'] != 'hold':
                    result = decision['result']
                    if result['success']:
                        if decision['action'] == 'charge':
                            print(f"   ✅ Charged: {result['energy_stored']:.2f} MWh")
                        else:
                            print(f"   ⚡ Discharged: {result['energy_used']:.2f} MWh")
                        print(f"   Battery Level: {result['new_charge_level']:.1f}%")
                
                # Display battery status
                battery.display_status()
            
            time.sleep(60)  # Check every minute
            
    except KeyboardInterrupt:
        print("\n🛑 Stopping battery system...")
        price_monitor.stop()
        battery.save_history()
        print("👋 Battery system stopped")

if __name__ == "__main__":
    main() 