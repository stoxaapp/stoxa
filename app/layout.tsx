import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  metadataBase: new URL("https://stoxa.co"),
  title: {
    default: "Stoxa.co // Global Financial Scenario Engine",
    template: "%s | Stoxa.co"
  },
  description: "Professional predictive scenario modeling, historical volatility tracking, and live global asset intelligence.",
  keywords: ["financial scenarios", "stock simulation", "portfolio stress test", "market intelligence", "price forecast", "volatility calculator"],
  authors: [{ name: "Stoxa.co" }],
  openGraph: {
    title: "Stoxa.co // Global Financial Scenario Engine",
    description: "Predictive scenario modeling and asset forecasting.",
    url: "https://stoxa.co",
    siteName: "Stoxa.co",
    images: [
      {
        url: "https://stoxa.co/og-image.png",
        width: 1200,
        height: 630,
        alt: "Stoxa.co Financial Scenario Corridor",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stoxa.co // Global Financial Scenario Engine",
    description: "Predictive scenario modeling and live asset intelligence.",
    images: ["https://stoxa.co/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Schema.org Strukturierte Daten für Google (SoftwareApplication)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Stoxa.co",
    "operatingSystem": "All",
    "applicationCategory": "FinanceApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "Predictive financial scenario engine providing symmetrical corridor forecasting and historical volatility modeling."
  };

  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              darkMode: 'class',
            }
          `
        }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
