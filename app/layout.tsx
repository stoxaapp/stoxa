import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stoxa // Financial Scenario Engine",
  description: "Predictive scenario modeling and portfolio stress testing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Tailwind CSS v3 CDN for instant, flawless styling */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="antialiased bg-[#07090e] text-[#f1f5f9] min-h-screen">
        {children}
      </body>
    </html>
  );
}
