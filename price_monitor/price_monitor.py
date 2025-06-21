#!/usr/bin/env python3
import subprocess
import json
import time
import threading
from datetime import datetime
from typing import List, Dict, Optional

class PriceMonitor:
    def __init__(self, api_url: str = "https://mara-hackathon-api.onrender.com/prices", interval_minutes: int = 5):
        """
        Initialize the PriceMonitor
        
        Args:
            api_url: The URL to fetch prices from
            interval_minutes: How often to fetch prices (in minutes)
        """
        self.api_url = api_url
        self.interval_seconds = interval_minutes * 60
        self.prices_history: List[Dict] = []
        self.latest_prices: Optional[Dict] = None
        self.is_running = False
        self.thread: Optional[threading.Thread] = None
        self.lock = threading.Lock()
        
    def fetch_prices(self) -> Optional[List[Dict]]:
        """Fetch current prices from the API using curl"""
        try:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Fetching prices from API...")
            
            # Use curl to fetch the data
            result = subprocess.run(
                ['curl', '-s', '-X', 'GET', self.api_url],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] ❌ Curl error: {result.stderr}")
                return None
            
            prices_data = json.loads(result.stdout)
            
            with self.lock:
                self.prices_history = prices_data
                if prices_data:
                    self.latest_prices = prices_data[0]  # Most recent price point
            
            print(f"[{datetime.now().strftime('%H:%M:%S')}] ✅ Fetched {len(prices_data)} price points")
            
            # Display latest prices
            if self.latest_prices:
                print(f"   Latest - Hash: {self.latest_prices['hash_price']:.4f}, "
                      f"Token: {self.latest_prices['token_price']:.4f}, "
                      f"Energy: {self.latest_prices['energy_price']:.4f}")
            
            return prices_data
            
        except subprocess.TimeoutExpired:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] ❌ Request timeout")
            return None
        except json.JSONDecodeError as e:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] ❌ JSON decode error: {e}")
            return None
        except Exception as e:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] ❌ Unexpected error: {e}")
            return None
    
    def _monitor_loop(self):
        """Internal loop that runs the price monitoring"""
        while self.is_running:
            self.fetch_prices()
            
            # Wait for the next interval
            time.sleep(self.interval_seconds)
    
    def start(self):
        """Start the price monitoring in a background thread"""
        if self.is_running:
            print("⚠️  Price monitor is already running!")
            return
        
        print(f"🚀 Starting price monitor - fetching every {self.interval_seconds//60} minutes")
        self.is_running = True
        self.thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.thread.start()
        
        # Do initial fetch
        self.fetch_prices()
    
    def stop(self):
        """Stop the price monitoring"""
        if not self.is_running:
            print("⚠️  Price monitor is not running!")
            return
        
        print("🛑 Stopping price monitor...")
        self.is_running = False
        if self.thread:
            self.thread.join(timeout=5)
    
    def get_latest_prices(self) -> Optional[Dict]:
        """Get the most recent price data"""
        with self.lock:
            return self.latest_prices.copy() if self.latest_prices else None
    
    def get_prices_history(self) -> List[Dict]:
        """Get all cached price history"""
        with self.lock:
            return self.prices_history.copy()
    
    def save_prices_to_file(self, filename: str = "prices_history.json"):
        """Save current price history to a file"""
        with self.lock:
            if self.prices_history:
                try:
                    with open(filename, 'w') as f:
                        json.dump(self.prices_history, f, indent=2)
                    print(f"💾 Prices saved to {filename}")
                except Exception as e:
                    print(f"❌ Error saving prices: {e}")
            else:
                print("⚠️  No prices to save")
    
    def get_price_summary(self) -> Dict:
        """Get a summary of current prices"""
        if not self.latest_prices:
            return {"error": "No prices available"}
        
        return {
            "timestamp": self.latest_prices["timestamp"],
            "hash_price": self.latest_prices["hash_price"],
            "token_price": self.latest_prices["token_price"],
            "energy_price": self.latest_prices["energy_price"],
            "total_price_points": len(self.prices_history)
        }
    
    def display_latest_prices(self):
        """Display the latest prices in a formatted way"""
        latest = self.get_latest_prices()
        
        if latest:
            print("📊 Latest Prices:")
            print(f"   Timestamp: {latest['timestamp']}")
            print(f"   Hash Price: {latest['hash_price']:.4f}")
            print(f"   Token Price: {latest['token_price']:.4f}")
            print(f"   Energy Price: {latest['energy_price']:.4f}")
            
            # Get price summary
            summary = self.get_price_summary()
            print(f"\n📈 Summary:")
            print(f"   Total price points: {summary['total_price_points']}")
            
            # Show recent price trend
            history = self.get_prices_history()
            if history:
                print(f"\n🕒 Recent Price Points:")
                for i, price in enumerate(history[:5]):
                    print(f"   {i+1}. {price['timestamp']} - Hash: {price['hash_price']:.4f}, "
                          f"Token: {price['token_price']:.4f}, Energy: {price['energy_price']:.4f}")
        else:
            print("❌ No prices available yet")

def main():
    """Example usage of the PriceMonitor class"""
    monitor = PriceMonitor()
    
    try:
        # Start monitoring
        monitor.start()
        
        # Wait a moment for initial fetch
        time.sleep(2)
        
        # Display latest prices
        monitor.display_latest_prices()
        
        # Keep the main thread alive
        print("\nPress Ctrl+C to stop the price monitor...")
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n🛑 Received interrupt signal")
        monitor.stop()
        print("👋 Price monitor stopped")

if __name__ == "__main__":
    main() 