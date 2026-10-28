'use client';

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, ShieldAlert, Activity, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';

// Vordefinierte Mock-Daten für realistische Simulation (wird später durch Live-API ersetzt)
const ASSET_PRESETS: Record<string, { name: string; price: number; trend: number; vol: number; maxDD: number }> = {
  "NVDA": { name: "NVIDIA Corp.", price: 135.50, trend: 0.65, vol: 0.45, maxDD: -0.35 },
  "AAPL": { name: "Apple Inc.", price: 228.20, trend: 0.22, vol: 0.20, maxDD: -0.18 },
  "BTC-USD": { name: "Bitcoin", price: 92400.00, trend: 0.85, vol: 0.65, maxDD: -0.55 },
  "TSLA": { name: "Tesla Inc.", price: 245.80, trend: 0.15, vol: 0.55, maxDD: -0.48 }
};

export default function StoxaApp() {
  const [ticker, setTicker] = useState("NVDA");
  const [timeframe, setTimeframe] = useState(12); // Monate

  const asset = ASSET_PRESETS[ticker.toUpperCase()] || { 
    name: ticker.toUpperCase(), 
    price: 100.00, 
    trend: 0.25, 
    vol: 0.30, 
    maxDD: -0.25 
  };

  // Mathematische Szenario-Berechnung
  const timeFactor = timeframe / 12.0;
  const bullTarget = asset.price * (1 + (Math.max(asset.trend, 0.15) * timeFactor) + (asset.vol * 0.4 * Math.sqrt(timeFactor)));
  const baseTarget = asset.price * (1 + (Math.max(asset.trend, 0.05) * timeFactor));
  const bearTarget = Math.max(asset.price * (1 + (asset.maxDD * timeFactor)), 1.0);

  const bullPct = ((bullTarget - asset.price) / asset.price) * 100;
  const basePct = ((baseTarget - asset.price) / asset.price) * 100;
  const bearPct = ((bearTarget - asset.price) / asset.price) * 100;

  // Chart-Daten generieren
  const chartData = [
    { month: 'Start', Historical: asset.price, Bull: asset.price, Base: asset.price, Bear: asset.price },
    { month: `${Math.round(timeframe / 2)}M`, Historical: asset.price * (1 + asset.trend * 0.2), Bull: asset.price * (1 + (bullPct/200)), Base: asset.price * (1 + (basePct/200)), Bear: asset.price * (1 + (bearPct/200)) },
    { month: `${timeframe}M (Target)`, Historical: null, Bull: bullTarget, Base: baseTarget, Bear: bearTarget }
  ];

  return (
    <div className="min-h-screen bg-[#07090e] text-[#f1f5f9] font-sans selection:bg-blue-500/30">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-blue-500/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Header */}
      <header className="relative z-10 max-w-6xl mx-auto px-6 py-8 flex items-center justify-between border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white">stoxa<span className="text-blue-500">.co</span></h1>
            <p className="text-xs text-slate-400">Predictive Financial Intelligence</p>
          </div>
        </div>
        <div className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300">
          v2.0 Next-Gen Core
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-10 space-y-8">
        
        {/* Control Box (Glassmorphism) */}
        <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-2xl rounded-3xl p-8 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            {/* Ticker Input & Quick Tags */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Target Asset Ticker</label>
              <input 
                type="text" 
                value={ticker} 
                onChange={(e) => setTicker(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-lg font-medium text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="e.g. AAPL, NVDA, BTC-USD"
              />
              <div className="flex gap-2 mt-3">
                {Object.keys(ASSET_PRESETS).map((t) => (
                  <button 
                    key={t}
                    onClick={() => setTicker(t)}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${ticker.toUpperCase() === t ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 font-medium' : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:border-white/20'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeframe Slider */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Projection Horizon</label>
                <span className="text-sm font-bold text-blue-400">{timeframe} Months ({(timeframe/12).toFixed(1)} Years)</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="60" 
                value={timeframe} 
                onChange={(e) => setTimeframe(Number(e.target.value))}
                className="w-full accent-blue-500 h-2 bg-white/10 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-2">
                <span>1 Month</span>
                <span>2 Years</span>
                <span>5 Years</span>
              </div>
            </div>

          </div>
        </div>

        {/* Asset Overview Bar */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{asset.name} <span className="text-slate-500 font-normal text-base">({ticker.toUpperCase()})</span></h2>
            <p className="text-xs text-slate-400">Algorithmic Volatility & Trend Model</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div className="text-xs text-emerald-400 font-medium flex items-center justify-end gap-1">
              <Activity className="w-3.5 h-3.5" /> Live Benchmark Active
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-8 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Scenario Projection Corridor</h3>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Bull</span>
              <span className="flex items-center gap-1.5 text-blue-400"><span className="w-2 h-2 rounded-full bg-blue-400"></span> Base</span>
              <span className="flex items-center gap-1.5 text-rose-400"><span className="w-2 h-2 rounded-full bg-rose-400"></span> Bear</span>
            </div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="month" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                />
                <Line type="monotone" dataKey="Bull" stroke="#10b981" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="Base" stroke="#3b82f6" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="Bear" stroke="#f43f5e" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3 Scenario Cards (CoinMarketCap & Apple Style) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Bull Case */}
          <div className="bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/30 rounded-2xl p-6 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Bull Scenario</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">${bullTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="inline-block px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
              +{bullPct.toFixed(1)}% Expected Gain
            </div>
          </div>

          {/* Base Case */}
          <div className="bg-white/[0.02] border border-white/[0.06] hover:border-blue-500/30 rounded-2xl p-6 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Base Scenario</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">${baseTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="inline-block px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-semibold">
              {basePct >= 0 ? '+' : ''}{basePct.toFixed(1)}% Trend Projection
            </div>
          </div>

          {/* Bear Case */}
          <div className="bg-white/[0.02] border border-white/[0.06] hover:border-rose-500/30 rounded-2xl p-6 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Bear Scenario</span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">${bearTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="inline-block px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-semibold">
              {bearPct.toFixed(1)}% Stress Drawdown
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500 pt-6 border-t border-white/[0.04]">
          Stoxa.co is a predictive financial simulation engine for educational & research purposes. Not financial advice.
        </div>

      </main>
    </div>
  );
}
