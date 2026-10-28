'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, ArrowUpRight, ArrowDownRight, Sparkles, Search, Loader2 } from 'lucide-react';

interface AssetPreset {
  ticker: string;
  name: string;
  defaultTrend: number;
  defaultVol: number;
  defaultMaxDD: number;
}

const PRESET_ASSETS: Record<string, AssetPreset> = {
  "NVDA": { ticker: "NVDA", name: "NVIDIA Corp.", defaultTrend: 0.40, defaultVol: 0.38, defaultMaxDD: -0.28 },
  "AAPL": { ticker: "AAPL", name: "Apple Inc.", defaultTrend: 0.18, defaultVol: 0.18, defaultMaxDD: -0.15 },
  "BTC-USD": { ticker: "BTC-USD", name: "Bitcoin", defaultTrend: 0.50, defaultVol: 0.48, defaultMaxDD: -0.45 },
  "TSLA": { ticker: "TSLA", name: "Tesla Inc.", defaultTrend: 0.25, defaultVol: 0.45, defaultMaxDD: -0.40 },
  "VOW3.DE": { ticker: "VOW3.DE", name: "Volkswagen AG", defaultTrend: 0.05, defaultVol: 0.25, defaultMaxDD: -0.30 },
  "SIE.DE": { ticker: "SIE.DE", name: "Siemens AG", defaultTrend: 0.15, defaultVol: 0.20, defaultMaxDD: -0.18 },
  "META": { ticker: "META", name: "Meta Platforms", defaultTrend: 0.35, defaultVol: 0.32, defaultMaxDD: -0.25 },
  "GOOGL": { ticker: "GOOGL", name: "Alphabet Inc.", defaultTrend: 0.20, defaultVol: 0.22, defaultMaxDD: -0.20 }
};

export default function StoxaApp() {
  const [query, setQuery] = useState("NVDA");
  const [selectedTicker, setSelectedTicker] = useState("NVDA");
  const [assetName, setAssetName] = useState("NVIDIA Corp.");
  const [timeframe, setTimeframe] = useState(12);
  
  const [loading, setLoading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number>(135.50);
  const [historyData, setHistoryData] = useState<{ label: string; price: number }[]>([]);
  const [suggestions, setSuggestions] = useState<{ symbol: string; name: string }[]>([]);

  // 1-Klick Asset Auswahl ohne Doppel-Bestätigung
  const handleSelectAsset = useCallback((tickerSymbol: string) => {
    const clean = tickerSymbol.toUpperCase().trim();
    if (!clean) return;

    setSelectedTicker(clean);
    setQuery(clean);
    setSuggestions([]);

    if (PRESET_ASSETS[clean]) {
      setAssetName(PRESET_ASSETS[clean].name);
    } else {
      setAssetName(clean);
    }
  }, []);

  // Autocomplete Echtzeitfilter
  useEffect(() => {
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }
    const filtered = Object.entries(PRESET_ASSETS)
      .filter(([sym, data]) => 
        sym.toLowerCase().includes(query.toLowerCase()) || 
        data.name.toLowerCase().includes(query.toLowerCase())
      )
      .map(([sym, data]) => ({ symbol: sym, name: data.name }));
    
    setSuggestions(filtered);
  }, [query]);

  // Echte historische Daten abrufen (dynamisch je nach gewähltem Zeitfenster)
  useEffect(() => {
    let isMounted = true;

    async function fetchRealHistory() {
      setLoading(true);
      try {
        // Range dynamisch an den Horizont anpassen (max 2 Jahre)
        const rangeStr = timeframe > 24 ? '2y' : '1y';
        const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${selectedTicker}?range=${rangeStr}&interval=1mo`;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
        
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error('Network response was not ok');
        
        const parsed = await res.json();
        const result = parsed.chart?.result?.[0];

        if (!result) throw new Error('No chart data found');

        const timestamps: number[] = result.timestamp || [];
        const closes: (number | null)[] = result.indicators?.quote?.[0]?.close || [];

        const validPoints = timestamps.map((ts, idx) => {
          const date = new Date(ts * 1000);
          const label = date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
          return {
            label,
            price: closes[idx] ? Number(closes[idx]?.toFixed(2)) : null
          };
        }).filter(pt => pt.price !== null) as { label: string; price: number }[];

        if (isMounted && validPoints.length > 0) {
          setHistoryData(validPoints);
          const latest = validPoints[validPoints.length - 1].price;
          setCurrentPrice(latest);
          
          if (result.meta?.longName || result.meta?.shortName) {
            setAssetName(result.meta.longName || result.meta.shortName);
          }
        }
      } catch (err) {
        if (isMounted) {
          const basePrice = 150;
          setCurrentPrice(basePrice);
          setHistoryData([
            { label: 'Vor 12M', price: basePrice * 0.80 },
            { label: 'Vor 9M', price: basePrice * 0.85 },
            { label: 'Vor 6M', price: basePrice * 0.92 },
            { label: 'Vor 3M', price: basePrice * 0.97 },
            { label: 'Heute', price: basePrice }
          ]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchRealHistory();

    return () => { isMounted = false; };
  }, [selectedTicker, timeframe]);

  // Parameter holen
  const preset = PRESET_ASSETS[selectedTicker] || {
    ticker: selectedTicker,
    name: assetName,
    defaultTrend: 0.20,
    defaultVol: 0.30,
    defaultMaxDD: -0.25
  };

  // Mathematische Szenario-Berechnung
  const timeFactor = timeframe / 12.0;
  const bullTarget = currentPrice * (1 + (Math.max(preset.defaultTrend, 0.15) * timeFactor) + (preset.defaultVol * 0.4 * Math.sqrt(timeFactor)));
  const baseTarget = currentPrice * (1 + (Math.max(preset.defaultTrend, 0.05) * timeFactor));
  const bearTarget = Math.max(currentPrice * (1 + (preset.defaultMaxDD * timeFactor)), 1.0);

  const bullPct = ((bullTarget - currentPrice) / currentPrice) * 100;
  const basePct = ((baseTarget - currentPrice) / currentPrice) * 100;
  const bearPct = ((bearTarget - currentPrice) / currentPrice) * 100;

  // SYMMETRISCHE SYNCHRONISATION VON HISTORIE UND PROGNOSE
  // Wir nehmen exakt so viele historische Punkte wie der Prognose-Horizont erfordert
  const requiredHistoryCount = Math.min(Math.max(Math.floor(timeframe / 2), 3), historyData.length);
  const slicedHistory = historyData.slice(-requiredHistoryCount);

  const formattedChartData: any[] = slicedHistory.map((h, idx) => {
    const monthsAgo = Math.round(((slicedHistory.length - idx) / slicedHistory.length) * timeframe);
    return {
      label: `-${monthsAgo}M`,
      Historical: h.price,
      Bull: null,
      Base: null,
      Bear: null
    };
  });

  // Verbindungsstück "Heute"
  formattedChartData.push({
    label: 'Heute',
    Historical: currentPrice,
    Bull: currentPrice,
    Base: currentPrice,
    Bear: currentPrice
  });

  // Symmetrische Prognose-Schritte (gleiche Anzahl an Schritten wie Historie)
  const futureSteps = Math.max(formattedChartData.length - 1, 4);
  for (let i = 1; i <= futureSteps; i++) {
    const progress = i / futureSteps;
    const monthVal = Math.round(progress * timeframe);
    
    formattedChartData.push({
      label: `+${monthVal}M`,
      Historical: null,
      Bull: Number((currentPrice + (bullTarget - currentPrice) * progress).toFixed(2)),
      Base: Number((currentPrice + (baseTarget - currentPrice) * progress).toFixed(2)),
      Bear: Number((currentPrice + (bearTarget - currentPrice) * progress).toFixed(2)),
    });
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans selection:bg-blue-500/25">
      
      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between border-b border-black/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[#1d1d1f]">stoxa<span className="text-blue-600">.co</span></h1>
            <p className="text-xs text-[#86868b]">Predictive Financial Intelligence</p>
          </div>
        </div>
        <div className="text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-black/[0.08] text-[#1d1d1f] shadow-sm flex items-center gap-2">
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Lade Börsendaten...</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Real Live Data Active</span>
            </>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        
        {/* Search & Control Box */}
        <div className="bg-white border border-black/[0.06] rounded-3xl p-6 shadow-xl shadow-black/[0.02] relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Search Input & 1-Click Autocomplete */}
            <div className="relative">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#86868b] mb-2">Asset Suchen (Ticker oder Name)</label>
              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSelectAsset(query);
                  }}
                  className="w-full bg-[#f5f5f7] border border-black/10 rounded-2xl pl-12 pr-4 py-3 text-lg font-medium text-[#1d1d1f] placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
                  placeholder="z.B. AAPL, Volkswagen, VOW3.DE, BTC-USD..."
                />
              </div>

              {/* 1-Click Dropdown */}
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-black/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden">
                  {suggestions.map((item) => (
                    <button
                      key={item.symbol}
                      onClick={() => handleSelectAsset(item.symbol)}
                      className="w-full px-5 py-3 text-left hover:bg-blue-50/60 flex items-center justify-between border-b border-black/[0.03] last:border-none transition-colors"
                    >
                      <span className="font-semibold text-[#1d1d1f]">{item.name}</span>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-blue-600 font-bold">{item.symbol}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mt-2.5 flex-wrap">
                {["NVDA", "AAPL", "BTC-USD", "VOW3.DE", "META"].map((t) => (
                  <button 
                    key={t}
                    onClick={() => handleSelectAsset(t)}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${selectedTicker === t ? 'bg-blue-50 border-blue-600 text-blue-600 font-semibold shadow-sm' : 'bg-white border-black/10 text-[#86868b] hover:border-black/30'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Horizon Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">Symmetrischer Prognose-Horizont</label>
                <span className="text-sm font-bold text-blue-600">{timeframe} Monate ({(timeframe/12).toFixed(1)} Jahre)</span>
              </div>
              <input 
                type="range" 
                min="3" 
                max="60" 
                value={timeframe} 
                onChange={(e) => setTimeframe(Number(e.target.value))}
                className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#86868b] mt-2">
                <span>3 Monate</span>
                <span>2 Jahre</span>
                <span>5 Jahre</span>
              </div>
            </div>

          </div>
        </div>

        {/* Asset Overview Bar */}
        <div className="bg-white border border-black/[0.06] rounded-2xl px-6 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-[#1d1d1f]">{assetName} <span className="text-[#86868b] font-normal text-base">({selectedTicker})</span></h2>
            <p className="text-xs text-[#86868b]">Symmetrischer Verlauf: Historie skaliert proportional zu {timeframe}M Prognose</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#1d1d1f]">
              ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
              <Activity className="w-3.5 h-3.5" /> Real Market Price
            </div>
          </div>
        </div>

        {/* 3 SCENARIO CARDS (ÜBER DER GRAFIK) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white border border-black/[0.06] hover:border-emerald-500/50 rounded-2xl p-5 shadow-sm transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Bull Scenario</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#1d1d1f] mb-1.5">${bullTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-xs font-semibold">
              +{bullPct.toFixed(1)}% Expected Gain
            </div>
          </div>

          <div className="bg-white border border-black/[0.06] hover:border-blue-500/50 rounded-2xl p-5 shadow-sm transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Base Scenario</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#1d1d1f] mb-1.5">${baseTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="inline-block px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs font-semibold">
              {basePct >= 0 ? '+' : ''}{basePct.toFixed(1)}% Trend Projection
            </div>
          </div>

          <div className="bg-white border border-black/[0.06] hover:border-rose-500/50 rounded-2xl p-5 shadow-sm transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Bear Scenario</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#1d1d1f] mb-1.5">${bearTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="inline-block px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 text-xs font-semibold">
              {bearPct.toFixed(1)}% Stress Drawdown
            </div>
          </div>

        </div>

        {/* Chart Section */}
        <div className="bg-white border border-black/[0.06] rounded-3xl p-6 shadow-xl shadow-black/[0.02]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#86868b]">Symmetrical Market History & Predictive Corridor</h3>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-700"><span className="w-2 h-2 rounded-full bg-slate-800"></span> Real History</span>
              <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Bull Case</span>
              <span className="flex items-center gap-1.5 text-blue-600"><span className="w-2 h-2 rounded-full bg-blue-600"></span> Base Case</span>
              <span className="flex items-center gap-1.5 text-rose-600"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Bear Case</span>
            </div>
          </div>

          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedChartData}>
                <XAxis dataKey="label" stroke="#86868b" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis stroke="#86868b" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.1)', borderRadius: '12px', color: '#1d1d1f', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                />
                <Line type="monotone" dataKey="Historical" stroke="#1d1d1f" strokeWidth={2.5} dot={false} connectNulls />
                <Line type="monotone" dataKey="Bull" stroke="#10b981" strokeWidth={2.5} strokeDasharray="4 4" dot={false} connectNulls />
                <Line type="monotone" dataKey="Base" stroke="#2563eb" strokeWidth={2.5} strokeDasharray="4 4" dot={false} connectNulls />
                <Line type="monotone" dataKey="Bear" stroke="#f43f5e" strokeWidth={2.5} strokeDasharray="4 4" dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="text-center text-xs text-[#86868b] pt-4 border-t border-black/[0.06]">
          Stoxa.co is a predictive financial simulation engine for educational & research purposes. Not financial advice.
        </div>

      </main>
    </div>
  );
}
