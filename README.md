# KrishiMitra AI (कृषिमित्र) 🌾

**KrishiMitra AI** is a premium, localized, full-stack Agricultural Intelligence and Decision-Support Platform built specifically for smallholder farmers. The system leverages state-of-the-art Generative AI, cloud databases, and satellite remote-sensing visualizations to empower farmers with data-driven decision-making tools.
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/67fcbae8-afbf-4d84-9434-47149353e821" />

---

## 🚀 Key Features

### 👤 1. Google Sign-In & Offline-First Profiles
- **Authentication**: Seamless, secure Google Auth sign-in integrated directly into the profile dashboard.
- **Durable Sync**: Instant data synchronization to Firebase Firestore for custom agricultural profiles (village, district, soil profile, water depth, crop selections).
- **Offline Caching**: Built-in `localStorage` fallback, ensuring uninterrupted offline/intermittent connection usability.

### 🛰️ 2. Live Satellite & Spectral Remote Sensing Map
- **Google Maps Platform Integration**: Powered by `@vis.gl/react-google-maps` to render real-time high-fidelity satellite imagery of local farm plots.
- **Dynamic Spectral Overlays**:
  - **NDVI Vigor**: Normalized Difference Vegetation Index tracking vegetation health.
  - **Soil Moisture**: Root-zone relative moisture saturation.
  - **Canopy Growth**: Canopy density and chlorophyll expression.
- **Live Geocoding**: Automatically pans the map to the farmer's registered village and district using the Google Maps Geocoding service.

### 🎙️ 3. Multi-lingual Voice Assistant & SMS Alerts
- **Voice UI**: Hands-free conversation engine designed to overcome rural literacy barriers.
- **SMS Alerts**: Periodic critical advisories (weather spikes, pest alerts, price fluctuation) simulated with detailed logs.
- **Gemini AI Engine**: Backend-brokered chats using cascading fallback sequences (`gemini-3.5-flash`, `gemini-flash-latest`, `gemini-3.1-flash-lite`) to guarantee maximum up-time and robustness.

### 🩺 4. Crop Doctor & Disease Diagnostician
- **Diagnosis**: Visual symptoms processor that identifies disease pathogens.
- **Treatment Plans**: Structured chemical remedies, organic prevention practices, and hazard ratings to preserve crop yields.

### 🚰 5. Borehole Telemetry & Groundwater Advisor
- **Telemetry Charts**: Interactive historical groundwater table charts (reversed-axis to simulate borehole depletion).
- **Borehole AI Advisor**: Tailored irrigation schedules and water conservation strategies calculated directly against local soil types and water availability.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React (vector iconography), and Recharts (data visualization).
- **Maps**: Google Maps JS API + `@vis.gl/react-google-maps`.
- **Backend**: Express + Node.js (brokering secure Gemini APIs and rendering static build layers).
- **Database / Auth**: Firebase Auth (Google Provider) & Google Cloud Firestore (custom database id `ai-studio-554694c2-c48a-4cf3-8a69-24891fb88efa`).

---

## ⚙️ Environment Configuration

To unlock full interactive capabilities, ensure the following secrets are configured in your AI Studio project:

```env
# Server-side Secret for AI Features
GEMINI_API_KEY=your_gemini_api_key_here

# Client-side API Key for Real Maps & Geocoding
GOOGLE_MAPS_PLATFORM_KEY=your_google_maps_key_here
```

### Setup Steps:
1. Open the **Settings** menu (⚙️ gear icon, top-right).
2. Go to **Secrets / Environment Variables**.
3. Add `GOOGLE_MAPS_PLATFORM_KEY` with your authorized Maps API Key.
4. Restart the development server to activate live map overlays!
