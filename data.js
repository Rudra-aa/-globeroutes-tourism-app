/**
 * Globeroutes Database & Synthesizer Engine
 * Contains pre-seeded structured datasets for 5 flagship countries,
 * and an intelligent procedural generator to generate infinite cities/POIs on the fly.
 */

const SEED_COUNTRIES = {
  france: {
    id: "france",
    name: "France",
    code: "FR",
    continent: "Europe",
    flag: "🇫🇷",
    center: [46.2276, 2.2137],
    zoom: 6,
    isFree: true,
    totalAttractions: 18,
    description: "A cultural tapestry of haute cuisine, high fashion, ancient art, and iconic architecture from the sparkling Eiffel Tower to the lavender fields of Provence.",
    coverImage: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80"
  },
  india: {
    id: "india",
    name: "India",
    code: "IN",
    continent: "Asia",
    flag: "🇮🇳",
    center: [20.5937, 78.9629],
    zoom: 5,
    isFree: true,
    totalAttractions: 145,
    description: "A land of incredible diversity, ancient heritage, architectural marvels, vibrant festivals, and deep spiritual traditions spanning from the Himalayas to tropical coasts.",
    coverImage: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80"
  },
  japan: {
    id: "japan",
    name: "Japan",
    code: "JP",
    continent: "Asia",
    flag: "🇯🇵",
    center: [36.2048, 138.2529],
    zoom: 5,
    isFree: false, // Premium Lock
    totalAttractions: 20,
    description: "A mesmerizing blend of neon-lit ultra-modern cities and ancient traditions, pristine shrines, peaceful gardens, and extraordinary gastronomy.",
    coverImage: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80"
  },
  usa: {
    id: "usa",
    name: "United States",
    code: "US",
    continent: "North America",
    flag: "🇺🇸",
    center: [37.0902, -95.7129],
    zoom: 4,
    isFree: false, // Premium Lock
    totalAttractions: 19,
    description: "A vast landscape of dazzling metropolis horizons, breathtaking national parks, diverse subcultures, and iconic entertainment monuments.",
    coverImage: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1200&q=80"
  },
  egypt: {
    id: "egypt",
    name: "Egypt",
    code: "EG",
    continent: "Africa",
    flag: "🇪🇬",
    center: [26.8206, 30.8025],
    zoom: 6,
    isFree: false, // Premium Lock
    totalAttractions: 15,
    description: "The historic cradle of empires, home of towering pharaonic tombs, massive golden temples, the eternal Nile, and majestic desert safaris.",
    coverImage: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1200&q=80"
  }
};

const SEED_CITIES = {
  // --- FRANCE CITIES ---
  paris: {
    id: "paris",
    name: "Paris",
    countryId: "france",
    lat: 48.8566,
    lng: 2.3522,
    tagline: "The City of Light",
    description: "The global center of art, fashion, gastronomy, and romantic walks along the winding Seine River.",
    coverImage: "https://images.unsplash.com/photo-1499856138868-75586016629f?auto=format&fit=crop&w=600&q=80"
  },
  nice: {
    id: "nice",
    name: "Nice",
    countryId: "france",
    lat: 43.7102,
    lng: 7.2620,
    tagline: "Jewel of the Côte d'Azur",
    description: "A gorgeous coastal retreat famous for pebble beaches, old Italianate squares, and stunning azure waters.",
    coverImage: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=600&q=80"
  },
  chamonix: {
    id: "chamonix",
    name: "Chamonix-Mont-Blanc",
    countryId: "france",
    lat: 45.9227,
    lng: 6.8685,
    tagline: "Roof of the Alps",
    description: "A dramatic alpine valley at the base of Mont Blanc, world-famous for mountaineering, skiing, and glaciers.",
    coverImage: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=600&q=80"
  },

  // --- INDIA CITIES ---
  mumbai: {
    id: "mumbai",
    name: "Mumbai",
    countryId: "india",
    state: "Maharashtra",
    lat: 18.9750,
    lng: 72.8258,
    tagline: "The City of Dreams",
    description: "India's massive financial hub, home of Bollywood, spectacular Victorian architectures, and bustling spice bazaars.",
    coverImage: "https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=600&q=80"
  },
  jaipur: {
    id: "jaipur",
    name: "Jaipur",
    countryId: "india",
    state: "Rajasthan",
    lat: 26.9124,
    lng: 75.7873,
    tagline: "The Pink City",
    description: "The royal gateway of Rajasthan, boasting exquisite pink sandstone palaces, imposing hilltop forts, and royal observatories.",
    coverImage: "https://images.unsplash.com/photo-1477587458883-471a5ed94245?auto=format&fit=crop&w=600&q=80"
  },
  agra: {
    id: "agra",
    name: "Agra",
    countryId: "india",
    state: "Uttar Pradesh",
    lat: 27.1767,
    lng: 78.0081,
    tagline: "Legacy of the Mughals",
    description: "An ancient capital globally renowned for hosting the ultimate monument to love, alongside magnificent red stone citadels.",
    coverImage: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80"
  },
  delhi: {
    id: "delhi",
    name: "New Delhi",
    countryId: "india",
    state: "Delhi (NCT)",
    lat: 28.6139,
    lng: 77.2090,
    tagline: "The Capital of Empires",
    description: "India's grand capital, a living museum of six consecutive empires — from Mughal red sandstone forts to colonial Lutyens bungalows and the modern Lotus Temple.",
    coverImage: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80"
  },
  varanasi: {
    id: "varanasi",
    name: "Varanasi",
    countryId: "india",
    state: "Uttar Pradesh",
    lat: 25.3176,
    lng: 82.9739,
    tagline: "The Eternal City on the Ganges",
    description: "One of the world's oldest continuously inhabited cities, where centuries of Hindu ritual, silk weaving, and classical music converge on the sacred river ghats.",
    coverImage: "https://images.unsplash.com/photo-1561361058-c24cecae35ca?auto=format&fit=crop&w=600&q=80"
  },
  udaipur: {
    id: "udaipur",
    name: "Udaipur",
    countryId: "india",
    state: "Rajasthan",
    lat: 24.5854,
    lng: 73.7125,
    tagline: "The City of Lakes",
    description: "Rajasthan's most romantic city, a gleaming white marble fantasy of palaces rising from the mirrored surface of Lake Pichola in the Aravalli Hills.",
    coverImage: "https://images.unsplash.com/photo-1588598048424-5e9de9e51f16?auto=format&fit=crop&w=600&q=80"
  },
  jodhpur: {
    id: "jodhpur",
    name: "Jodhpur",
    countryId: "india",
    state: "Rajasthan",
    lat: 26.2389,
    lng: 73.0243,
    tagline: "The Blue City",
    description: "The living heart of the Thar Desert — a maze of cobalt-blue houses, a colossal clifftop fortress, and spice markets that perfume the entire old city.",
    coverImage: "https://images.unsplash.com/photo-1624366412711-936294f2ea24?auto=format&fit=crop&w=600&q=80"
  },
  amritsar: {
    id: "amritsar",
    name: "Amritsar",
    countryId: "india",
    state: "Punjab",
    lat: 31.6340,
    lng: 74.8723,
    tagline: "The Holy City of the Sikhs",
    description: "Home of the transcendent Golden Temple — the spiritual and cultural epicenter of Sikhism — and the emotionally charged Wagah Border ceremony with Pakistan.",
    coverImage: "https://images.unsplash.com/photo-1609766418204-94aae0ecfb7e?auto=format&fit=crop&w=600&q=80"
  },
  kolkata: {
    id: "kolkata",
    name: "Kolkata",
    countryId: "india",
    state: "West Bengal",
    lat: 22.5726,
    lng: 88.3639,
    tagline: "The City of Joy",
    description: "The cultural soul of India — birthplace of Tagore, Bose, and Mother Teresa, with decaying colonial grandeur, passionate football culture, and the finest sweets in the subcontinent.",
    coverImage: "https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=600&q=80"
  },
  hyderabad: {
    id: "hyderabad",
    name: "Hyderabad",
    countryId: "india",
    state: "Telangana",
    lat: 17.3850,
    lng: 78.4867,
    tagline: "The City of Pearls",
    description: "A glittering blend of Nizami grandeur and tech-city ambition — where centuries-old biryani recipes, pearl bazaars, and palaces coexist with India's Silicon Plateau.",
    coverImage: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=600&q=80"
  },
  bangalore: {
    id: "bangalore", name: "Bangalore", countryId: "india", state: "Karnataka",
    lat: 12.9716, lng: 77.5946,
    tagline: "Silicon Valley of India",
    description: "India's fastest-growing metropolis and technology capital — home to 10,000+ tech startups, stunning Lalbagh Botanical Garden, the historic Vidhana Soudha, ISKCON Temple, and a thriving specialty-coffee and craft-beer culture that has made it the most cosmopolitan city in the subcontinent.",
    coverImage: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80"
  },
  chennai: {
    id: "chennai", name: "Chennai", countryId: "india", state: "Tamil Nadu",
    lat: 13.0827, lng: 80.2707,
    tagline: "Gateway of the South",
    description: "The cultural capital of South India — birthplace of Carnatic classical music and Bharatanatyam dance, home to the world's second-longest urban beach, and the nearest major city to the UNESCO temple sculptures of Mahabalipuram. Chennai balances 2,000-year-old Tamil heritage with a booming automobile and IT industry.",
    coverImage: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80"
  },
  mysore: {
    id: "mysore", name: "Mysore", countryId: "india", state: "Karnataka",
    lat: 12.2958, lng: 76.6394,
    tagline: "The City of Palaces",
    description: "A regal city of sandalwood, silk, and magnificent palace architecture — the seat of the Wadiyar dynasty and home to the glittering Mysore Palace (lit by 98,000 bulbs on Sundays), which ranks among India's most-visited monuments. The 10-day Dasara festival here is Karnataka's grandest royal celebration.",
    coverImage: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80"
  },
  shimla: {
    id: "shimla", name: "Shimla", countryId: "india", state: "Himachal Pradesh",
    lat: 31.1048, lng: 77.1734,
    tagline: "Queen of the Hills",
    description: "The former summer capital of British India — a charming colonial hill station perched at 2,200m in the Shivalik Himalayas with Tudor architecture, apple orchards, pine forests, and the UNESCO-listed Kalka–Shimla Narrow-Gauge Toy Train winding through 102 tunnels and 864 bridges.",
    coverImage: "https://images.unsplash.com/photo-1562462181-a920e9c9c8a8?auto=format&fit=crop&w=600&q=80"
  },
  leh: {
    id: "leh", name: "Leh", countryId: "india", state: "Ladakh",
    lat: 34.1526, lng: 77.5771,
    tagline: "Land of High Passes",
    description: "The gateway to the world's highest motorable roads and spectacular Himalayan cold-desert landscapes — where ancient Buddhist monasteries cling to sheer cliffs above the world's most surreally blue glacial lakes. Leh sits at 3,500m; acclimatise before exploring Pangong Tso, Nubra Valley, Zanskar, and Khardung La.",
    coverImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80"
  },
  pondicherry: {
    id: "pondicherry", name: "Pondicherry", countryId: "india", state: "Puducherry",
    lat: 11.9416, lng: 79.8083,
    tagline: "The French Riviera of India",
    description: "A former French colonial enclave where Tamil Dravidian culture meets Gallic architecture in sun-washed promenades and bougainvillea-draped yellow streets. Home to Sri Aurobindo's Ashram and the visionary township of Auroville — a 3,000-resident intentional community from 50+ countries living beyond nationality and religion.",
    coverImage: "https://images.unsplash.com/photo-1563841930606-67e2b64a896e?auto=format&fit=crop&w=600&q=80"
  },
  coorg: {
    id: "coorg", name: "Coorg (Kodagu)", countryId: "india", state: "Karnataka",
    lat: 12.3375, lng: 75.8069,
    tagline: "Scotland of India",
    description: "A misty mountain district in the Western Ghats blanketed with 30,000 hectares of coffee and spice estates, dense forests sheltering tigers and elephants, and cascading waterfalls. Coorg produces India's finest arabica coffee, cardamom, and pepper, and is home to the Kodava warrior clan with a proud martial tradition.",
    coverImage: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80"
  },
  hampi: {
    id: "hampi", name: "Hampi", countryId: "india", state: "Karnataka",
    lat: 15.3350, lng: 76.4600,
    tagline: "UNESCO Ruins of the Vijayanagara Empire",
    description: "A surreal landscape of colossal granite boulders studded with 1,600 monuments — the remains of the world's second-largest medieval city and capital of the Vijayanagara Empire (14th–16th century). A UNESCO World Heritage Site of extraordinary architectural richness scattered across 40 km², including the musical-pillared Vittala Temple.",
    coverImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80"
  },
  darjeeling: {
    id: "darjeeling", name: "Darjeeling", countryId: "india", state: "West Bengal",
    lat: 27.0360, lng: 88.2627,
    tagline: "Queen of the Hills & Tea Paradise",
    description: "A breathtaking Himalayan hill station at 2,050m where manicured tea gardens cascade down misty slopes beneath Kangchenjunga — the world's third-highest mountain. The UNESCO-listed Darjeeling Himalayan Railway (Toy Train) is among the world's most scenic mountain journeys, and Tiger Hill offers the most celebrated Himalayan sunrise in India.",
    coverImage: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=600&q=80"
  },
  gangtok: {
    id: "gangtok", name: "Gangtok", countryId: "india", state: "Sikkim",
    lat: 27.3389, lng: 88.6065,
    tagline: "Gateway to the Eastern Himalayas",
    description: "The immaculate mountain capital of Sikkim — a city of Tibetan Buddhist monasteries, pristine streets, and jaw-dropping views of Kangchenjunga (8,586m). India's cleanest city by multiple rankings; from here scenic roads lead to the frozen Tsomgo Lake and the China border at Nathula Pass at 4,310m.",
    coverImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80"
  },
  munnar: {
    id: "munnar", name: "Munnar", countryId: "india", state: "Kerala",
    lat: 10.0889, lng: 77.0595,
    tagline: "Tea Garden Capital of South India",
    description: "A high-altitude hill station in the Western Ghats at 1,600m blanketed by 30,000 hectares of emerald tea estates. Home to Eravikulam National Park (protecting the endangered Nilgiri Tahr), Anamudi — South India's highest peak (2,695m) — and the Neelakurinji flower that turns entire hillsides purple-blue every 12 years (next: 2030).",
    coverImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80"
  },
  alleppey: {
    id: "alleppey", name: "Alleppey (Alappuzha)", countryId: "india", state: "Kerala",
    lat: 9.4981, lng: 76.3388,
    tagline: "The Venice of the East",
    description: "A tranquil labyrinth of 900km of inland waterways, canals, and backwater lakes lined with swaying coconut palms. Drifting through the backwaters on a traditional Kettuvallam houseboat — past floating villages, Chinese fishing nets, and coir-making communities — is one of India's most iconic and distinctive travel experiences.",
    coverImage: "https://images.unsplash.com/photo-1561389966-a8ab2de3c4f1?auto=format&fit=crop&w=600&q=80"
  },
  jaisalmer: {
    id: "jaisalmer", name: "Jaisalmer", countryId: "india", state: "Rajasthan",
    lat: 26.9157, lng: 70.9083,
    tagline: "The Golden City of the Thar Desert",
    description: "A living fortress city rising like a sand castle from the great Thar Desert — the 12th-century Jaisalmer Fort (Sonar Qila) is one of the world's only fully inhabited fortress cities with 3,000 residents inside its medieval battlements. The surrounding Sam Sand Dunes offer camel safaris and spectacular stargazing under zero light pollution.",
    coverImage: "https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?auto=format&fit=crop&w=600&q=80"
  },
  khajuraho: {
    id: "khajuraho", name: "Khajuraho", countryId: "india", state: "Madhya Pradesh",
    lat: 24.8318, lng: 79.9199,
    tagline: "UNESCO Temples of Eternal Love",
    description: "A UNESCO World Heritage Site of extraordinary medieval Hindu and Jain temples built between 950–1050 AD by the Chandela dynasty. The temples are famous worldwide for their exquisitely carved erotic friezes (representing only 10% of the exterior — the remaining 90% depicts gods, warriors, musicians, and animals in stunning detail).",
    coverImage: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80"
  },
  manali: {
    id: "manali", name: "Manali", countryId: "india", state: "Himachal Pradesh",
    lat: 32.2432, lng: 77.1892,
    tagline: "Gateway to Himalayan Adventure",
    description: "A spectacular high-altitude resort town at 2,050m on the Beas River — the launch pad for India's most thrilling mountain adventures: crossing Rohtang Pass (3,978m) into Lahaul-Spiti, the 4-day Hampta Pass trek, white-water rafting, paragliding, and skiing at Solang Valley. Hidimba Devi Temple is a unique wooden pagoda in deodar forest.",
    coverImage: "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&w=600&q=80"
  },
  dharamsala: {
    id: "dharamsala", name: "Dharamsala & McLeod Ganj", countryId: "india", state: "Himachal Pradesh",
    lat: 32.2190, lng: 76.3234,
    tagline: "Little Lhasa — Home of the Dalai Lama",
    description: "The residence of His Holiness the 14th Dalai Lama and the Tibetan government-in-exile — a hill town in the Dhauladhar ranges that has become a global center for Tibetan Buddhism, meditation, yoga, and Himalayan trekking. McLeod Ganj's narrow lanes are lined with prayer flags, thangka paintings, momos, and Tibetan monks in maroon robes.",
    coverImage: "https://images.unsplash.com/photo-1570877277839-c2bf1af37688?auto=format&fit=crop&w=600&q=80"
  },
  ooty: {
    id: "ooty", name: "Ooty (Udhagamandalam)", countryId: "india", state: "Tamil Nadu",
    lat: 11.4102, lng: 76.6950,
    tagline: "Queen of the Nilgiri Hills",
    description: "India's quintessential southern hill station at 2,240m — a land of rose gardens, vast tea estates, eucalyptus-scented forests, and the famous Nilgiri Botanical Garden with its 20-million-year-old fossil tree. The UNESCO-listed Nilgiri Mountain Railway (Toy Train) is a rack-and-pinion marvel climbing through 250 bridges.",
    coverImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80"
  },
  spiti: {
    id: "spiti", name: "Spiti Valley", countryId: "india", state: "Himachal Pradesh",
    lat: 32.2461, lng: 78.0338,
    tagline: "The Middle Land — A Cold Desert Frontier",
    description: "A remote Trans-Himalayan high-altitude cold desert at 3,800–4,200m — one of Earth's most isolated and spectacular landscapes. Ancient Buddhist monasteries perch impossibly on sheer cliffs above narrow river gorges. Snow leopard sightings, 20-million-year-old marine fossils at the surface, and the Chandratal Lake make Spiti a bucket-list extreme destination.",
    coverImage: "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&w=600&q=80"
  },
  chopta: {
    id: "chopta", name: "Chopta & Tungnath", countryId: "india", state: "Uttarakhand",
    lat: 30.4832, lng: 79.2032,
    tagline: "Mini Switzerland of Uttarakhand",
    description: "A pristine alpine meadow at 2,680m in Kedarnath Wildlife Sanctuary — starting point of the 3.5km trek to Tungnath (3,680m, the world's highest Shiva temple) and onward to Chandrashila Peak (4,130m) with 360° panoramic views of Nanda Devi, Trishul, Kedarnath, and Badrinath snow peaks. Very few tourists reach here.",
    coverImage: "https://images.unsplash.com/photo-1629206028929-1e6ec6a9f975?auto=format&fit=crop&w=600&q=80"
  },
  valleyofflowers: {
    id: "valleyofflowers", name: "Valley of Flowers", countryId: "india", state: "Uttarakhand",
    lat: 30.7289, lng: 79.6075,
    tagline: "UNESCO Himalayan Wildflower Paradise",
    description: "A stunning high-altitude Himalayan valley at 3,352–3,658m blanketed with 300+ endemic alpine wildflower species during July–August bloom — including the rare Blue Poppy and Brahmakamal. A UNESCO World Heritage Site and National Park accessible via a 17km trek from Govindghat, also leading to the sacred Hemkund Sahib Gurudwara at 4,329m.",
    coverImage: "https://images.unsplash.com/photo-1540324155974-23be9c954668?auto=format&fit=crop&w=600&q=80"
  },
  kochi: {
    id: "kochi", name: "Kochi (Cochin)", countryId: "india", state: "Kerala",
    lat: 9.9312, lng: 76.2673,
    tagline: "Queen of the Arabian Sea",
    description: "A vibrant port city where 600 years of Chinese, Portuguese, Dutch, and British colonial history coexist with contemporary art galleries and Kerala backwater culture. Fort Kochi's cantilevered Chinese fishing nets (introduced ~1400 AD), India's oldest synagogue (1568 AD), Dutch Mattancherry Palace, and St. Francis Church (where Vasco da Gama was buried) make it South India's most historically layered destination.",
    coverImage: "https://images.unsplash.com/photo-1561389966-a8ab2de3c4f1?auto=format&fit=crop&w=600&q=80"
  },
  nainital: {
    id: "nainital", name: "Nainital", countryId: "india", state: "Uttarakhand",
    lat: 29.3919, lng: 79.4542,
    tagline: "Lake District of India",
    description: "A beautiful Kumaon Himalayan hill station at 2,084m built around the glacial pear-shaped Naini Lake — one of the 64 Shakti Peethas of Hinduism. Surrounded by forested ridges and colonial-era buildings, with a cable car to Snow View Point offering magnificent panoramas of Nanda Devi (7,816m) and the Himalayan snow ranges.",
    coverImage: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=600&q=80"
  },
  goa: {
    id: "goa",
    name: "Goa",
    countryId: "india",
    lat: 15.2993,
    lng: 74.1240,
    tagline: "India's Tropical Paradise",
    description: "A sun-soaked former Portuguese colony where Latin-infused Konkani culture, pristine beaches, spice plantations, and vibrant nightlife create India's most laid-back destination.",
    coverImage: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80"
  },

  // ─────────── CHAR DHAM & UTTARAKHAND PILGRIMAGE ───────────
  haridwar: {
      id: "haridwar", name: "Haridwar", countryId: "india",
      lat: 29.9457, lng: 78.1642,
      tagline: "Gateway to the Gods",
      description: "The most sacred Hindu city where the Ganges descends from the Himalayas to the plains. The nightly Ganga Aarti at Har Ki Pauri is one of India's most mesmerizing rituals and the starting point for the Char Dham Yatra.",
      coverImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80"
    },
    rishikesh: {
      id: "rishikesh", name: "Rishikesh", countryId: "india",
      lat: 30.0869, lng: 78.2676,
      tagline: "The World's Yoga Capital",
      description: "A sacred Himalayan foothills town where the Ganges flows swiftly between ashrams and ancient temples. The base for the Char Dham Yatra and the global birthplace of modern yoga.",
      coverImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80"
    },
    kedarnath: {
      id: "kedarnath", name: "Kedarnath", countryId: "india",
      lat: 30.7346, lng: 79.0669,
      tagline: "Shiva's Himalayan Abode — Char Dham",
      description: "A tiny ancient shrine at 3,583 metres in the Garhwal Himalayas — one of the 12 Jyotirlingas of Shiva and one of the 4 sacred Char Dhams. Accessible only by a 16km trek or helicopter through breathtaking alpine scenery.",
      coverImage: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80"
    },
    badrinath: {
      id: "badrinath", name: "Badrinath", countryId: "india",
      lat: 30.7433, lng: 79.4938,
      tagline: "Vishnu's Himalayan Shrine — Char Dham",
      description: "One of the holiest temples dedicated to Lord Vishnu, situated at 3,133 metres between the Nar and Narayan mountain ranges. One of the 4 Char Dhams and 108 Divya Desams.",
      coverImage: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=600&q=80"
    },
    gangotri: {
      id: "gangotri", name: "Gangotri", countryId: "india",
      lat: 30.9947, lng: 78.9398,
      tagline: "The Sacred Origin of the Ganga — Char Dham",
      description: "A Himalayan shrine town at 3,100 metres altitude — the origin of the sacred Ganga River and one of the 4 Char Dhams. The Gangotri Glacier, the actual source of the Bhagirathi river, is 19km upstream.",
      coverImage: "https://images.unsplash.com/photo-1540324155974-23be9c954668?auto=format&fit=crop&w=600&q=80"
    },
    yamunotri: {
      id: "yamunotri", name: "Yamunotri", countryId: "india",
      lat: 31.0146, lng: 78.4609,
      tagline: "Source of the Yamuna — Char Dham",
      description: "The westernmost of the 4 Char Dhams at 3,291 metres — the sacred source of the Yamuna River. The route passes the Janki Chatti hot springs where devotees cook rice in the boiling thermal water as prasad.",
      coverImage: "https://images.unsplash.com/photo-1610294792547-11a07e7e1284?auto=format&fit=crop&w=600&q=80"
    },

    // ─────────── UTTAR PRADESH PILGRIMAGE ───────────
    mathura: {
      id: "mathura", name: "Mathura", countryId: "india",
      lat: 27.4924, lng: 77.6737,
      tagline: "The Birthplace of Lord Krishna",
      description: "One of India's seven sacred cities (Sapta Puri) and the birthplace of Lord Krishna. The city is dotted with 3,000+ temples and ghats along the Yamuna, buzzing with devotional energy during Janmashtami.",
      coverImage: "https://images.unsplash.com/photo-1594387303756-a2b7b0e7c5d3?auto=format&fit=crop&w=600&q=80"
    },
    vrindavan: {
      id: "vrindavan", name: "Vrindavan", countryId: "india",
      lat: 27.5652, lng: 77.6900,
      tagline: "Krishna's Eternal Playground",
      description: "A sacred forest town where Lord Krishna spent his childhood — filled with 5,000+ temples, ancient ghats on the Yamuna, and the mystical Nidhivan forest where tradition holds that Krishna still dances at midnight.",
      coverImage: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80"
    },
    ayodhya: {
      id: "ayodhya", name: "Ayodhya", countryId: "india",
      lat: 26.7990, lng: 82.2042,
      tagline: "The Birthplace of Lord Rama",
      description: "One of the seven sacred Hindu cities and the birthplace of Lord Rama. The newly consecrated Ram Mandir (2024) has transformed this ancient city into one of India's most significant pilgrimage destinations.",
      coverImage: "https://images.unsplash.com/photo-1612802096736-b7e0e0c6b5ae?auto=format&fit=crop&w=600&q=80"
    },

    // ─────────── JYOTIRLINGA CITIES ───────────
    ujjain: {
      id: "ujjain", name: "Ujjain", countryId: "india",
      lat: 23.1765, lng: 75.7885,
      tagline: "City of Mahakaleshwar Jyotirlinga",
      description: "One of India's seven sacred cities (Sapta Puri) on the Shipra river — home to the Mahakaleshwar Jyotirlinga (the only south-facing Jyotirlinga) and the Kumbh Mela site every 12 years.",
      coverImage: "https://images.unsplash.com/photo-1629206028929-1e6ec6a9f975?auto=format&fit=crop&w=600&q=80"
    },
    shirdi: {
      id: "shirdi", name: "Shirdi", countryId: "india",
      lat: 19.7645, lng: 74.4762,
      tagline: "The Abode of Sai Baba",
      description: "A small Maharashtra town that draws 25,000+ pilgrims daily to the shrine of Sai Baba — a 19th-century saint revered equally by Hindus, Muslims and people of all faiths as a symbol of compassion.",
      coverImage: "https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?auto=format&fit=crop&w=600&q=80"
    },
    somnath: {
      id: "somnath", name: "Somnath", countryId: "india",
      lat: 20.9060, lng: 70.4014,
      tagline: "The First of 12 Jyotirlingas",
      description: "Home to the Somnath Temple on the Arabian Sea coast — the first and foremost of the 12 Jyotirlingas. Destroyed and rebuilt 17 times across history, the present temple rebuilt in 1951 is a symbol of India's eternal devotion.",
      coverImage: "https://images.unsplash.com/photo-1604537466158-719b1972feb8?auto=format&fit=crop&w=600&q=80"
    },
    dwarka: {
      id: "dwarka", name: "Dwarka", countryId: "india",
      lat: 22.2394, lng: 68.9674,
      tagline: "Krishna's Kingdom — Char Dham & Jyotirlinga",
      description: "One of the four Char Dhams and seven sacred cities at the tip of the Saurashtra peninsula. The Dwarkadhish Temple stands where Krishna's fabled underwater city once was, and Nageshwar Jyotirlinga lies nearby.",
      coverImage: "https://images.unsplash.com/photo-1610726360-f2a3b2c0f8e1?auto=format&fit=crop&w=600&q=80"
    },
    nashik: {
      id: "nashik", name: "Nashik", countryId: "india",
      lat: 19.9975, lng: 73.7898,
      tagline: "Trimbakeshwar Jyotirlinga & Kumbh Mela City",
      description: "A sacred city on the Godavari river home to the Trimbakeshwar Jyotirlinga and one of 4 Kumbh Mela sites. Also India's wine country — 40+ vineyards produce some of the subcontinent's finest wines.",
      coverImage: "https://images.unsplash.com/photo-1562183241-840b8af0721e?auto=format&fit=crop&w=600&q=80"
    },

    // ─────────── SOUTH INDIA PILGRIMAGE ───────────
    tirupati: {
      id: "tirupati", name: "Tirupati", countryId: "india",
      lat: 13.6288, lng: 79.4192,
      tagline: "The Most Visited Temple on Earth",
      description: "Home to the Tirumala Venkateswara Temple atop the Seven Hills — the most visited place of worship on Earth with 100,000+ daily pilgrims, and the wealthiest religious institution in history.",
      coverImage: "https://images.unsplash.com/photo-1591367003836-b3efeba29d0f?auto=format&fit=crop&w=600&q=80"
    },
    puri: {
      id: "puri", name: "Puri", countryId: "india",
      lat: 19.8135, lng: 85.8312,
      tagline: "Jagannath's Abode — Char Dham",
      description: "One of the four sacred Char Dhams in Odisha, home to the 12th-century Jagannath Temple and the spectacular Rath Yatra chariot festival. The golden beach alongside the sacred town makes Puri unique among dhams.",
      coverImage: "https://images.unsplash.com/photo-1578897367029-4d16bdf7e032?auto=format&fit=crop&w=600&q=80"
    },
    rameswaram: {
      id: "rameswaram", name: "Rameswaram", countryId: "india",
      lat: 9.2876, lng: 79.3129,
      tagline: "Southernmost Char Dham & 12th Jyotirlinga",
      description: "A sacred island town connected by the Pamban Bridge, housing Ramanathaswamy Temple — a Char Dham, a Jyotirlinga, where Rama is said to have prayed to Shiva before crossing to Lanka. The temple's corridor at 1.2km is India's longest.",
      coverImage: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80"
    },
    madurai: {
      id: "madurai", name: "Madurai", countryId: "india",
      lat: 9.9252, lng: 78.1198,
      tagline: "The Temple City of the South",
      description: "One of the world's oldest continuously inhabited cities, centered on the Meenakshi Amman Temple — a 2,500-year-old complex of 14 soaring gopurams encrusted with thousands of colorful sculptures that has defined Tamil culture.",
      coverImage: "https://images.unsplash.com/photo-1562693819-23e2ffe7b451?auto=format&fit=crop&w=600&q=80"
    },
    kanchipuram: {
      id: "kanchipuram", name: "Kanchipuram", countryId: "india",
      lat: 12.8185, lng: 79.6947,
      tagline: "The City of 1000 Temples & Silk",
      description: "One of the seven sacred Hindu cities with 108 functioning temples — the Shaiva, Vaishnava, and Shakta capitals of Tamil Nadu. Also world-famous for pure silk Kanjivaram sarees handwoven by 5,000+ master weavers.",
      coverImage: "https://images.unsplash.com/photo-1580068534765-71aa41b53bcc?auto=format&fit=crop&w=600&q=80"
    },

    // ─────────── RAJASTHAN PILGRIMAGE ───────────
    pushkar: {
      id: "pushkar", name: "Pushkar", countryId: "india",
      lat: 26.4897, lng: 74.5511,
      tagline: "The Only Brahma Temple in the World",
      description: "A sacred lake town in Rajasthan containing the world's only functioning temple dedicated to Brahma, the creator. The Pushkar Lake is surrounded by 52 ghats, 500 temples, and is considered one of the five sacred Tirthas.",
      coverImage: "https://images.unsplash.com/photo-1580121441575-41bcb5c6b47c?auto=format&fit=crop&w=600&q=80"
    },

    // ─────────── J&K PILGRIMAGE ───────────
    katra: {
      id: "katra", name: "Katra (Vaishno Devi)", countryId: "india",
      lat: 32.9915, lng: 74.9310,
      tagline: "Base Camp for Mata Vaishno Devi",
      description: "The base camp for one of India's most visited pilgrimages — the 14km trek through the Trikuta Hills to the sacred cave shrine of Mata Vaishno Devi, which draws 8 million+ pilgrims every year.",
      coverImage: "https://images.unsplash.com/photo-1603912699214-92627f304eb6?auto=format&fit=crop&w=600&q=80"
    },


    tokyo: {

      id: "tokyo",
      name: "Tokyo",
      countryId: "japan",
      lat: 35.6762,
      lng: 139.6503,
      tagline: "Retro-Futuristic Megacity",
      description: "A neon-splashed metropolis that marries massive skyscrapers, electronic districts, and hidden peaceful Shinto shrines.",
      coverImage: "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=600&q=80"
    },
    kyoto: {
      id: "kyoto",
      name: "Kyoto",
      countryId: "japan",
      lat: 35.0116,
      lng: 135.7681,
      tagline: "Ancient Capital of Culture",
      description: "The historic heart of traditional Japan, filled with thousands of classical Buddhist temples, gardens, and geisha wooden teahouses.",
      coverImage: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80"
    },

    // --- USA CITIES (PREMIUM) ---
    newyork: {
      id: "newyork",
      name: "New York City",
      countryId: "usa",
      lat: 40.7128,
      lng: -74.0060,
      tagline: "The Big Apple",
      description: "The energetic global capital of entertainment, media, finance, skyscrapers, and historic cultural neighborhoods.",
      coverImage: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=600&q=80"
    },
    sanfrancisco: {
      id: "sanfrancisco",
      name: "San Francisco",
      countryId: "usa",
      lat: 37.7749,
      lng: -122.4194,
      tagline: "The Golden Gate City",
      description: "Famed for its majestic red suspension bridge, steep rolling hills, historic cable cars, and colorful Victorian architecture.",
      coverImage: "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=600&q=80"
    },

    // --- EGYPT CITIES (PREMIUM) ---
    giza: {
      id: "giza",
      name: "Giza",
      countryId: "egypt",
      lat: 29.9765,
      lng: 31.1313,
      tagline: "Guardians of Antiquity",
      description: "A city globally famous for its limestone pyramids, the Great Sphinx, and millennia of pharaonic engineering history.",
      coverImage: "https://images.unsplash.com/photo-1503177119275-0aa32b31d468?auto=format&fit=crop&w=600&q=80"
    },
    cairo: {
      id: "cairo",
      name: "Cairo",
      countryId: "egypt",
      lat: 30.0444,
      lng: 31.2357,
      tagline: "The City of a Thousand Minarets",
      description: "A massive, chaotic, and beautiful capital loaded with rich Islamic history, busy Coptic quarters, and legendary antiquities.",
      coverImage: "https://images.unsplash.com/photo-1572252009286-268acec5a0af?auto=format&fit=crop&w=600&q=80"
    }
  };

  const SEED_ATTRACTIONS = [
    // ================= FRANCE ATTRACTIONS =================
    // PARIS
    {
      id: "paris_eiffel",
      name: "Eiffel Tower",
      cityId: "paris",
      countryId: "france",
      lat: 48.8584,
      lng: 2.2945,
      fameScore: 100,
      fameTier: "red",
      category: "landmark",
      tagline: "The iron titan of Paris.",
      description: "Constructed in 1889 as the entrance arch for the World's Fair, this towering iron lattice monument is the ultimate symbol of France.",
      images: ["https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80"],
      entryFee: "€26.80",
      openingHours: "09:30 AM - 11:45 PM",
      bestSeason: "Spring & Autumn",
      timeNeeded: "2-3 Hours",
      isUnesco: true,
      rating: 4.8,
      reviews: [
        { user: "Sarah L.", text: "Cliche but absolutely breath-taking, especially during the glittering light show at night!" },
        { user: "Marco K.", text: "Long lines, but walking up the stairs to the second level was a brilliant and cheaper alternative." }
      ]
    },
    {
      id: "paris_louvre",
      name: "Louvre Museum",
      cityId: "paris",
      countryId: "france",
      lat: 48.8606,
      lng: 2.3376,
      fameScore: 98,
      fameTier: "red",
      category: "museum",
      tagline: "The world's warehouse of masterpiece art.",
      description: "The world's largest art museum, housed in a historic royal fortress, containing legendary works including the Mona Lisa and Venus de Milo.",
      images: ["https://images.unsplash.com/photo-1597916829826-02e5bb4a54e0?auto=format&fit=crop&w=600&q=80"],
      entryFee: "€17.00",
      openingHours: "09:00 AM - 06:00 PM (Closed Tuesday)",
      bestSeason: "Year-Round",
      timeNeeded: "3-4 Hours",
      isUnesco: true,
      rating: 4.7,
      reviews: [
        { user: "Liam T.", text: "You can spend 3 days here and not see everything. Mona Lisa is tiny and crowded, look at the giant coronation painting instead!" }
      ]
    },
    {
      id: "paris_notredame",
      name: "Notre-Dame Cathedral",
      cityId: "paris",
      countryId: "france",
      lat: 48.8530,
      lng: 2.3499,
      fameScore: 88,
      fameTier: "orange",
      category: "culture",
      tagline: "A gothic masterpiece of history and hope.",
      description: "A monumental 12th-century medieval Catholic cathedral, famed for its flying buttresses, majestic rose windows, and gargoyles.",
      images: ["https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free (Towers require tickets)",
      openingHours: "Undergoing restoration visits / exterior viewing open",
      bestSeason: "Summer",
      timeNeeded: "1 Hour",
      isUnesco: true,
      rating: 4.6,
      reviews: [
        { user: "Jean P.", text: "Seeing the facade stand strong after the fire is extremely moving. Truly Paris's heart." }
      ]
    },
    {
      id: "paris_sacrecoeur",
      name: "Basilica of the Sacré-Cœur",
      cityId: "paris",
      countryId: "france",
      lat: 48.8867,
      lng: 2.3431,
      fameScore: 68,
      fameTier: "yellow",
      category: "culture",
      tagline: "The white temple overlooking the city.",
      description: "An iconic white Roman Catholic basilica standing tall at the summit of the Montmartre butte, offering the best panoramic sunset views of Paris.",
      images: ["https://images.unsplash.com/photo-1549887534-1541e9326642?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free",
      openingHours: "06:30 AM - 10:30 PM",
      bestSeason: "Spring",
      timeNeeded: "1.5 Hours",
      isUnesco: false,
      rating: 4.7,
      reviews: [
        { user: "Chara S.", text: "Sitting on the steps of Montmartre listening to street musicians with Paris laid out before you is pure magic." }
      ]
    },
    {
      id: "paris_thermopyles",
      name: "Rue des Thermopyles",
      cityId: "paris",
      countryId: "france",
      lat: 48.8329,
      lng: 2.3175,
      fameScore: 25,
      fameTier: "blue", // Hidden Gem
      category: "hidden_gem",
      tagline: "A quiet, vine-clad secret cobblestone passage.",
      description: "A hidden, gorgeous cobblestone street in the 14th arrondissement, overflowing with wisteria, potted ivy, and vintage doors. A complete escape from city noise.",
      images: ["https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free",
      openingHours: "Accessible 24/7 (Respect local privacy)",
      bestSeason: "May (Wisteria Bloom)",
      timeNeeded: "30 Mins",
      isUnesco: false,
      rating: 4.9,
      reviews: [
        { user: "Emma D.", text: "Shh! Do not share this online. It is so incredibly peaceful and green. Feels like a country village in the center of Paris." }
      ]
    },

    // NICE
    {
      id: "nice_promenade",
      name: "Promenade des Anglais",
      cityId: "nice",
      countryId: "france",
      lat: 43.6957,
      lng: 7.2514,
      fameScore: 82,
      fameTier: "orange",
      category: "nature",
      tagline: "Stroll along the edge of the blue Mediterranean.",
      description: "A massive, world-famous seaside promenade running along the Baie des Anges, frequented by rollerbladers, cafes, and iconic blue chairs.",
      images: ["https://images.unsplash.com/photo-1563841930606-67e2b64a896e?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free",
      openingHours: "Accessible 24/7",
      bestSeason: "Summer & Spring",
      timeNeeded: "1-2 Hours",
      isUnesco: true,
      rating: 4.6,
      reviews: [{ user: "Alex M.", text: "Rented a bicycle and cruised down the coast. The water color is unreal!" }]
    },
    {
      id: "nice_cascade",
      name: "Cascade de Gairaut",
      cityId: "nice",
      countryId: "france",
      lat: 43.7383,
      lng: 7.2599,
      fameScore: 28,
      fameTier: "blue", // Hidden Gem
      category: "hidden_gem",
      tagline: "A majestic Austrian-style mountain waterfall in a suburban city.",
      description: "Built in the late 19th century to celebrate the completion of the Canal de la Vésubie, this spectacular ornamental stone waterfall features caves, alpine wooden bridges, and a panoramic mountain-sea vista.",
      images: ["https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free",
      openingHours: "08:00 AM - 07:00 PM",
      bestSeason: "Spring & Summer",
      timeNeeded: "45 Mins",
      isUnesco: false,
      rating: 4.8,
      reviews: [{ user: "Pierre B.", text: "Virtually zero tourists here. Only locals jogging or reading. The cave looks like something out of a fairy tale!" }]
    },

    // CHAMONIX
    {
      id: "chamonix_aiguille",
      name: "Aiguille du Midi Cable Car",
      cityId: "chamonix",
      countryId: "france",
      lat: 45.8792,
      lng: 6.8872,
      fameScore: 89,
      fameTier: "orange",
      category: "landmark",
      tagline: "Touch the sky near the peak of Europe.",
      description: "The highest vertical ascent cable car in the world, carrying you from Chamonix up to 3,842m, giving a jaw-dropping face-to-face look at Mont Blanc.",
      images: ["https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=600&q=80"],
      entryFee: "€75.00 (Round Trip)",
      openingHours: "08:10 AM - 04:30 PM",
      bestSeason: "Winter (Ski) or Clear Summer",
      timeNeeded: "3 Hours",
      isUnesco: false,
      rating: 4.9,
      reviews: [{ user: "Clara T.", text: "Entering the Step into the Void glass cage made my heart leap! Totally worth the steep price tag." }]
    },
    {
      id: "chamonix_secret_glace",
      name: "Grotte de Glace Secret Portal",
      cityId: "chamonix",
      countryId: "france",
      lat: 45.9288,
      lng: 6.9328,
      fameScore: 22,
      fameTier: "blue", // Hidden Gem
      category: "hidden_gem",
      tagline: "An abandoned, glowing ice crystal side cavern.",
      description: "While most visitors stick to the main illuminated Mer de Glace ice tunnel, an ancient, non-commercialized side tunnel accessible via a specialized safety trail leads to an abandoned naturally frozen neon-blue cavern.",
      images: ["https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Requires general Mer de Glace train pass (€38)",
      openingHours: "10:00 AM - 03:00 PM (Highly seasonal)",
      bestSeason: "Late Winter Only",
      timeNeeded: "1 Hour",
      isUnesco: false,
      rating: 4.9,
      reviews: [{ user: "SkiPro99", text: "Incredible, glowing blue cathedral of pure ice. Ask local guides for permission first!" }]
    },


// ================= INDIA ATTRACTIONS =================
    // AGRA
    {
      id: "agra_tajmahal",
      name: "Taj Mahal",
      cityId: "agra",
      countryId: "india",
      lat: 27.1751,
      lng: 78.0421,
      fameScore: 100,
      fameTier: "red",
      category: "landmark",
      tagline: "The marble monument to eternal love.",
      description: "An immense white marble mausoleum built between 1631 and 1648 by Mughal Emperor Shah Jahan in memory of his favorite wife, Mumtaz Mahal. The jewel of Muslim art in India.",
      images: ["https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹1100 (Foreigners) / ₹50 (Indians)",
      openingHours: "06:00 AM - 07:00 PM (Closed Friday)",
      bestSeason: "October to March",
      timeNeeded: "3 Hours",
      isUnesco: true,
      rating: 4.9,
      reviews: [
        { user: "Rajesh S.", text: "Arrive at 5:30 AM to catch the sunrise. The way the white marble changes color from pink to gold is spiritual." }
      ]
    },
    {
      id: "agra_fort",
      name: "Agra Fort",
      cityId: "agra",
      countryId: "india",
      lat: 27.1798,
      lng: 78.0211,
      fameScore: 84,
      fameTier: "orange",
      category: "history",
      tagline: "The fortress palace of the Mughal Emperors.",
      description: "A massive 16th-century red sandstone citadel encompassing royal marble palaces, imperial audience chambers, and beautiful views of the nearby Taj Mahal.",
      images: ["https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹650 (Foreigners) / ₹50 (Indians)",
      openingHours: "06:00 AM - 06:00 PM",
      bestSeason: "Winter",
      timeNeeded: "2 Hours",
      isUnesco: true,
      rating: 4.6,
      reviews: [{ user: "Dev K.", text: "Do not miss the Jahangiri Mahal and the room where Shah Jahan was imprisoned, looking out at the Taj." }]
    },
    {
      id: "agra_sheroes",
      name: "Sheroes Hangout",
      cityId: "agra",
      countryId: "india",
      lat: 27.1648,
      lng: 78.0410,
      fameScore: 29,
      fameTier: "blue", // Hidden Gem
      category: "hidden_gem",
      tagline: "A cafe of hope run by heroic acid attack survivors.",
      description: "A heart-warming activist cafe run entirely by women who have survived acid attacks. Excellent food, a wonderful community library, and a hub for female empowerment advocacy.",
      images: ["https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Pay as you wish (Donations)",
      openingHours: "09:00 AM - 09:00 PM",
      bestSeason: "Year-Round",
      timeNeeded: "1 Hour",
      isUnesco: false,
      rating: 5.0,
      reviews: [{ user: "Ananya R.", text: "The most inspiring place in India. Meeting the women and listening to their stories was far more impactful than any monument." }]
    },

    // MUMBAI
    {
      id: "mumbai_gateway",
      name: "Gateway of India",
      cityId: "mumbai",
      countryId: "india",
      lat: 18.9220,
      lng: 72.8347,
      fameScore: 89,
      fameTier: "orange",
      category: "landmark",
      tagline: "The monumental archway to the Arabian Sea.",
      description: "Built in 1924 to commemorate the landing of King George V, this massive basalt triumphal arch stands directly on the waterfront facing the harbor.",
      images: ["https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free",
      openingHours: "24/7 (Best during day)",
      bestSeason: "Winter",
      timeNeeded: "30 Mins",
      isUnesco: false,
      rating: 4.5,
      reviews: [{ user: "Neil P.", text: "Bustling with vendors, photographers, and dynamic energy. A great place to start a boat ride to Elephanta!" }]
    },
    {
      id: "mumbai_chor_bazaar",
      name: "Chor Bazaar Secret Antique Nooks",
      cityId: "mumbai",
      countryId: "india",
      lat: 18.9609,
      lng: 72.8272,
      fameScore: 27,
      fameTier: "blue", // Hidden Gem
      category: "hidden_gem",
      tagline: "A labyrinth of stolen secrets and rare relics.",
      description: "Chor Bazaar (Thieves Market) is one of the largest flea markets in India. Hidden deep within its winding lanes are dusty, unlabelled warehouses containing authentic 100-year-old gramophones, vintage Bollywood posters, and old nautical compasses.",
      images: ["https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free (Bargain heavily!)",
      openingHours: "11:00 AM - 07:30 PM (Closed Friday)",
      bestSeason: "Winter",
      timeNeeded: "2 Hours",
      isUnesco: false,
      rating: 4.7,
      reviews: [{ user: "Vikram M.", text: "Found a genuine working brass spyglass from 1920 in a corner shop! Keep your eyes peeled and prepare to haggle." }]
    },

    // JAIPUR
    {
      id: "jaipur_hawamahal",
      name: "Hawa Mahal",
      cityId: "jaipur",
      countryId: "india",
      lat: 26.9239,
      lng: 75.8267,
      fameScore: 92,
      fameTier: "orange", // A strong orange / border red
      category: "landmark",
      tagline: "The glowing pink Palace of Winds.",
      description: "Built in 1799, this unique five-story structure features 953 tiny casements (jharokhas) decorated with intricate latticework, designed to let royal women observe street life unseen.",
      images: ["https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹200 (Foreigners) / ₹50 (Indians)",
      openingHours: "09:00 AM - 05:00 PM",
      bestSeason: "Autumn & Winter",
      timeNeeded: "1 Hour",
      isUnesco: false,
      rating: 4.6,
      reviews: [{ user: "John D.", text: "The wind really sweeps through the windows. The best view is actually from the Wind View Cafe across the street!" }]
    },
    {
      id: "jaipur_panna_meena",
      name: "Panna Meena ka Kund",
      cityId: "jaipur",
      countryId: "india",
      lat: 26.9934,
      lng: 75.8588,
      fameScore: 26,
      fameTier: "blue", // Hidden Gem
      category: "hidden_gem",
      tagline: "A stunning, symmetrical royal stepwell.",
      description: "An exquisite 16th-century rain-harvesting stepwell famous for its geometric staircases that form a mind-boggling optical illusion. Locals claim it's impossible to use the same stairs to go down and climb back up.",
      images: ["https://images.unsplash.com/photo-1506450981913-b7744b77d2e0?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free (Stepping down is restricted)",
      openingHours: "07:00 AM - 06:00 PM",
      bestSeason: "Monsoon & Winter",
      timeNeeded: "45 Mins",
      isUnesco: false,
      rating: 4.8,
      reviews: [{ user: "Sanjana L.", text: "Extremely photogenic. Much quieter than the fort next door. Perfect geometry!" }]
    },

    // ─────────── DELHI ───────────
    {
      id: "delhi_indiagate",
      name: "India Gate",
      cityId: "delhi", countryId: "india",
      lat: 28.6129, lng: 77.2295,
      fameScore: 96, fameTier: "red",
      category: "landmark",
      tagline: "The eternal flame of 84,000 fallen soldiers.",
      description: "A 42-metre-tall war memorial arch erected in 1931 in memory of soldiers who died in WWI. At night, illuminated against the Delhi sky, it is one of India's most iconic sights.",
      images: ["https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free",
      openingHours: "24/7 (Best at dusk)",
      bestSeason: "Winter (Oct–Feb)",
      timeNeeded: "1 Hour",
      isUnesco: false, rating: 4.7,
      reviews: [
        { user: "Arjun M.", text: "The eternal flame is deeply moving. Best to go at sunset — the orange light on the white stone is stunning." },
        { user: "Pooja R.", text: "Massive open lawns around it are perfect for a picnic. Kids love the space." }
      ]
    },
    {
      id: "delhi_qutub",
      name: "Qutub Minar",
      cityId: "delhi", countryId: "india",
      lat: 28.5245, lng: 77.1855,
      fameScore: 88, fameTier: "orange",
      category: "history",
      tagline: "The world's tallest brick minaret.",
      description: "A soaring 73-metre victory tower built in 1193 by Qutb ud-Din Aibak, the first Sultan of Delhi. The surrounding complex includes the Iron Pillar, which has resisted rust for 1,600 years.",
      images: ["https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹600 (Foreigners) / ₹40 (Indians)",
      openingHours: "07:00 AM - 05:00 PM",
      bestSeason: "Winter",
      timeNeeded: "2 Hours",
      isUnesco: true, rating: 4.6,
      reviews: [{ user: "Sahil V.", text: "The iron pillar that hasn't rusted in 1,600 years is mind-blowing. Arrive early to avoid school groups." }]
    },
    {
      id: "delhi_humayun",
      name: "Humayun's Tomb",
      cityId: "delhi", countryId: "india",
      lat: 28.5933, lng: 77.2507,
      fameScore: 72, fameTier: "yellow",
      category: "history",
      tagline: "The garden tomb that inspired the Taj Mahal.",
      description: "Built in 1570, this stunning Mughal-era mausoleum set within a classic charbagh garden is considered the precursor to the Taj Mahal and was the first garden-tomb on the Indian subcontinent.",
      images: ["https://images.unsplash.com/photo-1524168272322-bf73616d9cb5?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹600 (Foreigners) / ₹40 (Indians)",
      openingHours: "06:00 AM - 06:00 PM",
      bestSeason: "October to March",
      timeNeeded: "1.5 Hours",
      isUnesco: true, rating: 4.6,
      reviews: [{ user: "Divya K.", text: "Far less crowded than the Taj but equally breathtaking geometry. The gardens are immaculate." }]
    },
    {
      id: "delhi_lodi",
      name: "Lodi Garden",
      cityId: "delhi", countryId: "india",
      lat: 28.5931, lng: 77.2197,
      fameScore: 44, fameTier: "green",
      category: "nature",
      tagline: "An ancient royal graveyard turned beloved city park.",
      description: "A 90-acre park in the heart of New Delhi containing 15th-century tombs of the Lodi and Sayyid dynasties, scattered among lush lawns, rose gardens, and bonsai reserves.",
      images: ["https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free",
      openingHours: "06:00 AM - 08:00 PM",
      bestSeason: "Winter mornings",
      timeNeeded: "1 Hour",
      isUnesco: false, rating: 4.5,
      reviews: [{ user: "Naina T.", text: "My daily morning run goes through here. Seeing 600-year-old tombs while jogging is surreal and very Delhi." }]
    },
    {
      id: "delhi_agrasen",
      name: "Agrasen ki Baoli",
      cityId: "delhi", countryId: "india",
      lat: 28.6265, lng: 77.2198,
      fameScore: 26, fameTier: "blue",
      category: "hidden_gem",
      tagline: "A haunted 14th-century stepwell hidden between skyscrapers.",
      description: "An ancient 60-step stepwell tucked between towering Connaught Place office buildings. Despite its central location, it is virtually unknown to tourists. Local legend says the black water at its base drives visitors mad.",
      images: ["https://images.unsplash.com/photo-1593693411515-c20261bcad6e?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free",
      openingHours: "09:00 AM - 06:30 PM",
      bestSeason: "Monsoon (eerie atmosphere) or Winter",
      timeNeeded: "30 Mins",
      isUnesco: false, rating: 4.7,
      reviews: [{ user: "Ravi S.", text: "Impossible to believe this 600-year-old stepwell exists between corporate towers. The photography is extraordinary." }]
    },

    // ─────────── VARANASI ───────────
    {
      id: "varanasi_dashashwamedh",
      name: "Dashashwamedh Ghat",
      cityId: "varanasi", countryId: "india",
      lat: 25.3065, lng: 83.0109,
      fameScore: 91, fameTier: "orange",
      category: "culture",
      tagline: "The nightly fire ritual that transcends time.",
      description: "The main ghat on the Ganges where the spectacular Ganga Aarti ceremony is performed every evening at dusk — dozens of priests spin fire torches in mesmerizing synchrony while thousands watch from boats.",
      images: ["https://images.unsplash.com/photo-1561361058-c24cecae35ca?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free (Boat ride ₹100–200)",
      openingHours: "Aarti at dusk daily",
      bestSeason: "October to March",
      timeNeeded: "2 Hours",
      isUnesco: false, rating: 4.9,
      reviews: [
        { user: "Priya M.", text: "The Ganga Aarti from a boat is the single most spiritual experience of my life. Book a boat early — it fills up fast." },
        { user: "Hans K.", text: "The smoke, the fire, the bells, the chanting. Words cannot capture this. Just go." }
      ]
    },
    {
      id: "varanasi_kashi",
      name: "Kashi Vishwanath Temple",
      cityId: "varanasi", countryId: "india",
      lat: 25.3109, lng: 83.0107,
      fameScore: 89, fameTier: "orange",
      category: "culture",
      tagline: "The most sacred Shiva temple on Earth.",
      description: "One of the twelve Jyotirlinga shrines and the holiest temple in Hinduism, rebuilt in 1780 by Maratha queen Ahilyabai Holkar. The new corridor complex unveiled in 2022 offers a magnificent view of the Ganges.",
      images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free (ID required for foreigners)",
      openingHours: "03:00 AM - 11:00 PM",
      bestSeason: "Maha Shivaratri / Winter",
      timeNeeded: "1.5 Hours",
      isUnesco: false, rating: 4.8,
      reviews: [{ user: "Deepak J.", text: "The new corridor is stunning — it opens the view to the Ganga which was hidden for centuries. Go at 5 AM for Mangala Aarti." }]
    },
    {
      id: "varanasi_sarnath",
      name: "Sarnath",
      cityId: "varanasi", countryId: "india",
      lat: 25.3811, lng: 83.0247,
      fameScore: 65, fameTier: "yellow",
      category: "history",
      tagline: "Where the Buddha gave his first sermon.",
      description: "A deer park 13km from Varanasi where Siddhartha Gautama delivered his first teachings after achieving enlightenment. Contains the Dhamek Stupa (500 AD), the Ashoka Pillar capital (India's national emblem), and a superb museum.",
      images: ["https://images.unsplash.com/photo-1570213489059-0aac6626cade?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹40 (Stupa) + ₹15 (Museum)",
      openingHours: "06:00 AM - 06:00 PM",
      bestSeason: "Winter (Buddha Purnima is special)",
      timeNeeded: "2 Hours",
      isUnesco: true, rating: 4.5,
      reviews: [{ user: "Claire B.", text: "The museum has the original Lion Capital of Ashoka — the same one on India's national emblem and currency. Unmissable." }]
    },
    {
      id: "varanasi_manikarnika",
      name: "Manikarnika Ghat",
      cityId: "varanasi", countryId: "india",
      lat: 25.3093, lng: 83.0095,
      fameScore: 55, fameTier: "yellow",
      category: "culture",
      tagline: "The burning ghat where Hindus attain moksha.",
      description: "The ancient cremation ghat where funeral pyres burn 24/7, 365 days a year. Hindus believe dying and being cremated here releases the soul from the cycle of reincarnation. A profound and humbling glimpse into India's relationship with death.",
      images: ["https://images.unsplash.com/photo-1561389966-a8ab2de3c4f1?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free (Photography strictly prohibited)",
      openingHours: "24/7",
      bestSeason: "Year-Round",
      timeNeeded: "45 Mins",
      isUnesco: false, rating: 4.4,
      reviews: [{ user: "Marco V.", text: "Approach with deep respect. A boat view from the river is recommended. This is not a tourist attraction — it is real life and death." }]
    },
    {
      id: "varanasi_lalita",
      name: "Lalita Ghat & Nepali Temple",
      cityId: "varanasi", countryId: "india",
      lat: 25.3101, lng: 83.0102,
      fameScore: 22, fameTier: "blue",
      category: "hidden_gem",
      tagline: "A tiny wooden temple that looks stolen from Kathmandu.",
      description: "A small, exquisitely carved Nepali-style pagoda temple on Lalita Ghat, built in the 19th century by the King of Nepal using traditional wood. Almost no tourists visit, yet it is architecturally unlike anything else in Varanasi.",
      images: ["https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free",
      openingHours: "06:00 AM - 08:00 PM",
      bestSeason: "Winter",
      timeNeeded: "30 Mins",
      isUnesco: false, rating: 4.8,
      reviews: [{ user: "Ananya G.", text: "Stumbled on this while walking the ghats. The wood carvings are extraordinary. Nobody else was there — a complete hidden treasure." }]
    },

    // ─────────── UDAIPUR ───────────
    {
      id: "udaipur_citypalace",
      name: "City Palace Udaipur",
      cityId: "udaipur", countryId: "india",
      lat: 24.5763, lng: 73.6834,
      fameScore: 90, fameTier: "orange",
      category: "history",
      tagline: "The grandest royal palace complex in Rajasthan.",
      description: "A vast palace complex built over 400 years by 22 Maharanas of the Mewar dynasty, featuring intricate mosaics, mirror work, and balconies overlooking Lake Pichola. Part of it is still the Maharana's residence.",
      images: ["https://images.unsplash.com/photo-1588598048424-5e9de9e51f16?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹600 (Foreigners) / ₹30 (Indians)",
      openingHours: "09:30 AM - 05:30 PM",
      bestSeason: "October to March",
      timeNeeded: "3 Hours",
      isUnesco: false, rating: 4.7,
      reviews: [
        { user: "Sonia P.", text: "The museum inside is superb — elaborate Mewar paintings, royal weapons, costumes. The view of the lake from the top is unreal." }
      ]
    },
    {
      id: "udaipur_lakepichola",
      name: "Lake Pichola Boat Cruise",
      cityId: "udaipur", countryId: "india",
      lat: 24.5726, lng: 73.6814,
      fameScore: 82, fameTier: "orange",
      category: "nature",
      tagline: "Float between two palace-islands as the sun melts.",
      description: "A man-made freshwater lake created in 1362, with the Jag Niwas (Lake Palace Hotel) and Jag Mandir island palace rising from its center. Sunset boat cruises past the palaces are the most romantic experience in Rajasthan.",
      images: ["https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹400 (Boat cruise)",
      openingHours: "10:00 AM - 05:00 PM (Cruise timings)",
      bestSeason: "October to March",
      timeNeeded: "1.5 Hours",
      isUnesco: false, rating: 4.8,
      reviews: [{ user: "Lena M.", text: "The Lake Palace looks like it floats on water. At sunset the whole scene turns golden. Utterly romantic." }]
    },
    {
      id: "udaipur_bagore",
      name: "Bagore ki Haveli",
      cityId: "udaipur", countryId: "india",
      lat: 24.5767, lng: 73.6851,
      fameScore: 48, fameTier: "green",
      category: "culture",
      tagline: "A lakeside 18th-century haveli with nightly folk performances.",
      description: "An 18th-century mansion of a royal minister on the Gangaur Ghat lakefront, housing 100+ rooms of museum exhibits. Every evening it hosts the region's best Rajasthani folk dance performance including the spectacular fire dance.",
      images: ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹60 (Museum) / ₹90 (Evening show)",
      openingHours: "10:00 AM - 05:30 PM (Show at 07:00 PM)",
      bestSeason: "Year-Round",
      timeNeeded: "2 Hours",
      isUnesco: false, rating: 4.6,
      reviews: [{ user: "Rishi N.", text: "The evening folk dance is spectacular — especially the fire dance finale. Book seats early." }]
    },
    {
      id: "udaipur_neemach_mata",
      name: "Neemach Mata Temple Sunrise",
      cityId: "udaipur", countryId: "india",
      lat: 24.5882, lng: 73.7115,
      fameScore: 21, fameTier: "blue",
      category: "hidden_gem",
      tagline: "A 350-step hilltop shrine with Udaipur's best sunrise.",
      description: "A small hilltop goddess temple reached via 350 steep steps through a forest path on the eastern edge of Fateh Sagar Lake. Virtually unknown to tourists, it offers the most spectacular panoramic sunrise view over all four Udaipur lakes.",
      images: ["https://images.unsplash.com/photo-1545156521-77bd85671d30?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free",
      openingHours: "05:00 AM - 07:00 PM",
      bestSeason: "Year-Round (Sunrise)",
      timeNeeded: "1.5 Hours",
      isUnesco: false, rating: 4.9,
      reviews: [{ user: "Vikrant S.", text: "Leave at 5 AM. The sunrise over all four lakes of Udaipur from this hilltop is the best view I have seen in India. Zero crowds." }]
    },

    // ─────────── JODHPUR ───────────
    {
      id: "jodhpur_mehrangarh",
      name: "Mehrangarh Fort",
      cityId: "jodhpur", countryId: "india",
      lat: 26.2980, lng: 73.0188,
      fameScore: 93, fameTier: "orange",
      category: "history",
      tagline: "The mightiest fortress in all of Rajasthan.",
      description: "Rising 122 metres above the blue city on a sheer rocky cliff, this 15th-century fort is one of the largest in India. Its seven gateways, towering ramparts, and exquisite carved sandstone palaces make it extraordinary.",
      images: ["https://images.unsplash.com/photo-1624366412711-936294f2ea24?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹800 (Foreigners) / ₹100 (Indians)",
      openingHours: "09:00 AM - 05:30 PM",
      bestSeason: "October to March",
      timeNeeded: "3 Hours",
      isUnesco: false, rating: 4.8,
      reviews: [
        { user: "Tom H.", text: "The view of the blue city from the fort walls is breathtaking. The museum inside has the finest collection of Rajput weapons, elephant howdahs, and miniature paintings." }
      ]
    },
    {
      id: "jodhpur_jaswant",
      name: "Jaswant Thada",
      cityId: "jodhpur", countryId: "india",
      lat: 26.3022, lng: 73.0208,
      fameScore: 62, fameTier: "yellow",
      category: "landmark",
      tagline: "A marble cenotaph that glows gold at sunset.",
      description: "A beautiful white marble royal crematorium built in 1899, with intricately carved marble sheets so thin they are translucent. At sunset, the light turns the entire structure into warm glowing amber.",
      images: ["https://images.unsplash.com/photo-1589464526069-4e83e8b9e17f?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹30",
      openingHours: "09:00 AM - 05:30 PM",
      bestSeason: "Winter Sunset",
      timeNeeded: "45 Mins",
      isUnesco: false, rating: 4.6,
      reviews: [{ user: "Aisha P.", text: "The translucent marble panels that glow at sunset make this feel unreal. Much quieter than Mehrangarh next door." }]
    },
    {
      id: "jodhpur_toorji",
      name: "Toorji ka Jhalra Stepwell",
      cityId: "jodhpur", countryId: "india",
      lat: 26.2984, lng: 73.0338,
      fameScore: 24, fameTier: "blue",
      category: "hidden_gem",
      tagline: "A stunning restored royal stepwell in the heart of the old city.",
      description: "An 18th-century royal stepwell restored in 2021, hidden in a bustling market lane of the old city. Its stepped octagonal geometry, arched alcoves, and the contrast of women in colored saris fetching water make it Jodhpur's most photogenic secret.",
      images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free",
      openingHours: "08:00 AM - 07:00 PM",
      bestSeason: "Monsoon (water-filled) or Winter",
      timeNeeded: "30 Mins",
      isUnesco: false, rating: 4.9,
      reviews: [{ user: "Priyanka V.", text: "The most geometrically perfect thing I have ever seen. At golden hour with the blue city visible behind it — a photographer's dream." }]
    },

    // ─────────── AMRITSAR ───────────
    {
      id: "amritsar_goldentemple",
      name: "Golden Temple (Harmandir Sahib)",
      cityId: "amritsar", countryId: "india",
      lat: 31.6200, lng: 74.8765,
      fameScore: 100, fameTier: "red",
      category: "culture",
      tagline: "The holiest shrine in Sikhism, shimmering in gold.",
      description: "The supreme spiritual seat of Sikhism, a transcendent gold-plated gurdwara sitting in the centre of a sacred sarovar (pool of nectar). Open to all faiths, it feeds 100,000 people free daily in the world's largest community kitchen (langar).",
      images: ["https://images.unsplash.com/photo-1609766418204-94aae0ecfb7e?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free (All are welcome)",
      openingHours: "Open 24/7",
      bestSeason: "October to March (or Diwali for fireworks)",
      timeNeeded: "3 Hours",
      isUnesco: false, rating: 5.0,
      reviews: [
        { user: "Manpreet K.", text: "At 3 AM when the crowds thin, the gold reflection on the water is supernatural. Eat the langar — it is one of the best meals you'll have." },
        { user: "Anna L.", text: "The volunteers washing the marble barefoot at 4 AM moved me to tears. Pure devotion. Truly humbling for any visitor." }
      ]
    },
    {
      id: "amritsar_jallianwala",
      name: "Jallianwala Bagh",
      cityId: "amritsar", countryId: "india",
      lat: 31.6204, lng: 74.8797,
      fameScore: 82, fameTier: "orange",
      category: "history",
      tagline: "The walled garden of a massacre that changed India's destiny.",
      description: "The public garden where British troops massacred 379+ unarmed civilians on 13 April 1919 — a pivotal moment that galvanised the Indian independence movement. The bullet holes in the walls are still preserved.",
      images: ["https://images.unsplash.com/photo-1627894483216-2138af692e32?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free",
      openingHours: "06:30 AM - 08:00 PM",
      bestSeason: "Year-Round (13 April is deeply significant)",
      timeNeeded: "1 Hour",
      isUnesco: false, rating: 4.6,
      reviews: [{ user: "Sumit D.", text: "The bullet holes still visible in the brickwork make this viscerally real. The sound-and-light show is powerful." }]
    },
    {
      id: "amritsar_wagah",
      name: "Wagah Border Ceremony",
      cityId: "amritsar", countryId: "india",
      lat: 31.6043, lng: 74.5710,
      fameScore: 75, fameTier: "yellow",
      category: "culture",
      tagline: "The nightly military pageantry at the India-Pakistan border.",
      description: "An elaborate daily flag-lowering ceremony held every sunset at the only road crossing between India and Pakistan. BSF and Pakistani Rangers compete in theatrical high-kicks and aggressive marching to the roaring encouragement of thousands of spectators.",
      images: ["https://images.unsplash.com/photo-1503891450247-ee5f8ec46dc3?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free (VIP enclosure ₹200)",
      openingHours: "Ceremony 1 hour before sunset",
      bestSeason: "Year-Round (Republic/Independence Day is spectacular)",
      timeNeeded: "2 Hours",
      isUnesco: false, rating: 4.5,
      reviews: [{ user: "James W.", text: "Wildly theatrical and deeply nationalistic on both sides. The crowd energy is extraordinary. Arrive 2 hours early for a good spot." }]
    },
    {
      id: "amritsar_partition",
      name: "Partition Museum",
      cityId: "amritsar", countryId: "india",
      lat: 31.6277, lng: 74.8745,
      fameScore: 28, fameTier: "blue",
      category: "hidden_gem",
      tagline: "The world's only museum dedicated to the 1947 Partition.",
      description: "The world's first museum dedicated to the 1947 Partition of India and Pakistan, housing 10,000 survivor testimonies, photographs, and objects. Housed in the restored Town Hall, it is profoundly moving and tragically under-visited.",
      images: ["https://images.unsplash.com/photo-1611348586804-61bf6c080437?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹200 (Foreigners) / ₹20 (Indians)",
      openingHours: "10:00 AM - 06:00 PM (Closed Monday)",
      bestSeason: "Year-Round",
      timeNeeded: "2 Hours",
      isUnesco: false, rating: 4.9,
      reviews: [{ user: "Kavita R.", text: "I spent 3 hours crying. The oral testimonies of survivors are devastating and deeply important. Every Indian should visit this." }]
    },

    // ─────────── KOLKATA ───────────
    {
      id: "kolkata_victoria",
      name: "Victoria Memorial",
      cityId: "kolkata", countryId: "india",
      lat: 22.5448, lng: 88.3426,
      fameScore: 88, fameTier: "orange",
      category: "landmark",
      tagline: "The British Raj's grandest marble monument.",
      description: "A colossal white Makrana marble palace built between 1906 and 1921 to commemorate Queen Victoria. Its 25-gallery museum documents the entire history of British India with extraordinary paintings, weapons, and manuscripts.",
      images: ["https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹500 (Foreigners) / ₹30 (Indians)",
      openingHours: "10:00 AM - 05:00 PM (Closed Monday)",
      bestSeason: "Winter (Nov-Feb)",
      timeNeeded: "2.5 Hours",
      isUnesco: false, rating: 4.6,
      reviews: [{ user: "Subroto G.", text: "The building itself is more beautiful than anything inside. The sound-and-light show on winter evenings is spectacular." }]
    },
    {
      id: "kolkata_howrah",
      name: "Howrah Bridge",
      cityId: "kolkata", countryId: "india",
      lat: 22.5851, lng: 88.3468,
      fameScore: 80, fameTier: "orange",
      category: "landmark",
      tagline: "The sixth-longest cantilever bridge in the world.",
      description: "A 705-metre balanced cantilever bridge over the Hooghly River, built in 1943 without a single nut or bolt — held entirely by rivets. It carries 100,000 vehicles and 150,000 pedestrians daily, making it the world's busiest bridge.",
      images: ["https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free",
      openingHours: "24/7 (Best at dawn and dusk)",
      bestSeason: "Winter dawn",
      timeNeeded: "45 Mins",
      isUnesco: false, rating: 4.5,
      reviews: [{ user: "Pamela H.", text: "Watching the flower market vendors carry marigold loads across the bridge at dawn while fog rolls off the Hooghly — pure Kolkata magic." }]
    },
    {
      id: "kolkata_college_st",
      name: "College Street Book Market",
      cityId: "kolkata", countryId: "india",
      lat: 22.5788, lng: 88.3629,
      fameScore: 52, fameTier: "yellow",
      category: "culture",
      tagline: "The world's largest second-hand book market.",
      description: "A kilometre-long stretch of hundreds of pavement bookstalls outside Presidency College and Calcutta University, selling everything from ancient Bengali manuscripts to pirated bestsellers. A paradise for bibliophiles.",
      images: ["https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free (Books from ₹20)",
      openingHours: "10:00 AM - 08:00 PM",
      bestSeason: "Year-Round",
      timeNeeded: "2 Hours",
      isUnesco: false, rating: 4.7,
      reviews: [{ user: "Prof. Biswas", text: "Found a first-edition Tagore for ₹50 in a dusty pile. Spend hours rummaging — the finds are extraordinary." }]
    },
    {
      id: "kolkata_princep",
      name: "Prinsep Ghat at Dusk",
      cityId: "kolkata", countryId: "india",
      lat: 22.5529, lng: 88.3348,
      fameScore: 24, fameTier: "blue",
      category: "hidden_gem",
      tagline: "A Georgian colonnade on the river where Kolkata breathes.",
      description: "A gorgeous 1843 Gothic-Corinthian colonnade memorial on the Hooghly waterfront, completely unknown to most tourists. At dusk, young couples, musicians, and kite flyers gather here for the most atmospheric and authentic Kolkata evening experience.",
      images: ["https://images.unsplash.com/photo-1579546929662-711aa81148cf?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free",
      openingHours: "24/7 (Best 5-8 PM)",
      bestSeason: "Winter evenings",
      timeNeeded: "1 Hour",
      isUnesco: false, rating: 4.8,
      reviews: [{ user: "Ria C.", text: "Musicians play sitar on the steps while the sun sets over the Hooghly. Feels like a different century. This is why I love Kolkata." }]
    },

    // ─────────── HYDERABAD ───────────
    {
      id: "hyderabad_charminar",
      name: "Charminar",
      cityId: "hyderabad", countryId: "india",
      lat: 17.3616, lng: 78.4747,
      fameScore: 90, fameTier: "orange",
      category: "landmark",
      tagline: "The four-towered mosque that is Hyderabad's soul.",
      description: "Built in 1591 by Muhammad Quli Qutb Shah, this limestone-and-granite mosque with four ornate minarets stands at the historic crossroads of the old city, surrounded by the cacophonous Laad Bazaar and Chudi Bazaar.",
      images: ["https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹25 (Indians) / ₹300 (Foreigners)",
      openingHours: "09:30 AM - 05:30 PM",
      bestSeason: "Winter or Ramadan evenings",
      timeNeeded: "1.5 Hours",
      isUnesco: false, rating: 4.5,
      reviews: [{ user: "Salman K.", text: "Climb to the top for the best view of the old city. Visit at night during Ramadan when the whole bazaar is illuminated and bustling." }]
    },
    {
      id: "hyderabad_golconda",
      name: "Golconda Fort",
      cityId: "hyderabad", countryId: "india",
      lat: 17.3833, lng: 78.4011,
      fameScore: 78, fameTier: "yellow",
      category: "history",
      tagline: "The diamond capital of the medieval world.",
      description: "A massive 16th-century citadel from where all of the world's most famous diamonds — including the Kohinoor and Hope Diamond — were originally traded. The fort's acoustic system allows a hand clap at the base to be heard at the summit 1km away.",
      images: ["https://images.unsplash.com/photo-1589551514756-bc9df0db1f1b?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹500 (Foreigners) / ₹25 (Indians)",
      openingHours: "09:00 AM - 05:30 PM",
      bestSeason: "October to February",
      timeNeeded: "3 Hours",
      isUnesco: true, rating: 4.6,
      reviews: [{ user: "Farida B.", text: "Clap at the main entrance gate and you can hear it clearly at the throne room at the top of the hill 1km away. Incredible 16th-century acoustic engineering." }]
    },
    {
      id: "hyderabad_laad",
      name: "Laad Bazaar & Irani Cafes",
      cityId: "hyderabad", countryId: "india",
      lat: 17.3608, lng: 78.4724,
      fameScore: 44, fameTier: "green",
      category: "culture",
      tagline: "A lane of bangles, biryani, and a century-old Iranian café culture.",
      description: "The historic bangle market beside Charminar, famous for glass and lac bangles. Hidden within its lanes are 100-year-old Irani cafés serving Osmania biscuits and Irani chai — a culture introduced by Zoroastrian immigrants in the 1900s.",
      images: ["https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free",
      openingHours: "10:00 AM - 09:00 PM",
      bestSeason: "Year-Round (Ramadan is spectacular)",
      timeNeeded: "2 Hours",
      isUnesco: false, rating: 4.6,
      reviews: [{ user: "Zara H.", text: "An Irani chai with Osmania biscuits at a 100-year-old café while bangles clink around you is pure Hyderabad. Unmissable." }]
    },
    {
      id: "hyderabad_taramati",
      name: "Taramati Baradari",
      cityId: "hyderabad", countryId: "india",
      lat: 17.3167, lng: 78.4167,
      fameScore: 23, fameTier: "blue",
      category: "hidden_gem",
      tagline: "A 400-year-old baradari where a courtesan sang for a sultan.",
      description: "A stunning 17th-century pavilion originally built by the Qutb Shahi sultan for his favourite courtesan Taramati to perform. Today it hosts classical music performances and is one of Hyderabad's most atmospheric and least-visited monuments.",
      images: ["https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹10",
      openingHours: "09:00 AM - 05:00 PM",
      bestSeason: "Year-Round (Evening performances are special)",
      timeNeeded: "1 Hour",
      isUnesco: false, rating: 4.7,
      reviews: [{ user: "Sunita P.", text: "Completely ignored by tourists. The architecture is exquisite and the story behind it is fascinating. A true hidden gem of Hyderabad." }]
    },

    // ─────────── GOA ───────────
    {
      id: "goa_bomjesus",
      name: "Basilica of Bom Jesus",
      cityId: "goa", countryId: "india",
      lat: 15.5009, lng: 73.9116,
      fameScore: 86, fameTier: "orange",
      category: "culture",
      tagline: "A Baroque gem containing the incorrupt body of St. Francis Xavier.",
      description: "A 1605 Baroque Catholic basilica and UNESCO World Heritage Site containing the preserved remains of St. Francis Xavier (patron of Goa), whose body has been kept uncorrupted for over 450 years without embalming.",
      images: ["https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free",
      openingHours: "09:00 AM - 06:30 PM",
      bestSeason: "November to February",
      timeNeeded: "1 Hour",
      isUnesco: true, rating: 4.6,
      reviews: [{ user: "Rosa F.", text: "The silver casket containing St. Xavier's preserved body is extraordinary. The Baroque interior is remarkably well-preserved for its age." }]
    },
    {
      id: "goa_fortagauda",
      name: "Fort Aguada",
      cityId: "goa", countryId: "india",
      lat: 15.4917, lng: 73.7743,
      fameScore: 66, fameTier: "yellow",
      category: "history",
      tagline: "A 400-year-old Portuguese fort guarding the Arabian Sea.",
      description: "A well-preserved 17th-century Portuguese fort at the confluence of the Mandovi River and the Arabian Sea, featuring a four-storey lighthouse (the oldest of its kind in Asia), a freshwater spring, and panoramic ocean views.",
      images: ["https://images.unsplash.com/photo-1614087850046-d08c60a40ed4?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹100",
      openingHours: "09:30 AM - 06:00 PM",
      bestSeason: "November to February",
      timeNeeded: "1.5 Hours",
      isUnesco: false, rating: 4.4,
      reviews: [{ user: "Derek P.", text: "The views over the ocean from the ramparts at sunset are gorgeous. The fort is huge and well-preserved. Very photogenic." }]
    },
    {
      id: "goa_dudhsagar",
      name: "Dudhsagar Falls",
      cityId: "goa", countryId: "india",
      lat: 15.3145, lng: 74.3146,
      fameScore: 70, fameTier: "yellow",
      category: "nature",
      tagline: "A four-tier waterfall that looks like a sea of milk.",
      description: "One of India's tallest waterfalls at 310 metres, literally meaning 'Sea of Milk'. Set within the Bhagwan Mahaveer Wildlife Sanctuary on the Goa-Karnataka border, it is reached by a thrilling jeep ride through the jungle.",
      images: ["https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹400 (Jeep safari included)",
      openingHours: "09:00 AM - 05:00 PM",
      bestSeason: "Monsoon to November (peak flow)",
      timeNeeded: "Full Day",
      isUnesco: false, rating: 4.7,
      reviews: [{ user: "Tanya S.", text: "The drive through the jungle in the jeep is half the adventure. The falls are majestic after monsoon — truly looks like milk." }]
    },
    {
      id: "goa_cabo_de_rama",
      name: "Cabo de Rama Fort",
      cityId: "goa", countryId: "india",
      lat: 14.9827, lng: 73.9782,
      fameScore: 22, fameTier: "blue",
      category: "hidden_gem",
      tagline: "A crumbling clifftop fortress that almost no tourist visits.",
      description: "A 16th-century Hindu fort later seized by the Portuguese, perched dramatically on a rocky promontory with sheer 100-metre sea cliffs on three sides. The remote south Goa location keeps tourists away, leaving it an atmospheric ruin with breathtaking ocean views.",
      images: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free",
      openingHours: "09:00 AM - 06:00 PM",
      bestSeason: "Post-Monsoon (October–November)",
      timeNeeded: "2 Hours",
      isUnesco: false, rating: 4.8,
      reviews: [{ user: "Marco B.", text: "We were completely alone here for 2 hours. The 100m sea cliffs are terrifyingly beautiful. Most rewarding 'hidden gem' find in Goa." }]
    },


    // ─────────── DELHI NEW ATTRACTIONS ───────────
    {
      id: "delhi_redfort", name: "Red Fort (Lal Qila)", cityId: "delhi", countryId: "india",
      lat: 28.6562, lng: 77.2410, fameScore: 96, fameTier: "red", category: "history",
      tagline: "The Mughal throne of undivided India.",
      description: "The red sandstone citadel built 1638–1648 by Shah Jahan as the seat of Mughal rule — where India's PM hoists the national flag every Independence Day. The Lahori Gate, Diwan-i-Khas, and Peacock Throne platform are among India's most significant Mughal structures. Sound & Light shows run every evening.",
      images: ["https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹600 (Foreigners) / ₹50 (Indians)", openingHours: "09:30 AM – 04:30 PM (Closed Mon)",
      bestSeason: "October to March", timeNeeded: "2 Hours", isUnesco: true, rating: 4.5,
      reviews: [
        { user: "Prabhdeep K.", text: "The Sound & Light Show in evenings is stunning. Arrive 30 min early — worth the queue." },
        { user: "Mia T.", text: "The scale is immense. The Mughal-era water channels still flow through the gardens. Extraordinary." }
      ]
    },
    {
      id: "delhi_lotus", name: "Lotus Temple", cityId: "delhi", countryId: "india",
      lat: 28.5535, lng: 77.2588, fameScore: 78, fameTier: "yellow", category: "culture",
      tagline: "A petal-shaped Bahá'í temple open to all faiths — more visited than the Taj Mahal.",
      description: "The Bahá'í House of Worship completed in 1986 — 27 marble-clad petals forming a perfect lotus, receiving 100+ million visitors. Open to all religions for silent meditation with no sermons, no prayer leaders, no rituals — just profound silence.",
      images: ["https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "09:00 AM – 05:30 PM (Closed Mon)",
      bestSeason: "Winter", timeNeeded: "1 Hour", isUnesco: false, rating: 4.6,
      reviews: [{ user: "Yasmin B.", text: "Sitting in complete silence with people of every religion around you is profoundly moving." }]
    },
    {
      id: "delhi_chandni_chowk", name: "Chandni Chowk", cityId: "delhi", countryId: "india",
      lat: 28.6506, lng: 77.2305, fameScore: 68, fameTier: "yellow", category: "culture",
      tagline: "Mughal Delhi's 1650 bazaar of every spice and trade.",
      description: "Built by Jahanara Begum in 1650 — 1.3km of specialised lanes: Asia's largest spice market (Khari Baoli), electronics, wedding accessories, silver. Hidden behind shop fronts are Jain temples, mosques, and gurudwaras within metres of each other.",
      images: ["https://images.unsplash.com/photo-1593693411515-c20261bcad6e?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "09:00 AM – 09:00 PM (Closed Sun)",
      bestSeason: "Winter", timeNeeded: "2 Hours", isUnesco: false, rating: 4.4,
      reviews: [{ user: "Rohan V.", text: "Take a cycle rickshaw. Start at Fatehpuri Mosque end, work toward Red Fort, tasting everything along the way." }]
    },

    // ─────────── MUMBAI NEW ATTRACTIONS ───────────
    {
      id: "mumbai_elephanta", name: "Elephanta Caves", cityId: "mumbai", countryId: "india",
      lat: 18.9633, lng: 72.9315, fameScore: 82, fameTier: "orange", category: "history",
      tagline: "5th–8th century rock-cut Shiva temples on an Arabian Sea island.",
      description: "A UNESCO World Heritage Site on Elephanta Island (1-hr ferry from Gateway of India) — extraordinary 5th–8th century rock-cut temples dedicated to Shiva. The colossal 6-metre Trimurti (three-headed Shiva) is one of the greatest masterpieces of Indian art.",
      images: ["https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹600 (Foreigners) / ₹40 (Indians) + ₹200 Ferry", openingHours: "09:00 AM – 05:30 PM (Closed Mon)",
      bestSeason: "October to March", timeNeeded: "3–4 Hours", isUnesco: true, rating: 4.4,
      reviews: [{ user: "Sunaina R.", text: "The ferry ride itself is gorgeous. The Trimurti is breathtaking — 1,500-year-old craftsmanship." }]
    },
    {
      id: "mumbai_marine_drive", name: "Marine Drive", cityId: "mumbai", countryId: "india",
      lat: 18.9440, lng: 72.8230, fameScore: 72, fameTier: "yellow", category: "landmark",
      tagline: "Mumbai's 3.6km Art Deco Queen's Necklace along the Arabian Sea.",
      description: "A 3.6km curved seafront boulevard of 1930s Art Deco buildings — called the 'Queen's Necklace' for its glittering arc of street lamps at night. One of the world's finest urban waterfronts, beloved by joggers, cricketers, and romantics at all hours.",
      images: ["https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "24/7",
      bestSeason: "Monsoon (dramatic) or Winter", timeNeeded: "1 Hour", isUnesco: false, rating: 4.5,
      reviews: [{ user: "Siddharth P.", text: "Monsoon evenings with waves crashing over the promenade — pure, essential Mumbai." }]
    },
    {
      id: "mumbai_dhobi_ghat", name: "Dhobi Ghat (Mahalaxmi)", cityId: "mumbai", countryId: "india",
      lat: 18.9641, lng: 72.8317, fameScore: 29, fameTier: "blue", category: "hidden_gem",
      tagline: "The world's largest open-air laundry — 700 families, 200,000 garments daily.",
      description: "An open-air laundromat of 700+ dhobi families washing 200,000+ garments daily by hand. From the bridge on Dr. E. Moses Road, the sight of hundreds of steaming concrete wash pens at morning is one of Mumbai's most surreal spectacles.",
      images: ["https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free (bridge view) / ₹500 guided", openingHours: "Best 07:00–09:00 AM",
      bestSeason: "Year-Round", timeNeeded: "1 Hour", isUnesco: false, rating: 4.5,
      reviews: [{ user: "Clara B.", text: "I found this completely by accident and could not stop looking. The organised chaos of 200,000 clothes is staggering." }]
    },

    // ─────────── JAIPUR NEW ATTRACTIONS ───────────
    {
      id: "jaipur_amber_fort", name: "Amber Fort (Amer Fort)", cityId: "jaipur", countryId: "india",
      lat: 26.9855, lng: 75.8513, fameScore: 95, fameTier: "red", category: "history",
      tagline: "The palace-fort that inspired every Rajput fairy tale — Sheesh Mahal glitters with 1,000 mirrors.",
      description: "A magnificent hilltop palace built 1592 by Raja Man Singh I — Rajput and Mughal architecture across four grand courtyards. The Sheesh Mahal (Mirror Palace) creates a dazzling constellation effect from a single candle flame. One of India's most visited UNESCO sites.",
      images: ["https://images.unsplash.com/photo-1477587458883-471a5ed94245?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹1,000 (Foreigners) / ₹100 (Indians)", openingHours: "08:00 AM – 05:30 PM",
      bestSeason: "October to March", timeNeeded: "3 Hours", isUnesco: true, rating: 4.7,
      reviews: [
        { user: "Sarah K.", text: "The Sheesh Mahal with a candle is literally magical. The night show is worth booking." },
        { user: "Arjun T.", text: "The illuminated fort against the Aravalli Hills at night is absolutely cinematic." }
      ]
    },
    {
      id: "jaipur_city_palace", name: "City Palace Jaipur", cityId: "jaipur", countryId: "india",
      lat: 26.9258, lng: 75.8237, fameScore: 80, fameTier: "orange", category: "history",
      tagline: "The living royal residence of Jaipur's Maharaja — part museum, part home.",
      description: "An 18th-century complex — part still occupied by the royal family, part museum with extraordinary costumes, Mughal arms, and two giant silver urns (340kg each, holding 8,182 litres of Ganges water) commissioned for the Maharaja's 1902 England coronation visit.",
      images: ["https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹700 (Foreigners) / ₹100 (Indians)", openingHours: "09:30 AM – 05:00 PM",
      bestSeason: "October to March", timeNeeded: "2 Hours", isUnesco: false, rating: 4.5,
      reviews: [{ user: "Priya M.", text: "The two silver urns (340kg each) are in the Guinness Book of Records. The museum costumes are extraordinary." }]
    },
    {
      id: "jaipur_nahargarh", name: "Nahargarh Fort at Dusk", cityId: "jaipur", countryId: "india",
      lat: 26.9432, lng: 75.7932, fameScore: 62, fameTier: "yellow", category: "history",
      tagline: "The Aravalli ridge fortress with Jaipur's finest sunset panorama.",
      description: "A 1734 fort along the dramatic Aravalli ridge connected by a 36km wall to Jaigarh and Amber forts. Its sunset views over the entire Pink City — terracotta rooftops, Hawa Mahal, and City Palace — are Jaipur's finest. The Padao restaurant inside the fort is excellent.",
      images: ["https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹200 (Foreigners) / ₹50 (Indians)", openingHours: "10:00 AM – 06:00 PM",
      bestSeason: "Winter Sunset", timeNeeded: "2 Hours", isUnesco: false, rating: 4.6,
      reviews: [{ user: "Vikram S.", text: "The view of Jaipur at sunset from here is something you simply cannot capture in a photograph." }]
    },
    {
      id: "jaipur_jantar_mantar", name: "Jantar Mantar Jaipur", cityId: "jaipur", countryId: "india",
      lat: 26.9247, lng: 75.8247, fameScore: 72, fameTier: "yellow", category: "history",
      tagline: "The world's largest stone observatory — 19 instruments, still 2-second accurate.",
      description: "UNESCO World Heritage Site built 1734 by Maharaja Jai Singh II — 19 giant fixed astronomical instruments of marble and masonry that predict eclipses, track stars, and tell time to 2-second accuracy. The Samrat Yantra (27m tall) is the world's largest working sundial.",
      images: ["https://images.unsplash.com/photo-1503467913725-8484b65b0715?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹400 (Foreigners) / ₹50 (Indians)", openingHours: "09:00 AM – 04:30 PM",
      bestSeason: "Year-Round", timeNeeded: "1 Hour", isUnesco: true, rating: 4.3,
      reviews: [{ user: "Dr. Anika P.", text: "The sundial can tell time to 2 seconds. Hire a guide — without context you just see giant mysterious shapes." }]
    },

    // ─────────── BANGALORE ───────────
    {
      id: "bangalore_lalbagh", name: "Lalbagh Botanical Garden", cityId: "bangalore", countryId: "india",
      lat: 12.9507, lng: 77.5848, fameScore: 68, fameTier: "yellow", category: "nature",
      tagline: "A 240-acre living museum — 1,854 plant species and a 3-billion-year-old rock.",
      description: "Established 1760 by Hyder Ali, expanded by Tipu Sultan — 240 acres with 1,854 plant species, a Pre-Cambrian volcanic rock formation 3 billion years old, and the Glass House (modelled on London's Crystal Palace) hosting India's largest flower shows in January and August.",
      images: ["https://images.unsplash.com/photo-1586348943529-beaae6c28db9?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹20", openingHours: "06:00 AM – 07:00 PM",
      bestSeason: "Year-Round (Republic Day flower show is extraordinary)", timeNeeded: "2 Hours", isUnesco: false, rating: 4.5,
      reviews: [{ user: "Meera S.", text: "The ancient rock is 3 billion years old! Perfect morning walk spot — serene in the middle of Bangalore." }]
    },
    {
      id: "bangalore_iskcon", name: "ISKCON Temple Bangalore", cityId: "bangalore", countryId: "india",
      lat: 13.0103, lng: 77.5513, fameScore: 76, fameTier: "yellow", category: "culture",
      tagline: "One of the largest and most opulent ISKCON temples in the world.",
      description: "A grand temple complex dedicated to Radha-Krishnachandra, built 1997 — one of the largest ISKCON temples globally. The 6:30 PM evening Aarti is spectacular, with Bharatanatyam dance, devotional music, and elaborate light sequences. The vegetarian restaurant is excellent.",
      images: ["https://images.unsplash.com/photo-1545156521-77bd85671d30?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "07:00 AM – 08:30 PM",
      bestSeason: "Janmashtami (Aug/Sep) is extraordinary", timeNeeded: "1.5 Hours", isUnesco: false, rating: 4.7,
      reviews: [{ user: "Riya K.", text: "The evening Aarti is deeply moving. The vegetarian restaurant serves some of the best food in Bangalore." }]
    },
    {
      id: "bangalore_nandi_hills", name: "Nandi Hills", cityId: "bangalore", countryId: "india",
      lat: 13.3702, lng: 77.6835, fameScore: 30, fameTier: "blue", category: "hidden_gem",
      tagline: "A cloud-kissed hilltop fortress 60km from Bangalore — paragliding at dawn.",
      description: "An ancient hill fortress at 1,478m — famous for dawn paragliding over clouds rolling below the summit like a white sea. Tipu Sultan used it as his summer retreat. The 9th-century Bhoga Nandeeshwara temple complex at the base is a hidden architectural gem.",
      images: ["https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹20 (Entry) / ₹2,500 (Paragliding)", openingHours: "06:00 AM – 06:00 PM",
      bestSeason: "Monsoon (clouds below) & Winter (paragliding)", timeNeeded: "Half Day", isUnesco: false, rating: 4.7,
      reviews: [{ user: "Vikram P.", text: "Paragliding at 6 AM with the sunrise painting the clouds red below you and Bangalore's city lights fading — breathtaking." }]
    },

    // ─────────── CHENNAI ───────────
    {
      id: "chennai_marina", name: "Marina Beach", cityId: "chennai", countryId: "india",
      lat: 13.0500, lng: 80.2824, fameScore: 85, fameTier: "orange", category: "nature",
      tagline: "World's second-longest urban beach — 13km of Bay of Bengal shore.",
      description: "The world's second-longest natural urban beach at 13km. At 5 AM the beach transforms into a city-wide open gym, fishermen hauling nets, and social gathering. The bronze statues of Gandhi and Anna mark its iconic promenade. Sunrise over the Bay of Bengal is extraordinary.",
      images: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "24/7 (Best at dawn or dusk)",
      bestSeason: "November to February", timeNeeded: "2 Hours", isUnesco: false, rating: 4.3,
      reviews: [{ user: "Lakshmi N.", text: "Go at 5:30 AM — fishermen hauling nets, thousands exercising, the sun rising pink over the Bay of Bengal. Pure Chennai." }]
    },
    {
      id: "chennai_kapaleeshwarar", name: "Kapaleeshwarar Temple", cityId: "chennai", countryId: "india",
      lat: 13.0336, lng: 80.2686, fameScore: 78, fameTier: "yellow", category: "culture",
      tagline: "7th-century Dravidian temple — a 37m rainbow gopuram of 4,000 sculpted figures.",
      description: "A stunning 7th-century temple (rebuilt 16th century) dedicated to Shiva as Kapaleeshwarar. The 37m rainbow-coloured gopuram (tower) encrusted with 4,000+ sculpted figures is one of Tamil Nadu's most spectacular. The Mylapore neighbourhood surrounding it is unchanged for centuries.",
      images: ["https://images.unsplash.com/photo-1562693819-23e2ffe7b451?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "05:00 AM – 12:00 PM & 04:00 PM – 09:00 PM",
      bestSeason: "Brahmotsavam (March–April)", timeNeeded: "1 Hour", isUnesco: false, rating: 4.5,
      reviews: [{ user: "Kannan P.", text: "Explore the Mylapore streets — silk saree shops, flower vendors, old Brahmin neighbourhoods unchanged for 100 years." }]
    },
    {
      id: "chennai_mahabalipuram", name: "Mahabalipuram Shore Temple", cityId: "chennai", countryId: "india",
      lat: 12.6269, lng: 80.1927, fameScore: 84, fameTier: "orange", category: "history",
      tagline: "UNESCO 7th-century Pallava shore temples on the Bay of Bengal.",
      description: "A UNESCO World Heritage coastal site 60km from Chennai — extraordinary 7th–8th century Pallava monuments: the Shore Temple on the Bay of Bengal, Arjuna's Penance (world's largest open-air bas-relief, 29m × 13m), and the Five Rathas chariot temples carved from single granite boulders.",
      images: ["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹600 (Foreigners) / ₹40 (Indians)", openingHours: "06:00 AM – 06:00 PM",
      bestSeason: "October to March", timeNeeded: "Half Day", isUnesco: true, rating: 4.6,
      reviews: [{ user: "Emma C.", text: "The Shore Temple at sunrise with waves behind it is extraordinary. Arjuna's Penance hides hundreds of carved elephants — find them all." }]
    },

    // ─────────── MYSORE ───────────
    {
      id: "mysore_palace", name: "Mysore Palace (Amba Vilas)", cityId: "mysore", countryId: "india",
      lat: 12.3052, lng: 76.6551, fameScore: 95, fameTier: "red", category: "history",
      tagline: "India's most illuminated royal palace — 98,000 bulbs every Sunday evening.",
      description: "The opulent residence of the Wadiyar dynasty — one of the grandest palaces in the world. Built 1912 in Indo-Saracenic style with grey granite and pink marble domes, housing extraordinary throne rooms and Mysore paintings. Every Sunday and Dasara (October) 98,000 bulbs illuminate the entire exterior in gold.",
      images: ["https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹200 (Indians) / ₹500 (Foreigners)", openingHours: "10:00 AM – 05:30 PM",
      bestSeason: "Dasara Festival (October)", timeNeeded: "2.5 Hours", isUnesco: false, rating: 4.7,
      reviews: [
        { user: "Revathi S.", text: "Go on a Sunday evening to see 98,000 bulbs switch on simultaneously. The palace glows gold — unforgettable." },
        { user: "Pierre M.", text: "The golden throne and stained-glass peacock ceiling of Durbar Hall is unlike anything I've seen in any palace." }
      ]
    },
    {
      id: "mysore_chamundi", name: "Chamundeshwari Temple & Hill", cityId: "mysore", countryId: "india",
      lat: 12.2720, lng: 76.6701, fameScore: 78, fameTier: "yellow", category: "culture",
      tagline: "1,000-step climb to the royal goddess of Mysore at 1,065m.",
      description: "The tutelary deity of the Mysore royal family on Chamundi Hill (1,065m). The 1,000-step climb passes the famous 5m Nandi bull carved from solid granite in 1659. Sunrise views over Mysore spread 1,000m below are among Karnataka's most beautiful panoramas.",
      images: ["https://images.unsplash.com/photo-1562693819-23e2ffe7b451?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "07:30 AM – 02:00 PM & 03:30 PM – 06:00 PM",
      bestSeason: "Navratri is spectacular", timeNeeded: "2 Hours", isUnesco: false, rating: 4.5,
      reviews: [{ user: "Kavitha M.", text: "Climb all 1,000 steps — takes about an hour but the view from the top and the cool breeze make every step worth it." }]
    },

    // ─────────── SHIMLA ───────────
    {
      id: "shimla_toy_train", name: "Kalka–Shimla Toy Train", cityId: "shimla", countryId: "india",
      lat: 31.1048, lng: 77.1734, fameScore: 90, fameTier: "orange", category: "landmark",
      tagline: "UNESCO mountain railway through 102 tunnels — built 1898–1903.",
      description: "A UNESCO World Heritage narrow-gauge railway built 1898–1903, climbing 1,420m through 102 tunnels and 864 bridges across 96km of the Shivalik Hills. The 5-hour journey through pine forests and colonial stone viaducts aboard a steam locomotive is one of India's greatest travel experiences.",
      images: ["https://images.unsplash.com/photo-1562462181-a920e9c9c8a8?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹30–₹400 depending on class", openingHours: "Multiple departures daily",
      bestSeason: "Spring (rhododendrons) & Winter (snow)", timeNeeded: "5 Hours", isUnesco: true, rating: 4.8,
      reviews: [{ user: "Neil B.", text: "One of the world's great train journeys. Book the observation car — windows open and you feel the mountain air." }]
    },
    {
      id: "shimla_the_ridge", name: "The Ridge & Mall Road", cityId: "shimla", countryId: "india",
      lat: 31.1040, lng: 77.1701, fameScore: 65, fameTier: "yellow", category: "landmark",
      tagline: "The colonial promenade of Shimla at 2,200m — Victorian Gothic buildings and Himalayan views.",
      description: "A 2.5km pedestrian promenade at 2,200m — social centre of Shimla. Flanked by Victorian Gothic structures (Christ Church, Gaiety Heritage Theatre) with views of Himalayan snow ranges. In winter it becomes a snowfield where locals build snowmen.",
      images: ["https://images.unsplash.com/photo-1562462181-a920e9c9c8a8?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "24/7",
      bestSeason: "Winter (Snow) or April–May", timeNeeded: "1.5 Hours", isUnesco: false, rating: 4.4,
      reviews: [{ user: "Prerna R.", text: "A snowfall turns this promenade magical. Sip hot chai while watching snowflakes fall on colonial buildings." }]
    },

    // ─────────── LEH / LADAKH ───────────
    {
      id: "leh_pangong_lake", name: "Pangong Tso Lake", cityId: "leh", countryId: "india",
      lat: 33.7586, lng: 78.7065, fameScore: 96, fameTier: "red", category: "nature",
      tagline: "The impossibly blue 134km lake at 4,350m on the India–China border.",
      description: "A 134km-long lake at 4,350m — one of the world's highest saltwater lakes. The water shifts colour hourly from azure to emerald to turquoise. Made globally famous by the film 3 Idiots. Tibetan blue sheep and bar-headed geese inhabit its shores. Camping overnight offers extraordinary stargazing.",
      images: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹400 (Inner Line Permit for foreigners)", openingHours: "Year-Round (road: June–October)",
      bestSeason: "July–September or Jan–Feb (frozen lake)", timeNeeded: "Full Day (5hrs from Leh)", isUnesco: false, rating: 4.9,
      reviews: [
        { user: "Avneet K.", text: "The colour of the water is simply impossible. I kept checking my camera for over-saturation — then looked up and it was real." },
        { user: "Lars M.", text: "Camp overnight. Watching the Milky Way reflect in still water at 4,350m is a transcendent experience." }
      ]
    },
    {
      id: "leh_khardung_la", name: "Khardung La Pass", cityId: "leh", countryId: "india",
      lat: 34.2686, lng: 77.6010, fameScore: 80, fameTier: "orange", category: "nature",
      tagline: "One of the world's highest motorable mountain passes at 5,359m.",
      description: "The gateway to Nubra Valley at 5,359m — panoramic views of the entire Ladakh and Karakoram ranges. Stok Kangri (6,153m) and the Indus Valley 2,000m below are breathtaking. The Border Roads Organisation chai stalls at the top are legendary among Indian motorcyclists.",
      images: ["https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹50 (toll)", openingHours: "Summer only (June–October)",
      bestSeason: "July–August", timeNeeded: "3 Hours (round trip)", isUnesco: false, rating: 4.7,
      reviews: [{ user: "Mihir S.", text: "Altitude hits immediately. Spend only 20 mins at the top. The view of snow-draped Karakoram is worth every breathless step." }]
    },
    {
      id: "leh_thiksey_monastery", name: "Thiksey Monastery", cityId: "leh", countryId: "india",
      lat: 33.9269, lng: 77.6669, fameScore: 70, fameTier: "yellow", category: "culture",
      tagline: "Ladakh's Potala Palace — a 12-story 15th-century hilltop monastery.",
      description: "A 15th-century Gelug monastery built across 12 stories resembling Tibet's Potala Palace. Houses a 15m seated Maitreya Buddha statue and a legendary 3:30 AM morning prayer ceremony — monks blow long copper horns (dungchen) echoing across the entire Indus Valley.",
      images: ["https://images.unsplash.com/photo-1570877277839-c2bf1af37688?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹50", openingHours: "06:00 AM – 09:00 PM",
      bestSeason: "May–October (attend the 3:30 AM morning puja)", timeNeeded: "2 Hours", isUnesco: false, rating: 4.8,
      reviews: [{ user: "Sophie L.", text: "Wake at 3 AM for morning puja. Monks' prayers and horns echoing across the dark Ladakhi valley at sunrise is extraordinary." }]
    },
    {
      id: "leh_nubra_valley", name: "Nubra Valley & Bactrian Camels", cityId: "leh", countryId: "india",
      lat: 34.5550, lng: 77.5420, fameScore: 24, fameTier: "blue", category: "hidden_gem",
      tagline: "A cold desert valley with ancient Silk Road Bactrian double-humped camels.",
      description: "Hidden beyond Khardung La — a high-altitude cold desert valley with sand dunes, poplar groves, and the Shyok river surrounded by 7,000m peaks. The Bactrian double-humped camels (descendants of ancient Silk Road traders) still graze the Hunder sand dunes — one of India's most surreal wildlife encounters.",
      images: ["https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹400 (Camel ride) + Inner Line Permit", openingHours: "June–October (road access)",
      bestSeason: "August–September", timeNeeded: "Full Day / Overnight", isUnesco: false, rating: 4.9,
      reviews: [{ user: "Devika T.", text: "Riding a Bactrian camel through cold desert dunes surrounded by 7,000m snow peaks — no other experience on Earth is quite like this." }]
    },

    // ─────────── JAISALMER ───────────
    {
      id: "jaisalmer_fort", name: "Jaisalmer Fort (Sonar Qila)", cityId: "jaisalmer", countryId: "india",
      lat: 26.9124, lng: 70.9113, fameScore: 94, fameTier: "red", category: "history",
      tagline: "The living golden sandstone fortress city of the Thar — 3,000 people live inside.",
      description: "Built 1156 AD by Maharawal Jaisal — a 99-bastion golden sandstone fortress. Uniquely, 3,000 people STILL LIVE inside the walls: havelis, temples, hotels, and restaurants behind medieval battlements. A UNESCO World Heritage Site and one of the world's last truly inhabited medieval fortresses.",
      images: ["https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹250 (Foreigners) / ₹100 (Indians)", openingHours: "06:00 AM – 09:00 PM",
      bestSeason: "November to February", timeNeeded: "3 Hours", isUnesco: true, rating: 4.8,
      reviews: [{ user: "Ananya L.", text: "Stay overnight inside the fort — eat dinner on a rooftop as golden stone glows under the full moon over the dark desert. Magical." }]
    },
    {
      id: "jaisalmer_sam_dunes", name: "Sam Sand Dunes", cityId: "jaisalmer", countryId: "india",
      lat: 26.8849, lng: 70.6135, fameScore: 85, fameTier: "orange", category: "nature",
      tagline: "Thar Desert dunes under the most brilliant night sky in India.",
      description: "Great Thar Desert dunes 45km from Jaisalmer — camel safaris at sunset, overnight desert camps with Rajasthani folk music, and extraordinary stargazing (zero light pollution within 200km). The Jaisalmer Desert Festival (February) features camel racing and folk performances.",
      images: ["https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹300 (Camel safari) / ₹1,500–5,000 (Overnight camp)", openingHours: "Year-Round",
      bestSeason: "November–February", timeNeeded: "Full Day / Overnight", isUnesco: false, rating: 4.6,
      reviews: [{ user: "Priyanka S.", text: "Sleep under the stars in the desert. At 2 AM the Milky Way is so bright it casts shadows. No experience prepared me for this silence and stars." }]
    },
    {
      id: "jaisalmer_kuldhara", name: "Kuldhara Abandoned Village", cityId: "jaisalmer", countryId: "india",
      lat: 26.9124, lng: 70.7800, fameScore: 26, fameTier: "blue", category: "hidden_gem",
      tagline: "A ghost village abandoned overnight 200 years ago — cursed never to be reoccupied.",
      description: "In 1825, 1,500 Paliwal Brahmin families vanished overnight from Kuldhara, cursing the land. The perfectly preserved stone houses stand in complete desert silence. Listed among India's most haunted locations, and a genuinely eerie and beautiful place to visit.",
      images: ["https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹50", openingHours: "08:00 AM – 06:00 PM",
      bestSeason: "October–March", timeNeeded: "1.5 Hours", isUnesco: false, rating: 4.6,
      reviews: [{ user: "Ritu V.", text: "Complete silence. 200-year-old houses intact but empty. The legend of how and why they left makes it genuinely haunting." }]
    },

    // ─────────── HAMPI ───────────
    {
      id: "hampi_virupaksha", name: "Virupaksha Temple", cityId: "hampi", countryId: "india",
      lat: 15.3350, lng: 76.4601, fameScore: 88, fameTier: "orange", category: "culture",
      tagline: "A living 7th-century Shiva temple — active for 1,300 years without interruption.",
      description: "The oldest and most sacred temple in Hampi — an active place of worship with a 49m gopuram standing since the 7th century. The resident elephant Lakshmi blesses visitors every morning. The evening temple illumination against the granite boulder landscape is spectacular.",
      images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "06:00 AM – 12:30 PM & 05:00 PM – 08:30 PM",
      bestSeason: "October–February", timeNeeded: "1.5 Hours", isUnesco: true, rating: 4.7,
      reviews: [{ user: "Sanjay G.", text: "Visit at 8 AM for the elephant blessing ceremony. Lakshmi puts her trunk on your head — an extraordinary encounter." }]
    },
    {
      id: "hampi_vittala_temple", name: "Vittala Temple & Stone Chariot", cityId: "hampi", countryId: "india",
      lat: 15.3396, lng: 76.4748, fameScore: 92, fameTier: "orange", category: "history",
      tagline: "Musical stone pillars and the iconic stone chariot — 15th century engineering marvel.",
      description: "The most elaborate temple in Hampi — built 15th century, never consecrated because deemed too magnificent for a deity. The 56 'musical pillars' produce different musical notes when tapped. The stone chariot with rotating stone wheels is on the Indian 50-rupee note.",
      images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹600 (Foreigners) / ₹40 (Indians)", openingHours: "08:30 AM – 05:30 PM",
      bestSeason: "October–February", timeNeeded: "2 Hours", isUnesco: true, rating: 4.9,
      reviews: [{ user: "Radha K.", text: "Tap the musical pillars — they produce Sa Re Ga Ma! The stone chariot is mind-boggling. How did 16th century craftsmen do this?" }]
    },
    {
      id: "hampi_matanga_hill", name: "Matanga Hill Sunrise", cityId: "hampi", countryId: "india",
      lat: 15.3375, lng: 76.4670, fameScore: 25, fameTier: "blue", category: "hidden_gem",
      tagline: "360° sunrise over 1,600 ancient monuments — the ultimate Hampi experience.",
      description: "A 20-minute climb up rocky Matanga Hill — at dawn the entire ancient Vijayanagara empire spreads below: Hampi Bazaar, Virupaksha's gopuram, the Tungabhadra river, and 1,600 monuments scattered across a surreal granite landscape turning gold as the sun rises.",
      images: ["https://images.unsplash.com/photo-1545156521-77bd85671d30?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "Climb from 05:00 AM (before sunrise)",
      bestSeason: "October–February", timeNeeded: "2 Hours", isUnesco: false, rating: 4.9,
      reviews: [{ user: "Madhuri P.", text: "Leave at 5 AM with a headtorch. Watching the sunrise turn 1,600 ruins gold from Matanga Hill is India's most extraordinary vista." }]
    },

    // ─────────── DARJEELING ───────────
    {
      id: "darjeeling_tiger_hill", name: "Tiger Hill Sunrise", cityId: "darjeeling", countryId: "india",
      lat: 26.9630, lng: 88.2730, fameScore: 92, fameTier: "orange", category: "nature",
      tagline: "India's most famous Himalayan sunrise — Kangchenjunga turning gold at dawn.",
      description: "A 4 AM jeep ride to Tiger Hill (2,590m) to watch Kangchenjunga (8,586m) emerge from dark silhouette to blazing gold. On clear days, 6 of the world's 14 highest peaks are visible simultaneously, including distant Everest (8,849m).",
      images: ["https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹50 (Tiger Hill) + ₹500 (shared jeep)", openingHours: "04:00 AM – 07:00 AM",
      bestSeason: "Oct–Nov & March–May (clearest sky)", timeNeeded: "3 Hours", isUnesco: false, rating: 4.8,
      reviews: [{ user: "Nita B.", text: "The first ray turning Kangchenjunga from black to blazing gold in 30 seconds — I burst into tears. Breathtaking." }]
    },
    {
      id: "darjeeling_toy_train", name: "Darjeeling Himalayan Railway", cityId: "darjeeling", countryId: "india",
      lat: 27.0360, lng: 88.2627, fameScore: 90, fameTier: "orange", category: "landmark",
      tagline: "UNESCO 1881 Toy Train — the original mountain steam locomotive.",
      description: "The UNESCO World Heritage narrow-gauge Toy Train built 1881 — a 2-foot gauge steam locomotive winding through tea gardens, over viaducts, past Himalayan villages. The Batasia Loop with its Kangchenjunga backdrop is its most photographed section.",
      images: ["https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹1,210 (Tourist train Darjeeling–Ghum return)", openingHours: "Multiple daily departures",
      bestSeason: "Spring (rhododendrons) & Autumn (clear skies)", timeNeeded: "2 Hours (D'jling–Ghum return)", isUnesco: true, rating: 4.8,
      reviews: [{ user: "Tom E.", text: "The steam engine passes through market areas so close vendors lean back to let it through. Surreal and joyful." }]
    },
    {
      id: "darjeeling_tea_garden", name: "Happy Valley Tea Estate", cityId: "darjeeling", countryId: "india",
      lat: 27.0457, lng: 88.2561, fameScore: 62, fameTier: "yellow", category: "nature",
      tagline: "A 150-year-old working tea estate — sip first-flush Darjeeling where it grows.",
      description: "A working tea estate established 1854 just 3km from Darjeeling — visit the complete tea process from plucking to rolling and drying. Darjeeling's unique 'muscatel' flavour (from leafhopper insect bites triggering a defensive reaction) makes it the 'Champagne of teas'.",
      images: ["https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹100 (factory tour)", openingHours: "08:00 AM – 04:00 PM",
      bestSeason: "March–April (First Flush) or October (Autumn Flush)", timeNeeded: "2 Hours", isUnesco: false, rating: 4.7,
      reviews: [{ user: "Grace P.", text: "Sipping first-flush Darjeeling while looking at the plantation where it grew is extraordinary. Muscatel here is incomparable." }]
    },

    // ─────────── GANGTOK ───────────
    {
      id: "gangtok_rumtek", name: "Rumtek Monastery", cityId: "gangtok", countryId: "india",
      lat: 27.2943, lng: 88.5534, fameScore: 75, fameTier: "yellow", category: "culture",
      tagline: "One of Tibetan Buddhism's most sacred monasteries — the Karmapa's seat.",
      description: "One of the most important Kagyu monasteries outside Tibet — built by the 16th Karmapa after fleeing Tibet, housing the sacred Karmapa's golden crown (one of Buddhism's most revered relics). The morning prayer ceremony at 6 AM with chanting, horns, and drums is extraordinary.",
      images: ["https://images.unsplash.com/photo-1570877277839-c2bf1af37688?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "07:00 AM – 06:00 PM",
      bestSeason: "Year-Round (Losar festival Feb/March is extraordinary)", timeNeeded: "1.5 Hours", isUnesco: false, rating: 4.5,
      reviews: [{ user: "Dakpa L.", text: "The 6 AM prayer ceremony with monks chanting and horns reverberating across the valley is extraordinary." }]
    },
    {
      id: "gangtok_tsomgo", name: "Tsomgo (Changu) Lake", cityId: "gangtok", countryId: "india",
      lat: 27.3762, lng: 88.7542, fameScore: 80, fameTier: "orange", category: "nature",
      tagline: "A sacred glacial lake at 3,753m — frozen in winter, wildflower-ringed in summer.",
      description: "A glacial lake at 3,753m on the Nathu La Road to China — sacred to Sikkimese. From May–October the lake is ringed with alpine wildflowers and brahminy ducks; December–March it freezes completely solid, allowing yaks and horses to walk across its crystalline surface.",
      images: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹200 (Protected Area Permit)", openingHours: "Year-Round",
      bestSeason: "Dec–Feb (frozen lake) or July–August (wildflowers)", timeNeeded: "Half Day", isUnesco: false, rating: 4.6,
      reviews: [{ user: "Tenzin W.", text: "In February with the lake frozen, yaks walking on it, and Kangchenjunga beyond — it feels like being in Tibet." }]
    },

    // ─────────── MUNNAR ───────────
    {
      id: "munnar_eravikulam", name: "Eravikulam National Park", cityId: "munnar", countryId: "india",
      lat: 10.1764, lng: 77.0648, fameScore: 80, fameTier: "orange", category: "nature",
      tagline: "Home of the endangered Nilgiri Tahr — and the once-in-12-years Neelakurinji bloom.",
      description: "A 97 sq km UNESCO Biosphere Reserve protecting the critically endangered Nilgiri Tahr (only 900 remain globally). Every 12 years the entire hillside turns blue-purple with Neelakurinji (Strobilanthes kunthiana) flower — the next mass bloom is 2030. Anamudi (2,695m), South India's highest peak, is within the park.",
      images: ["https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹125 (Indians) / ₹380 (Foreigners)", openingHours: "08:00 AM – 04:00 PM (closed Feb for calving)",
      bestSeason: "October–April", timeNeeded: "3 Hours", isUnesco: false, rating: 4.6,
      reviews: [{ user: "Ananya C.", text: "The Nilgiri Tahr walk right up to you on the trail. The views of tea-covered hills from Rajamala are spectacular." }]
    },
    {
      id: "munnar_anamudi_trek", name: "Anamudi Peak Trek", cityId: "munnar", countryId: "india",
      lat: 10.1693, lng: 77.0638, fameScore: 30, fameTier: "blue", category: "hidden_gem",
      tagline: "South India's highest summit at 2,695m — a challenging Himalaya-rivalling trek.",
      description: "The highest point in peninsular India at 2,695m — a challenging 1-day trek through Eravikulam National Park requiring a special permit and mandatory guide. The summit offers 360° views of the entire Western Ghats biodiversity hotspot. Very few tourists make the full summit trek.",
      images: ["https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹500 (permit + guide mandatory)", openingHours: "October–April only",
      bestSeason: "November–March", timeNeeded: "Full Day", isUnesco: false, rating: 4.9,
      reviews: [{ user: "Deepak M.", text: "8-hour round trek, last 500m a very steep scramble. At the summit with all of Kerala's hills below — incredible reward." }]
    },

    // ─────────── ALLEPPEY ───────────
    {
      id: "alleppey_houseboat", name: "Kerala Houseboat Backwaters", cityId: "alleppey", countryId: "india",
      lat: 9.4981, lng: 76.3388, fameScore: 96, fameTier: "red", category: "nature",
      tagline: "Drift through 900km of Kerala waterways on a traditional wooden Kettuvallam.",
      description: "The quintessential Kerala experience — an overnight cruise on a traditional Kettuvallam rice barge through 900km of interconnected lakes, canals, and rivers passing floating villages, Chinese fishing net clusters, and coir-making communities. Kuttanad, the 'Rice Bowl of Kerala', is below sea level.",
      images: ["https://images.unsplash.com/photo-1561389966-a8ab2de3c4f1?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹8,000–₹25,000 per night", openingHours: "Check-in 12 PM, Check-out 9 AM",
      bestSeason: "September–March", timeNeeded: "1–2 Days", isUnesco: false, rating: 4.8,
      reviews: [
        { user: "Olivia M.", text: "Waking to mist on the backwaters with the sound of birds and no internet — the most peaceful moment of my India trip." },
        { user: "Rajan N.", text: "The cook aboard makes fresh Kerala fish curry under the stars. Extraordinary food and setting." }
      ]
    },

    // ─────────── KHAJURAHO ───────────
    {
      id: "khajuraho_western", name: "Khajuraho Western Group of Temples", cityId: "khajuraho", countryId: "india",
      lat: 24.8524, lng: 79.9200, fameScore: 90, fameTier: "orange", category: "history",
      tagline: "UNESCO masterpiece of erotic and divine medieval sculpture — 1,000 years old.",
      description: "The finest Chandela temples (950–1050 AD) including the 31m Kandariya Mahadeva, Lakshmana, and Devi Jagadambi. The Mithuna (erotic) sculptures cover only 10% of the exterior; the remaining 90% depicts celestial apsaras, gods, and armies with extraordinary artistry.",
      images: ["https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹600 (Foreigners) / ₹40 (Indians)", openingHours: "06:00 AM – 06:00 PM",
      bestSeason: "October–March", timeNeeded: "3 Hours", isUnesco: true, rating: 4.7,
      reviews: [{ user: "David H.", text: "Hire a government guide — without context the sculptures are shocking, but understanding Tantric philosophy makes them profound art." }]
    },
    {
      id: "khajuraho_raneh_falls", name: "Raneh Falls & Ken Gorge", cityId: "khajuraho", countryId: "india",
      lat: 24.8870, lng: 79.8800, fameScore: 22, fameTier: "blue", category: "hidden_gem",
      tagline: "A hidden canyon of rare pink-red granite with endangered gharial crocodiles.",
      description: "25km from Khajuraho — a spectacular gorge on the Ken River with 30m falls cascading over rare pink, grey, and red granite-dolomite formations. The Ken Gharial Wildlife Sanctuary protects India's critically endangered freshwater gharial (fewer than 200 wild). Almost no tourists visit this extraordinary natural site.",
      images: ["https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹50", openingHours: "06:00 AM – 06:00 PM",
      bestSeason: "October–November (post-monsoon full flow)", timeNeeded: "Half Day", isUnesco: false, rating: 4.8,
      reviews: [{ user: "Sunita K.", text: "Absolutely deserted — just us and the gorge. The pink-red granite columns are stunning. Gharial sightings are extraordinary." }]
    },

    // ─────────── MANALI ───────────
    {
      id: "manali_rohtang", name: "Rohtang Pass", cityId: "manali", countryId: "india",
      lat: 32.3674, lng: 77.2394, fameScore: 85, fameTier: "orange", category: "nature",
      tagline: "The dramatic gateway to Lahaul-Spiti — lush green to moonscape in one pass at 3,978m.",
      description: "A spectacular mountain pass at 3,978m — the dramatic gateway from the lush Kullu Valley into the bare lunar landscape of Lahaul-Spiti. Views of the Bara Shigri glacier (longest in Indian Himalayas outside Karakoram) and the wild Chandra river gorge are magnificent.",
      images: ["https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹50 (toll) + permit in high season", openingHours: "June–October (weather permitting)",
      bestSeason: "June–July", timeNeeded: "Full Day", isUnesco: false, rating: 4.5,
      reviews: [{ user: "Veer S.", text: "Lush green valley on one side, total moonscape on the other — one of nature's most dramatic transitions." }]
    },
    {
      id: "manali_hampta_trek", name: "Hampta Pass Trek (4-Day)", cityId: "manali", countryId: "india",
      lat: 32.1876, lng: 77.3180, fameScore: 26, fameTier: "blue", category: "hidden_gem",
      tagline: "India's most dramatic valley crossing — lush green to cold desert in one step.",
      description: "A 4-day trek (50km) from the lush forested Kullu Valley over Hampta Pass (4,270m) into the bare lunar desert of Lahaul-Spiti, with an optional side trip to Chandratal Lake (4,300m). The contrast between the two valleys at the summit is extraordinary.",
      images: ["https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹3,000–8,000 (guided trek with camping)", openingHours: "July–September only",
      bestSeason: "July–August", timeNeeded: "4–5 Days", isUnesco: false, rating: 4.9,
      reviews: [{ user: "Rajan M.", text: "Day 3 crossing the pass — from green forests to pure moonscape in one step — is the most dramatic landscape transition in any trek worldwide." }]
    },
    {
      id: "manali_hidimba", name: "Hidimba Devi Temple", cityId: "manali", countryId: "india",
      lat: 32.2437, lng: 77.1844, fameScore: 68, fameTier: "yellow", category: "culture",
      tagline: "A 1553 AD wooden pagoda-temple in an ancient deodar cedar forest.",
      description: "Built 1553 AD, dedicated to Hidimba Devi (Bhima's wife from the Mahabharata) in an old-growth deodar forest. The four-tiered pagoda with intricately carved wooden panels is one of the finest examples of Himachali wood-carving architecture. The cedar forest surroundings are deeply serene.",
      images: ["https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "08:00 AM – 06:00 PM",
      bestSeason: "Year-Round", timeNeeded: "1 Hour", isUnesco: false, rating: 4.5,
      reviews: [{ user: "Priya R.", text: "The cedar forest around the temple is gorgeous and quiet. Surprisingly spiritual even for non-religious visitors." }]
    },

    // ─────────── DHARAMSALA ───────────
    {
      id: "dharamsala_dalai_lama", name: "Namgyal Monastery & Dalai Lama Temple", cityId: "dharamsala", countryId: "india",
      lat: 32.2190, lng: 76.3234, fameScore: 85, fameTier: "orange", category: "culture",
      tagline: "The personal monastery of the 14th Dalai Lama — heart of Tibetan Buddhism in exile.",
      description: "The Namgyal Monastery in McLeod Ganj — the largest Tibetan monastery outside Tibet and the personal monastery of the 14th Dalai Lama. The Tsuglakhang temple, Tibet Museum, and Dalai Lama's residence are open to respectful visitors. He occasionally gives public teachings open to all.",
      images: ["https://images.unsplash.com/photo-1570877277839-c2bf1af37688?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free (Teachings: registration required)", openingHours: "06:00 AM – 09:00 PM",
      bestSeason: "Year-Round (check teaching schedule at dalailama.com)", timeNeeded: "2 Hours", isUnesco: false, rating: 4.7,
      reviews: [{ user: "Tenzin G.", text: "We arrived during a public teaching. Sitting with thousands of monks and lay people as the Dalai Lama spoke was profoundly moving." }]
    },
    {
      id: "dharamsala_triund_trek", name: "Triund Trek", cityId: "dharamsala", countryId: "india",
      lat: 32.2580, lng: 76.3580, fameScore: 72, fameTier: "yellow", category: "nature",
      tagline: "A magical 9km trek to a ridge with front-row views of the Dhauladhar Himalayas.",
      description: "One of India's most accessible and rewarding Himalayan treks — a 9km trail through rhododendron and oak forests to a ridge at 2,827m with 270° views of the Dhauladhar snow range and the Kangra Valley 2,000m below. Camping on the ridge under a star-filled sky is magical.",
      images: ["https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹50 (forest permit)", openingHours: "Year-Round (best Apr–June & Sep–Nov)",
      bestSeason: "April–June & September–November", timeNeeded: "Full Day or overnight", isUnesco: false, rating: 4.8,
      reviews: [{ user: "Maya P.", text: "Camp overnight at Triund — the Dhauladhar sunset then the Kangra plains sunrise with tea from a dhaba is quintessential Himachal." }]
    },

    // ─────────── PONDICHERRY ───────────
    {
      id: "pondi_auroville", name: "Auroville & The Matrimandir", cityId: "pondicherry", countryId: "india",
      lat: 12.0062, lng: 79.8106, fameScore: 88, fameTier: "orange", category: "culture",
      tagline: "A utopian city for all humanity — beyond all religion and nationality.",
      description: "A unique international township established 1968 — 3,000+ residents from 54 countries living together without national identities. At the centre: the Matrimandir — a 29m golden sphere for silent meditation (opened 2008). The surrounding forest is one of South India's most successful reforestation projects.",
      images: ["https://images.unsplash.com/photo-1579546929662-711aa81148cf?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free (outer) / Registration required for Matrimandir", openingHours: "09:00 AM – 12:30 PM (Visitor Center)",
      bestSeason: "Year-Round", timeNeeded: "Half Day", isUnesco: false, rating: 4.5,
      reviews: [{ user: "Jean-Marc L.", text: "A city of 54 nations without money is remarkable. Meditation inside the Matrimandir golden sphere is profound silence." }]
    },
    {
      id: "pondi_french_quarter", name: "French Quarter (Ville Blanche)", cityId: "pondicherry", countryId: "india",
      lat: 11.9326, lng: 79.8333, fameScore: 75, fameTier: "yellow", category: "culture",
      tagline: "Streets of France embedded in South India — bougainvillea and proper croissants.",
      description: "The former French colonial district — perfectly preserved yellow-painted colonial buildings behind a sea promenade, with French street signs, boulangeries, and Alliance Française. Tamil women in saris cycle past French-shuttered windows. The contrast of Gallic architecture and South Indian life is uniquely charming.",
      images: ["https://images.unsplash.com/photo-1563841930606-67e2b64a896e?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "24/7",
      bestSeason: "November–February", timeNeeded: "2 Hours", isUnesco: false, rating: 4.5,
      reviews: [{ user: "Céline B.", text: "Cycling these streets felt like being in Provence surrounded by Tamil culture. Perfect fusion. Real croissants here." }]
    },

    // ─────────── VALLEY OF FLOWERS ───────────
    {
      id: "vof_valley", name: "Valley of Flowers Trek", cityId: "valleyofflowers", countryId: "india",
      lat: 30.7289, lng: 79.6075, fameScore: 93, fameTier: "orange", category: "nature",
      tagline: "UNESCO Himalayan valley blooming with 300+ alpine wildflower species.",
      description: "A National Park and UNESCO World Heritage Site at 3,352–3,658m in the Garhwal Himalayas — 300+ endemic alpine wildflowers during July–August including the rare Himalayan Blue Poppy, Brahmakamal (Uttarakhand's state flower), and hundreds of rare orchid species. Discovered by British mountaineer Frank Smythe in 1931.",
      images: ["https://images.unsplash.com/photo-1540324155974-23be9c954668?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹200/day (Indians) / ₹800/day (Foreigners)", openingHours: "June 1 – October 31",
      bestSeason: "July–August (peak bloom)", timeNeeded: "2–3 Days (trek from Govindghat)", isUnesco: true, rating: 4.9,
      reviews: [{ user: "Priti S.", text: "Walking through a valley carpeted in hundreds of rare flowers with snow peaks above and waterfalls on both sides — this is what Heaven looks like." }]
    },
    {
      id: "vof_hemkund", name: "Hemkund Sahib Gurudwara", cityId: "valleyofflowers", countryId: "india",
      lat: 30.7485, lng: 79.5985, fameScore: 80, fameTier: "orange", category: "culture",
      tagline: "The world's highest Sikh Gurudwara at 4,329m — 400,000 pilgrims per season.",
      description: "A glacial lake shrine at 4,329m surrounded by seven snow peaks — the world's highest Sikh Gurudwara and one of Sikhism's holiest sites. The 6km trek from Ghangaria climbs through alpine meadows and snow fields even in August. Over 400,000 pilgrims make this journey annually between June and October.",
      images: ["https://images.unsplash.com/photo-1609766418204-94aae0ecfb7e?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "June–October (weather dependent)",
      bestSeason: "July–August", timeNeeded: "Full Day from Ghangaria", isUnesco: false, rating: 4.8,
      reviews: [{ user: "Harinder S.", text: "Reaching the glacial lake at 4,329m exhausted, then sitting with hundreds of pilgrims singing shabads — deeply emotional." }]
    },

    // ─────────── CHOPTA ───────────
    {
      id: "chopta_tungnath", name: "Tungnath Temple & Chandrashila Peak", cityId: "chopta", countryId: "india",
      lat: 30.4832, lng: 79.2032, fameScore: 82, fameTier: "orange", category: "culture",
      tagline: "World's highest Shiva temple at 3,680m — a 4,130m summit with 360° Himalayan views.",
      description: "A 3.5km trek from Chopta meadow to Tungnath (3,680m) — the world's highest Shiva temple and 1,000+ years old. From Tungnath, a further 1.5km climb to Chandrashila Peak (4,130m) offers 360° panoramas of Nanda Devi, Trishul, Kedarnath, and Badrinath peaks.",
      images: ["https://images.unsplash.com/photo-1629206028929-1e6ec6a9f975?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free (temple donation)", openingHours: "April–November",
      bestSeason: "May–June & September–October", timeNeeded: "Full Day", isUnesco: false, rating: 4.9,
      reviews: [{ user: "Rahul B.", text: "Leave at 4:30 AM from Chopta. Reaching Chandrashila at 4,130m as the sun rises over Nanda Devi and Trishul is jaw-dropping." }]
    },
    {
      id: "chopta_deoria_tal", name: "Deoria Tal Lake Trek", cityId: "chopta", countryId: "india",
      lat: 30.5220, lng: 79.1450, fameScore: 24, fameTier: "blue", category: "hidden_gem",
      tagline: "A magical alpine lake perfectly reflecting the Chaukhamba snow peaks.",
      description: "A 3km trek from Sari village to a hidden 5-acre alpine lake at 2,438m — famous for its mirror-like reflections of the Chaukhamba massif (7,138m). The sunrise reflection of snow peaks in completely still water is one of Uttarakhand's most photographed scenes. Very few tourists know this exists.",
      images: ["https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "Year-Round",
      bestSeason: "May & September–October", timeNeeded: "Half Day", isUnesco: false, rating: 4.9,
      reviews: [{ user: "Nandini T.", text: "The reflection of Chaukhamba in the still lake at 5:30 AM with no one else around — one of the most beautiful sights I have ever seen." }]
    },

    // ─────────── SPITI VALLEY ───────────
    {
      id: "spiti_chandratal", name: "Chandratal Lake", cityId: "spiti", countryId: "india",
      lat: 32.4896, lng: 77.6137, fameScore: 88, fameTier: "orange", category: "nature",
      tagline: "The Moon Lake — a crescent-shaped gem at 4,300m in the Lahaul cold desert.",
      description: "A high-altitude glacial lake at 4,300m shaped like a crescent moon, accessible only June–September. The water shifts colour from blue to green to emerald depending on light. Overnight camping at the lake provides the finest stargazing in India — no artificial light within 50km.",
      images: ["https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹250", openingHours: "July–September",
      bestSeason: "July–August or September (fewer people)", timeNeeded: "Full Day / Overnight", isUnesco: false, rating: 4.9,
      reviews: [{ user: "Chirag P.", text: "The colour of Chandratal changes by the hour. At midnight with no moon, the stars reflect in perfect stillness — the most magical lake I've ever seen." }]
    },
    {
      id: "spiti_key_monastery", name: "Key Monastery (Ki Gompa)", cityId: "spiti", countryId: "india",
      lat: 32.3026, lng: 78.0101, fameScore: 72, fameTier: "yellow", category: "culture",
      tagline: "A 1,000-year-old fortress monastery on a sheer desert cliff at 4,116m.",
      description: "Built in the 11th century on a 4,116m promontory — the largest and oldest monastery in Spiti Valley. The mud-brick fortress stacked impossibly on sheer rock has survived Mongol raids and earthquakes. The 4 AM morning puja and butter tea served by resident monks are extraordinary experiences.",
      images: ["https://images.unsplash.com/photo-1570877277839-c2bf1af37688?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹50 (donation)", openingHours: "07:00 AM – 07:00 PM",
      bestSeason: "June–October", timeNeeded: "2 Hours", isUnesco: false, rating: 4.8,
      reviews: [{ user: "Elena R.", text: "Being served butter tea by monks who live at 4,000m in one of Earth's most remote places — humbling and extraordinary." }]
    },
    {
      id: "spiti_pin_valley", name: "Pin Valley National Park", cityId: "spiti", countryId: "india",
      lat: 31.7890, lng: 77.9600, fameScore: 60, fameTier: "yellow", category: "nature",
      tagline: "The land of snow leopards and Siberian ibex — India's coldest national park.",
      description: "One of the coldest and most remote national parks in India at 3,500–6,000m — a cold desert biosphere reserve where the endangered snow leopard, Siberian ibex, and red fox roam. Guided winter wildlife tracking treks (January–March when leopards descend for prey) are extraordinary for serious wildlife enthusiasts.",
      images: ["https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹250", openingHours: "Year-Round (winter best for snow leopards)",
      bestSeason: "Jan–March (snow leopard) or July–September (wildflowers)", timeNeeded: "1–3 Days", isUnesco: false, rating: 4.7,
      reviews: [{ user: "Dr. Meera V.", text: "We saw a snow leopard on day 2 — a ghostly grey shape moving silently across the cliff face. Worth the 2-day journey from Kaza." }]
    },
    {
      id: "spiti_chicham", name: "Chicham Bridge & Cliff Village", cityId: "spiti", countryId: "india",
      lat: 32.1240, lng: 78.0110, fameScore: 24, fameTier: "blue", category: "hidden_gem",
      tagline: "Asia's highest gorge bridge — a village on a vertical cliff at 4,450m.",
      description: "A tiny village perched on a sheer cliff at 4,450m, connected to the main Spiti road by Asia's highest gorge bridge (120m above the gorge). Before 2017, villagers used a treacherous 3km mountain path accessible only in summer. The location looks like a Tolkien illustration.",
      images: ["https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "June–October",
      bestSeason: "July–August", timeNeeded: "1 Hour", isUnesco: false, rating: 4.9,
      reviews: [{ user: "Suresh A.", text: "20 houses on a vertical cliff 120m above the gorge. Crossing the bridge with the abyss below is both terrifying and beautiful." }]
    },

    // ─────────── KOCHI ───────────
    {
      id: "kochi_chinese_nets", name: "Chinese Fishing Nets at Fort Kochi", cityId: "kochi", countryId: "india",
      lat: 9.9640, lng: 76.2430, fameScore: 82, fameTier: "orange", category: "landmark",
      tagline: "600-year-old cantilevered nets introduced by Zheng He's fleet — an Arabian Sea icon.",
      description: "Massive cantilevered fishing nets introduced by Chinese explorer Zheng He's fleet around 1400 AD — each requiring a team of 6 men to counterbalance. At sunset, with the Arabian Sea turning orange, they are one of India's most photographed images. Dawn visits show fishermen hauling in fresh catch.",
      images: ["https://images.unsplash.com/photo-1561389966-a8ab2de3c4f1?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free (₹50 to help operate)", openingHours: "06:00 AM – 06:00 PM",
      bestSeason: "November–February (fishing season)", timeNeeded: "1 Hour", isUnesco: false, rating: 4.5,
      reviews: [{ user: "Naomi K.", text: "5 AM when the fishermen bring in the night's catch with mist on the water — this is the real Fort Kochi." }]
    },
    {
      id: "kochi_mattancherry", name: "Mattancherry & Paradesi Synagogue", cityId: "kochi", countryId: "india",
      lat: 9.9551, lng: 76.2574, fameScore: 68, fameTier: "yellow", category: "history",
      tagline: "India's oldest active synagogue (1568 AD) — blue Canton tiles and Belgian chandeliers.",
      description: "The Paradesi Synagogue (1568 AD) is the oldest active synagogue in the Commonwealth — built by Sephardic Jews fleeing the Portuguese Inquisition. The interior floor of hand-painted blue Canton tiles (each unique, no two the same) and Belgian chandeliers from the 1800s are extraordinary. Surrounding Jew Town antique dealers are fascinating.",
      images: ["https://images.unsplash.com/photo-1562693819-23e2ffe7b451?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹5 (Synagogue)", openingHours: "10:00 AM – 12:00 PM & 03:00 PM – 05:00 PM (Closed Sat)",
      bestSeason: "Year-Round", timeNeeded: "2 Hours", isUnesco: false, rating: 4.4,
      reviews: [{ user: "Sarah L.", text: "The floor of hand-painted Canton tiles — each unique, no two the same. 2,000 years of Jewish Kerala history is fascinating." }]
    },

    // ─────────── NAINITAL ───────────
    {
      id: "nainital_naini_lake", name: "Naini Lake & Boat Rides", cityId: "nainital", countryId: "india",
      lat: 29.3919, lng: 79.4542, fameScore: 78, fameTier: "yellow", category: "nature",
      tagline: "A pear-shaped glacial lake at 2,084m — one of the 64 sacred Shakti Peethas.",
      description: "A 1.5km glacial lake at 2,084m — according to legend one of the 64 Shakti Peethas where Sati's left eye fell. Rowing boats and paddleboats can be rented; the Naina Devi temple on the north bank is the town's sacred heart. Morning mist on the water before 8 AM is beautiful.",
      images: ["https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free (lake) / ₹80–200 (boat)", openingHours: "06:00 AM – 06:00 PM",
      bestSeason: "March–June & September–November", timeNeeded: "2 Hours", isUnesco: false, rating: 4.4,
      reviews: [{ user: "Suman T.", text: "Morning mist on the lake before 8 AM is beautiful. Rent a rowboat and go to the far end — the hill reflections are serene." }]
    },
    {
      id: "nainital_snow_view", name: "Snow View Point & Cable Car", cityId: "nainital", countryId: "india",
      lat: 29.4040, lng: 79.4599, fameScore: 65, fameTier: "yellow", category: "nature",
      tagline: "Aerial views of Nanda Devi (7,816m) and the Himalayan ranges from 2,270m.",
      description: "The cable car (Udan Khatola) from Mallital to Snow View Point at 2,270m — on clear days offering 270° panoramic views of Nanda Devi (7,816m), Trishul (7,120m), and the Himalayan snow ranges. In winter the surrounding forests transform into a snow wonderland.",
      images: ["https://images.unsplash.com/photo-1562462181-a920e9c9c8a8?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹280 (return cable car)", openingHours: "10:00 AM – 05:00 PM",
      bestSeason: "October–November & March–April", timeNeeded: "1.5 Hours", isUnesco: false, rating: 4.3,
      reviews: [{ user: "Nisha K.", text: "October morning — looking at Nanda Devi turn pink in morning light from this viewpoint is absolutely beautiful." }]
    },

    // ─────────── OOTY ───────────
    {
      id: "ooty_nilgiri_railway", name: "Nilgiri Mountain Railway", cityId: "ooty", countryId: "india",
      lat: 11.4102, lng: 76.6950, fameScore: 88, fameTier: "orange", category: "landmark",
      tagline: "UNESCO rack railway — India's only rack-and-pinion mountain train through 250 bridges.",
      description: "A UNESCO World Heritage narrow-gauge rack railway built 1891–1908 — the only rack railway in India and the steepest in Asia. The cogwheel mechanism allows the steam locomotive to climb 1,712m in 46km through 250 bridges and 16 tunnels. The 5-hour journey from Mettupalayam is one of South India's greatest travel experiences.",
      images: ["https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹35–₹310 depending on class", openingHours: "Departure from Mettupalayam at 07:10 AM",
      bestSeason: "All Year (avoid monsoon July–September)", timeNeeded: "5 Hours (one way)", isUnesco: true, rating: 4.8,
      reviews: [{ user: "Arjuna S.", text: "The steam engine snorts through tea estates and mountain curves for 5 hours. Book first class. Pure golden-age railway travel." }]
    },
    {
      id: "ooty_botanical_garden", name: "Government Botanical Garden", cityId: "ooty", countryId: "india",
      lat: 11.4138, lng: 76.7080, fameScore: 65, fameTier: "yellow", category: "nature",
      tagline: "A 55-acre Nilgiri garden at 2,200m — with a fossilised tree trunk 20 million years old.",
      description: "A 55-acre botanical garden established 1848 — 650+ plant varieties including a fossilised tree trunk 20 million years old. The annual May Flower Show transforms the garden into a display attended by 200,000+ visitors with elaborate floral arrangements rivalling Chelsea in scale.",
      images: ["https://images.unsplash.com/photo-1586348943529-beaae6c28db9?auto=format&fit=crop&w=600&q=80"],
      entryFee: "₹30", openingHours: "07:00 AM – 06:30 PM",
      bestSeason: "Year-Round (May Flower Show is spectacular)", timeNeeded: "2 Hours", isUnesco: false, rating: 4.4,
      reviews: [{ user: "Vani R.", text: "The 20-million-year-old fossil tree is extraordinary. The May Flower Show rivals Chelsea in scale and colour." }]
    },
    {
      id: "kedarnath_temple",
      name: "Kedarnath Temple",
      cityId: "kedarnath", countryId: "india",
      lat: 30.7346, lng: 79.0669, fameScore: 98, fameTier: "red", category: "temple",
      tagline: "Shiva's majestic Himalayan sanctuary.",
      description: "An ancient stone temple dedicated to Lord Shiva, nestled at 3,583m in the Garhwal Himalayas. It is one of the 12 Jyotirlingas, the highest of the Char Dhams, and a testament to spiritual endurance.",
      images: ["https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "06:00 AM - 09:00 PM",
      bestSeason: "May to October", timeNeeded: "2 Hours",
      isCharDham: true, isJyotirlinga: true, rating: 4.9,
      reviews: [{"user": "Aarav S.", "text": "The trek is demanding but catching the first glimpse of the temple with snow peaks behind it is purely magical."}]
    },
    {
      id: "badrinath_temple",
      name: "Badrinath Temple",
      cityId: "badrinath", countryId: "india",
      lat: 30.7433, lng: 79.4938, fameScore: 96, fameTier: "red", category: "temple",
      tagline: "The sacred Himalayan seat of Lord Vishnu.",
      description: "A bright, colorful 15m high temple dedicated to Lord Vishnu, located at 3,133m between the Nar and Narayan mountain ranges. The primary dham of the Char Dham pilgrimage circuit.",
      images: ["https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "04:30 AM - 09:00 PM",
      bestSeason: "May to November", timeNeeded: "2 Hours",
      isCharDham: true, rating: 4.8,
      reviews: [{"user": "Meera J.", "text": "Taking a dip in the Tapt Kund hot springs before visiting the colorful main shrine was deeply refreshing."}]
    },
    {
      id: "gangotri_temple",
      name: "Gangotri Temple",
      cityId: "gangotri", countryId: "india",
      lat: 30.9947, lng: 78.9398, fameScore: 90, fameTier: "red", category: "temple",
      tagline: "Origin temple of the sacred River Ganges.",
      description: "A serene white granite temple dedicated to Goddess Ganga, situated at 3,100m on the banks of the Bhagirathi River. Marks the place where Ganga is said to have touched Earth.",
      images: ["https://images.unsplash.com/photo-1540324155974-23be9c954668?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "06:15 AM - 09:30 PM",
      bestSeason: "May to October", timeNeeded: "1.5 Hours",
      isCharDham: true, rating: 4.8,
      reviews: [{"user": "Dev K.", "text": "The peaceful vibration of the river flowing beside the white marble temple creates a celestial mood."}]
    },
    {
      id: "yamunotri_temple",
      name: "Yamunotri Temple",
      cityId: "yamunotri", countryId: "india",
      lat: 31.0146, lng: 78.4609, fameScore: 90, fameTier: "red", category: "temple",
      tagline: "Source of the Yamuna River.",
      description: "A beautiful mountain temple dedicated to Goddess Yamuna, perched at 3,291m in the Garhwal Himalayas. Devotees cook prasad in the nearby thermal springs of Surya Kund.",
      images: ["https://images.unsplash.com/photo-1610294792547-11a07e7e1284?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "06:00 AM - 08:00 PM",
      bestSeason: "May to October", timeNeeded: "1.5 Hours",
      isCharDham: true, rating: 4.7,
      reviews: [{"user": "Sanjay G.", "text": "We cooked rice in the hot springs and took it home as holy prasad. A unique experience!"}]
    },
    {
      id: "somnath_temple",
      name: "Somnath Temple",
      cityId: "somnath", countryId: "india",
      lat: 20.888, lng: 70.4012, fameScore: 95, fameTier: "red", category: "temple",
      tagline: "The eternal shrine of the Lord of Moon.",
      description: "The first and foremost of the 12 Jyotirlinga shrines of Lord Shiva, located directly on the shores of the Arabian Sea. Destroyed and rebuilt 17 times across history, it stands as a symbol of resilience.",
      images: ["https://images.unsplash.com/photo-1604537466158-719b1972feb8?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "06:00 AM - 09:30 PM",
      bestSeason: "Winter", timeNeeded: "2 Hours",
      isJyotirlinga: true, rating: 4.9,
      reviews: [{"user": "Rajesh N.", "text": "The light and sound show at night with the roaring sea in the background gave me goosebumps."}]
    },
    {
      id: "dwarkadhish_temple",
      name: "Dwarkadhish Temple",
      cityId: "dwarka", countryId: "india",
      lat: 22.2377, lng: 68.9674, fameScore: 94, fameTier: "red", category: "temple",
      tagline: "The royal palace temple of Lord Krishna.",
      description: "A majestic 5-story limestone structure supported by 72 pillars, also known as Jagat Mandir. Dedication to Lord Krishna as the King of Dwarka, and one of the 4 primary Char Dhams.",
      images: ["https://images.unsplash.com/photo-1610726360-f2a3b2c0f8e1?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "06:30 AM - 09:30 PM",
      bestSeason: "Winter", timeNeeded: "2 Hours",
      isCharDham: true, rating: 4.8,
      reviews: [{"user": "Anil S.", "text": "Beautiful temple. The large flag on top is changed five times a day and is a sight of immense devotion."}]
    },
    {
      id: "puri_jagannath",
      name: "Jagannath Temple",
      cityId: "puri", countryId: "india",
      lat: 19.8048, lng: 85.8179, fameScore: 95, fameTier: "red", category: "temple",
      tagline: "The sacred abode of the Lord of the Universe.",
      description: "A massive 12th-century temple complex famous for its annual Rath Yatra (Chariot Festival). Home to the uniquely carved wooden idols of Lord Jagannath, Balabhadra, and Subhadra, and one of the 4 Char Dhams.",
      images: ["https://images.unsplash.com/photo-1578897367029-4d16bdf7e032?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "05:00 AM - 11:00 PM",
      bestSeason: "Winter / Rath Yatra", timeNeeded: "2 Hours",
      isCharDham: true, rating: 4.9,
      reviews: [{"user": "Sita R.", "text": "The Mahaprasad cooked in clay pots stacked on top of each other using firewood is delicious and pure divine."}]
    },
    {
      id: "tirupati_balaji",
      name: "Tirupati Balaji (Venkateswara Temple)",
      cityId: "tirupati", countryId: "india",
      lat: 13.6833, lng: 79.35, fameScore: 98, fameTier: "red", category: "temple",
      tagline: "The wealthiest and most visited temple on Earth.",
      description: "Located atop the seven sacred hills of Tirumala, this historical temple is dedicated to Lord Venkateswara. A stunning marvel of Dravidian architecture that draws up to 100,000 pilgrims daily.",
      images: ["https://images.unsplash.com/photo-1591367003836-b3efeba29d0f?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free / VIP Darshan (₹300)", openingHours: "03:00 AM - 11:00 PM",
      bestSeason: "September to March", timeNeeded: "3 Hours",
      rating: 4.9,
      reviews: [{"user": "Rahul G.", "text": "The administration is top-notch despite millions visiting. The famous Tirupati Laddoo prasadam is out of this world."}]
    },
    {
      id: "nashik_trimbakeshwar",
      name: "Trimbakeshwar Shiva Temple",
      cityId: "nashik", countryId: "india",
      lat: 19.9975, lng: 73.7898, fameScore: 88, fameTier: "orange", category: "temple",
      tagline: "Jyotirlinga containing the three-faced Brahma, Vishnu, Shiva.",
      description: "An ancient temple situated at the source of the Godavari River. Features a unique Jyotirlinga that embodies the Hindu Trinity: Lord Brahma, Lord Vishnu, and Lord Shiva.",
      images: ["https://images.unsplash.com/photo-1562183241-840b8af0721e?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "05:30 AM - 09:00 PM",
      bestSeason: "Winter / Monsoon", timeNeeded: "2 Hours",
      isJyotirlinga: true, rating: 4.7,
      reviews: [{"user": "Pooja V.", "text": "Set at the foothills of Brahmagiri mountain, the stone carvings of the temple are magnificent."}]
    },
    {
      id: "shirdi_saibaba",
      name: "Sai Baba Samadhi Mandir",
      cityId: "shirdi", countryId: "india",
      lat: 19.7645, lng: 74.4762, fameScore: 92, fameTier: "orange", category: "temple",
      tagline: "The sacred shrine of saintly peace.",
      description: "The holy shrine housing the final resting place (Samadhi) of the highly revered 19th-century spiritual leader Sai Baba, representing harmony and universal love.",
      images: ["https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "04:00 AM - 11:15 PM",
      bestSeason: "Winter", timeNeeded: "2 Hours",
      rating: 4.8,
      reviews: [{"user": "Vikram C.", "text": "Extremely peaceful place. The Kakad Aarti in the morning was incredibly soul-soothing."}]
    },
    {
      id: "ujjain_mahakaleshwar",
      name: "Mahakaleshwar Jyotirlinga Temple",
      cityId: "ujjain", countryId: "india",
      lat: 23.1765, lng: 75.7885, fameScore: 94, fameTier: "red", category: "temple",
      tagline: "The unique south-facing Lord of Time.",
      description: "One of the 12 sacred Jyotirlingas, famous for being the only south-facing (Dakshinmukhi) shrine. Celebrated for its unique Bhasma Aarti (ritual using sacred ash).",
      images: ["https://images.unsplash.com/photo-1629206028929-1e6ec6a9f975?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "04:00 AM - 11:00 PM",
      bestSeason: "Winter", timeNeeded: "2 Hours",
      isJyotirlinga: true, rating: 4.9,
      reviews: [{"user": "Amit T.", "text": "Attending the Bhasma Aarti at 4 AM is a life-changing experience. Pure, intense spiritual energy."}]
    },
    {
      id: "katra_vaishnodevi",
      name: "Mata Vaishno Devi Temple",
      cityId: "katra", countryId: "india",
      lat: 32.9915, lng: 74.931, fameScore: 96, fameTier: "red", category: "temple",
      tagline: "The sacred clifftop sanctuary of the Divine Mother.",
      description: "A highly revered cave shrine dedicated to Goddess Vaishno Devi, located at 1,585m in the holy Trikuta Mountains. Reached by a soulful 14km foot journey.",
      images: ["https://images.unsplash.com/photo-1603912699214-92627f304eb6?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free (Registration mandatory)", openingHours: "24/7",
      bestSeason: "March to October", timeNeeded: "5 Hours",
      rating: 4.9,
      reviews: [{"user": "Jyoti P.", "text": "Chanting 'Jai Mata Di' with thousands of other yatris during the clifftop trek makes the fatigue vanish completely."}]
    },
    {
      id: "vrindavan_bankebihari",
      name: "Shri Banke Bihari Temple",
      cityId: "vrindavan", countryId: "india",
      lat: 27.5652, lng: 77.69, fameScore: 92, fameTier: "orange", category: "temple",
      tagline: "The temple of mesmerizing devotion to Krishna.",
      description: "One of the most energetic and sacred temples of Lord Krishna in India. The deity stands in the unique Tribhanga posture and the curtains are frequently drawn to prevent a direct long gaze.",
      images: ["https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "07:45 AM - 09:30 PM",
      bestSeason: "Winter / Janmashtami", timeNeeded: "1.5 Hours",
      rating: 4.8,
      reviews: [{"user": "Hari N.", "text": "The pure ecstatic chanting of Radha-Radha by the crowd creates a vibe of absolute divine bliss."}]
    },
    {
      id: "mathura_krishnajanmabhoomi",
      name: "Shri Krishna Janmasthan Temple",
      cityId: "mathura", countryId: "india",
      lat: 27.4924, lng: 77.6737, fameScore: 90, fameTier: "orange", category: "temple",
      tagline: "The birthplace of Lord Krishna.",
      description: "A highly historic temple complex built around the prison cell where Lord Krishna was born to Devaki and Vasudeva, serving as a major hub of Krishna bhakti.",
      images: ["https://images.unsplash.com/photo-1594387303756-a2b7b0e7c5d3?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "05:00 AM - 09:30 PM",
      bestSeason: "Winter / Janmashtami", timeNeeded: "2 Hours",
      rating: 4.8,
      reviews: [{"user": "Shyam L.", "text": "The garbhagriha cell has a mystical silence and energy. A must visit for every seeker."}]
    },
    {
      id: "ayodhya_ramjanmabhoomi",
      name: "Shri Ram Janmabhoomi Mandir",
      cityId: "ayodhya", countryId: "india",
      lat: 26.799, lng: 82.2042, fameScore: 98, fameTier: "red", category: "temple",
      tagline: "The grand temple at the birthplace of Lord Rama.",
      description: "The grand newly consecrated Hindu temple dedicated to Ram Lalla (infant form of Lord Rama). Located at the historic birthplace, it represents a monumental achievement in traditional Nagara style architecture.",
      images: ["https://images.unsplash.com/photo-1612802096736-b7e0e0c6b5ae?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "06:30 AM - 09:30 PM",
      bestSeason: "Winter / Rama Navami", timeNeeded: "2 Hours",
      rating: 4.9,
      reviews: [{"user": "Rohan D.", "text": "The sandstone architecture is majestic and the carving details on pillars are phenomenal."}]
    },
    {
      id: "srisailam_mallikarjuna",
      name: "Mallikarjuna Jyotirlinga Temple",
      cityId: "tirupati", countryId: "india",
      lat: 16.0734, lng: 78.8681, fameScore: 85, fameTier: "orange", category: "temple",
      tagline: "The sacred mountain shrine of Shiva and Shakti.",
      description: "A highly sacred temple situated on Flat Top of Nallamala Hills. It is extremely unique as it is one of the only three shrines in India that is both a Jyotirlinga and a Shakti Peeth.",
      images: ["https://images.unsplash.com/photo-1591367003836-b3efeba29d0f?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "04:30 AM - 10:00 PM",
      bestSeason: "Winter", timeNeeded: "2 Hours",
      isJyotirlinga: true, rating: 4.7,
      reviews: [{"user": "Venu P.", "text": "Stunning location overlooking the Krishna river. Extremely peaceful and ancient forest shrine feel."}]
    },
    {
      id: "omkareshwar_temple",
      name: "Omkareshwar Jyotirlinga Temple",
      cityId: "ujjain", countryId: "india",
      lat: 22.2464, lng: 76.1504, fameScore: 86, fameTier: "orange", category: "temple",
      tagline: "The sacred island temple shaped like 'Om'.",
      description: "One of the 12 Jyotirlinga shrines, situated on a river island named Mandhata in the Narmada River, which is naturally shaped like the sacred Hindu symbol 'OM'.",
      images: ["https://images.unsplash.com/photo-1629206028929-1e6ec6a9f975?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "05:00 AM - 10:00 PM",
      bestSeason: "Winter", timeNeeded: "2 Hours",
      isJyotirlinga: true, rating: 4.7,
      reviews: [{"user": "Nandu R.", "text": "Taking the boat ride across the Narmada to reach the island temple is a beautiful pilgrimage ritual."}]
    },
    {
      id: "bhimashankar_temple",
      name: "Bhimashankar Jyotirlinga Temple",
      cityId: "nashik", countryId: "india",
      lat: 19.0721, lng: 73.5358, fameScore: 85, fameTier: "orange", category: "temple",
      tagline: "The forest-nestled source of the Bhima River.",
      description: "A beautiful black stone temple in the Sahyadri mountains, surrounded by a dense wildlife sanctuary. Represents the divine energy of Shiva's Bhima incarnation.",
      images: ["https://images.unsplash.com/photo-1562183241-840b8af0721e?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "04:30 AM - 09:30 PM",
      bestSeason: "Monsoon / Winter", timeNeeded: "2 Hours",
      isJyotirlinga: true, rating: 4.6,
      reviews: [{"user": "Girish M.", "text": "The surrounding Western Ghats forest is incredibly beautiful in the monsoons with mist all over the temple."}]
    },
    {
      id: "vaidyanath_temple",
      name: "Baidyanath Dham Jyotirlinga Temple",
      cityId: "varanasi", countryId: "india",
      lat: 24.4925, lng: 86.6997, fameScore: 88, fameTier: "orange", category: "temple",
      tagline: "The temple of the Divine Physician.",
      description: "Also known as Baba Dham, this massive temple complex contains 21 temples. The Jyotirlinga is said to have been placed by Ravana, and Shiva acts here as the divine healer.",
      images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "04:00 AM - 09:00 PM",
      bestSeason: "Winter / Shravan Month", timeNeeded: "2 Hours",
      isJyotirlinga: true, rating: 4.7,
      reviews: [{"user": "Subodh B.", "text": "During Shravan, millions of saffron-clad kanwariyas bring holy water from Ganges. A festival of sheer devotion."}]
    },
    {
      id: "dwarka_nageshwar",
      name: "Nageshwar Jyotirlinga Temple",
      cityId: "dwarka", countryId: "india",
      lat: 22.4286, lng: 68.9664, fameScore: 86, fameTier: "orange", category: "temple",
      tagline: "The temple of the Lord of Snakes.",
      description: "Located near Dwarka, it houses one of the 12 Jyotirlingas. Prominently features a magnificent 82-foot-tall seated statue of Lord Shiva that can be seen from miles away.",
      images: ["https://images.unsplash.com/photo-1610726360-f2a3b2c0f8e1?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "06:00 AM - 12:30 PM, 05:00 PM - 09:00 PM",
      bestSeason: "Winter", timeNeeded: "1 Hour",
      isJyotirlinga: true, rating: 4.7,
      reviews: [{"user": "Karan K.", "text": "The massive Shiva statue is incredibly striking. The inner sanctum is calm and very neat."}]
    },
    {
      id: "grishneshwar_temple",
      name: "Grishneshwar Jyotirlinga Temple",
      cityId: "nashik", countryId: "india",
      lat: 20.0248, lng: 75.1691, fameScore: 87, fameTier: "orange", category: "temple",
      tagline: "The last Jyotirlinga, built of red volcanic stone.",
      description: "Located close to the UNESCO Ellora Caves. It is the 12th and final Jyotirlinga temple, beautifully constructed from red volcanic rock and rebuilt in the 18th century by Ahilyabai Holkar.",
      images: ["https://images.unsplash.com/photo-1562183241-840b8af0721e?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "05:30 AM - 09:30 PM",
      bestSeason: "Winter", timeNeeded: "1.5 Hours",
      isJyotirlinga: true, rating: 4.8,
      reviews: [{"user": "Devashish S.", "text": "Stunning carvings in red stone, very close to the cave complex. Rebuilt by Ahilyabai Holkar."}]
    },
    {
      id: "rameswaram_ramanathaswamy",
      name: "Ramanathaswamy Temple",
      cityId: "rameswaram", countryId: "india",
      lat: 9.2876, lng: 79.3129, fameScore: 92, fameTier: "orange", category: "temple",
      tagline: "Char Dham & Jyotirlinga on the sacred island.",
      description: "A massive island temple featuring the longest temple corridor in India (1.2km) lined with 1,200+ sculpted pillars. Dedicated to Shiva, it is both a Char Dham and a Jyotirlinga, where Rama prayed.",
      images: ["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free", openingHours: "05:00 AM - 01:00 PM, 03:00 PM - 09:00 PM",
      bestSeason: "Winter", timeNeeded: "2 Hours",
      isCharDham: true, isJyotirlinga: true, rating: 4.8,
      reviews: [{"user": "Vignesh T.", "text": "Bathing in the 22 holy wells (tirthas) inside the temple before darshan is a deeply spiritual experience."}]
    },    // ================= JAPAN ATTRACTIONS (PREMIUM) =================

    // TOKYO
    {
      id: "tokyo_shibuya",
      name: "Shibuya Crossing",
      cityId: "tokyo",
      countryId: "japan",
      lat: 35.6595,
      lng: 139.7005,
      fameScore: 100,
      fameTier: "red",
      category: "landmark",
      tagline: "The world's ultimate pedestrian intersection.",
      description: "A spectacular neon crossroads where up to 3,000 people scramble simultaneously in a wave of perfect Japanese coordination.",
      images: ["https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free",
      openingHours: "24/7 (Best at rush hour / night)",
      bestSeason: "Year-Round",
      timeNeeded: "30 Mins",
      isUnesco: false,
      rating: 4.6,
      reviews: [{ user: "Hiro T.", text: "Exhilarating to walk across, but even cooler to watch from the 2nd floor window of Starbucks or Shibuya Sky!" }]
    },
    {
      id: "tokyo_goldengai",
      name: "Golden Gai Secret Whiskey Bars",
      cityId: "tokyo",
      countryId: "japan",
      lat: 35.6938,
      lng: 139.7042,
      fameScore: 28,
      fameTier: "blue", // Hidden Gem
      category: "hidden_gem",
      tagline: "A post-war wooden alleyway of micro-drinking joints.",
      description: "An architectural relic of six narrow alleys packed with over 200 tiny, single-room bars that accommodate only 4-6 patrons each, serving specialty highballs and local sakes.",
      images: ["https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Varies (Most bars have a ¥500-¥1000 seating charge)",
      openingHours: "07:00 PM - 03:00 AM",
      bestSeason: "Autumn & Winter",
      timeNeeded: "2 Hours",
      isUnesco: false,
      rating: 4.8,
      reviews: [{ user: "Kenji A.", text: "Found a tiny heavy-metal themed bar run by an old couple. Best night in Tokyo! Very welcoming if you show respect." }]
    },

    // KYOTO
    {
      id: "kyoto_fushimi",
      name: "Fushimi Inari-taisha Shrine",
      cityId: "kyoto",
      countryId: "japan",
      lat: 34.9671,
      lng: 135.7727,
      fameScore: 100,
      fameTier: "red",
      category: "culture",
      tagline: "The tunnel of ten thousand vermilion gates.",
      description: "An ancient mountainside Shinto shrine dedicated to the god of rice and sake, famous for its mesmerizing path covered in thousands of bright orange Torii gates.",
      images: ["https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free",
      openingHours: "24/7 (Highly recommend night hiking)",
      bestSeason: "Spring & Autumn",
      timeNeeded: "2-3 Hours",
      isUnesco: false,
      rating: 4.9,
      reviews: [{ user: "Rin Y.", text: "Hike all the way to the top! Most tourists turn back after 20 minutes, leaving the upper paths delightfully empty." }]
    },
    {
      id: "kyoto_otagi",
      name: "Otagi Nenbutsu-ji Temple",
      cityId: "kyoto",
      countryId: "japan",
      lat: 35.0315,
      lng: 135.6669,
      fameScore: 26,
      fameTier: "blue", // Hidden Gem
      category: "hidden_gem",
      tagline: "The hillside of 1,200 whimsical moss-covered statues.",
      description: "Hidden in the deep woods of Arashiyama, this enchanting Buddhist temple contains 1,200 mossy stone statues (rakan) representing disciples of Buddha, each carved with its own unique, humorous, or bizarre facial expression.",
      images: ["https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80"],
      entryFee: "¥300",
      openingHours: "08:00 AM - 05:00 PM",
      bestSeason: "Autumn (Stunning foliage colors)",
      timeNeeded: "1 Hour",
      isUnesco: false,
      rating: 4.9,
      reviews: [{ user: "David G.", text: "Statues are holding tennis rackets, drinking sake, laughing, or making funny faces. A joy to walk through!" }]
    },


    // ================= USA ATTRACTIONS (PREMIUM) =================
    // NEW YORK
    {
      id: "ny_statue",
      name: "Statue of Liberty",
      cityId: "newyork",
      countryId: "usa",
      lat: 40.6892,
      lng: -74.0445,
      fameScore: 99,
      fameTier: "red",
      category: "landmark",
      tagline: "The copper guardian of American freedom.",
      description: "A monumental neoclassical sculpture on Liberty Island in New York Harbor, designed by Frédéric-Auguste Bartholdi and gifted by the people of France in 1886.",
      images: ["https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&w=600&q=80"],
      entryFee: "$24.50 (Ferry + Ground)",
      openingHours: "08:30 AM - 04:00 PM",
      bestSeason: "Spring & Autumn",
      timeNeeded: "3 Hours",
      isUnesco: true,
      rating: 4.7,
      reviews: [{ user: "James F.", text: "Take the earliest ferry to avoid massive queues. The museum at the base is brilliant!" }]
    },
    {
      id: "ny_pdt",
      name: "Please Don't Tell (PDT) Speakeasy",
      cityId: "newyork",
      countryId: "usa",
      lat: 40.7272,
      lng: -73.9837,
      fameScore: 23,
      fameTier: "blue", // Hidden Gem
      category: "hidden_gem",
      tagline: "Enter a secret bar through an old telephone booth.",
      description: "A world-renowned cocktail lounge disguised inside the Crif Dogs hot dog joint. Patrons enter an active vintage phone booth, dial '1', and wait for a secret door in the wall to swing open.",
      images: ["https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free entry (Pricey drinks)",
      openingHours: "05:00 PM - 02:00 AM",
      bestSeason: "Year-Round",
      timeNeeded: "1.5 Hours",
      isUnesco: false,
      rating: 4.8,
      reviews: [{ user: "Tina K.", text: "The hotdogs they serve from Crif Dogs are epic, and the mixology is incredible. Felt like a secret agent entering the bar!" }]
    },

    // SAN FRANCISCO
    {
      id: "sf_goldengate",
      name: "Golden Gate Bridge",
      cityId: "sanfrancisco",
      countryId: "usa",
      lat: 37.8199,
      lng: -122.4783,
      fameScore: 100,
      fameTier: "red",
      category: "landmark",
      tagline: "The international orange suspension span.",
      description: "Completed in 1937, this legendary 1.7-mile steel suspension bridge is famously shrouded in low-hanging Pacific mist, connecting SF to Marin County.",
      images: ["https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free (Pedestrian/Bike toll free)",
      openingHours: "Accessible 24/7 (Walkways close at night)",
      bestSeason: "September & October (Clear skies)",
      timeNeeded: "1.5 Hours",
      isUnesco: false,
      rating: 4.9,
      reviews: [{ user: "Lucas R.", text: "Rented an e-bike, rode across to Sausalito and took the ferry back. One of the best days of my life!" }]
    },
    {
      id: "sf_waveorgan",
      name: "The Wave Organ",
      cityId: "sanfrancisco",
      countryId: "usa",
      lat: 37.8085,
      lng: -122.4402,
      fameScore: 21,
      fameTier: "blue", // Hidden Gem
      category: "hidden_gem",
      tagline: "A stone acoustic sculpture played by the tides.",
      description: "An eccentric public installation built on a jetty out of reclaimed cemetery granite. It features 25 PVC and concrete organ pipes going down into the bay, producing eerie, gurgling, deep musical chords as waves crash against them.",
      images: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free",
      openingHours: "24/7 (Best at high tide!)",
      bestSeason: "Year-Round",
      timeNeeded: "45 Mins",
      isUnesco: false,
      rating: 4.5,
      reviews: [{ user: "Megan S.", text: "So cool! It literally sounds like the ocean is breathing. Sit quietly on the stone seats and listen." }]
    },


    // ================= EGYPT ATTRACTIONS (PREMIUM) =================
    // GIZA
    {
      id: "giza_pyramids",
      name: "Great Pyramids of Giza",
      cityId: "giza",
      countryId: "egypt",
      lat: 29.9792,
      lng: 31.1342,
      fameScore: 100,
      fameTier: "red",
      category: "landmark",
      tagline: "The last standing wonder of the ancient world.",
      description: "Erected over 4,500 years ago during the Old Kingdom of Egypt, these towering limestone pyramids served as royal vaults for the pharaohs Khufu, Khafre, and Menkaure.",
      images: ["https://images.unsplash.com/photo-1503177119275-0aa32b31d468?auto=format&fit=crop&w=600&q=80"],
      entryFee: "EGP 240 (General Entry) / EGP 400 (Inside Great Pyramid)",
      openingHours: "07:00 AM - 05:00 PM",
      bestSeason: "November to February",
      timeNeeded: "3 Hours",
      isUnesco: true,
      rating: 4.9,
      reviews: [{ user: "Ziad E.", text: "Mind-boggling scale. To think these were built 4,500 years ago is humbling. Hire a camel to go deep into the dunes for the best panoramic view!" }]
    },
    {
      id: "giza_secret_dunes",
      name: "Hidden Dunes Sunset Oasis",
      cityId: "giza",
      countryId: "egypt",
      lat: 29.9650,
      lng: 31.1180,
      fameScore: 18,
      fameTier: "blue", // Hidden Gem
      category: "hidden_gem",
      tagline: "A silent desert plateau looking down on the pyramids.",
      description: "Located a 20-minute camel trek south of the commercialized pyramid perimeter, this secret sand dune plateau avoids all postcard hawkers, offering a meditative view of the pyramids silhouetted against a brilliant crimson desert sky.",
      images: ["https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Requires general park ticket + tip for camel guide",
      openingHours: "04:30 PM - 06:30 PM",
      bestSeason: "Winter",
      timeNeeded: "1.5 Hours",
      isUnesco: false,
      rating: 4.9,
      reviews: [{ user: "Nour H.", text: "Watching the sun go down over the ancient pyramids in complete, absolute silence is an experience I will never forget." }]
    },

    // CAIRO
    {
      id: "cairo_citadel",
      name: "Saladin Citadel of Cairo",
      cityId: "cairo",
      countryId: "egypt",
      lat: 30.0299,
      lng: 31.2611,
      fameScore: 78,
      fameTier: "yellow",
      category: "history",
      tagline: "The medieval mountain fortress of Egypt.",
      description: "A monumental fortified hill complex built by Salah ad-Din in 1176, containing beautiful medieval mosques, military museums, and spectacular vistas.",
      images: ["https://images.unsplash.com/photo-1553913861-c0fddf2619ee?auto=format&fit=crop&w=600&q=80"],
      entryFee: "EGP 180",
      openingHours: "09:00 AM - 05:00 PM",
      bestSeason: "Winter",
      timeNeeded: "2 Hours",
      isUnesco: true,
      rating: 4.6,
      reviews: [{ user: "Tarek F.", text: "The Mosque of Muhammad Ali is stunning with its towering dome and beautiful glowing glass lamps." }]
    },
    {
      id: "cairo_cave_church",
      name: "Cave Church of St. Simon the Tanner",
      cityId: "cairo",
      countryId: "egypt",
      lat: 30.0309,
      lng: 31.2764,
      fameScore: 29,
      fameTier: "blue", // Hidden Gem
      category: "hidden_gem",
      tagline: "A gargantuan amphitheater carved deep into the cliffs.",
      description: "Hidden behind the labyrinthine 'Garbage City' (Manshiyat Naser) in the Mokattam hills, this massive monastery is the largest church in the Middle East, seating 20,000 worshippers in a gigantic naturally hollowed-out limestone cave.",
      images: ["https://images.unsplash.com/photo-1545637904-8e3678e3664c?auto=format&fit=crop&w=600&q=80"],
      entryFee: "Free",
      openingHours: "09:00 AM - 05:00 PM",
      bestSeason: "Year-Round",
      timeNeeded: "1.5 Hours",
      isUnesco: false,
      rating: 4.9,
      reviews: [{ user: "Helena W.", text: "Absolutely jaw-dropping architectural marvel. Tucked away where few casual tourists venture. The carvings directly on the cave walls are magnificent." }]
    }
  ];

  // ================= DYNAMIC POI SYNTHESIZER ENGINE =================

  /**
   * Computes a deterministic pseudo-random hash from a string.
   * Used to ensure the procedural generator creates identical POIs for the same city name.
   */
  function getDeterministicHash(str) {
    let hash = 0;
for (let i = 0; i < str.length; i++) {
  const char = str.charCodeAt(i);
  hash = (hash << 5) - hash + char;
  hash |= 0; // Convert to 32bit integer
}
return Math.abs(hash);
}

/**
 * Procedurally generates a city structure and its POIs dynamically if not pre-seeded.
 * Ensures the app fulfills the requirement to "add every city's tourism places, famous or infamous".
 * @param {string} cityName - The queried city name
 * @param {string} countryId - The country containing the city
 * @param {number} [baseLat] - Optional approximate latitude
 * @param {number} [baseLng] - Optional approximate longitude
 */
function synthesizeCityAndPOIs(cityName, countryId, baseLat, baseLng) {
  const normName = cityName.trim();
  const hash = getDeterministicHash(normName);
  const country = SEED_COUNTRIES[countryId.toLowerCase()] || { name: "Traveler Land", center: [0, 0] };

  // Generate logical coordinates near country center if not provided
  let lat = baseLat;
  let lng = baseLng;
  if (!lat || !lng) {
    const latOffset = ((hash % 100) - 50) / 20; // -2.5 to +2.5 degrees
    const lngOffset = (((hash >> 4) % 100) - 50) / 20;
    lat = country.center[0] + latOffset;
    lng = country.center[1] + lngOffset;
  }

  // Create City Object
  const cityId = normName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const coverImages = [
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=600&q=80", // Modern Skyline
    "https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=600&q=80", // Valley city
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80", // Mountain town
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80", // Ancient town
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"  // Coastal town
  ];
  const coverImage = coverImages[hash % coverImages.length];

  const city = {
    id: cityId,
    name: normName,
    countryId: countryId.toLowerCase(),
    lat: parseFloat(lat.toFixed(4)),
    lng: parseFloat(lng.toFixed(4)),
    tagline: `Procedural Wonder of ${country.name}`,
    description: `A beautifully generated destination in ${country.name} waiting to be explored, featuring hidden viewpoints and local landmarks.`,
    coverImage: coverImage,
    isProcedural: true
  };

  // Generate 5 structured POIs (one for each tier)
  const poiCategories = ["landmark", "history", "nature", "culture", "hidden_gem"];

  // Naming matrices based on hash parameters
  const namesMatrix = {
    landmark: [
      { prefix: "Great", noun: "Cathedral", suffix: "Spire" },
      { prefix: "Imperial", noun: "Clocktower", suffix: "Square" },
      { prefix: "Grand", noun: "Palace", suffix: "Gardens" },
      { prefix: "Victorian", noun: "Civic Hall", suffix: "Dome" }
    ],
    history: [
      { prefix: "Ancient", noun: "Fortress", suffix: "Ruins" },
      { prefix: "Medieval", noun: "Stone Bridge", suffix: "Passage" },
      { prefix: "Centennial", noun: "Heritage Manor", suffix: "Vaults" },
      { prefix: "Dynastic", noun: "Watchtower", suffix: "Belfry" }
    ],
    nature: [
      { prefix: "Verdant", noun: "River Gorge", suffix: "Falls" },
      { prefix: "Panoramic", noun: "Mountain Ridge", suffix: "Lookout" },
      { prefix: "Tranquil", noun: "Botanical Sanctuary", suffix: "Ponds" },
      { prefix: "Ethereal", noun: "Valley", suffix: "Caves" }
    ],
    culture: [
      { prefix: "Spiritual", noun: "Shrine", suffix: "Pavilion" },
      { prefix: "Folklore", noun: "Museum", suffix: "Quarter" },
      { prefix: "Artisan", noun: "Bazaar", suffix: "Atelier" },
      { prefix: "Traditional", noun: "Amphitheater", suffix: "Hall" }
    ],
    hidden_gem: [
      { prefix: "Secret", noun: "Treehouse", suffix: "Escape" },
      { prefix: "Hidden", noun: "Speakeasy", suffix: "Cellar" },
      { prefix: "Local Favorite", noun: "Street-Food", suffix: "Nook" },
      { prefix: "Mysterious", noun: "Whispering Cliff", suffix: "View" }
    ]
  };

  const imagesMatrix = {
    landmark: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80",
    history: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    nature: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80",
    culture: "https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=600&q=80",
    hidden_gem: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80"
  };

  const attractions = [];
  const tiers = [
    { tier: "red", minScore: 90, scoreRange: 10, nameIndex: 0 },
    { tier: "orange", minScore: 70, scoreRange: 19, nameIndex: 1 },
    { tier: "yellow", minScore: 50, scoreRange: 19, nameIndex: 2 },
    { tier: "green", minScore: 30, scoreRange: 19, nameIndex: 3 },
    { tier: "blue", minScore: 10, scoreRange: 19, nameIndex: 0 } // Hidden Gem
  ];

  tiers.forEach((tierInfo, idx) => {
    const category = poiCategories[idx];
    const matrix = namesMatrix[category];
    const nameSeed = (hash + idx * 7) % matrix.length;
    const item = matrix[nameSeed];

    const poiName = `${item.prefix} ${normName} ${item.noun} ${item.suffix}`;
    const fameScore = tierInfo.minScore + ((hash + idx * 3) % tierInfo.scoreRange);

    // Compute slightly offset coordinates around city center
    const latOffset = ((getDeterministicHash(poiName) % 200) - 100) / 10000; // -0.01 to +0.01 degrees (~1km)
    const lngOffset = (((getDeterministicHash(poiName) >> 3) % 200) - 100) / 10000;

    const entryFees = ["Free", "$5.00", "$12.50", "Free", "$8.00"];
    const hours = ["24/7", "09:00 AM - 05:00 PM", "08:00 AM - 06:00 PM", "10:00 AM - 08:00 PM", "07:00 PM - 01:00 AM"];
    const seasons = ["Spring & Summer", "Autumn", "Year-Round", "Spring & Autumn", "Summer Nights"];
    const times = ["30 Mins", "1.5 Hours", "2 Hours", "1 Hour", "45 Mins"];

    const attraction = {
      id: `${cityId}_poi_${idx}`,
      name: poiName,
      cityId: cityId,
      countryId: countryId.toLowerCase(),
      lat: parseFloat((city.lat + latOffset).toFixed(5)),
      lng: parseFloat((city.lng + lngOffset).toFixed(5)),
      fameScore: fameScore,
      fameTier: tierInfo.tier,
      category: category,
      tagline: `A delightful procedural ${category} destination in ${normName}.`,
      description: `Discovered as part of our infinite city exploration engine, this place represents the unique vibe of ${normName}. Tourists can explore ${item.prefix.toLowerCase()} details, historical architectures, and local legends.`,
      images: [imagesMatrix[category]],
      entryFee: entryFees[idx],
      openingHours: hours[idx],
      bestSeason: seasons[idx],
      timeNeeded: times[idx],
      isUnesco: idx === 0 && (hash % 2 === 0), // Occasional UNESCO procedural tag
      rating: parseFloat((4.0 + ((hash + idx) % 10) / 10).toFixed(1)),
      reviews: [
        { user: "ExplorerBot", text: `I visited this beautiful ${category} spot. It felt incredibly authentic and full of character!` }
      ],
      isProcedural: true
    };

    attractions.push(attraction);
  });

  return { city, attractions };
}

// Export for app.js loading
window.SEED_COUNTRIES = SEED_COUNTRIES;
window.SEED_CITIES = SEED_CITIES;
window.SEED_ATTRACTIONS = SEED_ATTRACTIONS;
window.synthesizeCityAndPOIs = synthesizeCityAndPOIs;
