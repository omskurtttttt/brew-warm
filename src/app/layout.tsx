import type { Metadata } from "next";
import {
  Fraunces,
  Inter,
  IBM_Plex_Mono,
  Caveat,
} from "next/font/google";
import "./globals.css";

/* --------------------------------------------------------
   Font configuration — brew-warm typography spec
   -------------------------------------------------------- */
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
});

const caveat = Caveat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-caveat",
});

/* --------------------------------------------------------
   Metadata
   -------------------------------------------------------- */
export const metadata: Metadata = {
  title: "Brew Warm — Coffee Shop Finder",
  description:
    "Discover nearby coffee shops on an interactive map. Free, open-source, powered by OpenStreetMap.",
  keywords: ["coffee", "café", "shop finder", "map", "OpenStreetMap"],
  metadataBase: new URL("https://brew-warm.vercel.app"),
  openGraph: {
    title: "Brew Warm — Coffee Shop Finder",
    description: "Discover nearby coffee shops on an interactive map.",
    type: "website",
  },
};

/* --------------------------------------------------------
   Root layout
   -------------------------------------------------------- */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${ibmPlexMono.variable} ${caveat.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Prevent FOUC on theme — inline script reads preference before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('bw-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t)}else if(matchMedia('(prefers-color-scheme:dark)').matches){document.documentElement.setAttribute('data-theme','dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
