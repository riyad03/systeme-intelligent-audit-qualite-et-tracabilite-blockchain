
import json
import os

print("Starting address sync...")

# 1. Read Artifact
try:
    with open('frontend/src/contracts/AuditTraceability.json', 'r') as f:
        data = json.load(f)
        addr = data['networks']['5777']['address']
        print(f"Artifact Address: {addr}")
        print(f"Address Length: {len(addr)}")
        
        if len(addr) != 42:
            print("FATAL: Artifact address is invalid!")
            exit(1)
            
except Exception as e:
    print(f"Error reading artifact: {e}")
    exit(1)

# 2. Update App.js
try:
    app_js_path = 'frontend/src/App.js'
    with open(app_js_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    updated = False
    for line in lines:
        if 'const CONTRACT_ADDRESS =' in line:
            new_lines.append(f'const CONTRACT_ADDRESS = "{addr}";\n')
            updated = True
            print("Found and updated CONST definition.")
        else:
            new_lines.append(line)
            
    if not updated:
        print("WARNING: Did not find CONST definition to update!")
    
    with open(app_js_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
        
    print("App.js write complete.")

except Exception as e:
    print(f"Error updating App.js: {e}")
    exit(1)
