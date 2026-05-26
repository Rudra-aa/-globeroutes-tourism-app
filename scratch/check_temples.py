import re

with open('data.js', 'r', encoding='utf-8') as f:
    data_js = f.read()

# Extract all attractions using a regex
attractions = re.findall(r'\{\s*id:\s*"(.*?)",\s*name:\s*"(.*?)".*?\}', data_js, re.DOTALL)
print(f"Total attractions found in data.js: {len(attractions)}")

temple_keywords = ['temple', 'mandir', 'monastery', 'gurdwara', 'shrine', 'vishwanath', 'somnath', 'kedarnath', 'badrinath', 'gangotri', 'yamunotri', 'balaji', 'meenakshi', 'holiest', 'jyotirlinga', 'chardham']

found = []
for attr_id, name in attractions:
    matched = False
    for kw in temple_keywords:
        if kw in name.lower() or kw in attr_id.lower():
            matched = True
            break
    if matched:
        found.append((attr_id, name))

print(f"\nPotential temples ({len(found)}):")
for idx, (attr_id, name) in enumerate(found, 1):
    print(f"  {idx}. ID: {attr_id} | Name: {name}")
