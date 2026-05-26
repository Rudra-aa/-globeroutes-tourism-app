with open("data.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
skip_next = False
removed_count = 0

for i in range(len(lines)):
    if skip_next:
        skip_next = False
        removed_count += 1
        continue
        
    line = lines[i]
    stripped = line.strip()
    
    # Check if this line is a single-line reviews array
    if "reviews: [" in line and (line.rstrip().endswith("]") or line.rstrip().endswith("],")):
        # If the next line is just a closing bracket, we should skip it
        if i + 1 < len(lines):
            next_line_stripped = lines[i + 1].strip()
            if next_line_stripped == "]":
                new_lines.append(line)
                skip_next = True
                continue
                
    new_lines.append(line)

print(f"Removed {removed_count} extra brackets.")

with open("data.js", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
