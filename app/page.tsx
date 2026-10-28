'use client';

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';

// Historische Kurse + Prognose-Daten
const ASSET_DATA: Record<string, { name: string; price: number; trend: number; vol: number; maxDD: number; history: { month: string; price: number }[] }> = {
  "NVDA": { 
    name: "NVIDIA Corp.", 
    price: 135.50, 
    trend: 0.65, 
    vol: 0.45, 
    maxDD: -0.35,
    history: [
      { month: 'Jun', price: 95.2 }, { month: 'Jul', price: 108.4 }, { month: 'Aug', price: 115.0 },
      { month: 'Sep', price: 120.5 }, { month: 'Okt', price: 128.0 }, { month: 'Aktuell', price: 135.50 }
    ]
  },
  "AAPL": { 
    name: "Apple Inc.", 
    price: 228.20, 
    trend: 0.22, 
    vol: 0.20, 
    maxDD: -0.18,
    history: [
      { month: 'Jun', price: 210.0 }, { month: 'Jul', price: 215.5 }, { month: 'Aug', price: 220.0 },
      { month: 'Sep', price: 222.1 }, { month: 'Okt', price: 225.0 }, { month: 'Aktuell', price: 228.20 }
    ]
  },
  "BTC-USD": { 
    name: "Bitcoin", 
    price: 92400.00, 
    trend: 0.85, 
    vol: 0.65, 
    maxDD: -0.55,
    history: [
      { month: 'Jun', price: 64000 }, { month: 'Jul', price: 67500 }, { month: 'Aug', price: 61000 },
      { month: 'Sep', price: 74000 }, { month: 'Okt', price: 85000 }, { month: 'Aktuell', price: 92400 }
    ]
  },
  "TSLA": { 
    name: "Tesla Inc.", 
    price: 245.80, 
    trend: 0.15, 
    vol: 0.55, 
    maxDD: -0.48,
    history: [
      { month: 'Jun', price: 180.0 }, { month: 'Jul', price: 210.0 }, { month: 'Aug', price: 225.0 },
      { month: 'Sep', price: 240.0 }, { month: 'Okt', price: 235.0 }, { month: 'Aktuell', price: 245.80 }
    ]
  }
};

export default function StoxaApp() {
  const [ticker, setTicker] = useState("NVDA");
  const [timeframe, setTimeframe] = useState(12);

  const asset = ASSET_DATA[ticker.toUpperCase()] || { 
    name: ticker.toUpperCase(), 
    price: 100.00, 
    trend: 0.25, 
    vol: 0.30, 
    maxDD: -0.25,
    history: [
      { month: 'Jun', price: 85 }, { month: 'Jul', price: 90 }, { month: 'Aug', price: 95 },
      { month: 'Sep', price: 98 }, { month: 'Okt', price: 99 }, { month: 'Aktuell', price: 100 }
    ]
  };

  const timeFactor = timeframe / 12.0;
  const bullTarget = asset.price * (1 + (Math.max(asset.trend, 0.15) * timeFactor) + (asset.vol * 0.4 * Math.sqrt(timeFactor)));
  const baseTarget = asset.price * (1 + (Math.max(asset.trend, 0.05) * timeFactor));
  const bearTarget = Math.max(asset.price * (1 + (asset.maxDD * timeFactor)), 1.0);

  const bullPct = ((bullTarget - asset.price) / asset.price) * 100;
  const basePct = ((baseTarget - asset.price) / asset.price) * 100;
  const bearPct = ((bearTarget - asset.price) / asset.price) * 100;

  // Kombinierter Chart: Historie + Prognose-Zweige
  const chartData = [
    ...asset.history.map(h => ({ name: h.month, Historical: h.price, Bull: null, Base: null, Bear: null })),
    { name: `+${timeframe}M (Ziel)`, Historical: null, Bull: bullTarget, Base: baseTarget, Bear: bearTarget }
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans selection:bg-blue-500/20">
      
      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between border-b border-black/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[#1d1d1f]">stoxa<span className="text-blue-600">.co</span></h1>
            <p className="text-xs text-[#86868b]">Predictive Financial Intelligence</p>
          </div>
        </div>
        <div className="text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-black/[0.08] text-[#1d1d1f] shadow-sm">
          v2.1 Light Mode
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        
        {/* Control Box */}
        <div className="bg-white border border-black/[0.06] rounded-3xl p-8 shadow-xl shadow-black/[0.02]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#86868b] mb-3">Target Asset Ticker</label>
              <input 
                type="text" 
                value={ticker} 
                onChange={(e) => setTicker(e.target.value)}
                className="w-full bg-[#f5f5f7] border border-black/10 rounded-2xl px-5 py-4 text-lg font-medium text-[#1d1d1f] placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
                placeholder="e.g. AAPL, NVDA, BTC-USD"
              />
              <div className="flex gap-2 mt-3">
                {Object.keys(ASSET_DATA).map((t) => (
                  <button 
                    key={t}
                    onClick={() => setTicker(t)}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${ticker.toUpperCase() === t ? 'bg-blue-50 border-blue-600 text-blue-600 font-semibold shadow-sm' : 'bg-white border-black/10 text-[#86868b] hover:border-black/30'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">Projection Horizon</label>
                <span className="text-sm font-bold text-blue-600">{timeframe} Months ({(timeframe/12).toFixed(1)} Years)</span>
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
                <span>1 Month</span>
                <span>2 Years</span>
                <span>5 Years</span>
              </div>
            </div>

          </div>
        </div>

        {/* Asset Overview Bar */}
        <div className="bg-white border border-black/[0.06] rounded-2xl px-6 py-5 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-[#1d1d1f]">{asset.name} <span className="text-[#86868b] font-normal text-base">({ticker.toUpperCase()})</span></h2>
            <p className="text-xs text-[#86868b]">Historie & Algorithmic Volatility Model</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#1d1d1f]">${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
              <Activity className="w-3.5 h-3.5" /> Live Benchmark Active
            </div>
          </div>
        </div>

        {/* Chart Section (History + Projections) */}
        <div className="bg-white border border-black/[0.06] rounded-3xl p-8 shadow-xl shadow-black/[0.02]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#86868b]">Historischer Verlauf & Szenario-Prognose</h3>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-700"><span className="w-2 h-2 rounded-full bg-slate-700"></span> Historie</span>
              <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Bull</span>
              <span className="flex items-center gap-1.5 text-blue-600"><span className="w-2 h-2 rounded-full bg-blue-600"></span> Base</span>
              <span className="flex items-center gap-1.5 text-rose-600"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Bear</span>
            </div>
          </div>

          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="name" stroke="#86868b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#86868b" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.1)', borderRadius: '12px', color: '#1d1d1f', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                />
                <Line type="monotone" dataKey="Historical" stroke="#1d1d1f" strokeWidth={3} dot={{ r: 4 }} connectNulls />
                <Line type="monotone" dataKey="Bull" stroke="#10b981" strokeWidth={3} strokeDasharray="4 4" dot={{ r: 4 }} connectNulls />
                <Line type="monotone" dataKey="Base" stroke="#2563eb" strokeWidth={3} strokeDasharray="4 4" dot={{ r: 4 }} connectNulls />
                <Line type="monotone" dataKey="Bear" stroke="#f43f5e" strokeWidth={3} strokeDasharray="4 4" dot={{ r: 4 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3 Scenario Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white border border-black/[0.06] hover:border-emerald-500/50 rounded-2xl p-6 shadow-sm transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Bull Scenario</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#1d1d1f] mb-2">${bullTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-semibold">
              +{bullPct.toFixed(1)}% Expected Gain
            </div>
          </div>

          <div className="bg-white border border-black/[0.06] hover:border-blue-500/50 rounded-2xl p-6 shadow-sm transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Base Scenario</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#1d1d1f] mb-2">${baseTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold">
              {basePct >= 0 ? '+' : ''}{basePct.toFixed(1)}% Trend Projection
            </div>
          </div>

          <div className="bg-white border border-black/[0.06] hover:border-rose-500/50 rounded-2xl p-6 shadow-sm transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Bear Scenario</span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#1d1d1f] mb-2">${bearTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="inline-block px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 text-xs font-semibold">
              {bearPct.toFixed(1)}% Stress Drawdown
            </div>
          </div>

        </div>

        <div className="text-center text-xs text-[#86868b] pt-6 border-t border-black/[0.06]">
          Stoxa.co is a predictive financial simulation engine for educational & research purposes. Not financial advice.
        </div>

      </main>
    </div>
  );
}
