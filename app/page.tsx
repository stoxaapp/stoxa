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
  // Hochauflösende historische Kursreihe (Wochen-/Tagesdaten)
  historyPrices: number[]; 
}

const ASSETS_DATABASE: Record<string, AssetDetail> = {
  "NVDA": {
    ticker: "NVDA", name: "NVIDIA Corp.", price: 138.25, trend: 0.45, vol: 0.38, maxDD: -0.28,
    historyPrices: [92.0, 95.5, 98.0, 97.2, 102.0, 105.2, 108.5, 112.0, 118.0, 115.5, 121.0, 124.5, 122.0, 119.8, 125.0, 128.5, 131.0, 129.0, 126.5, 132.0, 135.5, 134.0, 136.2, 138.25]
  },
  "AAPL": {
    ticker: "AAPL", name: "Apple Inc.", price: 232.40, trend: 0.20, vol: 0.18, maxDD: -0.15,
    historyPrices: [185.0, 188.2, 192.0, 195.0, 198.5, 202.0, 205.5, 210.2, 212.0, 215.5, 218.5, 222.0, 224.0, 221.8, 223.5, 225.0, 228.5, 227.0, 226.0, 229.0, 231.5, 230.0, 231.2, 232.40]
  },
  "BTC-USD": {
    ticker: "BTC-USD", name: "Bitcoin", price: 84500.00, trend: 0.60, vol: 0.52, maxDD: -0.48,
    historyPrices: [54000, 56000, 58000, 61000, 64000, 62000, 66000, 69000, 72000, 76000, 80000, 85000, 92000, 90000, 88000, 85000, 82000, 81000, 83000, 86000, 84000, 82500, 83800, 84500]
  },
  "TSLA": {
    ticker: "TSLA", name: "Tesla Inc.", price: 248.90, trend: 0.25, vol: 0.48, maxDD: -0.40,
    historyPrices: [160.0, 165.0, 172.0, 180.0, 195.0, 215.0, 220.0, 225.0, 230.0, 240.0, 255.0, 248.0, 235.0, 220.0, 228.0, 235.0, 240.0, 242.0, 238.0, 245.0, 241.0, 244.5, 246.0, 248.90]
  },
  "VOW3.DE": {
    ticker: "VOW3.DE", name: "Volkswagen AG", price: 94.20, trend: 0.05, vol: 0.25, maxDD: -0.30,
    historyPrices: [112.0, 110.5, 108.0, 106.2, 104.5, 102.5, 100.0, 99.2, 98.0, 97.5, 95.5, 94.0, 96.2, 95.8, 94.5, 92.0, 91.5, 93.0, 93.5, 92.8, 94.0, 93.2, 93.8, 94.20]
  },
  "SIE.DE": {
    ticker: "SIE.DE", name: "Siemens AG", price: 182.50, trend: 0.18, vol: 0.20, maxDD: -0.18,
    historyPrices: [155.0, 158.2, 160.0, 162.0, 165.5, 168.5, 170.0, 171.5, 172.0, 174.0, 175.5, 176.0, 174.0, 173.5, 175.0, 178.0, 179.5, 180.0, 178.5, 181.0, 180.5, 181.8, 182.0, 182.50]
  },
  "META": {
    ticker: "META", name: "Meta Platforms", price: 595.00, trend: 0.38, vol: 0.32, maxDD: -0.25,
    historyPrices: [450.0, 465.0, 480.0, 495.0, 515.0, 530.0, 550.0, 558.0, 565.0, 572.0, 565.0, 540.0, 525.0, 545.0, 560.0, 580.0, 575.0, 572.0, 585.0, 590.0, 588.0, 591.0, 593.0, 595.00]
  }
};

export default function StoxaApp() {
  const [query, setQuery] = useState("");
  const [selectedTicker, setSelectedTicker] = useState("NVDA");
  const [timeframe, setTimeframe] = useState(12);
  const [suggestions, setSuggestions] = useState<{ symbol: string; name: string }[]>([]);

  const asset = ASSETS_DATABASE[selectedTicker] || ASSETS_DATABASE["NVDA"];

  const handleSelectAsset = useCallback((tickerSymbol: string) => {
    const clean = tickerSymbol.toUpperCase().trim();
    if (ASSETS_DATABASE[clean]) {
      setSelectedTicker(clean);
      setQuery("");
      setSuggestions([]);
    }
  }, []);

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

  // Szenario-Berechnung
  const timeFactor = timeframe / 12.0;
  const bullTarget = asset.price * (1 + (Math.max(asset.trend, 0.15) * timeFactor) + (asset.vol * 0.4 * Math.sqrt(timeFactor)));
  const baseTarget = asset.price * (1 + (Math.max(asset.trend, 0.05) * timeFactor));
  const bearTarget = Math.max(asset.price * (1 + (asset.maxDD * timeFactor)), 1.0);

  const bullPct = ((bullTarget - asset.price) / asset.price) * 100;
  const basePct = ((baseTarget - asset.price) / asset.price) * 100;
  const bearPct = ((bearTarget - asset.price) / asset.price) * 100;

  // HOCHAUFLÖSENDE WOCHEN-/TAGES-HISTORIE GENERIEREN
  const formattedChartData: any[] = [];
  const currentDate = new Date();
  
  const totalPoints = 24; // 24 hochauflösende Datenpunkte für detaillierten Verlauf
  const rawPrices = asset.historyPrices;

  for (let i = totalPoints; i >= 1; i--) {
    // Proportionale Aufteilung auf den gewählten Zeitrahmen
    const daysAgo = Math.round((i / totalPoints) * (timeframe * 30));
    const pastDate = new Date(currentDate.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const label = pastDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });

    const priceIdx = Math.floor(((totalPoints - i) / totalPoints) * (rawPrices.length - 1));
    const histPrice = rawPrices[priceIdx];

    formattedChartData.push({
      label,
      Historical: histPrice,
      Bull: null,
      Base: null,
      Bear: null
    });
  }

  // Anknüpfpunkt "Heute"
  formattedChartData.push({
    label: 'Heute',
    Historical: asset.price,
    Bull: asset.price,
    Base: asset.price,
    Bear: asset.price
  });

  // Symmetrische Prognoseschritte
  const futureSteps = totalPoints;
  for (let i = 1; i <= futureSteps; i++) {
    const progress = i / futureSteps;
    const futureDays = Math.round(progress * (timeframe * 30));
    const futureDate = new Date(currentDate.getTime() + futureDays * 24 * 60 * 60 * 1000);
    const label = futureDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
    
    formattedChartData.push({
      label,
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
          <span>High-Resolution Feed Active</span>
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
                <label className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">Symmetrischer Horizont</label>
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
            <p className="text-xs text-[#86868b]">Detaillierte historische Wochenkurse & dynamischer Korridor</p>
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
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#86868b]">High-Resolution Weekly History & Corridor</h3>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-700"><span className="w-2 h-2 rounded-full bg-slate-800"></span> Weekly History</span>
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
