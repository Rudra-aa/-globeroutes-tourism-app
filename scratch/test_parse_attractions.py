import re

with open("data.js", "r", encoding="utf-8") as f:
    content = f.read()

attr_start_marker = "    // ================= INDIA ATTRACTIONS ================="
attr_end_marker = "    // ================= JAPAN ATTRACTIONS (PREMIUM) ================="

start_attr_idx = content.find(attr_start_marker)
end_attr_idx = content.find(attr_end_marker)

attrs_block = content[start_attr_idx:end_attr_idx]

# Let's count how many attractions are in this block
# An attraction usually looks like:
#     {
#       id: "...",
#       name: "...",
#       ...
#     },
# Let's find matches
attraction_ids = re.findall(r'id:\s*"([^"]+)"', attrs_block)
print(f"Total India attractions currently in data.js: {len(attraction_ids)}")
print("First 10 attraction IDs:")
for i, aid in enumerate(attraction_ids[:10], 1):
    print(f"  {i}. {aid}")
