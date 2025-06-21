#!/usr/bin/env python3
import requests
import json
import os
from datetime import datetime

def fetch_and_cache_prices():
    """Fetch prices from the API and cache them locally"""
    url = "https://mara-hackathon-api.onrender.com/prices"
    
    try:
        print("Fetching prices from API...")
        response = requests.get(url)
        response.raise_for_status()
        
        prices_data = response.json()
        
        # Create cache directory if it doesn't exist
        cache_dir = "cache"
        if not os.path.exists(cache_dir):
            os.makedirs(cache_dir)
        
        # Save to cache file
        cache_file = os.path.join(cache_dir, "prices.json")
        with open(cache_file, 'w') as f:
            json.dump(prices_data, f, indent=2)
        
        print(f"✅ Prices cached successfully to {cache_file}")
        print(f"📊 Total price points: {len(prices_data)}")
        
        # Show latest prices
        if prices_data:
            latest = prices_data[0]
            print(f"\n📈 Latest prices (as of {latest['timestamp']}):")
            print(f"   Hash Price: {latest['hash_price']:.4f}")
            print(f"   Token Price: {latest['token_price']:.4f}")
            print(f"   Energy Price: {latest['energy_price']:.4f}")
        
        return prices_data
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching prices: {e}")
        return None
    except Exception as e:
        print(f"❌ Error caching prices: {e}")
        return None

def load_cached_prices():
    """Load cached prices from local file"""
    cache_file = "cache/prices.json"
    
    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"❌ Error loading cached prices: {e}")
    
    return None

if __name__ == "__main__":
    # Fetch and cache prices
    prices = fetch_and_cache_prices()
    
    if prices:
        print("\n🎯 Prices are now cached locally and ready to use!")
        print("💡 You can use load_cached_prices() to access them without making API calls.") 