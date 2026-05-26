import re
import json

with open("data.js", "r", encoding="utf-8") as f:
    content = f.read()

# Parse SEED_ATTRACTIONS
attrs_match = re.search(r'const SEED_ATTRACTIONS = \[(.*?)^\s*\];', content, re.DOTALL | re.MULTILINE)
if attrs_match:
    block = attrs_match.group(1)
    
    # Let's parse each attraction JSON-like or JS object
    # A robust check is to find if there are any objects missing "lat" or "lng"
    # We can split by attraction blocks or use regex to check if they have both "lat" and "lng"
    attractions = re.findall(r'(\{[^{}]+\})', block)
    print(f"Regex found {len(attractions)} potential attraction objects in block.")
    
    missing_coords = 0
    malformed_coords = 0
    
    for idx, attr_str in enumerate(attractions):
        # We only care about objects with id (to make sure they are attraction objects)
        if "id" not in attr_str:
            continue
            
        # Check for lat and lng
        lat_match = re.search(r'["\']?lat["\']?\s*:\s*(-?\d+\.?\d*)', attr_str)
        lng_match = re.search(r'["\']?lng["\']?\s*:\s*(-?\d+\.?\d*)', attr_str)
        
        if not lat_match or not lng_match:
            print(f"Attraction at index {idx} is missing lat/lng coordinates! Content:\n{attr_str[:200]}...")
            missing_coords += 1
            
    print(f"Total attractions missing coords: {missing_coords}")
else:
    print("Could not find SEED_ATTRACTIONS block!")
