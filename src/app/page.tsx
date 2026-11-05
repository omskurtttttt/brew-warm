import type { Metadata } from "next";
import FrontPage from "@/components/FrontPage";

export const metadata: Metadata = {
  title: "Brew Warm — Independent Coffee Spaces & Map Radar",
  description:
    "Discover independent coffee shops, quiet study corners, and specialty roasters across the globe on an interactive map. Powered by OpenStreetMap.",
};

export default function HomePage() {
  return <FrontPage />;
}
