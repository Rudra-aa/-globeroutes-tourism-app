import json
import re

with open("data.js", "r", encoding="utf-8") as f:
    content = f.read()

# Parse SEED_ATTRACTIONS block
attrs_match = re.search(r'const SEED_ATTRACTIONS = \[(.*?)^\s*\];', content, re.DOTALL | re.MULTILINE)
if attrs_match:
    block = attrs_match.group(1)
    
    # Let's extract all attractions using a simpler parser
    # Match JSON-like entries first
    lines = block.split("\n")
    red_attractions = []
    
    # We can match all lines containing "fameTier": "red" or fameTier: "red"
    for line in lines:
        if '"fameTier": "red"' in line or 'fameTier: "red"' in line or 'fameTier: \'red\'' in line:
            # Extract name and city
            name_match = re.search(r'["\']?name["\']?\s*:\s*["\']([^"\']+)["\']', line)
            city_match = re.search(r'["\']?cityId["\']?\s*:\s*["\']([^"\']+)["\']', line)
            score_match = re.search(r'["\']?fameScore["\']?\s*:\s*(\d+)', line)
            
            name = name_match.group(1) if name_match else "Unknown"
            city = city_match.group(1) if city_match else "Unknown"
            score = score_match.group(1) if score_match else "Unknown"
            
            red_attractions.append((name, city, score))
            
    print(f"Total Red-Tier Attractions: {len(red_attractions)}")
    for r in red_attractions:
        print(f"  - {r[0]} ({r[1]}), Fame Score: {r[2]}")
else:
    print("Could not find SEED_ATTRACTIONS block!")
