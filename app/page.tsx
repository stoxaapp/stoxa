'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, ArrowUpRight, ArrowDownRight, Sparkles, Search } from 'lucide-react';

interface AssetData {
  ticker: string;
  name: string;
  price: number;
  trend: number;
  vol: number;
  maxDD: number;
  isFallback?: boolean;
}

const PRESET_ASSETS: Record<string, AssetData> = {
  "NVDA": { ticker: "NVDA", name: "NVIDIA Corp.", price: 219.40, trend: 0.45, vol: 0.38, maxDD: -0.28 },
  "AAPL": { ticker: "AAPL", name: "Apple Inc.", price: 346.20, trend: 0.20, vol: 0.18, maxDD: -0.15 },
  "BTC-USD": { ticker: "BTC-USD", name: "Bitcoin", price: 85200.00, trend: 0.55, vol: 0.50, maxDD: -0.45 },
  "TSLA": { ticker: "TSLA", name: "Tesla Inc.", price: 410.60, trend: 0.30, vol: 0.48, maxDD: -0.40 },
  "VOW3.DE": { ticker: "VOW3.DE", name: "Volkswagen AG", price: 70.20, trend: -0.05, vol: 0.28, maxDD: -0.35 },
  "SIE.DE": { ticker: "SIE.DE", name: "Siemens AG", price: 178.50, trend: 0.15, vol: 0.22, maxDD: -0.20 },
  "META": { ticker: "META", name: "Meta Platforms", price: 580.00, trend: 0.40, vol: 0.35, maxDD: -0.30 },
  "GOOGL": { ticker: "GOOGL", name: "Alphabet Inc.", price: 180.00, trend: 0.25, vol: 0.24, maxDD: -0.22 }
};

export default function StoxaApp() {
  const [query, setQuery] = useState("NVDA");
  const [activeAsset, setActiveAsset] = useState<AssetData>(PRESET_ASSETS["NVDA"]);
  const [timeframe, setTimeframe] = useState(12);
  const [suggestions, setSuggestions] = useState<{ symbol: string; name: string }[]>([]);

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

  const selectAsset = (tickerSymbol: string) => {
    const cleanTicker = tickerSymbol.toUpperCase().trim();
    const found = PRESET_ASSETS[cleanTicker] || {
      ticker: cleanTicker,
      name: cleanTicker,
      price: 150.00,
      trend: 0.20,
      vol: 0.30,
      maxDD: -0.25
    };
    setActiveAsset(found);
    setSuggestions([]);
  };

  // Szenario-Berechnung
  const timeFactor = timeframe / 12.0;
  const bullTarget = activeAsset.price * (1 + (Math.max(activeAsset.trend, 0.15) * timeFactor) + (activeAsset.vol * 0.4 * Math.sqrt(timeFactor)));
  const baseTarget = activeAsset.price * (1 + (Math.max(activeAsset.trend, 0.05) * timeFactor));
  const bearTarget = Math.max(activeAsset.price * (1 + (activeAsset.maxDD * timeFactor)), 1.0);

  const bullPct = ((bullTarget - activeAsset.price) / activeAsset.price) * 100;
  const basePct = ((baseTarget - activeAsset.price) / activeAsset.price) * 100;
  const bearPct = ((bearTarget - activeAsset.price) / activeAsset.price) * 100;

  // DYNAMISCHE, SYMMETRISCHE DATING- UND PFADGENERIERUNG
  const chartData = [];
  const steps = Math.min(Math.max(timeframe, 6), 24);

  // 1. Organische Vergangenheit (Symmetrisch zum Slider)
  for (let i = steps; i > 0; i--) {
    const progress = i / steps;
    const monthVal = Math.round(progress * timeframe);
    // Erzeugt eine organische Wellenbewegung statt einer starren Geraden
    const wave = Math.sin(i * 0.8) * (activeAsset.price * activeAsset.vol * 0.15);
    const histPrice = activeAsset.price * (1 - (activeAsset.trend * 0.15 * progress)) + wave;
    
    chartData.push({
      label: `-${monthVal}M`,
      Historical: Number(histPrice.toFixed(2)),
      Bull: null,
      Base: null,
      Bear: null
    });
  }

  // 2. Startpunkt "Heute" (Verbindungsglied)
  chartData.push({
    label: 'Heute',
    Historical: activeAsset.price,
    Bull: activeAsset.price,
    Base: activeAsset.price,
    Bear: activeAsset.price
  });

  // 3. Prognose-Punkte
  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    const monthVal = Math.round(progress * timeframe);
    
    chartData.push({
      label: `+${monthVal}M`,
      Historical: null,
      Bull: Number((activeAsset.price + (bullTarget - activeAsset.price) * progress).toFixed(2)),
      Base: Number((activeAsset.price + (baseTarget - activeAsset.price) * progress).toFixed(2)),
      Bear: Number((activeAsset.price + (bearTarget - activeAsset.price) * progress).toFixed(2)),
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
          Precision Benchmark Engine
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        
        {/* Search & Control Box */}
        <div className="bg-white border border-black/[0.06] rounded-3xl p-6 shadow-xl shadow-black/[0.02] relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Search Input & Autocomplete */}
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

              {/* Autocomplete Dropdown */}
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-black/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden">
                  {suggestions.map((item) => (
                    <button
                      key={item.symbol}
                      onClick={() => {
                        setQuery(item.symbol);
                        selectAsset(item.symbol);
                      }}
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
                    onClick={() => { setQuery(t); selectAsset(t); }}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${activeAsset.ticker === t ? 'bg-blue-50 border-blue-600 text-blue-600 font-semibold shadow-sm' : 'bg-white border-black/10 text-[#86868b] hover:border-black/30'}`}
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
                min="1" 
                max="60" 
                value={timeframe} 
                onChange={(e) => setTimeframe(Number(e.target.value))}
                className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#86868b] mt-2">
                <span>1 Monat</span>
                <span>2 Jahre</span>
                <span>5 Jahre</span>
              </div>
            </div>

          </div>
        </div>

        {/* Asset Overview Bar */}
        <div className="bg-white border border-black/[0.06] rounded-2xl px-6 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-[#1d1d1f]">{activeAsset.name} <span className="text-[#86868b] font-normal text-base">({activeAsset.ticker})</span></h2>
            <p className="text-xs text-[#86868b]">Volatilität: {(activeAsset.vol * 100).toFixed(1)}% | Trend: {(activeAsset.trend * 100).toFixed(1)}%</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#1d1d1f]">${activeAsset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
              <Activity className="w-3.5 h-3.5" /> Benchmark Model Active
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
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#86868b]">Performance & Szenario-Korridor</h3>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-700"><span className="w-2 h-2 rounded-full bg-slate-800"></span> Historie ({timeframe}M)</span>
              <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Bull Case</span>
              <span className="flex items-center gap-1.5 text-blue-600"><span className="w-2 h-2 rounded-full bg-blue-600"></span> Base Case</span>
              <span className="flex items-center gap-1.5 text-rose-600"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Bear Case</span>
            </div>
          </div>

          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
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
