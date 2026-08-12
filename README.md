# ☕ Brew Warm — Coffee Shop Finder

A warm, café-inspired coffee shop finder built with **Next.js 16 (App Router)**, **Leaflet**, **OpenStreetMap Overpass API**, **Drizzle ORM**, and **Neon PostgreSQL**. Designed with a bespoke cream & espresso color palette, serif typography, and zero-cost API architecture.

---

## ✨ Features

- 🗺️ **Interactive Leaflet Map**: Custom terracotta pin markers, smooth pan/zoom debouncing, user geolocation, and active pin highlighting.
- 🔍 **Geocoding Location Search**: Built-in location search using OpenStreetMap's Nominatim API with instant map `flyTo` navigation.
- 🎯 **Filter Bar**: Dynamic amenity filtering (Wi-Fi, Outdoor Seating, Wheelchair Accessible, Open Hours) with live result count badges.
- 📖 **Slide-over Shop Details**: Drawer modal panel rendering opening hours, address, contact details, amenities, and receipt-style coordinates.
- 📍 **Sidebar Map Redirection**: Clicking any café card in the sidebar automatically redirects and centers the map directly over that coffee shop.
- ➕ **Community Submissions**: Submit new coffee shops directly to Neon PostgreSQL database via `/api/shops`.
- ♥️ **Persistent Favorites**: Cookie & localStorage session-backed favorites list (`/api/favorites`) allowing users to save spots without needing a user account/login.
- ☀️/🌙 **Light & Dark Theme**: Full dual-theme system featuring warm cream paper and dark espresso tones with smooth transitions and system preference fallbacks.
- ♿ **Accessibility & Micro-animations**: Focus-visible keyboard navigation rings, reduced-motion overrides, custom warm scrollbars, and ARIA labels.

---

## 🎨 Design System & Aesthetic Tokens

Built with vanilla CSS custom properties adhering to the **brew-warm** design language:

| Token | Light Theme | Dark Theme | Purpose |
|---|---|---|---|
| `--color-bg` | `#FBF6EE` (Warm Cream) | `#1B140F` (Dark Espresso) | Page background |
| `--color-ink` | `#2B1B12` (Deep Roast) | `#F3E9DC` (Warm Parchment) | Primary typography |
| `--color-accent` | `#C1682F` (Terracotta) | `#E08A52` (Warm Terracotta) | Brand accent & active states |
| `--font-display` | `Fraunces` | `Fraunces` | Serif headlines |
| `--font-body` | `Inter` | `Inter` | Primary sans-serif body |
| `--font-mono` | `IBM Plex Mono` | `IBM Plex Mono` | Micro-labels & receipt details |
| `--font-accent` | `Caveat` | `Caveat` | Handwriting accent notes |

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16.3.0 (App Router, Turbopack)
- **Language**: TypeScript, React 19
- **Styling**: Vanilla CSS Modules with CSS custom properties (Zero Tailwind)
- **Map & Geocoding**: Leaflet, React-Leaflet, OpenStreetMap Overpass API, Nominatim Geocoding
- **Database & ORM**: Drizzle ORM, Neon Serverless PostgreSQL (`@neondatabase/serverless`)
- **Deployment**: Vercel

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js 18.x or later
- npm or yarn

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/omskurtttttt/brew-warm.git
cd brew-warm
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
DATABASE_URL=postgresql://neondb_owner:npg_n5KxbXVk7QYZ@ep-wandering-meadow-azy4sr19.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

*(Refer to `.env.example` for template)*

### 4. Database Migration

Push schema to Neon PostgreSQL:

```bash
npx drizzle-kit push
```

### 5. Running Locally

Start the Next.js dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
brew-warm/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── favorites/route.ts      # REST API for user session favorites
│   │   │   └── shops/
│   │   │       ├── route.ts            # GET/POST user coffee shop submissions
│   │   │       └── [id]/route.ts       # GET/PATCH single shop details
│   │   ├── globals.css                 # Complete design token system & CSS
│   │   ├── layout.tsx                  # Root layout, Google Fonts, theme init
│   │   └── page.tsx                    # Main app entry page
│   ├── components/
│   │   ├── AddShopForm.tsx             # Modal form for submitting new cafes
│   │   ├── CoffeeStain.tsx             # SVG coffee ring background decor
│   │   ├── FavoritesPanel.tsx          # Saved favorites drawer/tab panel
│   │   ├── FilterBar.tsx               # Amenity filter pills & counter badge
│   │   ├── Map.tsx                     # React-Leaflet map client component
│   │   ├── MapView.tsx                 # Split-layout orchestrator & state
│   │   ├── SearchBar.tsx               # Nominatim geocoding search input
│   │   ├── ShopCard.tsx                # Sidebar cafe list card component
│   │   ├── ShopDetail.tsx              # Slide-over shop detail modal
│   │   └── ThemeToggle.tsx             # Light/Dark theme toggle button
│   ├── db/
│   │   ├── index.ts                    # Neon DB connection initialization
│   │   └── schema.ts                   # Drizzle ORM table definitions
│   └── lib/
│       ├── overpass.ts                 # Overpass API client for OpenStreetMap
│       └── session.ts                  # Persistent anonymous session manager
├── drizzle.config.ts                   # Drizzle ORM configuration
└── package.json
```

---

## 🌐 API Routes

| Endpoint | Method | Description |
|---|---|---|
| `/api/shops` | `GET` | Proximity query for coffee shops (`lat`, `lng`, `radius`) |
| `/api/shops` | `POST` | Submit a new coffee shop to database |
| `/api/shops/[id]` | `GET` | Retrieve single shop details |
| `/api/favorites` | `GET` | Fetch session saved favorites (`sessionId`) |
| `/api/favorites` | `POST` | Save a coffee shop to session favorites |
| `/api/favorites` | `DELETE` | Remove a coffee shop from session favorites |

---

## 📄 License

MIT License — Feel free to use, modify, and build upon this project.
