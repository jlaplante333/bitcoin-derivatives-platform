#!/usr/bin/env python3
import requests
import json
import os

def fetch_and_cache_inventory():
    """Fetch inventory from the API and cache it locally"""
    url = "https://mara-hackathon-api.onrender.com/inventory"
    
    try:
        print("Fetching inventory from API...")
        response = requests.get(url)
        response.raise_for_status()
        
        inventory_data = response.json()
        
        # Create cache directory if it doesn't exist
        cache_dir = "cache"
        if not os.path.exists(cache_dir):
            os.makedirs(cache_dir)
        
        # Save to cache file
        cache_file = os.path.join(cache_dir, "inventory.json")
        with open(cache_file, 'w') as f:
            json.dump(inventory_data, f, indent=2)
        
        print(f"✅ Inventory cached successfully to {cache_file}")
        
        # Display inventory summary
        print("\n📦 Inventory Summary:")
        
        print("\n🔧 Miners:")
        for miner_type, specs in inventory_data['miners'].items():
            print(f"   {miner_type.capitalize()}: {specs['hashrate']} hashrate, {specs['power']} power")
        
        print("\n🤖 Inference Equipment:")
        for inference_type, specs in inventory_data['inference'].items():
            print(f"   {inference_type.upper()}: {specs['tokens']} tokens, {specs['power']} power")
        
        return inventory_data
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching inventory: {e}")
        return None
    except Exception as e:
        print(f"❌ Error caching inventory: {e}")
        return None

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

if __name__ == "__main__":
    # Fetch and cache inventory
    inventory = fetch_and_cache_inventory()
    
    if inventory:
        print("\n🎯 Inventory is now cached locally and ready to use!")
        print("💡 You can use load_cached_inventory() to access it without making API calls.") 