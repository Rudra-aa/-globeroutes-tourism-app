import re
import sys

# Read build_india_data.py to see what places it tries to add
with open("build_india_data.py", "r", encoding="utf-8") as f:
    generator_content = f.read()

# Read data.js to see what places actually exist
with open("data.js", "r", encoding="utf-8") as f:
    data_content = f.read()

# Find all places in build_india_data.py under add_places([...])
# They are in the format ("Name", "City", "State", BaseScore, "Category", ...)
# Or ("Name", "City", "State", BaseScore, "Category")
places_in_generator = re.findall(r'\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*(\d+)\s*,\s*"([^"]+)"', generator_content)

print(f"Total places in generator: {len(places_in_generator)}")

# Find all IDs of attractions currently in data.js
data_attraction_ids = set(re.findall(r'id:\s*"([^"]+)"', data_content))

missing_places = []
for name, city, state, base_score, category in places_in_generator:
    # generate the ID exactly like build_india_data.py does
    clean_name = name.lower().replace(' ', '_').replace("'", '').replace('-', '_')
    clean_city = city.lower().replace(' ', '_')
    place_id = f"{clean_city}_{clean_name}"
    
    if place_id not in data_attraction_ids:
        missing_places.append((name, city, state, category, place_id))

print(f"\nMissing places ({len(missing_places)}):")
for idx, (name, city, state, category, pid) in enumerate(missing_places, 1):
    print(f"  {idx}. {name} ({city}, {state}) | Category: {category} | Generated ID: {pid}")
