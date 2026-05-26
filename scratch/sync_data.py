import json
import re

# 1. Read existing data.js
with open("data.js", "r", encoding="utf-8") as f:
    content = f.read()

# Find the exact indexes of India attractions
attr_start_marker = "    // ================= INDIA ATTRACTIONS ================="
attr_end_marker = "    // ================= JAPAN ATTRACTIONS (PREMIUM) ================="

start_attr_idx = content.find(attr_start_marker)
end_attr_idx = content.find(attr_end_marker)

if start_attr_idx == -1 or end_attr_idx == -1:
    print("Error: Could not locate attractions markers!")
    exit(1)

# Extract India attractions block
attrs_block = content[start_attr_idx:end_attr_idx]

# Define the new temples to add
new_temples = [
    {
        "id": "kedarnath_temple",
        "name": "Kedarnath Temple",
        "cityId": "kedarnath",
        "countryId": "india",
        "lat": 30.7346,
        "lng": 79.0669,
        "fameScore": 98,
        "fameTier": "red",
        "category": "temple",
        "tagline": "Shiva's majestic Himalayan sanctuary.",
        "description": "An ancient stone temple dedicated to Lord Shiva, nestled at 3,583m in the Garhwal Himalayas. It is one of the 12 Jyotirlingas, the highest of the Char Dhams, and a testament to spiritual endurance.",
        "images": ["https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80"],
        "entryFee": "Free",
        "openingHours": "06:00 AM - 09:00 PM",
        "bestSeason": "May to October",
        "timeNeeded": "2 Hours",
        "isCharDham": True,
        "isJyotirlinga": True,
        "rating": 4.9,
        "reviews": [{"user": "Aarav S.", "text": "The trek is demanding but catching the first glimpse of the temple with snow peaks behind it is purely magical."}]
    },
    {
        "id": "badrinath_temple",
        "name": "Badrinath Temple",
        "cityId": "badrinath",
        "countryId": "india",
        "lat": 30.7433,
        "lng": 79.4938,
        "fameScore": 96,
        "fameTier": "red",
        "category": "temple",
        "tagline": "The sacred Himalayan seat of Lord Vishnu.",
        "description": "A bright, colorful 15m high temple dedicated to Lord Vishnu, located at 3,133m between the Nar and Narayan mountain ranges. The primary dham of the Char Dham pilgrimage circuit.",
        "images": ["https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=600&q=80"],
        "entryFee": "Free",
        "openingHours": "04:30 AM - 09:00 PM",
        "bestSeason": "May to November",
        "timeNeeded": "2 Hours",
        "isCharDham": True,
        "rating": 4.8,
        "reviews": [{"user": "Meera J.", "text": "Taking a dip in the Tapt Kund hot springs before visiting the colorful main shrine was deeply refreshing."}]
    },
    {
        "id": "gangotri_temple",
        "name": "Gangotri Temple",
        "cityId": "gangotri",
        "countryId": "india",
        "lat": 30.9947,
        "lng": 78.9398,
        "fameScore": 90,
        "fameTier": "red",
        "category": "temple",
        "tagline": "Origin temple of the sacred River Ganges.",
        "description": "A serene white granite temple dedicated to Goddess Ganga, situated at 3,100m on the banks of the Bhagirathi River. Marks the place where Ganga is said to have touched Earth.",
        "images": ["https://images.unsplash.com/photo-1540324155974-23be9c954668?auto=format&fit=crop&w=600&q=80"],
        "entryFee": "Free",
        "openingHours": "06:15 AM - 09:30 PM",
        "bestSeason": "May to October",
        "timeNeeded": "1.5 Hours",
        "isCharDham": True,
        "rating": 4.8,
        "reviews": [{"user": "Dev K.", "text": "The peaceful vibration of the river flowing beside the white marble temple creates a celestial mood."}]
    },
    {
        "id": "yamunotri_temple",
        "name": "Yamunotri Temple",
        "cityId": "yamunotri",
        "countryId": "india",
        "lat": 31.0146,
        "lng": 78.4609,
        "fameScore": 90,
        "fameTier": "red",
        "category": "temple",
        "tagline": "Source of the Yamuna River.",
        "description": "A beautiful mountain temple dedicated to Goddess Yamuna, perched at 3,291m in the Garhwal Himalayas. Devotees cook prasad in the nearby thermal springs of Surya Kund.",
        "images": ["https://images.unsplash.com/photo-1610294792547-11a07e7e1284?auto=format&fit=crop&w=600&q=80"],
        "entryFee": "Free",
        "openingHours": "06:00 AM - 08:00 PM",
        "bestSeason": "May to October",
        "timeNeeded": "1.5 Hours",
        "isCharDham": True,
        "rating": 4.7,
        "reviews": [{"user": "Sanjay G.", "text": "We cooked rice in the hot springs and took it home as holy prasad. A unique experience!"}]
    },
    {
        "id": "somnath_temple",
        "name": "Somnath Temple",
        "cityId": "somnath",
        "countryId": "india",
        "lat": 20.8880,
        "lng": 70.4012,
        "fameScore": 95,
        "fameTier": "red",
        "category": "temple",
        "tagline": "The eternal shrine of the Lord of Moon.",
        "description": "The first and foremost of the 12 Jyotirlinga shrines of Lord Shiva, located directly on the shores of the Arabian Sea. Destroyed and rebuilt 17 times across history, it stands as a symbol of resilience.",
        "images": ["https://images.unsplash.com/photo-1604537466158-719b1972feb8?auto=format&fit=crop&w=600&q=80"],
        "entryFee": "Free",
        "openingHours": "06:00 AM - 09:30 PM",
        "bestSeason": "Winter",
        "timeNeeded": "2 Hours",
        "isJyotirlinga": True,
        "rating": 4.9,
        "reviews": [{"user": "Rajesh N.", "text": "The light and sound show at night with the roaring sea in the background gave me goosebumps."}]
    },
    {
        "id": "dwarkadhish_temple",
        "name": "Dwarkadhish Temple",
        "cityId": "dwarka",
        "countryId": "india",
        "lat": 22.2377,
        "lng": 68.9674,
        "fameScore": 94,
        "fameTier": "red",
        "category": "temple",
        "tagline": "The royal palace temple of Lord Krishna.",
        "description": "A majestic 5-story limestone structure supported by 72 pillars, also known as Jagat Mandir. Dedication to Lord Krishna as the King of Dwarka, and one of the 4 primary Char Dhams.",
        "images": ["https://images.unsplash.com/photo-1610726360-f2a3b2c0f8e1?auto=format&fit=crop&w=600&q=80"],
        "entryFee": "Free",
        "openingHours": "06:30 AM - 09:30 PM",
        "bestSeason": "Winter",
        "timeNeeded": "2 Hours",
        "isCharDham": True,
        "rating": 4.8,
        "reviews": [{"user": "Anil S.", "text": "Beautiful temple. The large flag on top is changed five times a day and is a sight of immense devotion."}]
    },
    {
        "id": "puri_jagannath",
        "name": "Jagannath Temple",
        "cityId": "puri",
        "countryId": "india",
        "lat": 19.8048,
        "lng": 85.8179,
        "fameScore": 95,
        "fameTier": "red",
        "category": "temple",
        "tagline": "The sacred abode of the Lord of the Universe.",
        "description": "A massive 12th-century temple complex famous for its annual Rath Yatra (Chariot Festival). Home to the uniquely carved wooden idols of Lord Jagannath, Balabhadra, and Subhadra, and one of the 4 Char Dhams.",
        "images": ["https://images.unsplash.com/photo-1578897367029-4d16bdf7e032?auto=format&fit=crop&w=600&q=80"],
        "entryFee": "Free",
        "openingHours": "05:00 AM - 11:00 PM",
        "bestSeason": "Winter / Rath Yatra",
        "timeNeeded": "2 Hours",
        "isCharDham": True,
        "rating": 4.9,
        "reviews": [{"user": "Sita R.", "text": "The Mahaprasad cooked in clay pots stacked on top of each other using firewood is delicious and pure divine."}]
    },
    {
        "id": "tirupati_balaji",
        "name": "Tirupati Balaji (Venkateswara Temple)",
        "cityId": "tirupati",
        "countryId": "india",
        "lat": 13.6833,
        "lng": 79.3500,
        "fameScore": 98,
        "fameTier": "red",
        "category": "temple",
        "tagline": "The wealthiest and most visited temple on Earth.",
        "description": "Located atop the seven sacred hills of Tirumala, this historical temple is dedicated to Lord Venkateswara. A stunning marvel of Dravidian architecture that draws up to 100,000 pilgrims daily.",
        "images": ["https://images.unsplash.com/photo-1591367003836-b3efeba29d0f?auto=format&fit=crop&w=600&q=80"],
        "entryFee": "Free / VIP Darshan (₹300)",
        "openingHours": "03:00 AM - 11:00 PM",
        "bestSeason": "September to March",
        "timeNeeded": "3 Hours",
        "rating": 4.9,
        "reviews": [{"user": "Rahul G.", "text": "The administration is top-notch despite millions visiting. The famous Tirupati Laddoo prasadam is out of this world."}]
    },
    {
        "id": "nashik_trimbakeshwar",
        "name": "Trimbakeshwar Shiva Temple",
        "cityId": "nashik",
        "countryId": "india",
        "lat": 19.9975,
        "lng": 73.7898,
        "fameScore": 88,
        "fameTier": "orange",
        "category": "temple",
        "tagline": "Jyotirlinga containing the three-faced Brahma, Vishnu, Shiva.",
        "description": "An ancient temple situated at the source of the Godavari River. Features a unique Jyotirlinga that embodies the Hindu Trinity: Lord Brahma, Lord Vishnu, and Lord Shiva.",
        "images": ["https://images.unsplash.com/photo-1562183241-840b8af0721e?auto=format&fit=crop&w=600&q=80"],
        "entryFee": "Free",
        "openingHours": "05:30 AM - 09:00 PM",
        "bestSeason": "Winter / Monsoon",
        "timeNeeded": "2 Hours",
        "isJyotirlinga": True,
        "rating": 4.7,
        "reviews": [{"user": "Pooja V.", "text": "Set at the foothills of Brahmagiri mountain, the stone carvings of the temple are magnificent."}]
    },
    {
        "id": "shirdi_saibaba",
        "name": "Sai Baba Samadhi Mandir",
        "cityId": "shirdi",
        "countryId": "india",
        "lat": 19.7645,
        "lng": 74.4762,
        "fameScore": 92,
        "fameTier": "orange",
        "category": "temple",
        "tagline": "The sacred shrine of saintly peace.",
        "description": "The holy shrine housing the final resting place (Samadhi) of the highly revered 19th-century spiritual leader Sai Baba, representing harmony and universal love.",
        "images": ["https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?auto=format&fit=crop&w=600&q=80"],
        "entryFee": "Free",
        "openingHours": "04:00 AM - 11:15 PM",
        "bestSeason": "Winter",
        "timeNeeded": "2 Hours",
        "rating": 4.8,
        "reviews": [{"user": "Vikram C.", "text": "Extremely peaceful place. The Kakad Aarti in the morning was incredibly soul-soothing."}]
    },
    {
        "id": "ujjain_mahakaleshwar",
        "name": "Mahakaleshwar Jyotirlinga Temple",
        "cityId": "ujjain",
        "countryId": "india",
        "lat": 23.1765,
        "lng": 75.7885,
        "fameScore": 94,
        "fameTier": "red",
        "category": "temple",
        "tagline": "The unique south-facing Lord of Time.",
        "description": "One of the 12 sacred Jyotirlingas, famous for being the only south-facing (Dakshinmukhi) shrine. Celebrated for its unique Bhasma Aarti (ritual using sacred ash).",
        "images": ["https://images.unsplash.com/photo-1629206028929-1e6ec6a9f975?auto=format&fit=crop&w=600&q=80"],
        "entryFee": "Free",
        "openingHours": "04:00 AM - 11:00 PM",
        "bestSeason": "Winter",
        "timeNeeded": "2 Hours",
        "isJyotirlinga": True,
        "rating": 4.9,
        "reviews": [{"user": "Amit T.", "text": "Attending the Bhasma Aarti at 4 AM is a life-changing experience. Pure, intense spiritual energy."}]
    },
    {
        "id": "katra_vaishnodevi",
        "name": "Mata Vaishno Devi Temple",
        "cityId": "katra",
        "countryId": "india",
        "lat": 32.9915,
        "lng": 74.9310,
        "fameScore": 96,
        "fameTier": "red",
        "category": "temple",
        "tagline": "The sacred clifftop sanctuary of the Divine Mother.",
        "description": "A highly revered cave shrine dedicated to Goddess Vaishno Devi, located at 1,585m in the holy Trikuta Mountains. Reached by a soulful 14km foot journey.",
        "images": ["https://images.unsplash.com/photo-1603912699214-92627f304eb6?auto=format&fit=crop&w=600&q=80"],
        "entryFee": "Free (Registration mandatory)",
        "openingHours": "24/7",
        "bestSeason": "March to October",
        "timeNeeded": "5 Hours",
        "rating": 4.9,
        "reviews": [{"user": "Jyoti P.", "text": "Chanting 'Jai Mata Di' with thousands of other yatris during the clifftop trek makes the fatigue vanish completely."}]
    },
    {
        "id": "vrindavan_bankebihari",
        "name": "Shri Banke Bihari Temple",
        "cityId": "vrindavan",
        "countryId": "india",
        "lat": 27.5652,
        "lng": 77.6900,
        "fameScore": 92,
        "fameTier": "orange",
        "category": "temple",
        "tagline": "The temple of mesmerizing devotion to Krishna.",
        "description": "One of the most energetic and sacred temples of Lord Krishna in India. The deity stands in the unique Tribhanga posture and the curtains are frequently drawn to prevent a direct long gaze.",
        "images": ["https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80"],
        "entryFee": "Free",
        "openingHours": "07:45 AM - 09:30 PM",
        "bestSeason": "Winter / Janmashtami",
        "timeNeeded": "1.5 Hours",
        "rating": 4.8,
        "reviews": [{"user": "Hari N.", "text": "The pure ecstatic chanting of Radha-Radha by the crowd creates a vibe of absolute divine bliss."}]
    },
    {
        "id": "mathura_krishnajanmabhoomi",
        "name": "Shri Krishna Janmasthan Temple",
        "cityId": "mathura",
        "countryId": "india",
        "lat": 27.4924,
        "lng": 77.6737,
        "fameScore": 90,
        "fameTier": "orange",
        "category": "temple",
        "tagline": "The birthplace of Lord Krishna.",
        "description": "A highly historic temple complex built around the prison cell where Lord Krishna was born to Devaki and Vasudeva, serving as a major hub of Krishna bhakti.",
        "images": ["https://images.unsplash.com/photo-1594387303756-a2b7b0e7c5d3?auto=format&fit=crop&w=600&q=80"],
        "entryFee": "Free",
        "openingHours": "05:00 AM - 09:30 PM",
        "bestSeason": "Winter / Janmashtami",
        "timeNeeded": "2 Hours",
        "rating": 4.8,
        "reviews": [{"user": "Shyam L.", "text": "The garbhagriha cell has a mystical silence and energy. A must visit for every seeker."}]
    },
    {
        "id": "ayodhya_ramjanmabhoomi",
        "name": "Shri Ram Janmabhoomi Mandir",
        "cityId": "ayodhya",
        "countryId": "india",
        "lat": 26.7990,
        "lng": 82.2042,
        "fameScore": 98,
        "fameTier": "red",
        "category": "temple",
        "tagline": "The grand temple at the birthplace of Lord Rama.",
        "description": "The grand newly consecrated Hindu temple dedicated to Ram Lalla (infant form of Lord Rama). Located at the historic birthplace, it represents a monumental achievement in traditional Nagara style architecture.",
        "images": ["https://images.unsplash.com/photo-1612802096736-b7e0e0c6b5ae?auto=format&fit=crop&w=600&q=80"],
        "entryFee": "Free",
        "openingHours": "06:30 AM - 09:30 PM",
        "bestSeason": "Winter / Rama Navami",
        "timeNeeded": "2 Hours",
        "rating": 4.9,
        "reviews": [{"user": "Rohan D.", "text": "The sandstone architecture is majestic and the carving details on pillars are phenomenal."}]
    },
    {
        "id": "srisailam_mallikarjuna",
        "name": "Mallikarjuna Jyotirlinga Temple",
        "cityId": "tirupati",
        "countryId": "india",
        "lat": 16.0734,
        "lng": 78.8681,
        "fameScore": 85,
        "fameTier": "orange",
        "category": "temple",
        "tagline": "The sacred mountain shrine of Shiva and Shakti.",
        "description": "A highly sacred temple situated on Flat Top of Nallamala Hills. It is extremely unique as it is one of the only three shrines in India that is both a Jyotirlinga and a Shakti Peeth.",
        "images": ["https://images.unsplash.com/photo-1591367003836-b3efeba29d0f?auto=format&fit=crop&w=600&q=80"],
        "entryFee": "Free",
        "openingHours": "04:30 AM - 10:00 PM",
        "bestSeason": "Winter",
        "timeNeeded": "2 Hours",
        "isJyotirlinga": True,
        "rating": 4.7,
        "reviews": [{"user": "Venu P.", "text": "Stunning location overlooking the Krishna river. Extremely peaceful and ancient forest shrine feel."}]
    },
    {
        "id": "omkareshwar_temple",
        "name": "Omkareshwar Jyotirlinga Temple",
        "cityId": "ujjain",
        "countryId": "india",
        "lat": 22.2464,
        "lng": 76.1504,
        "fameScore": 86,
        "fameTier": "orange",
        "category": "temple",
        "tagline": "The sacred island temple shaped like 'Om'.",
        "description": "One of the 12 Jyotirlinga shrines, situated on a river island named Mandhata in the Narmada River, which is naturally shaped like the sacred Hindu symbol 'OM'.",
        "images": ["https://images.unsplash.com/photo-1629206028929-1e6ec6a9f975?auto=format&fit=crop&w=600&q=80"],
        "entryFee": "Free",
        "openingHours": "05:00 AM - 10:00 PM",
        "bestSeason": "Winter",
        "timeNeeded": "2 Hours",
        "isJyotirlinga": True,
        "rating": 4.7,
        "reviews": [{"user": "Nandu R.", "text": "Taking the boat ride across the Narmada to reach the island temple is a beautiful pilgrimage ritual."}]
    },
    {
        "id": "bhimashankar_temple",
        "name": "Bhimashankar Jyotirlinga Temple",
        "cityId": "nashik",
        "countryId": "india",
        "lat": 19.0721,
        "lng": 73.5358,
        "fameScore": 85,
        "fameTier": "orange",
        "category": "temple",
        "tagline": "The forest-nestled source of the Bhima River.",
        "description": "A beautiful black stone temple in the Sahyadri mountains, surrounded by a dense wildlife sanctuary. Represents the divine energy of Shiva's Bhima incarnation.",
        "images": ["https://images.unsplash.com/photo-1562183241-840b8af0721e?auto=format&fit=crop&w=600&q=80"],
        "entryFee": "Free",
        "openingHours": "04:30 AM - 09:30 PM",
        "bestSeason": "Monsoon / Winter",
        "timeNeeded": "2 Hours",
        "isJyotirlinga": True,
        "rating": 4.6,
        "reviews": [{"user": "Girish M.", "text": "The surrounding Western Ghats forest is incredibly beautiful in the monsoons with mist all over the temple."}]
    },
    {
        "id": "vaidyanath_temple",
        "name": "Baidyanath Dham Jyotirlinga Temple",
        "cityId": "varanasi",
        "countryId": "india",
        "lat": 24.4925,
        "lng": 86.6997,
        "fameScore": 88,
        "fameTier": "orange",
        "category": "temple",
        "tagline": "The temple of the Divine Physician.",
        "description": "Also known as Baba Dham, this massive temple complex contains 21 temples. The Jyotirlinga is said to have been placed by Ravana, and Shiva acts here as the divine healer.",
        "images": ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"],
        "entryFee": "Free",
        "openingHours": "04:00 AM - 09:00 PM",
        "bestSeason": "Winter / Shravan Month",
        "timeNeeded": "2 Hours",
        "isJyotirlinga": True,
        "rating": 4.7,
        "reviews": [{"user": "Subodh B.", "text": "During Shravan, millions of saffron-clad kanwariyas bring holy water from Ganges. A festival of sheer devotion."}]
    },
    {
        "id": "dwarka_nageshwar",
        "name": "Nageshwar Jyotirlinga Temple",
        "cityId": "dwarka",
        "countryId": "india",
        "lat": 22.4286,
        "lng": 68.9664,
        "fameScore": 86,
        "fameTier": "orange",
        "category": "temple",
        "tagline": "The temple of the Lord of Snakes.",
        "description": "Located near Dwarka, it houses one of the 12 Jyotirlingas. Prominently features a magnificent 82-foot-tall seated statue of Lord Shiva that can be seen from miles away.",
        "images": ["https://images.unsplash.com/photo-1610726360-f2a3b2c0f8e1?auto=format&fit=crop&w=600&q=80"],
        "entryFee": "Free",
        "openingHours": "06:00 AM - 12:30 PM, 05:00 PM - 09:00 PM",
        "bestSeason": "Winter",
        "timeNeeded": "1 Hour",
        "isJyotirlinga": True,
        "rating": 4.7,
        "reviews": [{"user": "Karan K.", "text": "The massive Shiva statue is incredibly striking. The inner sanctum is calm and very neat."}]
    },
    {
        "id": "grishneshwar_temple",
        "name": "Grishneshwar Jyotirlinga Temple",
        "cityId": "nashik",
        "countryId": "india",
        "lat": 20.0248,
        "lng": 75.1691,
        "fameScore": 87,
        "fameTier": "orange",
        "category": "temple",
        "tagline": "The last Jyotirlinga, built of red volcanic stone.",
        "description": "Located close to the UNESCO Ellora Caves. It is the 12th and final Jyotirlinga temple, beautifully constructed from red volcanic rock and rebuilt in the 18th century by Ahilyabai Holkar.",
        "images": ["https://images.unsplash.com/photo-1562183241-840b8af0721e?auto=format&fit=crop&w=600&q=80"],
        "entryFee": "Free",
        "openingHours": "05:30 AM - 09:30 PM",
        "bestSeason": "Winter",
        "timeNeeded": "1.5 Hours",
        "isJyotirlinga": True,
        "rating": 4.8,
        "reviews": [{"user": "Devashish S.", "text": "Stunning carvings in red stone, very close to the cave complex. Rebuilt by Ahilyabai Holkar."}]
    },
    {
        "id": "rameswaram_ramanathaswamy",
        "name": "Ramanathaswamy Temple",
        "cityId": "rameswaram",
        "countryId": "india",
        "lat": 9.2876,
        "lng": 79.3129,
        "fameScore": 92,
        "fameTier": "orange",
        "category": "temple",
        "tagline": "Char Dham & Jyotirlinga on the sacred island.",
        "description": "A massive island temple featuring the longest temple corridor in India (1.2km) lined with 1,200+ sculpted pillars. Dedicated to Shiva, it is both a Char Dham and a Jyotirlinga, where Rama prayed.",
        "images": ["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80"],
        "entryFee": "Free",
        "openingHours": "05:00 AM - 01:00 PM, 03:00 PM - 09:00 PM",
        "bestSeason": "Winter",
        "timeNeeded": "2 Hours",
        "isCharDham": True,
        "isJyotirlinga": True,
        "rating": 4.8,
        "reviews": [{"user": "Vignesh T.", "text": "Bathing in the 22 holy wells (tirthas) inside the temple before darshan is a deeply spiritual experience."}]
    }
]

# Helper to format a dictionary as a JS object block exactly matching data.js structure
def format_attraction(a):
    lines = []
    lines.append("    {")
    lines.append(f'      id: "{a["id"]}",')
    lines.append(f'      name: "{a["name"]}",')
    lines.append(f'      cityId: "{a["cityId"]}", countryId: "{a["countryId"]}",')
    lines.append(f'      lat: {a["lat"]}, lng: {a["lng"]}, fameScore: {a["fameScore"]}, fameTier: "{a["fameTier"]}", category: "{a["category"]}",')
    lines.append(f'      tagline: "{a["tagline"]}",')
    lines.append(f'      description: "{a["description"]}",')
    lines.append(f'      images: {json.dumps(a["images"])},')
    lines.append(f'      entryFee: "{a["entryFee"]}", openingHours: "{a["openingHours"]}",')
    lines.append(f'      bestSeason: "{a["bestSeason"]}", timeNeeded: "{a["timeNeeded"]}",')
    
    flags = []
    if a.get("isUnesco"): flags.append("isUnesco: true")
    if a.get("isCharDham"): flags.append("isCharDham: true")
    if a.get("isJyotirlinga"): flags.append("isJyotirlinga: true")
    
    flag_line = ", ".join(flags)
    if flag_line:
        lines.append(f'      {flag_line}, rating: {a["rating"]},')
    else:
        lines.append(f'      rating: {a["rating"]},')
        
    reviews_str = json.dumps(a["reviews"], ensure_ascii=False)
    lines.append(f'      reviews: {reviews_str}')
    lines.append("    }")
    return "\n".join(lines)

# Format all the new temples
formatted_new_temples = [format_attraction(t) for t in new_temples]

# Clean up or check if we already have the new temples' IDs in the current block
# (to prevent any duplicate insertions)
existing_ids = set(re.findall(r'id:\s*"([^"]+)"', attrs_block))

final_additions = []
for t, formatted in zip(new_temples, formatted_new_temples):
    if t["id"] not in existing_ids:
        final_additions.append(formatted)
        print(f"Adding new temple: {t['name']} ({t['id']})")
    else:
        print(f"Skipping already existing temple: {t['name']} ({t['id']})")

if not final_additions:
    print("No new temples to add! All already exist.")
    exit(0)

# Join the existing block (strip trailing spaces or commas) with the new ones
trimmed_attrs_block = attrs_block.strip()
if trimmed_attrs_block.endswith("],") or trimmed_attrs_block.endswith("]"):
    # The block ends with a closing array bracket or comment, let's find the last closing brace '}' of the last attraction
    last_brace_idx = trimmed_attrs_block.rfind("}")
    if last_brace_idx != -1:
        # Reconstruct the block by inserting a comma after the last brace, and then appending the new temples
        prefix = trimmed_attrs_block[:last_brace_idx + 1]
        suffix = trimmed_attrs_block[last_brace_idx + 1:]
        
        # Format the additions joined by commas
        additions_str = ",\n" + ",\n".join(final_additions)
        
        new_attrs_block = prefix + additions_str + suffix
    else:
        new_attrs_block = trimmed_attrs_block + ",\n" + ",\n".join(final_additions)
else:
    # Try finding the last brace of the last attraction in the block
    last_brace_idx = trimmed_attrs_block.rfind("}")
    if last_brace_idx != -1:
        prefix = trimmed_attrs_block[:last_brace_idx + 1]
        suffix = trimmed_attrs_block[last_brace_idx + 1:]
        additions_str = ",\n" + ",\n".join(final_additions)
        new_attrs_block = prefix + additions_str + suffix
    else:
        new_attrs_block = trimmed_attrs_block + ",\n" + ",\n".join(final_additions)

# Reassemble the file
new_content = content[:start_attr_idx] + new_attrs_block + content[end_attr_idx:]

with open("data.js", "w", encoding="utf-8") as f:
    f.write(new_content)

print("="*60)
print(f"SUCCESSFULLY SYNCHRONISED AND INSTALLED {len(final_additions)} NEW TEMPLES INTO DATA.JS! 🛕✅")
print("="*60)
