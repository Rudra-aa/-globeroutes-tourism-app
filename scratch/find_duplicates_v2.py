import re

with open("data.js", "r", encoding="utf-8") as f:
    content = f.read()

# Locate SEED_ATTRACTIONS block
attrs_match = re.search(r'const SEED_ATTRACTIONS = \[(.*?)^\s*\];', content, re.DOTALL | re.MULTILINE)
if attrs_match:
    block = attrs_match.group(1)
    
    # Match any "id": "val" or id: "val"
    attraction_ids = re.findall(r'["\']?id["\']?\s*:\s*["\']([^"\']+)["\']', block)
    
    seen = {}
    dupes = []
    for aid in attraction_ids:
        if aid in seen:
            seen[aid] += 1
            dupes.append(aid)
        else:
            seen[aid] = 1
            
    print(f"Total parsed attractions: {len(attraction_ids)}")
    print(f"Total duplicate Attraction IDs: {len(dupes)}")
    if dupes:
        print(f"Duplicate IDs: {set(dupes)}")
        # Print counts
        for d in set(dupes):
            print(f"  {d}: appears {seen[d]} times")
            
    # Also let's check for duplicate city keys in SEED_CITIES
    cities_match = re.search(r'const SEED_CITIES = \{(.*?)^};', content, re.DOTALL | re.MULTILINE)
    if cities_match:
        c_block = cities_match.group(1)
        city_ids = re.findall(r'["\']?id["\']?\s*:\s*["\']([^"\']+)["\']', c_block)
        seen_c = {}
        dupes_c = []
        for cid in city_ids:
            if cid in seen_c:
                seen_c[cid] += 1
                dupes_c.append(cid)
            else:
                seen_c[cid] = 1
        print(f"Total parsed cities: {len(city_ids)}")
        print(f"Total duplicate City IDs: {len(dupes_c)}")
        if dupes_c:
            print(f"Duplicate cities: {set(dupes_c)}")
            for d in set(dupes_c):
                print(f"  {d}: appears {seen_c[d]} times")
else:
    print("Could not find SEED_ATTRACTIONS block!")
