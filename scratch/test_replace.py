with open("data.js", "r", encoding="utf-8") as f:
    content = f.read()

city_start_marker = "  // --- INDIA CITIES ---"
city_end_marker = "    tokyo: {"

start_city_idx = content.find(city_start_marker)
end_city_idx = content.find(city_end_marker)

print(f"Cities section markers:")
print(f"  Start: '{city_start_marker}' found at index {start_city_idx}")
print(f"  End:   '{city_end_marker}' found at index {end_city_idx}")

attr_start_marker = "    // ================= INDIA ATTRACTIONS ================="
attr_end_marker = "    // ================= JAPAN ATTRACTIONS (PREMIUM) ================="

# Let's try exact matches and also a relaxed search if exact fails
start_attr_idx = content.find(attr_start_marker)
end_attr_idx = content.find(attr_end_marker)

print(f"\nAttractions section markers:")
print(f"  Start: '{attr_start_marker}' found at index {start_attr_idx}")
print(f"  End:   '{attr_end_marker}' found at index {end_attr_idx}")
