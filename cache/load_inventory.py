#!/usr/bin/env python3
import json
import os

def load_cached_inventory():
    """Load cached inventory from local file"""
    cache_file = "cache/inventory.json"
    
    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"❌ Error loading cached inventory: {e}")
    
    return None

def get_inventory_summary():
    """Get a formatted summary of the cached inventory"""
    inventory = load_cached_inventory()
    
    if not inventory:
        print("❌ No cached inventory found. Run cache_inventory.py first.")
        return None
    
    print("📦 Cached Inventory Summary:")
    
    print("\n🔧 Miners:")
    for miner_type, specs in inventory['miners'].items():
        print(f"   {miner_type.capitalize()}: {specs['hashrate']} hashrate, {specs['power']} power")
    
    print("\n🤖 Inference Equipment:")
    for inference_type, specs in inventory['inference'].items():
        print(f"   {inference_type.upper()}: {specs['tokens']} tokens, {specs['power']} power")
    
    return inventory

if __name__ == "__main__":
    get_inventory_summary() 