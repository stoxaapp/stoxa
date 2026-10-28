'use client';

import React, { useState, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles,
  Search,
  Check
} from 'lucide-react';

// Extended Mock Database with Company Names, Keywords, and Realistic Asset Parameters
interface AssetInfo {
  ticker: string;
  name: string;
  aliases: string[];
  price: number;
  trend: number;
  vol: number;
  maxDD: number;
  category: string;
}

const EXTENDED_ASSETS: Record<string, AssetInfo> = {
  "NVDA": { 
    ticker: "NVDA", 
    name: "NVIDIA Corporation", 
    aliases: ["nvidia", "nvda", "graphics", "ai", "chips"], 
    price: 138.25, 
    trend: 0.65, 
    vol: 0.42, 
    maxDD: -0.32,
    category: "Semiconductors"
  },
  "AAPL": { 
    ticker: "AAPL", 
    name: "Apple Inc.", 
    aliases: ["apple", "aapl", "iphone", "mac", "ios"], 
    price: 228.20, 
    trend: 0.22, 
    vol: 0.20, 
    maxDD: -0.18,
    category: "Consumer Tech"
  },
  "GOOGL": { 
    ticker: "GOOGL", 
    name: "Alphabet Inc. (Google)", 
    aliases: ["google", "googl", "goog", "alphabet", "youtube", "search"], 
    price: 176.80, 
    trend: 0.28, 
    vol: 0.24, 
    maxDD: -0.22,
    category: "Internet / Tech"
  },
  "META": { 
    ticker: "META", 
    name: "Meta Platforms, Inc.", 
    aliases: ["meta", "facebook", "fb", "instagram", "whatsapp"], 
    price: 585.40, 
    trend: 0.45, 
    vol: 0.35, 
    maxDD: -0.29,
    category: "Social Media / Tech"
  },
  "BTC-USD": { 
    ticker: "BTC-USD", 
    name: "Bitcoin", 
    aliases: ["bitcoin", "btc", "crypto", "satoshi"], 
    price: 88450.00, 
    trend: 0.75, 
    vol: 0.58, 
    maxDD: -0.48,
    category: "Digital Currency"
  },
  "TSLA": { 
    ticker: "TSLA", 
    name: "Tesla, Inc.", 
    aliases: ["tesla", "tsla", "elon", "ev", "cars"], 
    price: 248.50, 
    trend: 0.25, 
    vol: 0.52, 
    maxDD: -0.45,
    category: "Automotive / Energy"
  },
  "MSFT": { 
    ticker: "MSFT", 
    name: "Microsoft Corporation", 
    aliases: ["microsoft", "msft", "windows", "azure", "xbox"], 
    price: 428.90, 
    trend: 0.24, 
    vol: 0.21, 
    maxDD: -0.17,
    category: "Software / Cloud"
  },
  "AMZN": { 
    ticker: "AMZN", 
    name: "Amazon.com, Inc.", 
    aliases: ["amazon", "amzn", "aws", "ecommerce"], 
    price: 198.30, 
    trend: 0.32, 
    vol: 0.28, 
    maxDD: -0.26,
    category: "E-Commerce / Cloud"
  }
};

const PRESET_TICKERS = ['NVDA', 'AAPL', 'GOOGL', 'META', 'BTC-USD', 'TSLA'];

export default function StoxaApp() {
  const [selectedTicker, setSelectedTicker] = useState<string>("NVDA");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [timeframe, setTimeframe] = useState<number>(12); // Months
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Active Asset Object
  const asset = useMemo(() => {
    return EXTENDED_ASSETS[selectedTicker] || EXTENDED_ASSETS["NVDA"];
  }, [selectedTicker]);

  // Autocomplete / Fuzzy Match Results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    return Object.values(EXTENDED_ASSETS).filter((item) => {
      const matchTicker = item.ticker.toLowerCase().includes(q);
      const matchName = item.name.toLowerCase().includes(q);
      const matchAlias = item.aliases.some((alias) => alias.toLowerCase().includes(q));
      return matchTicker || matchName || matchAlias;
    });
  }, [searchQuery]);

  // Handle Select from Dropdown or Tag
  const handleSelectAsset = (ticker: string) => {
    setSelectedTicker(ticker);
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  // Math Scenario Projections
  const calculations = useMemo(() => {
    const timeFactor = timeframe / 12.0;
    const bullTarget = asset.price * (1 + (Math.max(asset.trend, 0.15) * timeFactor) + (asset.vol * 0.4 * Math.sqrt(timeFactor)));
    const baseTarget = asset.price * (1 + (Math.max(asset.trend, 0.05) * timeFactor));
    const bearTarget = Math.max(asset.price * (1 + (asset.maxDD * timeFactor)), 1.0);

    const bullPct = ((bullTarget - asset.price) / asset.price) * 100;
    const basePct = ((baseTarget - asset.price) / asset.price) * 100;
    const bearPct = ((bearTarget - asset.price) / asset.price) * 100;

    return {
      bullTarget,
      baseTarget,
      bearTarget,
      bullPct,
      basePct,
      bearPct
    };
  }, [asset, timeframe]);

  // Generate Proportional Chart Data (Dynamic History + Projections)
  const chartData = useMemo(() => {
    const data = [];
    const steps = Math.min(Math.max(timeframe, 6), 24);

    // 1. History Points (Matching timeframe back)
    for (let i = steps; i > 0; i--) {
      const progress = i / steps;
      const noise = Math.sin(i * 1.5) * (asset.price * 0.018);
      const histPrice = asset.price * (1 - (asset.trend * 0.18 * progress)) + noise;
      data.push({
        label: `-${Math.round(progress * timeframe)}M`,
        Historical: Number(histPrice.toFixed(2)),
        Bull: null,
        Base: null,
        Bear: null
      });
    }

    // 2. Today Transition Point
    data.push({
      label: 'Heute',
      Historical: asset.price,
      Bull: asset.price,
      Base: asset.price,
      Bear: asset.price
    });

    // 3. Forward Scenario Points
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      const currentMonth = Math.round(progress * timeframe);
      data.push({
        label: `+${currentMonth}M`,
        Historical: null,
        Bull: Number((asset.price + (calculations.bullTarget - asset.price) * progress).toFixed(2)),
        Base: Number((asset.price + (calculations.baseTarget - asset.price) * progress).toFixed(2)),
        Bear: Number((asset.price + (calculations.bearTarget - asset.price) * progress).toFixed(2)),
      });
    }

    return data;
  }, [asset, timeframe, calculations]);

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans selection:bg-blue-500/20 antialiased">
      
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
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          v2.6 Pro Engine
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        
        {/* Control Box & Smart Search */}
        <div className="bg-white border border-black/[0.06] rounded-3xl p-6 shadow-xl shadow-black/[0.02]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* Search Input with Autocomplete */}
            <div className="relative">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#86868b] mb-2">
                Search Ticker or Company
              </label>
              
              <div className="relative">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b]" />
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-full bg-[#f5f5f7] border border-black/10 rounded-2xl pl-11 pr-5 py-3.5 text-sm font-medium text-[#1d1d1f] placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
                  placeholder="Type 'Facebook', 'Google', 'NVDA', 'Apple'..."
                />
              </div>

              {/* Autocomplete Dropdown */}
              {isSearchOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-black/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-black/[0.04]">
                  {searchResults.map((item) => (
                    <button
                      key={item.ticker}
                      onClick={() => handleSelectAsset(item.ticker)}
                      className="w-full text-left px-5 py-3.5 hover:bg-blue-50/60 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-sm font-bold text-[#1d1d1f] flex items-center gap-2">
                          {item.name}
                          <span className="text-xs font-normal text-[#86868b] bg-slate-100 px-2 py-0.5 rounded-md">
                            {item.ticker}
                          </span>
                        </div>
                        <div className="text-xs text-[#86868b] mt-0.5">{item.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-[#1d1d1f]">
                          ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        {selectedTicker === item.ticker && (
                          <span className="text-xs text-blue-600 font-medium flex items-center justify-end gap-1">
                            <Check className="w-3.5 h-3.5" /> Selected
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Presets Chips */}
              <div className="flex flex-wrap gap-2 mt-3">
                {PRESET_TICKERS.map((t) => (
                  <button 
                    key={t}
                    onClick={() => handleSelectAsset(t)}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                      selectedTicker === t 
                        ? 'bg-blue-50 border-blue-600 text-blue-600 font-semibold shadow-sm' 
                        : 'bg-white border-black/10 text-[#86868b] hover:border-black/30'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeframe Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">
                  Projection Horizon & History
                </label>
                <span className="text-sm font-bold text-blue-600">
                  {timeframe} Monate ({(timeframe/12).toFixed(1)} Jahre)
                </span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="60" 
                value={timeframe} 
                onChange={(e) => setTimeframe(Number(e.target.value))}
                className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer mt-3"
              />
              <div className="flex justify-between text-[11px] text-[#86868b] mt-2">
                <span>1 Monat</span>
                <span>2 Jahre</span>
                <span>5 Jahre</span>
              </div>
            </div>

          </div>
        </div>

        {/* Asset Overview Banner */}
        <div className="bg-white border border-black/[0.06] rounded-2xl px-6 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-[#1d1d1f]">
              {asset.name} <span className="text-[#86868b] font-normal text-base">({asset.ticker})</span>
            </h2>
            <p className="text-xs text-[#86868b]">
              Category: {asset.category} • Symmetrischer Korridor ({timeframe}M Historie ➔ {timeframe}M Prognose)
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#1d1d1f]">
              ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
              <Activity className="w-3.5 h-3.5" /> Benchmark Active
            </div>
          </div>
        </div>

        {/* 3 SCENARIO CARDS (POSITIONED ABOVE THE CHART) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Bull Card */}
          <div className="bg-white border border-black/[0.06] hover:border-emerald-500/50 rounded-2xl p-5 shadow-sm transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Bull Scenario</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#1d1d1f] mb-1">
              ${calculations.bullTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-xs font-semibold">
              +{calculations.bullPct.toFixed(1)}% Expected Gain
            </div>
          </div>

          {/* Base Card */}
          <div className="bg-white border border-black/[0.06] hover:border-blue-500/50 rounded-2xl p-5 shadow-sm transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Base Scenario</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#1d1d1f] mb-1">
              ${calculations.baseTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="inline-block px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs font-semibold">
              {calculations.basePct >= 0 ? '+' : ''}{calculations.basePct.toFixed(1)}% Trend Projection
            </div>
          </div>

          {/* Bear Card */}
          <div className="bg-white border border-black/[0.06] hover:border-rose-500/50 rounded-2xl p-5 shadow-sm transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Bear Scenario</span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#1d1d1f] mb-1">
              ${calculations.bearTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="inline-block px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-600 text-xs font-semibold">
              {calculations.bearPct.toFixed(1)}% Stress Drawdown
            </div>
          </div>

        </div>

        {/* Main Chart Section */}
        <div className="bg-white border border-black/[0.06] rounded-3xl p-6 shadow-xl shadow-black/[0.02]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#86868b]">Performance & Szenario-Korridor</h3>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2 h-2 rounded-full bg-slate-800"></span> Historie
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Bull
              </span>
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span> Base
              </span>
              <span className="flex items-center gap-1.5 text-rose-600">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Bear
              </span>
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

        {/* Footer Disclaimer */}
        <div className="text-center text-xs text-[#86868b] pt-4 border-t border-black/[0.06]">
          Stoxa.co is a predictive financial simulation engine for educational & research purposes. Not financial advice.
        </div>

      </main>
    </div>
  );
}
