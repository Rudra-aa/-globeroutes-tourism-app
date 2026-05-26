import re

with open("data.js", "r", encoding="utf-8") as f:
    content = f.read()

# We only want to search in the cities block of data.js
city_start_marker = "  // --- INDIA CITIES ---"
city_end_marker = "    tokyo: {"

start_city_idx = content.find(city_start_marker)
end_city_idx = content.find(city_end_marker)

cities_block = content[start_city_idx:end_city_idx]

# Let's extract each city entry
# A city entry typically looks like:
#   city_id: {
#       id: "city_id", name: "Name", ...
#   },
# Let's find matches
city_matches = re.finditer(r'(\w+):\s*\{\s*id:\s*"(\w+)"(.*?)\},', cities_block, re.DOTALL)
existing_cities = {}

for match in city_matches:
    city_key = match.group(1)
    city_body = match.group(3)
    
    # Extract fields
    name_m = re.search(r'name:\s*"([^"]*)"', city_body)
    state_m = re.search(r'state:\s*"([^"]*)"', city_body)
    lat_m = re.search(r'lat:\s*([-\d.]+)', city_body)
    lng_m = re.search(r'lng:\s*([-\d.]+)', city_body)
    tagline_m = re.search(r'tagline:\s*"([^"]*)"', city_body)
    desc_m = re.search(r'description:\s*"([^"]*)"', city_body)
    img_m = re.search(r'coverImage:\s*"([^"]*)"', city_body)
    
    existing_cities[city_key] = {
        "name": name_m.group(1) if name_m else None,
        "state": state_m.group(1) if state_m else None,
        "lat": float(lat_m.group(1)) if lat_m else None,
        "lng": float(lng_m.group(1)) if lng_m else None,
        "tagline": tagline_m.group(1) if tagline_m else None,
        "description": desc_m.group(1) if desc_m else None,
        "coverImage": img_m.group(1) if img_m else None,
    }

print(f"Parsed {len(existing_cities)} existing cities from data.js:")
for k, v in list(existing_cities.items())[:5]:
    print(f"  {k}: {v['name']} | Tagline: '{v['tagline']}'")
