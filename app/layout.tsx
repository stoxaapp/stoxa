import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stoxa.co // Global Financial Scenario & Asset Engine",
  description: "Professional predictive scenario modeling, historical volatility tracking, and live global asset intelligence.",
  keywords: ["financial scenarios", "stock simulation", "portfolio stress test", "market intelligence", "yahoo finance api"],
  authors: [{ name: "Stoxa.co" }],
  openGraph: {
    title: "Stoxa.co // Global Financial Scenario Engine",
    description: "Predictive scenario modeling and asset forecasting.",
    url: "https://stoxa.co",
    siteName: "Stoxa.co",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
      </head>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
