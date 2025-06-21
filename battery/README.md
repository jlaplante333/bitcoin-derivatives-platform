# 🔋 Battery System

A virtual energy buffer system that integrates with the Bitcoin derivatives platform to optimize energy usage based on real-time price data.

## 🎯 Overview

The battery system simulates a virtual energy storage solution that:
- **Charges** when energy prices are low (< 1.7)
- **Discharges** when energy prices are high (> 2.0)
- **Powers** mining and inference operations during expensive periods
- **Tracks** all operations and energy usage

## 🚀 Features

### Core Functionality
- ✅ **Real-time price monitoring** integration
- ✅ **Intelligent charging/discharging** decisions
- ✅ **Thread-safe operations** with background monitoring
- ✅ **Energy efficiency tracking** (90% efficiency by default)
- ✅ **Operation history** logging and export
- ✅ **Configurable thresholds** and capacity limits

### Battery Specifications
- **Capacity**: 100 MWh (configurable)
- **Max Charge Rate**: 20 MW (configurable)
- **Max Discharge Rate**: 20 MW (configurable)
- **Efficiency**: 90% (configurable)
- **Charge Threshold**: 1.7 (charge when energy price < 1.7)
- **Discharge Threshold**: 2.0 (discharge when energy price > 2.0)

## 📊 Usage

### Basic Usage
```python
from battery.battery_system import BatterySystem

# Create battery system
battery = BatterySystem(
    capacity_mwh=100.0,
    max_charge_rate_mw=20.0,
    max_discharge_rate_mw=20.0,
    efficiency=0.9,
    initial_charge=50.0
)

# Get battery status
status = battery.get_status()
print(f"Charge Level: {status['charge_level_percent']}%")

# Make decision based on current prices
decision = battery.make_decision(
    energy_price=1.8,
    hash_price=1.7,
    token_price=1.0
)
print(f"Action: {decision['action']}")
```

### Integration with Price Monitor
```python
from price_monitor.price_monitor import PriceMonitor
from battery.battery_system import BatterySystem

# Start price monitoring
price_monitor = PriceMonitor()
price_monitor.start()

# Create battery system
battery = BatterySystem()

# Continuous monitoring loop
while True:
    latest_prices = price_monitor.get_latest_prices()
    if latest_prices:
        decision = battery.make_decision(
            energy_price=latest_prices['energy_price'],
            hash_price=latest_prices['hash_price'],
            token_price=latest_prices['token_price']
        )
        print(f"Decision: {decision['action']}")
    time.sleep(60)
```

## 🧪 Testing

Run the test suite to verify functionality:
```bash
python3 battery/test_battery.py
```

Tests include:
- ✅ Basic charging/discharging operations
- ✅ Decision making with different price scenarios
- ✅ Capacity and rate limit validation
- ✅ Error handling and edge cases

## 📈 Decision Logic

### Charging Conditions
- Energy price < 1.5 (charge threshold)
- Battery has available capacity
- Current demand can be met

### Discharging Conditions
- Energy price > 2.0 (discharge threshold)
- Battery has sufficient energy
- Mining/inference operations need power

### Hold Conditions
- Energy price between 1.5-2.0
- No action needed

## 🔧 API Reference

### BatterySystem Class

#### Constructor
```python
BatterySystem(
    capacity_mwh=100.0,
    max_charge_rate_mw=20.0,
    max_discharge_rate_mw=20.0,
    efficiency=0.9,
    initial_charge=50.0
)
```

#### Methods

**`get_status()`** - Get current battery status
```python
status = battery.get_status()
# Returns: {
#   "charge_level_percent": 75.5,
#   "available_energy_mwh": 75.5,
#   "capacity_mwh": 100.0,
#   "can_charge": True,
#   "can_discharge": True,
#   ...
# }
```

**`make_decision(energy_price, hash_price, token_price)`** - Make charging/discharging decision
```python
decision = battery.make_decision(1.8, 1.7, 1.0)
# Returns: {
#   "action": "hold",
#   "reason": "Energy price (1.80) within normal range",
#   "result": {"success": True}
# }
```

**`charge(power_mw, duration_hours)`** - Charge the battery
```python
result = battery.charge(10.0, 2.0)  # 10 MW for 2 hours
```

**`discharge(power_mw, duration_hours)`** - Discharge the battery
```python
result = battery.discharge(15.0, 1.0)  # 15 MW for 1 hour
```

**`display_status()`** - Display formatted battery status
```python
battery.display_status()
# Output:
# 🔋 Battery System Status:
#    Charge Level: 75.5%
#    Available Energy: 75.50 MWh
#    ...
```

**`save_history(filename)`** - Save operation history to JSON
```python
battery.save_history("battery_history.json")
```

## 📁 Files

- `battery_system.py` - Main battery system implementation
- `test_battery.py` - Test suite for battery functionality
- `README.md` - This documentation file

## 🎯 Integration Points

The battery system integrates with:
- **Price Monitor**: Real-time price data for decision making
- **Mining Operations**: 15 MW energy demand
- **Inference Operations**: 10 MW energy demand
- **Energy Grid**: Virtual energy storage and retrieval

## 🚀 Future Enhancements

- [ ] **Emissions tracking** for green energy optimization
- [ ] **Predictive charging** based on price forecasts
- [ ] **Multiple battery types** with different characteristics
- [ ] **Grid integration** for real-world deployment
- [ ] **Machine learning** for optimized decision making 