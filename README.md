# 🗺️ GlobeRoutes — Interactive World Explorer & Route Planner

[![Platform](https://img.shields.io/badge/Platform-Web-blueviolet?style=for-the-badge)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](licence)
[![Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge)]()

**GlobeRoutes** is a premium, highly interactive world tourism and travel route planning web application. Designed with modern glassmorphic aesthetics, responsive layouts, and robust spatial calculations, GlobeRoutes lets users explore local attractions, check-in to visited timeline logs, and coordinate routes across three transport modes with real-time feedback and smart feasibility gates.

---

## ✨ Core Platform Features

### 1. 🚗🚂✈️ Multi-Transport Winding Route Planner
* **Road Transit (Directions)**: Instant simulated winding road lines with inner glowing dashes as an automatic fallback when public geocoding servers are slow or rate-limited.
* **Railway Transit (Sinusoidal Tracks)**: Layed track layers (dark slate base with white dashed overlay) that simulate winding scenic train trips.
* **Airway Transit (Curved Flight Arcs)**: High-resolution direct bezier curved flight arcs representing international flight routes.
* **Synchronized State Coordinates**: Integrates path rendering directly with active coordinate arrays for accurate stat tracking.

### 2. 🛑 Smart Route Feasibility Validation
* **Island & Continent Constraints**: Automatically detects land connectivity boundaries using geocoded country addresses from autocomplete nominations.
* **Land travel (Road/Rail)** is prevented from drawing between separated continental landmasses (e.g. Italy to India) or isolated island nations (e.g. Japan, Australia, Madagascar, Philippines) with no physical bridges.
* Prompts a sleek red **Route Impossible Alert** inside the stats sidebar panel, dynamically instructing the traveler to switch to Flight mode.

### 3. 🏨⛽⚡ Roadside Amenities Along Route
* Plots rest spots, fuel stations, and EV charging points dynamically along active road paths.
* Leverages custom coordinate-proximity calculations to plot amenities in high density near paths.

### 4. 🔑 Free vs. Standard vs. Pro Subscription Tiers
* **Free Explorer**: Unlocks Red Tier locations and permits exactly 3 India Temple detail reviews. Legend switches show premium lock icons.
* **Standard Explorer ($3.99/mo)**: Fully unlocks Red, Orange, and Yellow fame tiers and all 50+ India Temples and Char Dham details.
* **Pro Explorer ($9.99/mo)**: Full access to all 195+ countries, complete Green & Blue Tiers (Hidden Gems), procedural city generations, and unlimited routing hops.

### 5. 💳📱 3D Checkout & UPI Multi-Payment Simulator
* Seamless payment modal featuring an interactive credit card and a dedicated **UPI QR Scan & Pay** dashboard.
* Visualizes dynamic invoice summaries matching standard vs. pro tier pricing.

---

## 🛠️ Technology Stack

* **Frontend Structure & Templates**: HTML5 Semantic markup with embedded viewport configuration.
* **Premium Styling System**: Custom HSL color variables, glassmorphic filters, and modular CSS classes inside `styles.css`.
* **Map Engine**: Leaflet.js with custom zoom coordinates, customized line styling, and path bindings.
* **Routing Mechanics**: Leaflet Routing Machine with Geocoder.nominatim.
* **Dynamic Icons**: Lucide Icons library.
* **Backend API (Server)**: Node.js, Express, MongoDB (User profiles, reviews, and check-in timeline histories).

---

## 🚀 Setup & Local Execution

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Rudra-aa/-globeroutes-tourism-app.git
   cd -globeroutes-tourism-app
   ```

2. **Frontend Deployment**:
   Open `index.html` directly in any web browser, or host it locally using a server extension like Live Server.

3. **Optional Backend Server Launch**:
   Navigate to the server directory, install dependencies, and start the node server:
   ```bash
   cd server
   npm install
   npm run start
   ```

---

© 2026 GlobeRoutes. All Rights Reserved. Designed with ❤️ for modern global travelers.
