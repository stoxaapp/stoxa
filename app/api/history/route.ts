import { NextResponse } from 'next/server';

// Ticker-spezifische Fallback-Parameter für Asset-Eigenschaften
const ASSET_PRESETS: Record<string, { trend: number; vol: number; maxDD: number }> = {
  "NVDA": { trend: 0.42, vol: 0.38, maxDD: -0.28 },
  "AAPL": { trend: 0.16, vol: 0.18, maxDD: -0.15 },
  "BTC-USD": { trend: 0.55, vol: 0.52, maxDD: -0.45 },
  "TSLA": { trend: 0.22, vol: 0.46, maxDD: -0.42 },
  "VOW3.DE": { trend: 0.04, vol: 0.22, maxDD: -0.28 },
  "SIE.DE": { trend: 0.14, vol: 0.19, maxDD: -0.16 },
  "META": { trend: 0.32, vol: 0.31, maxDD: -0.24 },
  "AMZN": { trend: 0.20, vol: 0.24, maxDD: -0.20 },
  "MSFT": { trend: 0.18, vol: 0.19, maxDD: -0.16 },
  "GOOGL": { trend: 0.17, vol: 0.21, maxDD: -0.18 }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol')?.toUpperCase().trim() || 'NVDA';
  const timeframeMonths = parseInt(searchParams.get('timeframe') || '12', 10);

  try {
    const range = timeframeMonths > 12 ? '2y' : '1y';
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=1d`;

    const res = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      throw new Error(`API Proxy Fehler: ${res.statusText}`);
    }

    const data = await res.json();
    const result = data.chart?.result?.[0];

    if (!result || !result.timestamp) {
      return NextResponse.json({ error: 'Keine Daten gefunden' }, { status: 404 });
    }

    const timestamps: number[] = result.timestamp;
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close || [];
    const meta = result.meta || {};

    const name = meta.longName || meta.shortName || symbol;
    const currentPrice = meta.regularMarketPrice || closes[closes.length - 1] || 100.0;

    // Alle gültigen historischen Handelstage filtern
    const allHistory = timestamps
      .map((ts, idx) => {
        const date = new Date(ts * 1000);
        return {
          timestamp: ts,
          date: date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }),
          price: closes[idx] !== null && closes[idx] !== undefined ? Number(closes[idx]?.toFixed(2)) : null
        };
      })
      .filter((item): item is { timestamp: number; date: string; price: number } => item.price !== null);

    // Filtere auf den gewählten Zeitraum
    const cutoffTimestamp = Math.floor(Date.now() / 1000) - (timeframeMonths * 30 * 24 * 60 * 60);
    let filteredHistory = allHistory.filter(item => item.timestamp >= cutoffTimestamp);

    if (filteredHistory.length < 5) {
      filteredHistory = allHistory.slice(-Math.max(timeframeMonths * 18, 15));
    }

    // --- DYNAMISCHE CALCULATED METRICS AUS DEN TAGESKURSEN ---
    let trend = ASSET_PRESETS[symbol]?.trend ?? 0.18;
    let vol = ASSET_PRESETS[symbol]?.vol ?? 0.25;
    let maxDD = ASSET_PRESETS[symbol]?.maxDD ?? -0.22;

    if (filteredHistory.length > 20) {
      const prices = filteredHistory.map(h => h.price);
      
      // 1. CAGR / Annualisierter Trend aus historischem Start/Endpreis
      const startPrice = prices[0];
      const endPrice = prices[prices.length - 1];
      const years = filteredHistory.length / 252; // ca. 252 Handelstage pro Jahr
      
      if (startPrice > 0 && years > 0) {
        const rawTrend = Math.pow(endPrice / startPrice, 1 / years) - 1;
        // Trend sinnvoll eingrenzen (-30% bis +80%)
        trend = Math.max(-0.30, Math.min(0.80, Number(rawTrend.toFixed(4))));
      }

      // 2. Daily Log-Returns für echte annualisierte Volatilität
      const dailyReturns: number[] = [];
      for (let i = 1; i < prices.length; i++) {
        dailyReturns.push(Math.log(prices[i] / prices[i - 1]));
      }
      
      const meanReturn = dailyReturns.reduce((acc, val) => acc + val, 0) / dailyReturns.length;
      const variance = dailyReturns.reduce((acc, val) => acc + Math.pow(val - meanReturn, 2), 0) / dailyReturns.length;
      const dailyVol = Math.sqrt(variance);
      const annVol = dailyVol * Math.sqrt(252); // Annualisieren
      
      vol = Math.max(0.08, Math.min(0.95, Number(annVol.toFixed(4))));

      // 3. Peak-to-Trough Maximum Drawdown (MaxDD)
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
    return NextResponse.json({ error: 'Fehler beim Laden der Marktdaten' }, { status: 500 });
  }
}
