import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Brew Warm — Coffee Shop Finder",
    short_name: "Brew Warm",
    description:
      "A warm, café-inspired coffee shop finder powered by OpenStreetMap and community submissions.",
    start_url: "/",
    display: "standalone",
    background_color: "#FBF6EE",
    theme_color: "#C1682F",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml",
      },
    ],
  };
}

