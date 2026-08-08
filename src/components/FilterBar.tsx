"use client";

interface FilterBarProps {
  activeFilters: Set<string>;
  onToggle: (filter: string) => void;
  cafeCount: number;
}

const FILTERS = [
  { key: "wifi", label: "wifi", icon: "📶" },
  { key: "outdoor", label: "outdoor", icon: "🌿" },
  { key: "wheelchair", label: "accessible", icon: "♿" },
  { key: "has_hours", label: "open hours", icon: "🕐" },
] as const;

export default function FilterBar({ activeFilters, onToggle, cafeCount }: FilterBarProps) {
  return (
    <div className="filter-bar">
      <div className="filter-bar__pills">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`pill pill--filter ${activeFilters.has(f.key) ? "pill--filter-active" : ""}`}
            onClick={() => onToggle(f.key)}
            aria-pressed={activeFilters.has(f.key)}
          >
            <span aria-hidden="true">{f.icon}</span>
            {f.label}
          </button>
        ))}
      </div>
      <span className="text-micro filter-bar__count">
        {cafeCount} {cafeCount === 1 ? "result" : "results"}
      </span>
    </div>
  );
}
