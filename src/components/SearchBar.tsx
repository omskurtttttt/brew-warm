"use client";

import { useState, useCallback, useRef } from "react";

interface SearchBarProps {
  onLocationSelect: (lat: number, lng: number, label: string) => void;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export default function SearchBar({ onLocationSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchNominatim = useCallback(async (q: string) => {
    if (q.trim().length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=0`,
        { headers: { "User-Agent": "BrewWarm/1.0" } }
      );
      const data: NominatimResult[] = await res.json();
      setResults(data);
      setIsOpen(data.length > 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleInput(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchNominatim(value), 400);
  }

  function handleSelect(result: NominatimResult) {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    // Truncate long display names
    const label =
      result.display_name.length > 60
        ? result.display_name.slice(0, 57) + "..."
        : result.display_name;
    setQuery(label);
    setIsOpen(false);
    setResults([]);
    onLocationSelect(lat, lng, label);
  }

  return (
    <div className="search-bar">
      <div className="search-bar__input-wrap">
        <svg
          className="search-bar__icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          className="input"
          type="text"
          placeholder="search for a place or address..."
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          aria-label="Search location"
          aria-expanded={isOpen}
          role="combobox"
          aria-autocomplete="list"
        />
        {loading && (
          <span className="search-bar__spinner" aria-label="Searching..." />
        )}
      </div>

      {isOpen && (
        <ul className="search-bar__dropdown" role="listbox">
          {results.map((r) => (
            <li key={r.place_id} role="option">
              <button
                className="search-bar__result"
                onMouseDown={() => handleSelect(r)}
              >
                <span className="search-bar__result-name">
                  {r.display_name}
                </span>
                <span className="text-micro">
                  {parseFloat(r.lat).toFixed(4)}, {parseFloat(r.lon).toFixed(4)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
