import { NextResponse } from 'next/server';

const ASSET_PRESETS: Record<string, { trend: number; vol: number; maxDD: number }> = {
  "GM": { trend: 0.12, vol: 0.32, maxDD: -0.35 },
  "WMT": { trend: 0.18, vol: 0.18, maxDD: -0.15 },
  "NVDA": { trend: 0.42, vol: 0.38, maxDD: -0.28 },
  "AAPL": { trend: 0.16, vol: 0.18, maxDD: -0.15 },
  "BTC-USD": { trend: 0.55, vol: 0.52, maxDD: -0.45 },
  "TSLA": { trend: 0.22, vol: 0.46, maxDD: -0.42 },
  "BMW.DE": { trend: 0.08, vol: 0.24, maxDD: -0.30 },
};

// Hilfsfunktion: Konvertiert ausgeschriebene Namen automatisch in Ticker via Yahoo Search API
async function resolveSymbol(input: string): Promise<string> {
  const clean = input.toUpperCase().trim();
  
  // Bekannte Shortcuts direkt mappen
  const shortcuts: Record<string, string> = {
    "GOOGLE": "GOOGL", "ALPHABET": "GOOGL", "BITCOIN": "BTC-USD",
    "APPLE": "AAPL", "TESLA": "TSLA", "MICROSOFT": "MSFT",
    "NVIDIA": "NVDA", "WALMART": "WMT", "BMW": "BMW.DE",
    "VOLKSWAGEN": "VOW3.DE", "GENERAL MOTORS": "GM"
  };
  if (shortcuts[clean]) return shortcuts[clean];

  // Wenn der Input Leerzeichen enthält (z.B. "General Motors"), suchen wir nach dem Ticker
  try {
    const searchUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(input)}&quotesCount=1`;
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 86400 } // Cache für 24h
    });
    const data = await res.json();
    if (data.quotes && data.quotes.length > 0) {
      return data.quotes[0].symbol;
    }
  } catch (e) {
    // Fallback auf Originalinput
  }

  return clean;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get('symbol'] || 'NVDA';
  const timeframeMonths = parseInt(searchParams.get('timeframe') || '12', 10);

  try {
    // Automatische Auflösung von Namen zu Ticker
    const symbol = await resolveSymbol(rawQuery);

    const range = timeframeMonths > 12 ? '2y' : '1y';
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=1d`;

    const res = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      throw new Error(`Asset '${rawQuery}' not found.`);
    }

    const data = await res.json();
    const result = data.chart?.result?.[0];

    if (!result || !result.timestamp) {
      return NextResponse.json({ error: 'No data found for this asset.' }, { status: 404 });
    }

    const timestamps: number[] = result.timestamp;
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close || [];
    const meta = result.meta || {};

    const name = meta.longName || meta.shortName || symbol;
    const currentPrice = meta.regularMarketPrice || closes[closes.length - 1] || 100.0;

    const allHistory = timestamps
      .map((ts, idx) => {
        const date = new Date(ts * 1000);
        return {
          timestamp: ts,
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
          price: closes[idx] !== null && closes[idx] !== undefined ? Number(closes[idx]?.toFixed(2)) : null
        };
      })
      .filter((item): item is { timestamp: number; date: string; price: number } => item.price !== null);

    const cutoffTimestamp = Math.floor(Date.now() / 1000) - (timeframeMonths * 30 * 24 * 60 * 60);
    let filteredHistory = allHistory.filter(item => item.timestamp >= cutoffTimestamp);

    if (filteredHistory.length < 5) {
      filteredHistory = allHistory.slice(-Math.max(timeframeMonths * 18, 15));
    }

    let trend = ASSET_PRESETS[symbol]?.trend ?? 0.15;
    let vol = ASSET_PRESETS[symbol]?.vol ?? 0.25;
    let maxDD = ASSET_PRESETS[symbol]?.maxDD ?? -0.22;

    if (filteredHistory.length > 20) {
      const prices = filteredHistory.map(h => h.price);
      const startPrice = prices[0];
      const endPrice = prices[prices.length - 1];
      const years = filteredHistory.length / 252;
      
      if (startPrice > 0 && years > 0) {
        const rawTrend = Math.pow(endPrice / startPrice, 1 / years) - 1;
        trend = Math.max(-0.30, Math.min(0.80, Number(rawTrend.toFixed(4))));
      }

      const dailyReturns: number[] = [];
      for (let i = 1; i < prices.length; i++) {
        dailyReturns.push(Math.log(prices[i] / prices[i - 1]));
      }
      
      const meanReturn = dailyReturns.reduce((acc, val) => acc + val, 0) / dailyReturns.length;
      const variance = dailyReturns.reduce((acc, val) => acc + Math.pow(val - meanReturn, 2), 0) / dailyReturns.length;
      const annVol = Math.sqrt(variance) * Math.sqrt(252);
      
      vol = Math.max(0.08, Math.min(0.95, Number(annVol.toFixed(4))));

      let peak = prices[0];
      let maxDrawdown = 0;
      for (const p of prices) {
        if (p > peak) peak = p;
        const dd = (p - peak) / peak;
        if (dd < maxDrawdown) maxDrawdown = dd;
      }
      maxDD = Math.max(-0.70, Math.min(-0.05, Number(maxDrawdown.toFixed(4))));
    }

    return NextResponse.json({
      symbol,
      name,
      currentPrice: Number(currentPrice.toFixed(2)),
      trend,
      vol,
      maxDD,
      history: filteredHistory.map(({ date, price }) => ({ date, price }))
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch asset data' }, { status: 500 });
  }
}
