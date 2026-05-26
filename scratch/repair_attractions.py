with open("data.js", "r", encoding="utf-8") as f:
    content = f.read()

# Locate SEED_ATTRACTIONS
attr_start_idx = content.find("const SEED_ATTRACTIONS = [")
engine_start_idx = content.find("// ================= DYNAMIC POI SYNTHESIZER ENGINE =================")

head_text = content[:attr_start_idx]
attrs_block = content[attr_start_idx:engine_start_idx]
tail_text = content[engine_start_idx:]

lines = attrs_block.split("\n")
new_lines = []

in_reviews = False
for line in lines:
    stripped = line.strip()
    
    if "reviews: [" in line:
        in_reviews = True
        new_lines.append(line)
        continue
        
    if in_reviews:
        # Check if the line is a closing brace of the attraction
        if stripped == "}," or stripped == "];":
            # Close the reviews array
            new_lines.append("    ]")
            in_reviews = False
            new_lines.append(line)
            continue
        elif stripped == "]":
            # If the reviews array is already closed (e.g. India attractions), reset in_reviews
            in_reviews = False
            new_lines.append(line)
            continue
            
    new_lines.append(line)

repaired_attrs_block = "\n".join(new_lines)
new_data_js = head_text + repaired_attrs_block + tail_text

with open("data.js", "w", encoding="utf-8") as f:
    f.write(new_data_js)

print("="*60)
print("SUCCESSFULLY REPAIRED SEED_ATTRACTIONS REVIEWS ARRAYS! ✅")
print("="*60)
