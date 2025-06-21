from app.api import get_current_btc_price

def test_get_current_btc_price():
    result = get_current_btc_price()
    assert "Error" not in result
