import type { Metadata } from "next";
import FrontPage from "@/components/FrontPage";

export const metadata: Metadata = {
  title: "Brew Warm — Independent Coffee Atlas",
  description:
    "Discover independent coffee spaces, quiet study sanctuaries, and homegrown roasters on an interactive map. Powered by OpenStreetMap.",
};

export default function HomePage() {
  return <FrontPage />;
}
