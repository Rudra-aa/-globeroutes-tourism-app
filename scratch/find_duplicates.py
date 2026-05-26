import re

with open("data.js", "r", encoding="utf-8") as f:
    content = f.read()

# Parse SEED_CITIES keys
cities_block = re.search(r'const SEED_CITIES = \{(.*?)^};', content, re.DOTALL | re.MULTILINE)
if cities_block:
    city_keys = re.findall(r'^\s{2}([a-zA-Z0-9_]+):\s*\{', cities_block.group(1), re.MULTILINE)
    seen_cities = {}
    city_dupes = []
    for key in city_keys:
        if key in seen_cities:
            city_dupes.append(key)
            seen_cities[key] += 1
        else:
            seen_cities[key] = 1
    print(f"Duplicate City Keys in SEED_CITIES: {city_dupes}")

# Parse SEED_ATTRACTIONS block
attrs_block = re.search(r'const SEED_ATTRACTIONS = \[(.*?)^\s*\];', content, re.DOTALL | re.MULTILINE)
if attrs_block:
    # Let's extract id fields inside attractions
    attraction_ids = re.findall(r'id:\s*["\']([^"\']+)["\']', attrs_block.group(1))
    seen_attrs = {}
    attr_dupes = []
    for attr_id in attraction_ids:
        if attr_id in seen_attrs:
            attr_dupes.append(attr_id)
            seen_attrs[attr_id] += 1
        else:
            seen_attrs[attr_id] = 1
    print(f"Duplicate Attraction IDs in SEED_ATTRACTIONS: {len(attr_dupes)} duplicate IDs found.")
    if len(attr_dupes) > 0:
        print(f"First 10 duplicates: {attr_dupes[:10]}")
        
    # Also find duplicate names + cityId combinations
    attraction_names = re.findall(r'name:\s*["\']([^"\']+)["\'].*?cityId:\s*["\']([^"\']+)["\']', attrs_block.group(1), re.DOTALL)
    seen_names = {}
    name_dupes = []
    for name, cityId in attraction_names:
        key = (name, cityId)
        if key in seen_names:
            name_dupes.append(key)
            seen_names[key] += 1
        else:
            seen_names[key] = 1
    print(f"Duplicate Attraction Name+City combinations: {len(name_dupes)} found.")
    if len(name_dupes) > 0:
        print(f"First 10 name duplicates: {name_dupes[:10]}")
