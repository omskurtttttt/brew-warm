import type { Metadata } from "next";
import MapView from "@/components/MapView";

export const metadata: Metadata = {
  title: "Live Map & Radar — Brew Warm",
  description:
    "Explore independent coffee shops, verified Wi-Fi sanctuaries, and homegrown specialty roasters on an interactive map.",
};

export default function MapPage() {
  return <MapView />;
}

