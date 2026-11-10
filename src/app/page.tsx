import type { Metadata } from "next";
import FrontPage from "@/components/FrontPage";

export const metadata: Metadata = {
  title: "Brew Warm — Philippine Specialty Coffee Atlas",
  description:
    "Discover independent coffee spaces, quiet study sanctuaries, and homegrown roasters across the Philippines on an interactive map. Powered by OpenStreetMap.",
};

export default function HomePage() {
  return <FrontPage />;
}
