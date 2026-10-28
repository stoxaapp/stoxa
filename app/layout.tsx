import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased bg-[#07090e]">{children}</body>
    </html>
  );
}
