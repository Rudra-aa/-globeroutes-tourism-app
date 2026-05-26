import json
import os

log_path = "/Users/rudrapratapsinghparmar/.gemini/antigravity-ide/brain/dd622813-a65a-4a59-a46b-d032640b4807/.system_generated/logs/transcript.jsonl"

print("Checking if log file exists...")
if os.path.exists(log_path):
    print("Log file exists! Reading steps...")
    
    # We want to scan the logs backwards to find any data.js contents
    with open(log_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    print(f"Found {len(lines)} lines in log.")
    
    # Let's search for "SEED_COUNTRIES" or the content of data.js in the logs
    for idx, line in enumerate(reversed(lines)):
        try:
            step = json.loads(line)
            content = step.get("content", "")
            
            # Let's search if this step contains the full data.js code or writes to it
            if "const SEED_COUNTRIES =" in content and len(content) > 50000:
                print(f"Found massive data.js match in step content at reverse index {idx}!")
                with open("data_restored.js", "w", encoding="utf-8") as out:
                    out.write(content)
                print("Restored to data_restored.js!")
                break
                
            # Also search in tool calls / outputs
            for tool_call in step.get("tool_calls", []):
                args = tool_call.get("args", {})
                code = args.get("CodeContent", "")
                if "const SEED_COUNTRIES =" in code and len(code) > 50000:
                    print(f"Found massive data.js match in tool call args at reverse index {idx}!")
                    with open("data_restored.js", "w", encoding="utf-8") as out:
                        out.write(code)
                    print("Restored to data_restored.js!")
                    break
        except Exception as e:
            continue
else:
    print("Log file not found at path.")
