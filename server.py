from flask import Flask, render_template, jsonify, request
from app.api import get_current_btc_price
from app.forecasting import get_forecast_data
from app.hedging import get_hedging_suggestions
import requests
import random
import time
from dotenv import load_dotenv
import os
import openai
from datetime import date
import json

load_dotenv()

app = Flask(__name__)

openai.api_key = os.getenv("OPENAI_API_KEY")

@app.route('/')
def index():
    btc_price = get_current_btc_price()
    return render_template('index.html', btc_price=btc_price)

@app.route('/ai_analysis', methods=['POST'])
def ai_analysis():
    try:
        data = request.json
        exposure = data.get('exposure')
        btc_delta = data.get('btc_delta')
        energy_delta = data.get('energy_delta')
        vega = data.get('vega')
        time_horizon = data.get('time_horizon')

        # Get today's date to pass to the prompt
        today = date.today().strftime("%Y-%m-%d")

        prompt = f"""
        As a sophisticated financial analyst for a Bitcoin-centric quantitative fund, your task is to construct a derivatives portfolio that matches the user's specified risk sensitivities (Greeks) and constraints.

        User Parameters:
        - Target Exposure Managed: {exposure}% (The portion of the total portfolio this derivatives strategy should represent)
        - Target BTC Price Delta: {btc_delta} (The desired sensitivity of the position's value to a $1 change in Bitcoin's price)
        - Target Energy Price Delta: {energy_delta} (The desired sensitivity of the position's value to a $1 change in the price of energy/MWh)
        - Target Vega: {vega} (The desired sensitivity of the position's value to a 1% change in implied volatility)
        - Time Horizon: {time_horizon} days

        Current Market Conditions:
        - Today's Date: {today}
        - Current BTC Price: $68,730
        - Current Energy Price: $55/MWh
        - BTC Implied Volatility: 65%
        - Energy Implied Volatility: 40%
        - Market Sentiment: Moderately Bullish on BTC, Neutral on Energy

        Instructions:
        1.  Propose a block of 2 to 5 derivatives positions. You can use options or futures on both BTC and Energy to achieve the target Greeks.
        2.  For each position, specify:
            - Asset: (BTC or Energy)
            - Type: (e.g., Call Option, Put Option, Future)
            - Action: (Buy or Sell)
            - Quantity: (Number of contracts)
            - Strike Price: (in USD)
            - Expiry Date: (in YYYY-MM-DD format). **Crucially, this date must be in the future relative to today's date ({today}).**
            - Delta: The individual position's delta.
            - Vega: The individual position's vega.
        3.  Provide a brief (2-3 sentence) justification for the overall strategy.
        4.  Quantify the benefit of this strategy by calculating the total change it will have on the portfolio's overall risk profile. Provide this as "impact_to_portfolio_delta" and "impact_to_portfolio_vega".
        5.  Format the entire response as a single JSON object. Do not include any other text, greetings, or explanations outside of the JSON object.

        Example JSON structure:
        {{
          "justification": "This portfolio uses a long BTC call spread to achieve positive BTC delta and vega, while shorting an energy future to create the target negative energy delta. The overall structure is capital efficient and matches the specified time horizon.",
          "impact_to_portfolio_delta": 550.75,
          "impact_to_portfolio_vega": 120.50,
          "positions": [
            {{
              "Asset": "BTC",
              "Type": "Call Option",
              "Action": "Buy",
              "Quantity": 10,
              "Strike Price": 75000,
              "Expiry Date": "2025-09-30",
              "Delta": 0.52,
              "Vega": 150.20
            }},
            {{
              "Asset": "Energy",
              "Type": "Future",
              "Action": "Sell",
              "Quantity": 20,
              "Strike Price": 60,
              "Expiry Date": "2025-09-30",
              "Delta": -20.00,
              "Vega": 0
            }}
          ]
        }}
        """

        client = openai.OpenAI()
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )
        
        ai_response = response.choices[0].message.content.strip()
        
        # Ensure the response is clean JSON
        ai_response = ai_response.lstrip('```json').rstrip('```')

        return jsonify(json.loads(ai_response))

    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": "Failed to get AI recommendation."}), 500

@app.route('/forecast')
def forecast():
    return jsonify(get_forecast_data())

@app.route('/hedging')
def hedging():
    return jsonify(get_hedging_suggestions())

@app.route('/market_data')
def market_data():
    try:
        response = requests.get('https://mara-hackathon-api.onrender.com/prices')
        response.raise_for_status()  # Raise an exception for bad status codes
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001) 