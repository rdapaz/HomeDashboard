"""Finance services: Bitcoin price, USD/AUD exchange rate, ASX top performers."""

import httpx
import yfinance as yf
from database import get_cached, set_cached
from config import (
    COINGECKO_URL, FRANKFURTER_URL, ASX_TICKERS,
    CACHE_BTC, CACHE_FX, CACHE_ASX,
)


async def fetch_finance() -> dict:
    """Fetch all finance data."""
    btc = await fetch_btc()
    fx = await fetch_fx()
    asx = fetch_asx()

    return {
        "bitcoin": btc,
        "exchange_rate": fx,
        "asx": asx,
    }


async def fetch_btc() -> dict:
    """Fetch Bitcoin price in AUD from CoinGecko."""
    cached = get_cached("btc", CACHE_BTC)
    if cached:
        return cached

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{COINGECKO_URL}/simple/price",
                params={
                    "ids": "bitcoin",
                    "vs_currencies": "aud",
                    "include_24hr_change": "true",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        result = {
            "price_aud": data.get("bitcoin", {}).get("aud"),
            "change_24h_pct": data.get("bitcoin", {}).get("aud_24h_change"),
        }
        set_cached("btc", result)
        return result
    except Exception as e:
        print(f"CoinGecko error: {e}")
        return {"error": str(e)}


async def fetch_fx() -> dict:
    """Fetch USD to AUD exchange rate from Frankfurter."""
    cached = get_cached("fx", CACHE_FX)
    if cached:
        return cached

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                FRANKFURTER_URL,
                params={"from": "USD", "to": "AUD"},
            )
            resp.raise_for_status()
            data = resp.json()

        result = {
            "usd_to_aud": data.get("rates", {}).get("AUD"),
            "date": data.get("date"),
        }
        set_cached("fx", result)
        return result
    except Exception as e:
        print(f"Frankfurter error: {e}")
        return {"error": str(e)}


def fetch_asx() -> dict:
    """Fetch ASX top performers using yfinance bulk download."""
    cached = get_cached("asx", CACHE_ASX)
    if cached:
        return cached

    try:
        import time as _time
        movers = []

        # Use yf.download for bulk fetch (more reliable than individual Ticker calls)
        symbols_str = " ".join(ASX_TICKERS)
        data = yf.download(symbols_str, period="5d", group_by="ticker", progress=False)

        if data.empty:
            print("yfinance: bulk download returned empty data")
            return {"top_gainers": [], "top_losers": [], "note": "ASX data temporarily unavailable"}

        for symbol in ASX_TICKERS:
            try:
                if symbol in data.columns.get_level_values(0):
                    ticker_data = data[symbol]["Close"].dropna()
                else:
                    continue

                if len(ticker_data) < 2:
                    continue

                prev_close = float(ticker_data.iloc[-2])
                price = float(ticker_data.iloc[-1])

                if prev_close > 0:
                    change_pct = ((price - prev_close) / prev_close) * 100
                else:
                    change_pct = 0

                movers.append({
                    "symbol": symbol.replace(".AX", ""),
                    "price": round(price, 2),
                    "change_pct": round(change_pct, 2),
                })
            except Exception as e:
                print(f"yfinance ticker {symbol} parse error: {e}")
                continue

        # Sort by change percentage descending
        movers.sort(key=lambda x: x["change_pct"], reverse=True)

        result = {
            "top_gainers": movers[:5],
            "top_losers": movers[-5:][::-1] if len(movers) >= 5 else [],
        }
        if movers:
            set_cached("asx", result)
        return result
    except Exception as e:
        print(f"yfinance error: {e}")
        return {"error": str(e)}
