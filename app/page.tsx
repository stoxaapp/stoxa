'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, ArrowUpRight, ArrowDownRight, Search, Loader2, X, ShieldCheck, HelpCircle, Sun, Moon, Newspaper, ExternalLink, Sparkles, ShieldAlert } from 'lucide-react';
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

interface NewsArticle {
  id: string;
  title: string;
  publisher: string;
  link: string;
  providerPublishTime: string;
}

export default function StoxaApp({ initialTicker = "NVDA" }: { initialTicker?: string }) {
  const [query, setQuery] = useState("");
  const [selectedTicker, setSelectedTicker] = useState(initialTicker);
  const [timeframe, setTimeframe] = useState(12);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showImpressum, setShowImpressum] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  
  const [darkMode, setDarkMode] = useState(false);
  const [suggestions, setSuggestions] = useState<{ symbol: string; name: string; exchange: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // News State
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);

  const [assetData, setAssetData] = useState<AssetDetail>({
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    currentPrice: 138.25,
    trend: 0.42,
    vol: 0.38,
    maxDD: -0.28,
    history: []
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('stoxa-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('stoxa-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('stoxa-theme', 'light');
    }
  };

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data.results || []);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectAsset = useCallback((tickerSymbol: string) => {
    const clean = tickerSymbol.toUpperCase().trim();
    if (clean) {
      setSelectedTicker(clean);
      setQuery("");
      setSuggestions([]);
      setErrorMsg("");
    }
  }, []);

  // Fetch Asset Data & News
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setLoading(true);
      setErrorMsg("");
      try {
        const res = await fetch(`/api/history?symbol=${encodeURIComponent(selectedTicker)}&timeframe=${timeframe}`);
        if (!res.ok) {
          throw new Error(`Asset '${selectedTicker}' not found.`);
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

    async function fetchNews() {
      setLoadingNews(true);
      try {
        const res = await fetch(`/api/news?symbol=${encodeURIComponent(selectedTicker)}`);
        const data = await res.json();
        if (isMounted) {
          setNews(data.news || []);
        }
      } catch (err) {
        if (isMounted) setNews([]);
      } finally {
        if (isMounted) setLoadingNews(false);
      }
    }

    fetchData();
    fetchNews();
    return () => { isMounted = false; };
  }, [selectedTicker, timeframe]);

  const timeFactor = timeframe / 12.0;

  const bullTarget = assetData.currentPrice * (1 + (Math.max(assetData.trend, 0.08) * timeFactor) + (assetData.vol * 0.5 * Math.sqrt(timeFactor)));
  const baseTarget = assetData.currentPrice * (1 + (assetData.trend * timeFactor));
  const bearTarget = Math.max(assetData.currentPrice * (1 + (assetData.maxDD * Math.sqrt(timeFactor))), 1.0);

  const bullPct = ((bullTarget - assetData.currentPrice) / assetData.currentPrice) * 100;
  const basePct = ((baseTarget - assetData.currentPrice) / assetData.currentPrice) * 100;
  const bearPct = ((bearTarget - assetData.currentPrice) / assetData.currentPrice) * 100;

  // Mathematische Volatilitäts-Score-Berechnung (0-100)
  const spreadPct = bullPct - bearPct;
  const volScore = Math.min(100, Math.round((assetData.vol * 100 * 1.2) + (spreadPct * 0.3)));

  let volCategory = {
    label: "Low Volatility Corridor",
    color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    desc: "Historically tight price corridor with lower expected short-term dispersion."
  };

  if (volScore > 65) {
    volCategory = {
      label: "High Volatility Corridor",
      color: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800",
      desc: "Wide historical swings and projected scenario dispersion. Elevated variance expected."
    };
  } else if (volScore > 35) {
    volCategory = {
      label: "Moderate Volatility Corridor",
      color: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      desc: "Standard market fluctuation profile with balanced scenario boundaries."
    };
  }

  const historyPoints = assetData.history || [];

  // Saubere Aufbereitung mit Standard-Labels
  const formattedChartData: any[] = historyPoints.map((h) => {
    const d = new Date(h.date);
    const label = !isNaN(d.getTime()) 
      ? d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) 
      : h.date;

    return {
      label,
      rawDate: h.date,
      Historical: h.price,
      Bull: null,
      Base: null,
      Bear: null
    };
  });

  if (formattedChartData.length > 0) {
    const last = formattedChartData[formattedChartData.length - 1];
    last.Bull = assetData.currentPrice;
    last.Base = assetData.currentPrice;
    last.Bear = assetData.currentPrice;
  }

  const futureSteps = Math.max(historyPoints.length, 12);
  const currentDate = new Date();

  for (let i = 1; i <= futureSteps; i++) {
    const progress = i / futureSteps;
    const daysAhead = Math.round(progress * (timeframe * 30));
    const futureDate = new Date(currentDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    
    const label = futureDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    
    formattedChartData.push({
      label,
      rawDate: futureDate.toISOString(),
      Historical: null,
      Bull: Number((assetData.currentPrice + (bullTarget - assetData.currentPrice) * progress).toFixed(2)),
      Base: Number((assetData.currentPrice + (baseTarget - assetData.currentPrice) * progress).toFixed(2)),
      Bear: Number((assetData.currentPrice + (bearTarget - assetData.currentPrice) * progress).toFixed(2)),
    });
  }

  let uniqueMonthCount = 0;

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0b0f17] text-[#1d1d1f] dark:text-slate-100 font-sans selection:bg-blue-500/25 transition-colors duration-200 relative">
      
      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between border-b border-black/[0.06] dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/25 text-white">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 18L9 13L13 16L20 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 8H20V12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 13L9 8L13 11L20 3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" strokeOpacity="0.6"/>
            </svg>
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">stoxa<span className="text-blue-600 dark:text-blue-400">.co</span></h1>
            <p className="text-xs text-[#86868b] dark:text-slate-400">Predictive Financial Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-white dark:bg-slate-800 border border-black/[0.08] dark:border-slate-700 text-[#1d1d1f] dark:text-slate-200 hover:border-black/30 dark:hover:border-slate-500 shadow-sm transition-all"
            title="Toggle Theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          <button 
            onClick={() => setShowHowItWorks(true)}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-black/[0.08] dark:border-slate-700 text-[#1d1d1f] dark:text-slate-200 hover:border-black/30 dark:hover:border-slate-500 shadow-sm flex items-center gap-1.5 transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>How it works</span>
          </button>

          <div className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-black/[0.08] dark:border-slate-700 text-[#1d1d1f] dark:text-slate-200 shadow-sm hidden sm:flex items-center gap-2">
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
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
        <div className="bg-white dark:bg-[#161e2e] border border-black/[0.06] dark:border-slate-800 rounded-3xl p-6 shadow-xl shadow-black/[0.02] dark:shadow-none relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            <div className="relative">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#86868b] dark:text-slate-400 mb-2">Search Any Global Asset</label>
              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && suggestions.length > 0) {
                      handleSelectAsset(suggestions[0].symbol);
                    } else if (e.key === 'Enter' && query.trim()) {
                      handleSelectAsset(query);
                    }
                  }}
                  className="w-full bg-[#f5f5f7] dark:bg-slate-900 border border-black/10 dark:border-slate-700 rounded-2xl pl-12 pr-10 py-3 text-lg font-medium text-[#1d1d1f] dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
                  placeholder="e.g. General Motors, Apple, BMW..."
                />
                {isSearching && (
                  <Loader2 className="absolute right-4 top-4 w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
                )}
              </div>

              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-black/[0.08] dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  {suggestions.map((item) => (
                    <div
                      key={item.symbol}
                      onPointerDown={() => handleSelectAsset(item.symbol)}
                      className="w-full px-5 py-3 text-left hover:bg-blue-50/60 dark:hover:bg-slate-700/60 flex items-center justify-between border-b border-black/[0.03] dark:border-slate-700/50 last:border-none cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-[#1d1d1f] dark:text-slate-100 text-sm">{item.name}</div>
                        <div className="text-[10px] text-[#86868b] dark:text-slate-400">{item.exchange}</div>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold">{item.symbol}</span>
                    </div>
                  ))}
                </div>
              )}

              {errorMsg && <p className="text-xs text-rose-500 mt-1.5">{errorMsg}</p>}

              <div className="flex gap-2 mt-2.5 flex-wrap">
                {["NVDA", "AAPL", "GM", "WMT", "BMW.DE", "BTC-USD"].map((t) => (
                  <button 
                    key={t}
                    onClick={() => handleSelectAsset(t)}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${selectedTicker === t ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 font-semibold shadow-sm' : 'bg-white dark:bg-slate-800 border-black/10 dark:border-slate-700 text-[#86868b] dark:text-slate-400 hover:border-black/30 dark:hover:border-slate-500'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#86868b] dark:text-slate-400">Symmetrical Horizon</label>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{timeframe} Months ({(timeframe/12).toFixed(1)} Years)</span>
              </div>
              <input 
                type="range" 
                min="3" 
                max="24" 
                value={timeframe} 
                onChange={(e) => setTimeframe(Number(e.target.value))}
                className="w-full accent-blue-600 dark:accent-blue-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#86868b] dark:text-slate-400 mt-2">
                <span>3 Months</span>
                <span>12 Months (1 Y.)</span>
                <span>24 Months (2 Y.)</span>
              </div>
            </div>

          </div>
        </div>

        {/* Asset Overview Bar */}
        <div className="bg-white dark:bg-[#161e2e] border border-black/[0.06] dark:border-slate-800 rounded-2xl px-6 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-[#1d1d1f] dark:text-white">{assetData.name} <span className="text-[#86868b] dark:text-slate-400 font-normal text-base">({assetData.symbol})</span></h2>
            <p className="text-xs text-[#86868b] dark:text-slate-400">
              Hist. Volatility: <span className="font-semibold text-slate-700 dark:text-slate-200">{(assetData.vol * 100).toFixed(1)}%</span> | 
              CAGR Trend: <span className="font-semibold text-slate-700 dark:text-slate-200">{(assetData.trend * 100).toFixed(1)}%</span> | 
              Max Drawdown: <span className="font-semibold text-slate-700 dark:text-slate-200">{(assetData.maxDD * 100).toFixed(1)}%</span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#1d1d1f] dark:text-white">
              ${assetData.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-end gap-1">
              <Activity className="w-3.5 h-3.5" /> Live Benchmark Active
            </div>
          </div>
        </div>

        {/* DYNAMISCHE KACHEL MIT INTEGRATION DES SCORES IM FLIESSTEXT */}
        <div className="bg-white dark:bg-[#161e2e] border border-black/[0.06] dark:border-slate-800 rounded-3xl p-6 shadow-xl shadow-black/[0.02] dark:shadow-none space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.04] dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Scenario Intelligence Briefing
              </h3>
            </div>

            {/* VOLATILITY PROFILE BADGE */}
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 w-fit ${volCategory.color}`}>
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>{volCategory.label}</span>
              <span className="opacity-40">|</span>
              <span className="font-mono">Score {volScore}/100</span>
            </div>
          </div>
          
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <strong className="text-[#1d1d1f] dark:text-white font-semibold">{assetData.name} ({assetData.symbol})</strong> is currently classified within a <strong className="text-slate-800 dark:text-slate-200">{volCategory.label}</strong> with a quantitative Volatility Score of <strong className="text-slate-800 dark:text-slate-200">{volScore}/100</strong>. 
            The asset exhibits an annualized historical volatility of <span className="font-semibold text-slate-800 dark:text-slate-200">{(assetData.vol * 100).toFixed(1)}%</span> and a CAGR trend metric of <span className="font-semibold text-slate-800 dark:text-slate-200">{(assetData.trend * 100).toFixed(1)}%</span>. 
            Over the selected <span className="font-semibold text-slate-800 dark:text-slate-200">{timeframe}-month horizon</span>, Stoxa models a Base projection target of <strong className="text-blue-600 dark:text-blue-400">${baseTarget.toFixed(2)}</strong> ({basePct >= 0 ? '+' : ''}{basePct.toFixed(1)}%). 
            Under high-momentum Bull scenarios, upper target bounds reach <strong className="text-emerald-600 dark:text-emerald-400">${bullTarget.toFixed(2)}</strong> (+{bullPct.toFixed(1)}%), while Bear stress testing indicates a lower support level around <strong className="text-rose-600 dark:text-rose-400">${bearTarget.toFixed(2)}</strong> ({bearPct.toFixed(1)}%). 
            <span className="block mt-2 italic text-slate-500 dark:text-slate-400">Model Characterization: {volCategory.desc}</span>
          </p>
        </div>

        {/* 3 SCENARIO CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#161e2e] border border-black/[0.06] dark:border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 shadow-sm transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Bull Scenario</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#1d1d1f] dark:text-white mb-1.5">${bullTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              +{bullPct.toFixed(1)}% Expected Gain
            </div>
          </div>

          <div className="bg-white dark:bg-[#161e2e] border border-black/[0.06] dark:border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 shadow-sm transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Base Scenario</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#1d1d1f] dark:text-white mb-1.5">${baseTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="inline-block px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-semibold">
              {basePct >= 0 ? '+' : ''}{basePct.toFixed(1)}% Trend Projection
            </div>
          </div>

          <div className="bg-white dark:bg-[#161e2e] border border-black/[0.06] dark:border-slate-800 hover:border-rose-500/50 rounded-2xl p-5 shadow-sm transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Bear Scenario</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#1d1d1f] dark:text-white mb-1.5">${bearTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="inline-block px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {bearPct.toFixed(1)}% Stress Drawdown
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white dark:bg-[#161e2e] border border-black/[0.06] dark:border-slate-800 rounded-3xl p-6 shadow-xl shadow-black/[0.02] dark:shadow-none">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#86868b] dark:text-slate-400">Asset Scenario Corridor ({timeframe}M Symmetrical)</h3>
            <div className="flex items-center gap-4 text-xs font-medium flex-wrap">
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300"><span className="w-2 h-2 rounded-full bg-slate-800 dark:bg-slate-200"></span> History</span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Bull Case</span>
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400"><span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"></span> Base Case</span>
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Bear Case</span>
            </div>
          </div>

          <div className="w-full overflow-x-auto pb-2">
            <div className="h-[380px] min-w-[550px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedChartData}>
                  <XAxis 
                    dataKey="label" 
                    stroke={darkMode ? "#64748b" : "#86868b"} 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    interval={0}
                    tickFormatter={(value, index) => {
                      if (index === 0) {
                        uniqueMonthCount = 0;
                        return value;
                      }
                      const prevValue = formattedChartData[index - 1]?.label;
                      const isNewMonth = value !== prevValue;
                      
                      if (isNewMonth) {
                        uniqueMonthCount++;
                        const step = timeframe > 18 ? 3 : timeframe > 12 ? 2 : 1;
                        if (uniqueMonthCount % step === 0) {
                          return value;
                        }
                      }
                      return '';
                    }}
                  />
                  <YAxis stroke={darkMode ? "#64748b" : "#86868b"} fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1e293b' : '#ffffff', 
                      borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', 
                      borderRadius: '12px', 
                      color: darkMode ? '#f8fafc' : '#1d1d1f', 
                      boxShadow: '0 10px 25px rgba(0,0,0,0.2)' 
                    }}
                  />
                  <Line type="monotone" dataKey="Historical" stroke={darkMode ? "#f8fafc" : "#1d1d1f"} strokeWidth={1.8} dot={false} connectNulls />
                  <Line type="monotone" dataKey="Bull" stroke="#10b981" strokeWidth={1.8} strokeDasharray="4 4" dot={false} connectNulls />
                  <Line type="monotone" dataKey="Base" stroke="#3b82f6" strokeWidth={1.8} strokeDasharray="4 4" dot={false} connectNulls />
                  <Line type="monotone" dataKey="Bear" stroke="#f43f5e" strokeWidth={1.8} strokeDasharray="4 4" dot={false} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* NEWS FEED SECTION */}
        <div className="bg-white dark:bg-[#161e2e] border border-black/[0.06] dark:border-slate-800 rounded-3xl p-6 shadow-xl shadow-black/[0.02] dark:shadow-none">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#86868b] dark:text-slate-400">Latest Headlines for {assetData.symbol}</h3>
            </div>
            {loadingNews && <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />}
          </div>

          {news.length === 0 && !loadingNews ? (
            <p className="text-xs text-[#86868b] dark:text-slate-400 py-4">No recent news found for this asset.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {news.map((item) => (
                <a
                  key={item.id}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-4 rounded-2xl bg-[#f5f5f7] dark:bg-slate-900 border border-black/[0.04] dark:border-slate-800 hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all flex flex-col justify-between gap-3"
                >
                  <h4 className="text-xs font-semibold text-[#1d1d1f] dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {item.title}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-[#86868b] dark:text-slate-400">
                    <span>{item.publisher} • {item.providerPublishTime}</span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 dark:text-blue-400" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="pt-6 pb-8 border-t border-black/[0.06] dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#86868b] dark:text-slate-500">
          <div>
            {SITE_CONFIG.name} is a predictive financial simulation engine for educational & research purposes.
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowImpressum(true)} 
              className="hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors underline underline-offset-4"
            >
              Legal & Imprint
            </button>
            <span>•</span>
            <span>© {new Date().getFullYear()} {SITE_CONFIG.domain}</span>
          </div>
        </footer>

      </main>

      {/* HOW IT WORKS MODAL */}
      {showHowItWorks && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-black/10 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-lg text-[#1d1d1f] dark:text-white">How Stoxa.co Works</h3>
              </div>
              <button onClick={() => setShowHowItWorks(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">1. Symmetrical 50/50 Layout</h4>
                <p>The chart is split exactly 1:1. The left side reflects real daily historical market data matching your selected horizon. The right side forecasts future performance symmetrically.</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">2. Dynamic Volatility & Trend</h4>
                <p>Stoxa computes real annualized volatility ($\sigma$) and CAGR trend metrics dynamically from each asset's past trading history to project realistic upper (Bull) and lower (Bear) boundaries.</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">3. Universal Live Search</h4>
                <p>Type any company name or ticker globally (e.g. "General Motors", "Walmart") to instantly query live market listings.</p>
              </div>
            </div>

            <button 
              onClick={() => setShowHowItWorks(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl text-xs transition-colors shadow-md shadow-blue-600/20"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* LEGAL & IMPRINT MODAL */}
      {showImpressum && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-black/10 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-black/5 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-lg text-[#1d1d1f] dark:text-white">Legal & Privacy</h3>
              </div>
              <button onClick={() => setShowImpressum(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#1d1d1f] dark:text-slate-200 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Provider Identification</h4>
                <p className="text-slate-600 dark:text-slate-400">
                  {SITE_CONFIG.owner.name}<br />
                  {SITE_CONFIG.owner.street}<br />
                  {SITE_CONFIG.owner.city}<br />
                  {SITE_CONFIG.owner.country}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Contact</h4>
                <p className="text-slate-600 dark:text-slate-400">
                  Email: <a href={`mailto:${SITE_CONFIG.owner.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">{SITE_CONFIG.owner.email}</a><br />
                  Website: <a href={`https://${SITE_CONFIG.domain}`} className="text-blue-600 dark:text-blue-400 hover:underline">www.{SITE_CONFIG.domain}</a>
                </p>
              </div>

              <div className="pt-2 border-t border-black/5 dark:border-slate-800">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Privacy Policy</h4>
                <p className="text-slate-600 dark:text-slate-400 leading-normal">
                  {SITE_CONFIG.privacyText}
                </p>
              </div>

              <div className="pt-2 border-t border-black/5 dark:border-slate-800">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Disclaimer</h4>
                <p className="text-[#86868b] dark:text-slate-400 leading-normal">
                  {SITE_CONFIG.disclaimer}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={() => setShowImpressum(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl text-xs transition-colors shadow-md shadow-blue-600/20"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
