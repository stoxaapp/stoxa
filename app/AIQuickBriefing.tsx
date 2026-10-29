'use client';

import React, { useState } from 'react';
import { Sparkles, X, Activity, ShieldAlert, TrendingUp, Cpu, BarChart3 } from 'lucide-react';

interface AIQuickBriefingProps {
  ticker?: string;
  volatilityScore?: number;
  currentPrice?: number;
  bullTarget?: number;
  bearTarget?: number;
  timeframe?: number; // Neu: Nimmt den dynamischen Slider-Wert entgegen
}

export default function AIQuickBriefing({ 
  ticker = "NVDA", 
  volatilityScore = 35, 
  currentPrice = 140, 
  bullTarget = 180, 
  bearTarget = 110,
  timeframe = 12 
}: AIQuickBriefingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 600);
  };

  const getRiskLevel = (score: number) => {
    if (score < 30) return { label: "Defensive / Low Volatility", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50" };
    if (score < 65) return { label: "Moderate Market Dispersion", color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50" };
    return { label: "Elevated Risk / High Volatility", color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50" };
  };

  const risk = getRiskLevel(volatilityScore);
  const upsidePercent = currentPrice && bullTarget ? (((bullTarget - currentPrice) / currentPrice) * 100).toFixed(1) : "15.0";
  const downsidePercent = currentPrice && bearTarget ? (((bearTarget - currentPrice) / currentPrice) * 100).toFixed(1) : "-10.0";
  const yearsLabel = (timeframe / 12).toFixed(1);

  return (
    <>
      {/* Trigger-Button */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-600/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] border border-blue-400/30 cursor-pointer"
      >
        <Sparkles className="w-4 h-4 text-blue-200 animate-pulse" />
        <span>⚡ AI Quick Briefing</span>
      </button>

      {/* Modal / Pop-up */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl bg-white dark:bg-[#161e2e] border border-black/[0.08] dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-[#1d1d1f] dark:text-slate-100 transition-colors">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] dark:border-slate-800 bg-slate-50/50 dark:bg-[#161e2e]/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/50 rounded-xl text-blue-600 dark:text-blue-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight">Stoxa Intelligence Briefing</h3>
                  <p className="text-xs text-[#86868b] dark:text-slate-400">Algorithmic Simulation Report • {ticker.toUpperCase()} ({timeframe}M Horizon)</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-black/5 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {isLoading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-medium text-[#86868b] dark:text-slate-400 animate-pulse">Processing {timeframe}-month volatility corridors & CAGR models...</p>
                </div>
              ) : (
                <div className="space-y-5 text-xs">
                  
                  {/* Badges / Metrics */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className={`px-3 py-1 rounded-full font-semibold border ${risk.color}`}>
                      {risk.label} (Score: {volatilityScore}/100)
                    </span>
                    <span className="px-3 py-1 rounded-full font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
                      Horizon: {timeframe} Months ({yearsLabel} Yrs)
                    </span>
                  </div>

                  {/* Structured Financial Report Blocks */}
                  <div className="space-y-3">
                    <div className="p-4 bg-[#f5f5f7] dark:bg-slate-900 border border-black/[0.04] dark:border-slate-800 rounded-2xl space-y-1">
                      <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200 text-sm">
                        <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Bullish Scenario Ceiling</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono">${bullTarget.toFixed(2)} (+{upsidePercent}%)</span>
                      </div>
                      <p className="text-[#86868b] dark:text-slate-400 leading-relaxed pt-1">
                        Driven by compounding historical velocity, the upper corridor projects a resistance ceiling of <strong className="text-slate-700 dark:text-slate-200">${bullTarget.toFixed(2)}</strong> over the next {timeframe} months.
                      </p>
                    </div>

                    <div className="p-4 bg-[#f5f5f7] dark:bg-slate-900 border border-black/[0.04] dark:border-slate-800 rounded-2xl space-y-1">
                      <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200 text-sm">
                        <span className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Risk & Dispersion Profile</span>
                        <span className="text-blue-600 dark:text-blue-400 font-mono">Score {volatilityScore}/100</span>
                      </div>
                      <p className="text-[#86868b] dark:text-slate-400 leading-relaxed pt-1">
                        Annualized standard deviation indicates standard mean-reversion behavior. Symmetrical corridor modeling outlines balanced probabilistic outcomes for the selected timeframe.
                      </p>
                    </div>

                    <div className="p-4 bg-[#f5f5f7] dark:bg-slate-900 border border-black/[0.04] dark:border-slate-800 rounded-2xl space-y-1">
                      <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200 text-sm">
                        <span className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" /> Bear Stress Floor</span>
                        <span className="text-rose-600 dark:text-rose-400 font-mono">${bearTarget.toFixed(2)} ({downsidePercent}%)</span>
                      </div>
                      <p className="text-[#86868b] dark:text-slate-400 leading-relaxed pt-1">
                        Downside volatility stress testing establishes primary structural support near the <strong className="text-slate-700 dark:text-slate-200">${bearTarget.toFixed(2)}</strong> threshold under adverse market trajectories.
                      </p>
                    </div>
                  </div>

                  <p className="text-[10px] text-[#86868b] dark:text-slate-500 pt-2 text-center border-t border-black/[0.06] dark:border-slate-800">
                    ⚠️ Generated autonomously via Stoxa.co Scenario Simulation Engine. For informational and research purposes only. Not financial advice.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-black/[0.06] dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-black dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                Close Briefing
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
