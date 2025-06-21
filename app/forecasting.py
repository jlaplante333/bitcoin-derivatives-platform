import random

def get_forecast_data():
    base_price = 65000
    forecast_data = []
    for day in range(1, 6):
        forecast = round(base_price + random.uniform(-2000, 2000), 2)
        forecast_data.append({"day": day, "price": forecast})
    return forecast_data

def forecast_prices():
    print("Future BTC price forecast (next 5 days):")
    data = get_forecast_data()
    for item in data:
        print(f"Day {item['day']}: ${item['price']}")
