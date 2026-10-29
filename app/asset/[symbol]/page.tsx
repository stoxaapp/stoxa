import { Metadata } from 'next';
import StoxaApp from '@/app/page';

interface Props {
  params: { symbol: string };
}

// 1. Dynamische Meta-Daten für Google & Social Media
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const symbol = params.symbol.toUpperCase();
  
  return {
    title: `${symbol} Stock Forecast & Bull/Bear Corridor | Stoxa.co`,
    description: `Interactive predictive corridor analysis for ${symbol}. View real-time historical volatility, CAGR trends, Volatility Score, and Bull/Base/Bear scenario targets on Stoxa.co.`,
    keywords: [`${symbol} stock forecast`, `${symbol} price target`, `${symbol} volatility`, `${symbol} bull bear scenario`, "financial simulation"],
    openGraph: {
      title: `${symbol} Predictive Scenario Analysis | Stoxa.co`,
      description: `View ${symbol} price targets, volatility profile, and dynamic Bull/Base/Bear corridors for ${symbol}.`,
      url: `https://stoxa.co/asset/${symbol}`,
      siteName: 'Stoxa.co',
      images: [
        {
          url: 'https://stoxa.co/og-image.png',
          width: 1200,
          height: 630,
          alt: `${symbol} Scenario Corridor Simulation`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${symbol} Stock Target & Scenario Engine`,
      description: `Live volatility & corridor simulation for ${symbol}.`,
    },
  };
}

// 2. Rendern der Hauptkomponente mit dem jeweiligen Ticker
export default function AssetPage({ params }: Props) {
  return <StoxaApp initialTicker={params.symbol.toUpperCase()} />;
}
