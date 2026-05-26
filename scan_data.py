import re
import json
import os

issues = []
fixes_applied = []

# ========================================================
# READ ALL FILES
# ========================================================
with open('data.js', 'r', encoding='utf-8') as f:
    data_js = f.read()

with open('app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

with open('explorer.html', 'r', encoding='utf-8') as f:
    explorer_html = f.read()

with open('styles.css', 'r', encoding='utf-8') as f:
    styles_css = f.read()

print("=" * 60)
print("GLOBETROTTER FULL PROJECT DEBUG SCAN")
print("=" * 60)

# ========================================================
# DATA.JS CHECKS
# ========================================================
print("\n[1] SCANNING data.js...")

# 1a. Duplicate city keys
cities_section = re.search(r'SEED_CITIES\s*=\s*\{(.*?)^};', data_js, re.DOTALL | re.MULTILINE)
if cities_section:
    city_keys = re.findall(r'^\s{2}([a-z_]+):\s*\{', cities_section.group(1), re.MULTILINE)
    seen = {}
    for key in city_keys:
        if key in seen:
            issues.append(f'DATA.JS: Duplicate city key "{key}"')
            seen[key] += 1
        else:
            seen[key] = 1

# 1b. Stale _cityName fields
cn_count = data_js.count('"_cityName"')
if cn_count:
    issues.append(f'DATA.JS: {cn_count} stale "_cityName" fields')
    data_js = re.sub(r',?\s*"_cityName":\s*"[^"]*"', '', data_js)
    fixes_applied.append(f'Removed {cn_count} "_cityName" stale fields')

# 1c. Brace mismatch
open_b = data_js.count('{')
close_b = data_js.count('}')
if open_b != close_b:
    issues.append(f'DATA.JS: Brace mismatch: {{ = {open_b}, }} = {close_b}')

# 1d. Double commas
dbl = list(re.finditer(r',,', data_js))
if dbl:
    issues.append(f'DATA.JS: {len(dbl)} double commas found')
    data_js = re.sub(r',,+', ',', data_js)
    fixes_applied.append(f'Removed {len(dbl)} double commas')

# 1e. Comma before SEED_ATTRACTIONS closing ]
# Ensure no trailing comma after last attraction entry
bad_trail = re.search(r',\s*\n\s*\];', data_js)
# This is valid in modern JS, no action needed

# 1f. cities missing lat/lng (0,0)
zero_coords = len(re.findall(r'"lat":\s*0\.0.*?"lng":\s*0\.0', data_js))
if zero_coords:
    issues.append(f'DATA.JS: {zero_coords} attraction entries have zero lat/lng (placeholder coords)')

print(f"  Brace balance: {{ ={open_b}, }} ={close_b} {'✅' if open_b == close_b else '❌'}")
print(f"  Stale _cityName fields: {cn_count} {'✅' if cn_count == 0 else '❌ -> Fixed'}")
print(f"  Double commas: {len(dbl)} {'✅' if not dbl else '❌ -> Fixed'}")
print(f"  Zero-coord placeholders: {zero_coords} {'⚠️  (non-critical)' if zero_coords else '✅'}")

# ========================================================
# APP.JS CHECKS
# ========================================================
print("\n[2] SCANNING app.js...")

# 2a. Check setIndiaViewMode function exists
if 'function setIndiaViewMode' not in app_js:
    issues.append('APP.JS: Missing function setIndiaViewMode()')

# 2b. Check createCityCard function exists
if 'function createCityCard' not in app_js:
    issues.append('APP.JS: Missing function createCityCard()')

# 2c. Check for references to deleted/renamed functions
if 'toggleCategoryFilter' in app_js:
    # Check how many definitions vs calls
    defs = len(re.findall(r'function toggleCategoryFilter', app_js))
    calls = len(re.findall(r'toggleCategoryFilter\(', app_js))
    if defs > 1:
        issues.append(f'APP.JS: toggleCategoryFilter defined {defs} times (duplicate)')

# 2d. Check activeCategory vs activeFilters.category discrepancy
uses_active_cat = 'activeCategory' in app_js
uses_active_filters_cat = 'activeFilters.category' in app_js
if uses_active_cat and uses_active_filters_cat:
    issues.append('APP.JS: Both "activeCategory" and "activeFilters.category" used - likely conflict/split after refactor')

# 2e. Check if applyPOIFilters uses the right variable
if 'applyPOIFilters' in app_js:
    apo_section = re.search(r'function applyPOIFilters\(\)(.*?)^}', app_js, re.DOTALL | re.MULTILINE)
    if apo_section:
        section_text = apo_section.group(1)
        if 'activeFilters.category' in section_text and 'activeCategory' not in section_text:
            issues.append('APP.JS: applyPOIFilters() uses activeFilters.category, but toggleCategoryFilter now sets activeCategory - MISMATCH!')

# 2f. Check for undefined function references in HTML onclick handlers
html_onclicks = re.findall(r'onclick="([^"]+)"', explorer_html)
defined_funcs = set(re.findall(r'function (\w+)\s*\(', app_js))
for onclick in html_onclicks:
    # Extract function name
    fn_match = re.match(r'([a-zA-Z_]\w*)\(', onclick.strip())
    if fn_match:
        fn_name = fn_match.group(1)
        if fn_name not in defined_funcs and fn_name not in ['event', 'navigateHome', 'handleLogin', 'handleRegister', 'switchAuthMode']:
            issues.append(f'HTML: onclick references undefined function: {fn_name}()')

# 2g. Check for duplicate variable declarations
let_consts = re.findall(r'^(?:let|const|var)\s+(\w+)', app_js, re.MULTILINE)
seen_vars = {}
for var in let_consts:
    seen_vars[var] = seen_vars.get(var, 0) + 1
for var, count in seen_vars.items():
    if count > 1:
        issues.append(f'APP.JS: Variable "{var}" declared {count} times (possible duplicate let/const)')

print(f"  setIndiaViewMode() present: {'✅' if 'function setIndiaViewMode' in app_js else '❌'}")
print(f"  createCityCard() present: {'✅' if 'function createCityCard' in app_js else '❌'}")
print(f"  activeCategory vs activeFilters.category conflict: {'❌' if uses_active_cat and uses_active_filters_cat else '✅'}")
print(f"  Duplicate variable declarations: {[v for v,c in seen_vars.items() if c > 1]}")

# ========================================================
# EXPLORER.HTML CHECKS  
# ========================================================
print("\n[3] SCANNING explorer.html...")

# 3a. Check for required element IDs referenced in app.js
required_ids_in_app = re.findall(r'getElementById\([\'"](\w+)[\'"]\)', app_js)
html_ids = set(re.findall(r'id="(\w+)"', explorer_html))
missing_ids = []
for req_id in set(required_ids_in_app):
    if req_id not in html_ids:
        missing_ids.append(req_id)
if missing_ids:
    for mid in missing_ids:
        issues.append(f'HTML: Element id="{mid}" is referenced in app.js but missing from explorer.html')

# 3b. Check for data.js and app.js script tags
if 'data.js' not in explorer_html:
    issues.append('HTML: data.js script tag missing from explorer.html')
if 'app.js' not in explorer_html:
    issues.append('HTML: app.js script tag missing from explorer.html')

print(f"  Script tags: data.js={'✅' if 'data.js' in explorer_html else '❌'}, app.js={'✅' if 'app.js' in explorer_html else '❌'}")
print(f"  Missing element IDs referenced in app.js: {missing_ids if missing_ids else '✅ None'}")

# ========================================================
# SUMMARY
# ========================================================
print("\n" + "=" * 60)
print(f"TOTAL ISSUES FOUND: {len(issues)}")
print("=" * 60)
for i, issue in enumerate(issues, 1):
    print(f"  {i}. {issue}")

print(f"\nFIXES APPLIED: {len(fixes_applied)}")
for fix in fixes_applied:
    print(f"  ✅ {fix}")

# ========================================================
# WRITE BACK FIXED data.js
# ========================================================
with open('data.js', 'w', encoding='utf-8') as f:
    f.write(data_js)

print("\n✅ data.js written back with all fixes applied.")
