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
