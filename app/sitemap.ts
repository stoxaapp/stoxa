import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://stoxa.co';

  // Die populärsten Assets direkt in die Sitemap packen
  const popularAssets = ['NVDA', 'AAPL', 'GM', 'WMT', 'BMW.DE', 'BTC-USD', 'TSLA', 'MSFT', 'AMZN', 'GOOGL'];

  const assetUrls: MetadataRoute.Sitemap = popularAssets.map((symbol) => ({
    url: `${baseUrl}/asset/${symbol}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...assetUrls,
  ];
}
