import { Metadata } from 'next';
import StoxaApp from '../../page';

interface Props {
  params: {
    symbol: string;
  };
}

// Dynamische SEO Meta-Tags pro Aktie für Google
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const symbol = params.symbol.toUpperCase();
  
  return {
    title: `${symbol} Price Forecast & Scenario Corridor | Stoxa.co`,
    description: `Analyze historical volatility, CAGR trends, and predictive Bull/Base/Bear scenario corridors for ${symbol}.`,
    openGraph: {
      title: `${symbol} Financial Scenario Engine | Stoxa.co`,
      description: `Live forecasting corridor and stress testing for ${symbol}.`,
      url: `https://stoxa.co/asset/${symbol}`,
    }
  };
}

export default function AssetPage({ params }: Props) {
  // Rendert die Stoxa-App direkt für das jeweilige Asset
  return <StoxaApp initialTicker={params.symbol.toUpperCase()} />;
}
