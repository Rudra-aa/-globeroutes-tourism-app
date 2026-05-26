import os

# Define the exact original cities for France, Japan, USA, Egypt
france_cities = """  paris: {
    id: "paris",
    name: "Paris",
    countryId: "france",
    lat: 48.8566,
    lng: 2.3522,
    tagline: "The City of Light",
    description: "The global center of art, fashion, gastronomy, and romantic walks along the winding Seine River.",
    coverImage: "https://images.unsplash.com/photo-1499856138868-75586016629f?auto=format&fit=crop&w=600&q=80"
  },
  nice: {
    id: "nice",
    name: "Nice",
    countryId: "france",
    lat: 43.7102,
    lng: 7.2620,
    tagline: "Jewel of the Côte d'Azur",
    description: "A gorgeous coastal retreat famous for pebble beaches, old Italianate squares, and stunning azure waters.",
    coverImage: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=600&q=80"
  },
  chamonix: {
    id: "chamonix",
    name: "Chamonix-Mont-Blanc",
    countryId: "france",
    lat: 45.9227,
    lng: 6.8685,
    tagline: "Roof of the Alps",
    description: "A dramatic alpine valley at the base of Mont Blanc, world-famous for mountaineering, skiing, and glaciers.",
    coverImage: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=600&q=80"
  },"""

japan_cities = """  tokyo: {
    id: "tokyo",
    name: "Tokyo",
    countryId: "japan",
    lat: 35.6762,
    lng: 139.6503,
    tagline: "Retro-Futuristic Megacity",
    description: "A neon-splashed metropolis that marries massive skyscrapers, electronic districts, and hidden peaceful Shinto shrines.",
    coverImage: "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=600&q=80"
  },
  kyoto: {
    id: "kyoto",
    name: "Kyoto",
    countryId: "japan",
    lat: 35.0116,
    lng: 135.7681,
    tagline: "Ancient Capital of Culture",
    description: "The historic heart of traditional Japan, filled with thousands of classical Buddhist temples, gardens, and geisha wooden teahouses.",
    coverImage: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80"
  },"""

usa_cities = """  newyork: {
    id: "newyork",
    name: "New York City",
    countryId: "usa",
    lat: 40.7128,
    lng: -74.0060,
    tagline: "The Big Apple",
    description: "The energetic global capital of entertainment, media, finance, skyscrapers, and historic cultural neighborhoods.",
    coverImage: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=600&q=80"
  },
  sanfrancisco: {
    id: "sanfrancisco",
    name: "San Francisco",
    countryId: "usa",
    lat: 37.7749,
    lng: -122.4194,
    tagline: "The Golden Gate City",
    description: "Famed for its majestic red suspension bridge, steep rolling hills, historic cable cars, and colorful Victorian architecture.",
    coverImage: "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=600&q=80"
  },"""

egypt_cities = """  giza: {
    id: "giza",
    name: "Giza",
    countryId: "egypt",
    lat: 29.9765,
    lng: 31.1313,
    tagline: "Guardians of Antiquity",
    description: "A city globally famous for its limestone pyramids, the Great Sphinx, and millennia of pharaonic engineering history.",
    coverImage: "https://images.unsplash.com/photo-1503177119275-0aa32b31d468?auto=format&fit=crop&w=600&q=80"
  },
  cairo: {
    id: "cairo",
    name: "Cairo",
    countryId: "egypt",
    lat: 30.0444,
    lng: 31.2357,
    tagline: "The City of a Thousand Minarets",
    description: "A massive, chaotic, and beautiful capital loaded with rich Islamic history, busy Coptic quarters, and legendary antiquities.",
    coverImage: "https://images.unsplash.com/photo-1572252009286-268acec5a0af?auto=format&fit=crop&w=600&q=80"
  }"""

with open("data.js", "r", encoding="utf-8") as f:
    content = f.read()

# Locate the starts and ends
head_split = content.split("const SEED_CITIES = {")
head_text = head_split[0] + "const SEED_CITIES = {\n"

tail_split = content.split("const SEED_ATTRACTIONS = [")
tail_text = "const SEED_ATTRACTIONS = [" + tail_split[1]

# Extract India cities lines from the original text (between '// --- INDIA CITIES ---' and '// --- USA CITIES (PREMIUM) ---')
india_start_idx = content.find("// --- INDIA CITIES ---")
usa_start_idx = content.find("// --- USA CITIES (PREMIUM) ---")

india_cities_block = content[india_start_idx:usa_start_idx].strip()

# Construct the brand-new repaired SEED_CITIES
new_cities_block = f"""  // --- FRANCE CITIES ---
{france_cities}

  // --- JAPAN CITIES ---
{japan_cities}

  {india_cities_block}

  // --- USA CITIES (PREMIUM) ---
{usa_cities}

  // --- EGYPT CITIES (PREMIUM) ---
{egypt_cities}
}};"""

new_data_js = head_text + new_cities_block + "\n\n" + tail_text

with open("data.js", "w", encoding="utf-8") as f:
    f.write(new_data_js)

print("="*60)
print("SUCCESSFULLY REPAIRED data.js CITIES AND RESTORED ENTIRE SYNTAX! ✅")
print("="*60)
