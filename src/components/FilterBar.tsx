"use client";

import { WifiIcon, OutdoorIcon, WheelchairIcon, ClockIcon } from "./Icons";

interface FilterBarProps {
  activeFilters: Set<string>;
  onToggle: (filter: string) => void;
  cafeCount: number;
}

export default function FilterBar({ activeFilters, onToggle, cafeCount }: FilterBarProps) {
  const filters = [
    { key: "wifi", label: "wifi", icon: <WifiIcon size={13} /> },
    { key: "outdoor", label: "outdoor", icon: <OutdoorIcon size={13} /> },
    { key: "wheelchair", label: "accessible", icon: <WheelchairIcon size={13} /> },
    { key: "has_hours", label: "open hours", icon: <ClockIcon size={13} /> },
  ];

  return (
    <div className="filter-bar">
      <div className="filter-bar__pills">
        {filters.map((f) => (
          <button
            key={f.key}
            className={`pill pill--filter ${activeFilters.has(f.key) ? "pill--filter-active" : ""}`}
            onClick={() => onToggle(f.key)}
            aria-pressed={activeFilters.has(f.key)}
            style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
          >
            {f.icon}
            <span>{f.label}</span>
          </button>
        ))}
      </div>
      <span className="text-micro filter-bar__count">
        {cafeCount} {cafeCount === 1 ? "result" : "results"}
      </span>
    </div>
  );
}
