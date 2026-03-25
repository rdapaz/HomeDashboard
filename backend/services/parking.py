"""City of Perth parking bay availability scraper."""

import httpx
from bs4 import BeautifulSoup
from database import get_cached, set_cached
from config import PARKING_URL, CACHE_PARKING

CACHE_KEY = "parking"


async def fetch_parking() -> dict:
    """Fetch parking bay availability from City of Perth."""
    cached = get_cached(CACHE_KEY, CACHE_PARKING)
    if cached:
        return cached

    data = await _scrape_parking()
    if data:
        set_cached(CACHE_KEY, data)
    return data or {"error": "Failed to fetch parking data", "locations": []}


async def _scrape_parking() -> dict | None:
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(
                PARKING_URL,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                },
            )
            resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")
        locations = []

        # Look for parking facility data on the page
        # The exact selectors will need adjustment based on the actual page structure
        # Common patterns: cards, tables, or divs with availability data
        facility_elements = soup.select(".facility, .parking-facility, .car-park, [class*='park']")

        if not facility_elements:
            # Fallback: try to find any structured parking data
            # Look for elements with numbers that could be bay counts
            facility_elements = soup.select(".card, .location, .item")

        for el in facility_elements:
            name_el = el.select_one("h2, h3, h4, .name, .title, .facility-name")
            avail_el = el.select_one(".available, .bays, .count, .spaces, [class*='avail']")

            if name_el and avail_el:
                name = name_el.get_text(strip=True)
                available_text = avail_el.get_text(strip=True)

                # Extract number from text
                available = 0
                for word in available_text.split():
                    if word.isdigit():
                        available = int(word)
                        break

                locations.append({
                    "name": name,
                    "available": available,
                    "status": "open" if available > 0 else "full",
                })

        # If scraping didn't find structured data, return a note
        if not locations:
            return {
                "locations": [],
                "note": "Parking data structure may have changed. Check cityofperthparking.com.au",
            }

        return {"locations": locations}
    except Exception as e:
        print(f"Parking scraper error: {e}")
        return None
