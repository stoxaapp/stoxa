'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, ArrowUpRight, ArrowDownRight, Search, Loader2, X, ShieldCheck, HelpCircle } from 'lucide-react';
import { SITE_CONFIG } from './config/site';

interface AssetDetail {
  symbol: string;
  name: string;
  currentPrice: number;
  trend: number;
  vol: number;
  maxDD: number;
  history: { date: string; price: number }[];
}

export default function StoxaApp() {
  const [query, setQuery] = useState("");
  const [selectedTicker, setSelectedTicker] = useState("NVDA");
  const [timeframe, setTimeframe] = useState(12);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showImpressum, setShowImpressum] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const [assetData, setAssetData] = useState<AssetDetail>({
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    currentPrice: 138.25,
    trend: 0.42,
    vol: 0.38,
    maxDD: -0.28,
    history: []
  });

  const handleSelectAsset = useCallback((tickerSymbol: string) => {
    const clean = tickerSymbol.toUpperCase().trim();
    if (clean) {
      setSelectedTicker(clean);
      setQuery("");
      setErrorMsg("");
    }
  }, []);

  // API Fetch
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setLoading(true);
      setErrorMsg("");
      try {
        const res = await fetch(`/api/history?symbol=${encodeURIComponent(selectedTicker)}&timeframe=${timeframe}`);
        if (!res.ok) {
          throw new Error('Asset not found.');
        }
        const data = await res.json();
        
        if (isMounted) {
          setAssetData(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err.message || 'Failed to load data.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();
    return () => { isMounted = false; };
  }, [selectedTicker, timeframe]);

  // Scenario Calculations
  const timeFactor = timeframe / 12.0;

  const bullTarget = assetData.currentPrice * (1 + (Math.max(assetData.trend, 0.08) * timeFactor) + (assetData.vol * 0.5 * Math.sqrt(timeFactor)));
  const baseTarget = assetData.currentPrice * (1 + (assetData.trend * timeFactor));
  const bearTarget = Math.max(assetData.currentPrice * (1 + (assetData.maxDD * Math.sqrt(timeFactor))), 1.0);

  const bullPct = ((bullTarget - assetData.currentPrice) / assetData.currentPrice) * 100;
  const basePct = ((baseTarget - assetData.currentPrice) / assetData.currentPrice) * 100;
  const bearPct = ((bearTarget - assetData.currentPrice) / assetData.currentPrice) * 100;

  // 50/50 Symmetrical Chart Construction
  const historyPoints = assetData.history || [];

  const formattedChartData: any[] = historyPoints.map(h => ({
    label: h.date,
    Historical: h.price,
    Bull: null,
    Base: null,
    Bear: null
  }));

  if (formattedChartData.length > 0) {
    const last = formattedChartData[formattedChartData.length - 1];
    last.Bull = assetData.currentPrice;
    last.Base = assetData.currentPrice;
    last.Bear = assetData.currentPrice;
  }

  const futureSteps = Math.max(historyPoints.length, 10);
  const currentDate = new Date();

  for (let i = 1; i <= futureSteps; i++) {
    const progress = i / futureSteps;
    const daysAhead = Math.round(progress * (timeframe * 30));
    const futureDate = new Date(currentDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    const label = futureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    
    formattedChartData.push({
      label,
      Historical: null,
      Bull: Number((assetData.currentPrice + (bullTarget - assetData.currentPrice) * progress).toFixed(2)),
      Base: Number((assetData.currentPrice + (baseTarget - assetData.currentPrice) * progress).toFixed(2)),
      Bear: Number((assetData.currentPrice + (bearTarget - assetData.currentPrice) * progress).toFixed(2)),
    });
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans selection:bg-blue-500/25 relative">
      
      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between border-b border-black/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/25">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 18L9 13L13 16L20 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 8H20V12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 13L9 8L13 11L20 3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" strokeOpacity="0.6"/>
            </svg>
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1d1d1f]">stoxa<span className="text-blue-600">.co</span></h1>
            <p className="text-xs text-[#86868b]">Predictive Financial Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowHowItWorks(true)}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-black/[0.08] text-[#1d1d1f] hover:border-black/30 shadow-sm flex items-center gap-1.5 transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>How it works</span>
          </button>

          <div className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-white border border-black/[0.08] text-[#1d1d1f] shadow-sm hidden sm:flex items-center gap-2">
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Loading Market Feed...</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Engine Active</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        
        {/* Search & Control Box */}
        <div className="bg-white border border-black/[0.06] rounded-3xl p-6 shadow-xl shadow-black/[0.02] relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Search Input */}
            <div className="relative">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#86868b] mb-2">Search Asset (Ticker + Enter)</label>
              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && query.trim()) {
                      handleSelectAsset(query);
                    }
                  }}
                  className="w-full bg-[#f5f5f7] border border-black/10 rounded-2xl pl-12 pr-4 py-3 text-lg font-medium text-[#1d1d1f] placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
                  placeholder="e.g. AAPL, TSLA, BTC-USD, VOW3.DE..."
                />
              </div>
              {errorMsg && <p className="text-xs text-rose-500 mt-1.5">{errorMsg}</p>}

              <div className="flex gap-2 mt-2.5 flex-wrap">
                {["NVDA", "AAPL", "TSLA", "BTC-USD", "MSFT", "AMZN", "VOW3.DE"].map((t) => (
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
                <label className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">Symmetrical Horizon</label>
                <span className="text-sm font-bold text-blue-600">{timeframe} Months ({(timeframe/12).toFixed(1)} Years)</span>
              </div>
              <input 
                type="range" 
                min="3" 
                max="24" 
                value={timeframe} 
                onChange={(e) => setTimeframe(Number(e.target.value))}
                className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#86868b] mt-2">
                <span>3 Months</span>
                <span>12 Months (1 Y.)</span>
                <span>24 Months (2 Y.)</span>
              </div>
            </div>

          </div>
        </div>

        {/* Asset Overview Bar */}
        <div className="bg-white border border-black/[0.06] rounded-2xl px-6 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-[#1d1d1f]">{assetData.name} <span className="text-[#86868b] font-normal text-base">({assetData.symbol})</span></h2>
            <p className="text-xs text-[#86868b]">
              Hist. Volatility: <span className="font-semibold text-slate-700">{(assetData.vol * 100).toFixed(1)}%</span> | 
              CAGR Trend: <span className="font-semibold text-slate-700">{(assetData.trend * 100).toFixed(1)}%</span> | 
              Max Drawdown: <span className="font-semibold text-slate-700">{(assetData.maxDD * 100).toFixed(1)}%</span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#1d1d1f]">
              ${assetData.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
              <Activity className="w-3.5 h-3.5" /> Live Benchmark Active
            </div>
          </div>
        </div>

        {/* 3 SCENARIO CARDS */}
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
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#86868b]">Asset Scenario Corridor ({timeframe}M Symmetrical)</h3>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-700"><span className="w-2 h-2 rounded-full bg-slate-800"></span> History</span>
              <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Bull Case</span>
