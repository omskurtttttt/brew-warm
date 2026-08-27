import type { Metadata } from "next";
import { Inter, Fraunces, IBM_Plex_Mono, Caveat } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-accent",
  display: "swap",
});

/* --------------------------------------------------------
   Metadata
   -------------------------------------------------------- */
export const metadata: Metadata = {
  title: "Brew Warm — Coffee Shop Finder",
  description:
    "Discover nearby coffee shops on an interactive map. Free, open-source, powered by OpenStreetMap.",
  keywords: ["coffee", "café", "shop finder", "map", "OpenStreetMap", "specialty coffee"],
  metadataBase: new URL("https://brew-warm.vercel.app"),
  openGraph: {
    title: "Brew Warm — Coffee Shop Finder",
    description: "Discover nearby coffee shops on an interactive map.",
    type: "website",
    siteName: "Brew Warm",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brew Warm — Coffee Shop Finder",
    description: "Discover nearby coffee shops on an interactive map.",
  },
};

/* --------------------------------------------------------
   Root layout
   -------------------------------------------------------- */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${fraunces.variable} ${ibmPlexMono.variable} ${caveat.variable}`}
    >
      <head>
        {/* Prevent FOUC on theme — inline script reads preference before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('brew_warm_theme')||localStorage.getItem('bw-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t)}else if(matchMedia('(prefers-color-scheme:dark)').matches){document.documentElement.setAttribute('data-theme','dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <main id="main-content">{children}</main>
      </body>

    </html>
  );
}


