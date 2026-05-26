import re

with open("data.js", "r", encoding="utf-8") as f:
    content = f.read()

# We only want to search in the attractions block of data.js
attr_start_marker = "// ================= INDIA ATTRACTIONS"
attr_end_marker = "// ================= JAPAN ATTRACTIONS"

start_attr_idx = content.find(attr_start_marker)
end_attr_idx = content.find(attr_end_marker)

attrs_block = content[start_attr_idx:end_attr_idx]

# Let's parse all attractions
# Each attraction block starts with { and ends with } (approx)
# Let's extract entries
entries = re.findall(r'\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)"(.*?)\},', attrs_block, re.DOTALL)

print(f"Total parsed India attractions: {len(entries)}")

charDhamKeywords = ["badrinath", "kedarnath", "gangotri", "yamunotri", "jagannath", "dwarka", "rameswaram", "ramanthaswamy"]
jyotirlingaKeywords = ["kashi vishwanath", "somnath", "kedarnath", "trimbakeshwar", "mahakaleshwar", "ramanthaswamy", "rameswaram", "grishneshwar", "bhimashankar", "mallikarjuna", "omkareshwar", "nageshwar", "vaidyanath"]

temple_count = 0
chardham_count = 0
jyotirlinga_count = 0

print("\nMatched Temples:")
for aid, name, body in entries:
    name_lower = name.lower()
    id_lower = aid.lower()
    
    isTempleKeyword = ("temple" in name_lower or 
                        "mandir" in name_lower or 
                        "monastery" in name_lower or 
                        "gurdwara" in name_lower or 
                        "shrine" in name_lower or 
                        "nenbutsu-ji" in name_lower or
                        "temple" in id_lower or
                        "monastery" in id_lower or
                        "rumtek" in id_lower or
                        "goldentemple" in id_lower)

    isSpecificTemple = ("vishwanath" in name_lower or 
                         "somnath" in name_lower or 
                         "kedarnath" in name_lower or 
                         "badrinath" in name_lower or 
                         "gangotri" in name_lower or 
                         "yamunotri" in name_lower or 
                         "balaji" in name_lower or 
                         "meenakshi" in name_lower or
                         "tungnath" in name_lower or
                         "matrimandir" in name_lower)
                         
    if isTempleKeyword or isSpecificTemple:
        temple_count += 1
        isCharDham = any(kw in name_lower or kw in id_lower for kw in charDhamKeywords)
        isJyotirlinga = any(kw in name_lower or kw in id_lower for kw in jyotirlingaKeywords)
        
        dham_str = "🕋 Char Dham" if isCharDham else ""
        jyot_str = "🔱 Jyotirlinga" if isJyotirlinga else ""
        print(f"  - ID: {aid} | Name: {name} | {dham_str} {jyot_str}".strip())
        
        if isCharDham: chardham_count += 1
        if isJyotirlinga: jyotirlinga_count += 1

print(f"\nSummary:")
print(f"  Total Temples Matched: {temple_count}")
print(f"  Char Dhams: {chardham_count}")
print(f"  Jyotirlingas: {jyotirlinga_count}")
