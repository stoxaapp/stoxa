import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol')?.toUpperCase().trim() || 'NVDA';
  const timeframeMonths = parseInt(searchParams.get('timeframe') || '12', 10);

  try {
    // Dynamischer Zeitraum für Yahoo: Wähle den passenden historischen Range
    let range = '1y';
    if (timeframeMonths <= 6) range = '6m';
    else if (timeframeMonths <= 12) range = '1y';
    else range = '2y';

    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=1d`;
    
    const res = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      throw new Error(`Börsen-API Fehler: ${res.statusText}`);
    }

    const data = await res.json();
    const result = data.chart?.result?.[0];

    if (!result || !result.timestamp) {
      return NextResponse.json({ error: 'Keine historischen Daten gefunden' }, { status: 404 });
    }

    const timestamps: number[] = result.timestamp;
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close || [];
    const meta = result.meta || {};

    const name = meta.longName || meta.shortName || symbol;
    const currentPrice = meta.regularMarketPrice || closes[closes.length - 1] || 100.0;

    // Lückenlose tagesgenaue Historie filtern
    const history = timestamps
      .map((ts, idx) => {
        const date = new Date(ts * 1000);
        return {
          date: date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }),
          price: closes[idx] !== null && closes[idx] !== undefined ? Number(closes[idx]?.toFixed(2)) : null
        };
      })
      .filter((item): item is { date: string; price: number } => item.price !== null);

    return NextResponse.json({
      symbol,
      name,
      currentPrice: Number(currentPrice.toFixed(2)),
      trend: 0.25,
      vol: 0.30,
      maxDD: -0.25,
      history
    });
  } catch (err) {
    return NextResponse.json({ error: 'Fehler beim Laden der Marktdaten' }, { status: 500 });
  }
}
