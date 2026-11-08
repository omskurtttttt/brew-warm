"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import AmbientPlayer from "@/components/AmbientPlayer";
import CoffeeStain from "@/components/CoffeeStain";
import {
  CoffeeIcon,
  CompassIcon,
  MapPinIcon,
  WifiIcon,
  OutdoorIcon,
  SparklesIcon,
  NavigationIcon,
  StarIcon,
  HeartIcon,
} from "@/components/Icons";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

const POPULAR_HUBS = [
  { name: "Manila", country: "Philippines", region: "Metro Manila", lat: 14.5547, lng: 121.0244, flag: "🏙️" },
  { name: "Baguio", country: "Philippines", region: "Benguet", lat: 16.4124, lng: 120.5960, flag: "🌲" },
  { name: "Cebu", country: "Philippines", region: "Central Visayas", lat: 10.3157, lng: 123.8854, flag: "🌊" },
  { name: "La Union", country: "Philippines", region: "Ilocos Region", lat: 16.6575, lng: 120.3204, flag: "🏄" },
  { name: "Davao", country: "Philippines", region: "Mindanao", lat: 7.0731, lng: 125.6128, flag: "🏔️" },
  { name: "Legazpi", country: "Philippines", region: "Albay", lat: 13.1391, lng: 123.7438, flag: "🌋" },
];

const CURATED_VIBES = [
  {
    id: "wifi",
    title: "Deep Work & Wi-Fi",
    description: "Quiet hum, ample power outlets, and verified high-speed Wi-Fi for your flow state.",
    tag: "Remote Friendly",
    count: "940+ spots",
    filterParam: "wifi",
    icon: <WifiIcon size={20} color="var(--color-accent)" />,
  },
  {
    id: "outdoor",
    title: "Sunlit Terraces & Patios",
    description: "Open-air seating, lush potted greenery, and morning sun for slow sips.",
    tag: "Al Fresco",
    count: "1,200+ spots",
    filterParam: "outdoor",
    icon: <OutdoorIcon size={20} color="var(--color-accent)" />,
  },
  {
    id: "cozy",
    title: "Quiet Reading Nooks",
    description: "Soft lighting, low decibels, and vintage wooden tables for getting lost in a book.",
    tag: "Low Decibel",
    count: "Cozy Sanctuaries",
    filterParam: "",
    icon: <CoffeeIcon size={20} color="var(--color-accent)" />,
  },
  {
    id: "specialty",
    title: "Specialty Pour-Overs",
    description: "Single-origin beans, calibrated water profiles, and artisan manual brewing.",
    tag: "Third Wave",
    count: "Artisan Roasters",
    filterParam: "",
    icon: <SparklesIcon size={20} color="var(--color-accent)" />,
  },
];

const BARISTA_PICKS = [
  {
    name: "Yardstick Coffee",
    city: "Manila",
    neighborhood: "Legazpi Village, Makati",
    lat: 14.5568,
    lng: 121.0173,
    rating: "4.9",
    vibe: "Pioneering Third Wave Studio",
    notes: "Bright, industrial-chic space famous for calibrating single-origin beans, signature cold brews, and barista workshop lab.",
    tags: ["Specialty Roaster", "Fast Wi-Fi", "Work friendly"],
  },
  {
    name: "The Good Cup",
    city: "Cebu",
    neighborhood: "F. Ramos St, Cogon Ramos",
    lat: 10.3068,
    lng: 123.8969,
    rating: "4.9",
    vibe: "World Brewers Cup Roastery",
    notes: "Internationally renowned Cebuano specialty roastery offering meticulously sourced micro-lots and champion filter brews.",
    tags: ["Competition Roaster", "Single Origin", "Filter Bar"],
  },
  {
    name: "El Union Coffee",
    city: "La Union",
    neighborhood: "Urbiztondo, San Juan",
    lat: 16.6596,
    lng: 120.3224,
    rating: "4.8",
    vibe: "Coastal Surf & Slow Pour",
    notes: "The quintessential beachside sanctuary celebrated for Cordillera beans, open-air ocean breeze, and post-surf pour-overs.",
    tags: ["Beachfront", "Pour-over", "Outdoor Deck"],
  },
  {
    name: "Hatch Coffee",
    city: "Baguio",
    neighborhood: "Easter Road, Guisad",
    lat: 16.4233,
    lng: 120.5871,
    rating: "4.9",
    vibe: "Secluded Pine Garden",
    notes: "A hidden garden sanctuary tucked inside a historic Baguio compound serving exquisite Benguet cold brew flights and rustic bites.",
    tags: ["Garden Sanctuary", "Benguet Arabica", "Cozy Nook"],
  },
];

export default function FrontPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchNominatim = useCallback(async (q: string) => {
    if (q.trim().length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q
        )}&limit=5&addressdetails=0`,
        { headers: { "User-Agent": "BrewWarm/1.0" } }
      );
      const data: NominatimResult[] = await res.json();
      setResults(data);
      setIsOpen(data.length > 0);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  function handleInputChange(val: string) {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchNominatim(val), 350);
  }

  function handleSelectLocation(lat: number, lng: number) {
    router.push(`/map?lat=${lat}&lng=${lng}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (results.length > 0) {
      const first = results[0];
      handleSelectLocation(parseFloat(first.lat), parseFloat(first.lon));
    } else if (query.trim()) {
      router.push(`/map`);
    } else {
      router.push(`/map`);
    }
  }

  function handleNearMe() {
    if (typeof window === "undefined" || !navigator.geolocation) {
      router.push("/map");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        router.push(`/map?lat=${latitude.toFixed(6)}&lng=${longitude.toFixed(6)}`);
      },
      () => {
        setIsLocating(false);
        router.push("/map");
      },
      { timeout: 8000 }
    );
  }

  return (
    <div className="front-page">
      {/* ─── Global Top Navigation Bar ─── */}
      <header className="front-nav">
        <div className="front-nav__container">
          <Link href="/" className="front-nav__brand">
            <div className="front-nav__logo" aria-hidden="true">
              <CoffeeIcon size={18} color="var(--color-accent)" />
            </div>
            <div className="front-nav__brand-text">
              <span className="front-nav__title">brew warm</span>
              <span className="front-nav__badge">café atlas</span>
            </div>
          </Link>

          <nav className="front-nav__links">
            <a href="#vibes" className="front-nav__link">
              Vibes
            </a>
            <a href="#featured" className="front-nav__link">
              Sanctuaries
            </a>
            <a href="#ambient" className="front-nav__link">
              Soundscape
            </a>
            <a href="#about" className="front-nav__link">
              Passport
            </a>
          </nav>

          <div className="front-nav__actions">
            <AmbientPlayer />
            <ThemeToggle />
            <Link href="/map" className="btn-primary front-nav__cta">
              <span>Open Map</span>
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <section className="front-hero">
        <CoffeeStain position="top-right" opacity={0.07} size={340} />
        <CoffeeStain position="bottom-left" opacity={0.04} size={260} />

        <div className="front-hero__content">
          <div className="front-hero__eyebrow">
            <span className="front-hero__pill">
              <SparklesIcon size={13} color="var(--color-accent)" />
              INDEPENDENT COFFEE ATLAS
            </span>
          </div>

          <h1 className="front-hero__headline">
            Find your warm <span className="front-hero__headline-accent">corner.</span>
          </h1>

          <p className="front-hero__subhead">
            A curated directory of independent coffee spaces, quiet study sanctuaries, and specialty
            roasters. Free of ads, powered by OpenStreetMap, and shaped by coffee wanderers.
          </p>

          {/* Search Card */}
          <div className="front-hero__search-box">
            <form onSubmit={handleSubmit} className="front-hero__search-form">
              <div className="front-hero__input-wrap">
                <span className="front-hero__input-icon" aria-hidden="true">
                  <MapPinIcon size={18} color="var(--color-neutral-400)" />
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Search any neighborhood, city, or café..."
                  className="front-hero__input"
                  aria-label="Search destination"
                />
                {isSearching && <span className="front-hero__spinner" />}
              </div>

              <div className="front-hero__search-buttons">
                <button
                  type="button"
                  onClick={handleNearMe}
                  disabled={isLocating}
                  className="front-hero__btn-geo"
                  title="Find coffee spots near your GPS location"
                >
                  <NavigationIcon size={15} />
                  <span>{isLocating ? "locating..." : "near me"}</span>
                </button>

                <button type="submit" className="btn-primary front-hero__btn-submit">
                  <span>Explore Map</span>
                  <span>→</span>
                </button>
              </div>
            </form>

            {/* Nominatim Search Autocomplete Dropdown */}
            {isOpen && results.length > 0 && (
              <ul className="front-hero__results-dropdown" role="listbox">
                {results.map((r) => (
                  <li
                    key={r.place_id}
                    role="option"
                    aria-selected="false"
                    className="front-hero__result-item"
                    onClick={() => handleSelectLocation(parseFloat(r.lat), parseFloat(r.lon))}
                  >
                    <MapPinIcon size={15} color="var(--color-accent)" />
                    <span className="front-hero__result-text">{r.display_name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick Hub Chips */}
          <div className="front-hero__hubs">
            <span className="front-hero__hubs-label">quick jump:</span>
            <div className="front-hero__hubs-list">
              {POPULAR_HUBS.map((hub) => (
                <button
                  key={hub.name}
                  type="button"
                  className="front-hub-chip"
                  onClick={() => handleSelectLocation(hub.lat, hub.lng)}
                >
                  <span className="front-hub-chip__flag">{hub.flag}</span>
                  <span className="front-hub-chip__name">{hub.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Curated Moods / Vibes Section ─── */}
      <section id="vibes" className="front-section">
        <div className="front-section__header">
          <span className="front-section__eyebrow">✦ CURATED VIBES</span>
          <h2 className="front-section__title">What&apos;s your coffee ritual today?</h2>
          <p className="front-section__subtitle">
            Every coffee run has a purpose. Filter spaces designed specifically for your rhythm.
          </p>
        </div>

        <div className="front-vibes-grid">
          {CURATED_VIBES.map((vibe) => (
            <Link
              key={vibe.id}
              href={`/map${vibe.filterParam ? `?filter=${vibe.filterParam}` : ""}`}
              className="front-vibe-card"
            >
              <div className="front-vibe-card__icon-badge">{vibe.icon}</div>
              <div className="front-vibe-card__body">
                <div className="front-vibe-card__meta">
                  <span className="pill pill--featured">{vibe.tag}</span>
                  <span className="front-vibe-card__count">{vibe.count}</span>
                </div>
                <h3 className="front-vibe-card__title">{vibe.title}</h3>
                <p className="front-vibe-card__desc">{vibe.description}</p>
              </div>
              <div className="front-vibe-card__footer">
                <span className="btn-secondary">Explore on radar</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Barista's Picks / Sanctuaries ─── */}
      <section id="featured" className="front-section front-section--tinted">
        <div className="front-section__header">
          <span className="front-section__eyebrow">✦ HANDPICKED SPACES</span>
          <h2 className="front-section__title">Coffee Sanctuaries</h2>
          <p className="front-section__subtitle">
            Beloved independent spaces across the Philippines celebrated for extraordinary cups, homegrown roasts, and welcoming souls.
          </p>
        </div>

        <div className="front-picks-grid">
          {BARISTA_PICKS.map((pick) => (
            <article key={pick.name} className="front-pick-card">
              <div className="front-pick-card__header">
                <div>
                  <div className="front-pick-card__location">
                    <MapPinIcon size={13} color="var(--color-accent)" />
                    <span>
                      {pick.neighborhood}, {pick.city}
                    </span>
                  </div>
                  <h3 className="front-pick-card__name">{pick.name}</h3>
                </div>
                <div className="front-pick-card__rating">
                  <StarIcon size={14} color="#D4A017" />
                  <span>{pick.rating}</span>
                </div>
              </div>

              <div className="front-pick-card__vibe-badge">
                <span>{pick.vibe}</span>
              </div>

              <p className="front-pick-card__notes">{pick.notes}</p>

              <div className="front-pick-card__tags">
                {pick.tags.map((t) => (
                  <span key={t} className="pill">
                    {t}
                  </span>
                ))}
              </div>

              <div className="front-pick-card__action">
                <Link
                  href={`/map?lat=${pick.lat}&lng=${pick.lng}&shop=${encodeURIComponent(pick.name)}`}
                  className="btn-primary front-pick-card__btn"
                >
                  <span>Fly to on Map</span>
                  <span>↗</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ─── Ambient Coffeehouse Experience ─── */}
      <section id="ambient" className="front-ambient-section">
        <div className="front-ambient-card">
          <div className="front-ambient-card__text">
            <span className="front-section__eyebrow">✦ AMBIENT WORKSPACE</span>
            <h2 className="front-ambient-card__title">Bring the café soundscape with you.</h2>
            <p className="front-ambient-card__desc">
              Soft rain tapping on the glass, milk steamed to velvet, and quiet lo-fi murmurs.
              Turn on our built-in ambient player while you work or plan your weekend café crawl.
            </p>
            <div className="front-ambient-card__controls">
              <div className="front-ambient-card__player-wrap">
                <AmbientPlayer />
                <span className="front-ambient-card__hint">
                  ← tap to toggle rain & coffee murmur
                </span>
              </div>
            </div>
          </div>
          <div className="front-ambient-card__badge" aria-hidden="true">
            ☕
          </div>
        </div>
      </section>

      {/* ─── Passport & Community Ethos ─── */}
      <section id="about" className="front-section">
        <div className="front-manifesto-card">
          <div className="front-manifesto-card__content">
            <span className="front-section__eyebrow">✦ OPEN DATA & COMMUNITY</span>
            <h2 className="front-manifesto-card__title">Your Personal Coffee Passport</h2>
            <p className="front-manifesto-card__text">
              Most map apps prioritize whoever buys ads. Brew Warm is different: it is 100%
              independent, powered by the global OpenStreetMap project, and keeps your favorites
              private right on your device.
            </p>

            <div className="front-features-row">
              <div className="front-feature">
                <div className="front-feature__icon">
                  <HeartIcon size={18} color="var(--color-accent)" />
                </div>
                <div>
                  <h4 className="front-feature__title">Save Without Signups</h4>
                  <p className="front-feature__desc">
                    Heart any café to curate your private travel passport. Saved locally in your
                    browser.
                  </p>
                </div>
              </div>

              <div className="front-feature">
                <div className="front-feature__icon">
                  <CompassIcon size={18} color="var(--color-accent)" />
                </div>
                <div>
                  <h4 className="front-feature__title">Community Additions</h4>
                  <p className="front-feature__desc">
                    Spot a newly opened specialty café? Add it instantly so fellow coffee seekers can
                    discover it.
                  </p>
                </div>
              </div>
            </div>

            <div className="front-manifesto-card__cta">
              <Link href="/map" className="btn-primary front-manifesto-card__btn">
                <span>Start Exploring Nearby</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Editorial Footer ─── */}
      <footer className="front-footer">
        <div className="front-footer__container">
          <div className="front-footer__col-brand">
            <div className="front-nav__brand">
              <div className="front-nav__logo" aria-hidden="true">
                <CoffeeIcon size={18} color="var(--color-accent)" />
              </div>
              <div className="front-nav__brand-text">
                <span className="front-nav__title">brew warm</span>
                <span className="front-nav__badge">editorial edition</span>
              </div>
            </div>
            <p className="front-footer__tagline">
              Dedicated to slow sips, sunny outdoor terraces, and independent coffee makers.
            </p>
          </div>

          <div className="front-footer__col-links">
            <h5 className="front-footer__heading">Navigation</h5>
            <ul className="front-footer__list">
              <li>
                <Link href="/map">Live Map Radar</Link>
              </li>
              <li>
                <a href="#vibes">Curated Vibes</a>
              </li>
              <li>
                <a href="#featured">Sanctuaries</a>
              </li>
              <li>
                <a href="#about">About & Passport</a>
              </li>
            </ul>
          </div>

          <div className="front-footer__col-links">
            <h5 className="front-footer__heading">Open Source</h5>
            <ul className="front-footer__list">
              <li>
                <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer">
                  OpenStreetMap
                </a>
              </li>
              <li>
                <a href="https://overpass-api.de" target="_blank" rel="noopener noreferrer">
                  Overpass API
                </a>
              </li>
              <li>
                <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer">
                  Next.js 16
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="front-footer__bottom">
          <span>&copy; {new Date().getFullYear()} Brew Warm. Independent & open source.</span>
          <span className="front-footer__coffee-quote">&ldquo;Life begins after coffee.&rdquo;</span>
        </div>
      </footer>
    </div>
  );
}

