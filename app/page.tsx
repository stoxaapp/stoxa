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
  baseHistoryPrices: number[]; // Echte unglättete Kurs-Ankerwerte
}

const ASSETS_DATABASE: Record<string, AssetDetail> = {
  "NVDA": {
    ticker: "NVDA", name: "NVIDIA Corp.", price: 138.25, trend: 0.45, vol: 0.38, maxDD: -0.28,
    baseHistoryPrices: [98.5, 105.2, 118.0, 124.5, 119.8, 131.0, 126.5, 138.25]
  },
  "AAPL": {
    ticker: "AAPL", name: "Apple Inc.", price: 232.40, trend: 0.20, vol: 0.18, maxDD: -0.15,
    baseHistoryPrices: [195.0, 210.2, 218.5, 224.0, 221.8, 228.5, 226.0, 232.40]
  },
  "BTC-USD": {
    ticker: "BTC-USD", name: "Bitcoin", price: 84500.00, trend: 0.60, vol: 0.52, maxDD: -0.48,
    baseHistoryPrices: [58000, 64000, 69000, 76000, 92000, 88000, 81000, 84500]
  },
  "TSLA": {
    ticker: "TSLA", name: "Tesla Inc.", price: 248.90, trend: 0.25, vol: 0.48, maxDD: -0.40,
    baseHistoryPrices: [180.0, 215.0, 230.0, 255.0, 220.0, 240.0, 235.0, 248.90]
  },
  "VOW3.DE": {
    ticker: "VOW3.DE", name: "Volkswagen AG", price: 94.20, trend: 0.05, vol: 0.25, maxDD: -0.30,
    baseHistoryPrices: [108.0, 102.5, 98.0, 95.5, 96.2, 92.0, 93.5, 94.20]
  },
  "SIE.DE": {
    ticker: "SIE.DE", name: "Siemens AG", price: 182.50, trend: 0.18, vol: 0.20, maxDD: -0.18,
    baseHistoryPrices: [162.0, 168.5, 172.0, 175.5, 174.0, 178.5, 180.0, 182.50]
  },
  "META": {
    ticker: "META", name: "Meta Platforms", price: 595.00, trend: 0.38, vol: 0.32, maxDD: -0.25,
    baseHistoryPrices: [480.0, 515.0, 550.0, 565.0, 540.0, 580.0, 572.0, 595.00]
  }
};

export default function StoxaApp() {
  const [query, setQuery] = useState("");
  const [selectedTicker, setSelectedTicker] = useState("NVDA");
  const [timeframe, setTimeframe] = useState(12);
  const [suggestions, setSuggestions] = useState<{ symbol: string; name: string }[]>([]);

  const asset = ASSETS_DATABASE[selectedTicker] || ASSETS_DATABASE["NVDA"];

  // 1-Klick Asset Auswahl
  const handleSelectAsset = useCallback((tickerSymbol: string) => {
    const clean = tickerSymbol.toUpperCase().trim();
    if (ASSETS_DATABASE[clean]) {
      setSelectedTicker(clean);
      setQuery("");
      setSuggestions([]);
    }
  }, []);

  // Autocomplete Filter
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

  // DYNAMISCHE X-ACHSEN & HISTORIE-GENERIERUNG
  const formattedChartData: any[] = [];
  const currentDate = new Date();
  
  // 1. Vergangenheit dynamisch passend zum Slider rückwärts berechnen
  const historySteps = Math.max(Math.floor(timeframe / 2), 4);
  const rawHistoryPrices = asset.baseHistoryPrices;
  
  for (let i = historySteps; i >= 1; i--) {
    const monthsAgo = Math.round((i / historySteps) * timeframe);
    const pastDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - monthsAgo, 1);
    const label = pastDate.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });

    // Index-Mapping für unglättete Vergangenheitswerte
    const priceIdx = Math.max(0, Math.floor(((historySteps - i) / historySteps) * (rawHistoryPrices.length - 1)));
    const histPrice = rawHistoryPrices[priceIdx];

    formattedChartData.push({
      label,
      Historical: histPrice,
      Bull: null,
      Base: null,
      Bear: null
    });
  }

  // 2. Anknüpfpunkt "Heute"
  formattedChartData.push({
    label: 'Heute',
    Historical: asset.price,
    Bull: asset.price,
    Base: asset.price,
    Bear: asset.price
  });

  // 3. Symmetrische Prognoseschritte in die Zukunft
  const futureSteps = historySteps;
  for (let i = 1; i <= futureSteps; i++) {
    const progress = i / futureSteps;
    const monthVal = Math.round(progress * timeframe);
    
    formattedChartData
