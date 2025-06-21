#!/usr/bin/env python3
import sys
import os
import time
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from battery.battery_system import BatterySystem

def test_battery_basic():
    """Test basic battery operations"""
    print("🧪 Testing Basic Battery Operations...")
    
    # Create battery
    battery = BatterySystem(
        capacity_mwh=50.0,
        max_charge_rate_mw=10.0,
        max_discharge_rate_mw=10.0,
        efficiency=0.9,
        initial_charge=25.0
    )
    
    # Display initial status
    print("\n📊 Initial Status:")
    battery.display_status()
    
    # Test charging
    print("\n⚡ Testing Charging...")
    charge_result = battery.charge(5.0, 2.0)  # 5 MW for 2 hours
    if charge_result['success']:
        print(f"   ✅ Charged: {charge_result['energy_stored']:.2f} MWh")
        print(f"   Battery Level: {charge_result['new_charge_level']:.1f}%")
    else:
        print(f"   ❌ Charge failed: {charge_result['reason']}")
    
    # Test discharging
    print("\n🔋 Testing Discharging...")
    discharge_result = battery.discharge(3.0, 1.0)  # 3 MW for 1 hour
    if discharge_result['success']:
        print(f"   ⚡ Discharged: {discharge_result['energy_used']:.2f} MWh")
        print(f"   Battery Level: {discharge_result['new_charge_level']:.1f}%")
    else:
        print(f"   ❌ Discharge failed: {discharge_result['reason']}")
    
    # Display final status
    print("\n📊 Final Status:")
    battery.display_status()
    
    return battery

def test_battery_decisions():
    """Test battery decision making with different energy prices"""
    print("\n🧪 Testing Battery Decision Making...")
    
    battery = BatterySystem(initial_charge=50.0)
    
    # Test scenarios
    scenarios = [
        {"energy_price": 1.2, "hash_price": 1.7, "token_price": 1.0, "expected": "charge"},
        {"energy_price": 2.5, "hash_price": 1.7, "token_price": 1.0, "expected": "discharge"},
        {"energy_price": 1.8, "hash_price": 1.7, "token_price": 1.0, "expected": "hold"},
    ]
    
    for i, scenario in enumerate(scenarios, 1):
        print(f"\n📈 Scenario {i}: Energy Price = {scenario['energy_price']}")
        
        decision = battery.make_decision(
            energy_price=scenario['energy_price'],
            hash_price=scenario['hash_price'],
            token_price=scenario['token_price']
        )
        
        print(f"   Decision: {decision['action'].upper()}")
        print(f"   Reason: {decision['reason']}")
        print(f"   Expected: {scenario['expected'].upper()}")
        
        if decision['action'] == scenario['expected']:
            print("   ✅ Decision matches expectation")
        else:
            print("   ❌ Decision doesn't match expectation")

def test_battery_limits():
    """Test battery capacity and rate limits"""
    print("\n🧪 Testing Battery Limits...")
    
    # Create battery with low capacity
    battery = BatterySystem(
        capacity_mwh=10.0,
        max_charge_rate_mw=5.0,
        max_discharge_rate_mw=5.0,
        initial_charge=90.0  # Almost full
    )
    
    print("\n📊 Initial Status (Almost Full):")
    battery.display_status()
    
    # Try to charge when almost full
    print("\n⚡ Trying to charge when almost full...")
    charge_result = battery.charge(5.0, 1.0)
    if charge_result['success']:
        print(f"   ✅ Charged: {charge_result['energy_stored']:.2f} MWh")
    else:
        print(f"   ❌ Charge blocked: {charge_result['reason']}")
    
    # Try to discharge when almost empty
    battery = BatterySystem(
        capacity_mwh=10.0,
        max_charge_rate_mw=5.0,
        max_discharge_rate_mw=5.0,
        initial_charge=10.0  # Almost empty
    )
    
    print("\n📊 Status (Almost Empty):")
    battery.display_status()
    
    print("\n🔋 Trying to discharge when almost empty...")
    discharge_result = battery.discharge(5.0, 1.0)
    if discharge_result['success']:
        print(f"   ⚡ Discharged: {discharge_result['energy_used']:.2f} MWh")
    else:
        print(f"   ❌ Discharge blocked: {discharge_result['reason']}")

def main():
    """Run all battery tests"""
    print("🔋 Battery System Test Suite")
    print("=" * 50)
    
    try:
        # Run tests
        battery = test_battery_basic()
        test_battery_decisions()
        test_battery_limits()
        
        # Save test history
        battery.save_history("test_battery_history.json")
        
        print("\n✅ All tests completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")

if __name__ == "__main__":
    main() 