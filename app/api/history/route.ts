import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'NVDA';
  const timeframe = parseInt(searchParams.get('timeframe') || '12', 10);

  // Dynamischer Zeitraum für Yahoo Finance basierend auf dem Slider
  let range = '1y';
  let interval = '1wk';

  if (timeframe <= 6) {
    range = '6m';
    interval = '1d';
  } else if (timeframe <= 12) {
    range = '1y';
    interval = '1wk';
  } else if (timeframe <= 24) {
    range = '2y';
    interval = '1wk';
  } else {
    range = '5y';
    interval = '1mo';
  }

  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
    const res = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 300 } // Cache 5 Minuten auf dem Server
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Börsen-API nicht erreichbar' }, { status: res.status });
    }

    const data = await res.json();
    const result = data.chart?.result?.[0];

    if (!result) {
      return NextResponse.json({ error: 'Keine Daten gefunden' }, { status: 404 });
    }

    const timestamps: number[] = result.timestamp || [];
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close || [];
    const name = result.meta?.longName || result.meta?.shortName || symbol;

    const history = timestamps
      .map((ts, idx) => {
        const date = new Date(ts * 1000);
        return {
          date: date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }),
          price: closes[idx] ? Number(closes[idx]?.toFixed(2)) : null
        };
      })
      .filter((item): item is { date: string; price: number } => item.price !== null);

    return NextResponse.json({
      symbol,
      name,
      currentPrice: history.length > 0 ? history[history.length - 1].price : 100,
      history
    });
  } catch (err) {
    return NextResponse.json({ error: 'Server-Fehler beim Datenabruf' }, { status: 500 });
  }
}
