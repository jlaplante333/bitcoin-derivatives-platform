import random

def get_current_btc_price():
    base_price = 103512.58
    fluctuation = random.uniform(-100, 100)
    price = base_price + fluctuation
    return f"${price:,.2f}"
