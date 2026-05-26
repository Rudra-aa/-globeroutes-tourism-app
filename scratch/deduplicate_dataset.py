import re

with open("data.js", "r", encoding="utf-8") as f:
    content = f.read()

# Locate SEED_ATTRACTIONS block
attr_start_marker = "const SEED_ATTRACTIONS = ["
attr_end_marker = "];\n\n// ================= DYNAMIC POI SYNTHESIZER ENGINE ================="

attr_start_idx = content.find(attr_start_marker)
engine_start_idx = content.find("// ================= DYNAMIC POI SYNTHESIZER ENGINE =================")

if attr_start_idx == -1 or engine_start_idx == -1:
    print("Could not find delimiters in data.js!")
    exit(1)

head_text = content[:attr_start_idx + len(attr_start_marker)]
# The text containing the attractions, we need to strip trailing '];\n\n' or similar
attrs_text = content[attr_start_idx + len(attr_start_marker):engine_start_idx]

# Locate where the attractions block ends. It should end with something like '];' followed by newlines.
# Let's find the last occurrence of '];' in attrs_text.
last_semicolon = attrs_text.rfind("];")
if last_semicolon != -1:
    tail_text = attrs_text[last_semicolon:] + content[engine_start_idx:]
    attrs_body = attrs_text[:last_semicolon]
else:
    print("Could not find closing '];' of SEED_ATTRACTIONS!")
    exit(1)

# Now, we need to extract each attraction object from attrs_body.
# Since attractions can be multiline JS objects or single-line JSONs, let's parse using brace balancing.
attractions = []
current_attr = []
brace_count = 0
in_string = False
string_char = None
escape = False

i = 0
while i < len(attrs_body):
    char = attrs_body[i]
    
    if escape:
        escape = False
        current_attr.append(char)
        i += 1
        continue
        
    if char == "\\":
        escape = True
        current_attr.append(char)
        i += 1
        continue
        
    if in_string:
        if char == string_char:
            in_string = False
            string_char = None
        current_attr.append(char)
        i += 1
        continue
        
    if char in ["'", '"', "`"]:
        in_string = True
        string_char = char
        current_attr.append(char)
        i += 1
        continue
        
    if char == "{":
        brace_count += 1
        current_attr.append(char)
    elif char == "}":
        brace_count -= 1
        current_attr.append(char)
        if brace_count == 0:
            # We found the end of an attraction object!
            # Read until the next comma or whitespace
            j = i + 1
            while j < len(attrs_body) and attrs_body[j] in [",", " ", "\n", "\t", "\r"]:
                current_attr.append(attrs_body[j])
                j += 1
            
            attractions.append("".join(current_attr))
            current_attr = []
            i = j
            continue
    else:
        if len(current_attr) > 0 or char.strip() != "":
            current_attr.append(char)
            
    i += 1

print(f"Extracted {len(attractions)} attraction strings from data.js.")

# Deduplicate by ID
unique_attractions = []
seen_ids = set()

# Regex to find ID inside each attraction block
id_pattern = re.compile(r'["\']?id["\']?\s*:\s*["\']([^"\']+)["\']')

for attr_str in attractions:
    match = id_pattern.search(attr_str)
    if match:
        attr_id = match.group(1)
        if attr_id not in seen_ids:
            seen_ids.add(attr_id)
            unique_attractions.append(attr_str)
    else:
        # If no ID found, keep it anyway to avoid losing data
        unique_attractions.append(attr_str)

print(f"Deduplicated to {len(unique_attractions)} unique attractions.")

# Reassemble the file
new_attrs_block = "\n" + "".join(unique_attractions)
# Clean up extra trailing commas/newlines
new_attrs_block = new_attrs_block.rstrip().rstrip(",") + "\n"

new_data_js = head_text + new_attrs_block + "];\n\n" + tail_text

with open("data.js", "w", encoding="utf-8") as f:
    f.write(new_data_js)

print("SUCCESSFULLY DEDUPLICATED data.js! ✅")
