import json
import random
import re

random.seed(42)

def create_place(name, city, state, base_score, category, **kwargs):
    score = base_score
    if kwargs.get('is_unesco'): score = min(100, score + 5)
    if kwargs.get('is_jyotirlinga'): score = min(100, score + 8)
    if kwargs.get('is_shakti_peeth'): score = min(100, score + 6)
    if kwargs.get('is_char_dham'): score = min(100, score + 7)
    if kwargs.get('is_panch_kedar'): score = min(100, score + 6)
    if kwargs.get('is_sapta_puri'): score = min(100, score + 5)
    if kwargs.get('is_major_pilgrimage'): score = min(100, score + 4)
    if kwargs.get('is_national_park'): score = min(100, score + 3)
    if kwargs.get('is_fort'): score = min(100, score + 2)
    
    score = round(score, 1)
    
    if score >= 90:
        tier, tier_name, color = "red", "🔴 World Icon", "#FF0000"
    elif score >= 70:
        tier, tier_name, color = "orange", "🟠 National Famous", "#FF8C00"
    elif score >= 50:
        tier, tier_name, color = "yellow", "🟡 Regional Famous", "#FFD700"
    elif score >= 30:
        tier, tier_name, color = "green", "🟢 City Famous", "#32CD32"
    else:
        tier, tier_name, color = "blue", "🔵 Hidden Gem", "#1E90FF"
    
    lat = kwargs.get('lat', 20.0)
    lng = kwargs.get('lng', 78.0)
    
    clean_name = name.lower().replace(' ', '_').replace("'", '').replace('-', '_')
    clean_city = city.lower().replace(' ', '_')
    
    return {
        "id": f"{clean_city}_{clean_name}",
        "name": name,
        "cityId": clean_city,
        "_cityName": city,
        "countryId": "india",
        "state": state,
        "lat": round(lat, 4),
        "lng": round(lng, 4),
        "fameScore": score,
        "fameTier": tier,
        "category": category,
        "tagline": f"{tier_name} in {city}",
        "description": f"{name} is a renowned {category} located in {city}, {state}.",
        "images": ["https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=600&q=80"],
        "entryFee": "Free/Varies",
        "openingHours": "06:00 AM - 06:00 PM",
        "bestSeason": "Winter",
        "timeNeeded": "2 Hours",
        "isUnesco": kwargs.get('is_unesco', False),
        "isCharDham": kwargs.get('is_char_dham', False),
        "isJyotirlinga": kwargs.get('is_jyotirlinga', False),
        "rating": round(random.uniform(4.0, 5.0), 1),
        "reviews": [
            { "user": "Traveler123", "text": f"Amazing visit to {name}." }
        ]
    }

all_places_data = []
def add_places(place_list):
    for p in place_list:
        if len(p) == 5:
            all_places_data.append(create_place(p[0], p[1], p[2], p[3], p[4]))
        else:
            all_places_data.append(create_place(p[0], p[1], p[2], p[3], p[4], **p[5]))

add_places([
    # UTTAR PRADESH
    ("Taj Mahal", "Agra", "Uttar Pradesh", 98, "monument", {"is_unesco": True, "lat": 27.1751, "lng": 78.0421}),
    ("Agra Fort", "Agra", "Uttar Pradesh", 84, "history", {"is_unesco": True, "lat": 27.1798, "lng": 78.0211}),
    ("Kashi Vishwanath Temple", "Varanasi", "Uttar Pradesh", 96, "temple", {"is_jyotirlinga": True, "lat": 25.3109, "lng": 83.0107}),
    ("Dashashwamedh Ghat", "Varanasi", "Uttar Pradesh", 88, "culture", {"lat": 25.3065, "lng": 83.0109}),
    ("Sarnath", "Varanasi", "Uttar Pradesh", 65, "history", {"is_unesco": True, "lat": 25.3811, "lng": 83.0247}),
    ("Manikarnika Ghat", "Varanasi", "Uttar Pradesh", 55, "culture", {"lat": 25.3093, "lng": 83.0095}),
    ("Banke Bihari Temple", "Vrindavan", "Uttar Pradesh", 90, "temple", {"lat": 27.5652, "lng": 77.6900}),
    ("Shri Krishna Janmabhoomi", "Mathura", "Uttar Pradesh", 88, "temple", {"lat": 27.4924, "lng": 77.6737}),
    ("Ram Janmabhoomi", "Ayodhya", "Uttar Pradesh", 95, "temple", {"lat": 26.7990, "lng": 82.2042}),
    
    # DELHI
    ("Red Fort", "Delhi", "Delhi", 95, "fort", {"is_unesco": True, "lat": 28.6562, "lng": 77.2410}),
    ("Qutub Minar", "Delhi", "Delhi", 92, "history", {"is_unesco": True, "lat": 28.5245, "lng": 77.1855}),
    ("India Gate", "Delhi", "Delhi", 88, "landmark", {"lat": 28.6129, "lng": 77.2295}),
    ("Humayun's Tomb", "Delhi", "Delhi", 72, "history", {"is_unesco": True, "lat": 28.5933, "lng": 77.2507}),
    ("Lodi Garden", "Delhi", "Delhi", 44, "nature", {"lat": 28.5931, "lng": 77.2197}),
    ("Agrasen ki Baoli", "Delhi", "Delhi", 26, "hidden_gem", {"lat": 28.6265, "lng": 77.2198}),
    ("Akshardham Temple", "Delhi", "Delhi", 80, "temple", {"lat": 28.6127, "lng": 77.2773}),

    # RAJASTHAN
    ("Hawa Mahal", "Jaipur", "Rajasthan", 90, "landmark", {"lat": 26.9239, "lng": 75.8267}),
    ("Amber Fort", "Jaipur", "Rajasthan", 88, "history", {"is_unesco": True, "lat": 26.9855, "lng": 75.8513}),
    ("Panna Meena ka Kund", "Jaipur", "Rajasthan", 26, "hidden_gem", {"lat": 26.9934, "lng": 75.8588}),
    ("City Palace Udaipur", "Udaipur", "Rajasthan", 90, "history", {"lat": 24.5763, "lng": 73.6834}),
    ("Lake Pichola Boat Cruise", "Udaipur", "Rajasthan", 82, "nature", {"lat": 24.5726, "lng": 73.6814}),
    ("Mehrangarh Fort", "Jodhpur", "Rajasthan", 93, "history", {"lat": 26.2980, "lng": 73.0188}),
    ("Jaswant Thada", "Jodhpur", "Rajasthan", 62, "landmark", {"lat": 26.3022, "lng": 73.0208}),
    ("Brahma Temple", "Pushkar", "Rajasthan", 75, "temple", {"lat": 26.4897, "lng": 74.5511}),

    # PUNJAB & NORTH
    ("Golden Temple", "Amritsar", "Punjab", 100, "culture", {"lat": 31.6200, "lng": 74.8765}),
    ("Jallianwala Bagh", "Amritsar", "Punjab", 82, "history", {"lat": 31.6204, "lng": 74.8797}),
    ("Vaishno Devi", "Katra", "Jammu and Kashmir", 95, "temple", {"lat": 32.9915, "lng": 74.9310}),

    # TAMIL NADU
    ("Meenakshi Temple", "Madurai", "Tamil Nadu", 94, "temple", {"lat": 9.9195, "lng": 78.1193}),
    ("Ramanathaswamy Temple", "Rameswaram", "Tamil Nadu", 90, "temple", {"is_jyotirlinga": True, "is_char_dham": True, "lat": 9.2876, "lng": 79.3129}),
    ("Kailasanathar Temple", "Kanchipuram", "Tamil Nadu", 75, "temple", {"lat": 12.8185, "lng": 79.6947}),

    # ODISHA
    ("Jagannath Temple", "Puri", "Odisha", 90, "temple", {"is_char_dham": True, "lat": 19.8048, "lng": 85.8179}),
    ("Konark Sun Temple", "Konark", "Odisha", 88, "history", {"is_unesco": True, "lat": 19.8876, "lng": 86.0945}),

    # ANDHRA PRADESH
    ("Tirupati Balaji", "Tirupati", "Andhra Pradesh", 96, "temple", {"lat": 13.6833, "lng": 79.3500}),

    # GUJARAT
    ("Somnath Temple", "Somnath", "Gujarat", 90, "temple", {"is_jyotirlinga": True, "lat": 20.8880, "lng": 70.4012}),
    ("Dwarkadhish Temple", "Dwarka", "Gujarat", 88, "temple", {"is_char_dham": True, "lat": 22.2377, "lng": 68.9674}),
    ("Statue of Unity", "Kevadia", "Gujarat", 86, "landmark", {"lat": 21.8380, "lng": 73.7191}),

    # MAHARASHTRA
    ("Gateway of India", "Mumbai", "Maharashtra", 89, "landmark", {"lat": 18.9220, "lng": 72.8347}),
    ("Trimbakeshwar Temple", "Nashik", "Maharashtra", 85, "temple", {"is_jyotirlinga": True, "lat": 19.9975, "lng": 73.7898}),
    ("Sai Baba Temple", "Shirdi", "Maharashtra", 88, "temple", {"lat": 19.7645, "lng": 74.4762}),
    
    # MADHYA PRADESH
    ("Mahakaleshwar Temple", "Ujjain", "Madhya Pradesh", 88, "temple", {"is_jyotirlinga": True, "lat": 23.1765, "lng": 75.7885}),

    # UTTARAKHAND
    ("Kedarnath Temple", "Kedarnath", "Uttarakhand", 95, "temple", {"is_jyotirlinga": True, "is_char_dham": True, "lat": 30.7346, "lng": 79.0669}),
    ("Badrinath Temple", "Badrinath", "Uttarakhand", 94, "temple", {"is_char_dham": True, "lat": 30.7433, "lng": 79.4938}),
    ("Gangotri Temple", "Gangotri", "Uttarakhand", 90, "temple", {"is_char_dham": True, "lat": 30.9947, "lng": 78.9398}),
    ("Yamunotri Temple", "Yamunotri", "Uttarakhand", 90, "temple", {"is_char_dham": True, "lat": 31.0146, "lng": 78.4609}),
    ("Har Ki Pauri", "Haridwar", "Uttarakhand", 90, "culture", {"lat": 29.9557, "lng": 78.1702}),
    ("Ram Jhula", "Rishikesh", "Uttarakhand", 85, "landmark", {"lat": 30.1227, "lng": 78.3186})
])

cities_dict = {}
for p in all_places_data:
    city_id = p["cityId"]
    if city_id not in cities_dict:
        cities_dict[city_id] = {
            "id": city_id,
            "name": p["_cityName"],
            "state": p["state"],
            "countryId": "india",
            "lat": p["lat"],
            "lng": p["lng"],
            "tagline": f"The Pride of {p['state']}",
            "description": f"{p['_cityName']} is a wonderful destination in {p['state']}.",
            "coverImage": p["images"][0]
        }

cities_js = []
states = sorted(list(set(c["state"] for c in cities_dict.values())))
for state in states:
    cities_js.append(f"  // ─────────── {state.upper()} ───────────")
    state_cities = [c for c in cities_dict.values() if c["state"] == state]
    for c in state_cities:
        cities_js.append(f"  {c['id']}: {json.dumps(c, ensure_ascii=False)},")

attractions_js = []
for state in states:
    attractions_js.append(f"  // ================= {state.upper()} =================")
    state_attrs = [a for a in all_places_data if a["state"] == state]
    for a in state_attrs:
        attractions_js.append(f"  {json.dumps(a, ensure_ascii=False)},")

file_path = "data.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

city_pattern = re.compile(r'(  delhi: \{.*?)(?=\n  // --- JAPAN CITIES)', re.DOTALL)
new_cities_str = "\n".join(cities_js)
content = city_pattern.sub(new_cities_str + "\n", content)

attr_pattern = re.compile(r'(  // ================= INDIA ATTRACTIONS =================.*?)(?=\n  // ================= JAPAN ATTRACTIONS)', re.DOTALL)
new_attrs_str = "  // ================= INDIA ATTRACTIONS =================\n" + "\n".join(attractions_js)
content = attr_pattern.sub(new_attrs_str + "\n", content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("data.js successfully updated inline!")
