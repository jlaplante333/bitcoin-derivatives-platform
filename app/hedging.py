def get_hedging_suggestions():
    return [
        "Recommended hedge: Buy put options to cover 50% of long BTC exposure.",
        "Alternative: Diversify with short ETH futures or stablecoin allocation."
    ]

def suggest_hedges():
    suggestions = get_hedging_suggestions()
    for suggestion in suggestions:
        print(suggestion)
