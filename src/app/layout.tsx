import type { Metadata } from "next";
import "./globals.css";

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
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Fonts preconnect & stylesheet */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=Fraunces:opsz,wght@9..144,400..700&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
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

