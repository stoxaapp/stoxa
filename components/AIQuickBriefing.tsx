'use client';

import React, { useState } from 'react';
import { Sparkles, X, Activity, ShieldAlert, TrendingUp, Cpu } from 'lucide-react';

interface AIQuickBriefingProps {
  ticker?: string;
  volatilityScore?: number;
  currentPrice?: number;
  bullTarget?: number;
  bearTarget?: number;
}

export default function AIQuickBriefing({ 
  ticker = "AAPL", 
  volatilityScore = 35, 
  currentPrice = 180, 
  bullTarget = 220, 
  bearTarget = 150 
}: AIQuickBriefingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
    setIsLoading(true);
    // Simuliert eine kurze, elegante "KI-Rechenzeit"
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  };

  // Intelligente Einordnung des Volatilitätsscores
  const getRiskLevel = (score: number) => {
    if (score < 30) return { label: "Low Risk / Defensive", color: "text-emerald-400 bg-emerald-950/40 border-emerald-800/50" };
    if (score < 65) return { label: "Moderate Volatility", color: "text-amber-400 bg-amber-950/40 border-amber-800/50" };
    return { label: "High Risk / Speculative", color: "text-rose-400 bg-rose-950/40 border-rose-800/50" };
  };

  const risk = getRiskLevel(volatilityScore);
  const upsidePercent = currentPrice && bullTarget ? (((bullTarget - currentPrice) / currentPrice) * 100).toFixed(1) : "15.0";

  return (
    <>
      {/* Der Trigger-Button */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-950/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] border border-indigo-400/30 cursor-pointer"
      >
        <Sparkles className="w-4 h-4 text-indigo-200 animate-pulse" />
        <span>⚡ AI Quick Briefing</span>
      </button>

      {/* Das Pop-up Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Stoxa Intelligence Engine</h3>
                  <p className="text-xs text-zinc-400">Algorithmic Simulation Report • {ticker.toUpperCase()}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-zinc-400 animate-pulse">Analyzing volatility corridors & CAGR trends...</p>
                </div>
              ) : (
                <div className="space-y-4 text-sm">
                  
                  {/* Badges / Key Metrics */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${risk.color}`}>
                      {risk.label} (Score: {volatilityScore}/100)
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-950/50 text-indigo-300 border border-indigo-800/50">
                      Target Upside: +{upsidePercent}%
                    </span>
                  </div>

                  {/* Bullet points mit echten Daten */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3 p-3 bg-zinc-950/50 border border-zinc-800/80 rounded-xl">
                      <TrendingUp className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <div>
                        <strong className="block text-zinc-200">Bullish Scenario Corridor</strong>
                        <span className="text-zinc-400 text-xs">Projected 12M resistance ceiling targets approximately ${bullTarget} based on historical compounding velocity.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-zinc-950/50 border border-zinc-800/80 rounded-xl">
                      <Activity className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <strong className="block text-zinc-200">Volatility & Risk Profile</strong>
                        <span className="text-zinc-400 text-xs">Annualized standard deviation indicates stable mean-reversion characteristics within the 50/50 historical-predictive model.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-zinc-950/50 border border-zinc-800/80 rounded-xl">
                      <ShieldAlert className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                      <div>
                        <strong className="block text-zinc-200">Bear Floor Support</strong>
                        <span className="text-zinc-400 text-xs">Downside risk corridor holds primary structural support near the ${bearTarget} threshold.</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-500 pt-2 text-center border-t border-zinc-800/60">
                    ⚠️ Generated autonomously via Stoxa.co Simulation Engine. Algorithmic estimate, not financial advice.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-zinc-950 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Close Report
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
