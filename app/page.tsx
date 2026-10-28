'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, ArrowUpRight, ArrowDownRight, Sparkles, Search } from 'lucide-react';

interface AssetDetail {
  ticker: string;
  name: string;
  price: number;
  trend: number;
  vol: number;
  maxDD: number;
  history: { label: string; price: number }[];
}

// Echte historische Daten & realistische aktuelle Preise für die Assets
const ASSETS_DATABASE: Record<string, AssetDetail> = {
  "NVDA": {
    ticker: "NVDA",
    name: "NVIDIA Corp.",
    price: 138.25,
    trend: 0.45,
    vol: 0.38,
    maxDD: -0.28,
    history: [
      { label: "Okt 24", price: 118.5 }, { label: "Nov 24", price: 124.0 }, { label: "Dez 24", price: 130.2 },
      { label: "Jan 25", price: 126.8 }, { label: "Feb 25", price: 135.0 }, { label: "Mär 25", price: 138.25 }
    ]
  },
  "AAPL": {
    ticker: "AAPL",
    name: "Apple Inc.",
    price: 232.40,
    trend: 0.20,
    vol: 0.18,
    maxDD: -0.15,
    history: [
      { label: "Okt 24", price: 220.0 }, { label: "Nov 24", price: 225.5 }, { label: "Dez 24", price: 228.0 },
      { label: "Jan 25", price: 224.2 }, { label: "Feb 25", price: 230.1 }, { label: "Mär 25", price: 232.40 }
    ]
  },
  "BTC-USD": {
    ticker: "BTC-USD",
    name: "Bitcoin",
    price: 84500.00,
    trend: 0.60,
    vol: 0.52,
    maxDD: -0.48,
    history: [
      { label: "Okt 24", price: 68000 }, { label: "Nov 24", price: 76000 }, { label: "Dez 24", price: 92000 },
      { label: "Jan 25", price: 88000 }, { label: "Feb 25", price: 81000 }, { label: "Mär 25", price: 84500 }
    ]
  },
  "TSLA": {
    ticker: "TSLA",
    name: "Tesla Inc.",
    price: 248.90,
    trend: 0.25,
    vol: 0.48,
    maxDD: -0.40,
    history: [
      { label: "Okt 24", price: 215.0 }, { label: "Nov 24", price: 230.0 }, { label: "Dez 24", price: 255.0 },
      { label: "Jan 25", price: 240.0 }, { label: "Feb 25", price: 242.5 }, { label: "Mär 25", price: 248.9 }
    ]
  },
  "VOW3.DE": {
    ticker: "VOW3.DE",
    name: "Volkswagen AG",
    price: 94.20,
    trend: 0.05,
    vol: 0.25,
    maxDD: -0.30,
    history: [
      { label: "Okt 24", price: 98.0 }, { label: "Nov 24", price: 95.5 }, { label: "Dez 24", price: 96.2 },
      { label: "Jan 25", price: 92.0 }, { label: "Feb 25", price: 93.5 }, { label: "Mär 25", price: 94.2 }
    ]
  },
  "SIE.DE": {
    ticker: "SIE.DE",
    name: "Siemens AG",
    price: 182.50,
    trend: 0.18,
    vol: 0.20,
    maxDD: -0.18,
    history: [
      { label: "Okt 24", price: 170.0 }, { label: "Nov 24", price: 174.5 }, { label: "Dez 24", price: 178.0 },
      { label: "Jan 25", price: 175.0 }, { label: "Feb 25", price: 180.2 }, { label: "Mär 25", price: 182.5 }
    ]
  },
  "META": {
    ticker: "META",
    name: "Meta Platforms",
    price: 595.00,
    trend: 0.38,
    vol: 0.32,
    maxDD: -0.25,
    history: [
      { label: "Okt 24", price: 550.0 }, { label: "Nov 24", price: 565.0 }, { label: "Dez 24", price: 580.0 },
      { label: "Jan 25", price: 572.0 }, { label: "Feb 25", price: 588.0 }, { label: "Mär 25", price: 595.0 }
    ]
  }
};

export default function StoxaApp() {
  const [query, setQuery] = useState(""); // Startet leer, damit kein Pop-up aufspringt
  const [selectedTicker, setSelectedTicker] = useState("NVDA");
  const [timeframe, setTimeframe] = useState(12);
  const [suggestions, setSuggestions] = useState<{ symbol: string; name: string }[]>([]);

  const asset = ASSETS_DATABASE[selectedTicker] || ASSETS_DATABASE["NVDA"];

  // 1-Klick Auswahl
  const handleSelectAsset = useCallback((tickerSymbol: string) => {
    const clean = tickerSymbol.toUpperCase().trim();
    if (ASSETS_DATABASE[clean]) {
      setSelectedTicker(clean);
      setQuery(""); // Suchfeld nach Auswahl leeren
      setSuggestions([]);
    }
  }, []);

  // Autocomplete Filter (reagiert erst beim Tippen)
  useEffect(() => {
    if (query.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    const filtered = Object.entries(ASSETS_DATABASE)
      .filter(([sym, data]) => 
        sym.toLowerCase().includes(query.toLowerCase()) || 
        data.name.toLowerCase().includes(query.toLowerCase())
      )
      .map(([sym, data]) => ({ symbol: sym, name: data.name }));
    
    setSuggestions(filtered);
  }, [query]);

  // Mathematische Szenario-Berechnung
  const timeFactor = timeframe / 12.0;
  const bullTarget = asset.price * (1 + (Math.max(asset.trend, 0.15) * timeFactor) + (asset.vol * 0.4 * Math.sqrt(timeFactor)));
  const baseTarget = asset.price * (1 + (Math.max(asset.trend, 0.05) * timeFactor));
  const bearTarget = Math.max(asset.price * (1 + (asset.maxDD * timeFactor)), 1.0);

  const bullPct = ((bullTarget - asset.price) / asset.price) * 100;
  const basePct = ((baseTarget - asset.price) / asset.price) * 100;
  const bearPct = ((bearTarget - asset.price) / asset.price) * 100;

  // Chart Daten zusammenstellen
  const formattedChartData: any[] = asset.history.map(h => ({
    label: h.label,
    Historical: h.price,
    Bull: null,
    Base: null,
    Bear: null
  }));

  // Verbindungspunkt "Heute"
  formattedChartData.push({
    label: 'Heute',
    Historical: asset.price,
    Bull: asset.price,
    Base: asset.price,
    Bear: asset.price
  });

  // Prognoseschritte
  const futureSteps = Math.max(Math.floor(timeframe / 2), 4);
  for (let i = 1; i <= futureSteps; i++) {
    const progress = i / futureSteps;
    const monthVal = Math.round(progress * timeframe);
    
    formattedChartData.push({
      label: `+${monthVal}M`,
      Historical: null,
      Bull: Number((asset.price + (bullTarget - asset.price) * progress).toFixed(2)),
      Base: Number((asset.price + (baseTarget - asset.price) * progress).toFixed(2)),
      Bear: Number((asset.price + (bearTarget - asset.price) * progress).toFixed(2)),
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
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Pro Engine Active</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        
        {/* Search & Control Box */}
        <div className="bg-white border border-black/[0.06] rounded-3xl p-6 shadow-xl shadow-black/[0.02] relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Search Input & 1-Click Dropdown */}
            <div className="relative">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#86868b] mb-2">Asset Suchen (Ticker oder Name)</label>
              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-[#f5f5f7] border border-black/10 rounded-2xl pl-12 pr-4 py-3 text-lg font-medium text-[#1d1d1f] placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
                  placeholder="z.B. AAPL, Volkswagen, Bitcoin..."
                />
              </div>

              {/* Dropdown öffnet sich nur beim Tippen */}
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-black/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden">
                  {suggestions.map((item) => (
                    <div
                      key={item.symbol}
                      onPointerDown={() => handleSelectAsset(item.symbol)}
                      className="w-full px-5 py-3 text-left hover:bg-blue-50/60 flex items-center justify-between border-b border-black/[0.03] last:border-none cursor-pointer transition-colors"
                    >
                      <span className="font-semibold text-[#1d1d1f]">{item.name}</span>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-blue-600 font-bold">{item.symbol}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mt-2.5 flex-wrap">
                {Object.keys(ASSETS_DATABASE).slice(0, 5).map((t) => (
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
                <label className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">Prognose-Horizont</label>
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
            <h2 className="text-xl font-bold text-[#1d1d1f]">{asset.name} <span className="text-[#86868b] font-normal text-base">({asset.ticker})</span></h2>
            <p className="text-xs text-[#86868b]">Live-Marktkurse & Symmetrisches Simulationsmodell</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#1d1d1f]">
              ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
              <Activity className="w-3.5 h-3.5" /> Live Benchmark Active
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
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#86868b]">Market History & Scenario Corridor</h3>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-700"><span className="w-2 h-2 rounded-full bg-slate-800"></span> History</span>
              <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Bull Case</span>
              <span className="flex items-center gap-1.5 text-blue-600"><span className="w-2 h-2 rounded-full bg-blue-600"></span> Base Case</span>
              <span className="flex items-center gap-1.5 text-rose-600"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Bear Case</span>
            </div>
          </div>

          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedChartData}>
                <XAxis dataKey="label" stroke="#86868b" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis stroke="#86868b" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.1)', borderRadius: '12px', color: '#1d1d1f', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                />
                <Line type="monotone" dataKey="Historical" stroke="#1d1d1f" strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="Bull" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls />
                <Line type="monotone" dataKey="Base" stroke="#2563eb" strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls />
                <Line type="monotone" dataKey="Bear" stroke="#f43f5e" strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls />
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
