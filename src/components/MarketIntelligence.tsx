import React, { useState } from "react";
import { TrendingUp, Award, Building, Landmark, Compass, Calendar, ArrowUpRight, Search } from "lucide-react";
import { DEFAULT_MARKET_PRICES } from "../data";
import { MarketPrice } from "../types";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface MarketProps {
  translations: Record<string, string>;
}

export default function MarketIntelligence({ translations }: MarketProps) {
  const [selectedCommodity, setSelectedCommodity] = useState<MarketPrice>(DEFAULT_MARKET_PRICES[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPrices = DEFAULT_MARKET_PRICES.filter(p => 
    p.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.market.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="market-module" className="space-y-6">
      {/* Banner */}
      <div className="bento-card-deep relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 text-white pointer-events-none">
          <TrendingUp size={160} />
        </div>
        <span className="text-bento-mint text-xs font-bold uppercase tracking-wider bg-bento-forest/60 border border-bento-mint/20 px-3 py-1 rounded-full">
          Market Intelligence & Price Forecast
        </span>
        <h2 className="font-display text-2xl font-bold mt-2">
          {translations.market || "Mandi Prices & Price Trends"}
        </h2>
        <p className="text-bento-mint/80 text-sm mt-1">
          Stay informed with active spot prices from nearby Mandis, Minimum Support Prices (MSP), and AI price forecasts to negotiate and sell at peak value.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mandi pricing list */}
        <div className="bento-card space-y-4 lg:col-span-1">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3 justify-between">
            <h3 className="font-display font-bold text-bento-deep text-md">Live Spot Prices</h3>
            <span className="text-[10px] bg-bento-light text-bento-deep font-bold px-2 py-0.5 rounded">₹ per Quintal</span>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search crops or mandis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-bento-accent"
            />
          </div>

          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
            {filteredPrices.map((price, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedCommodity(price)}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex justify-between items-center ${selectedCommodity.commodity === price.commodity ? "bg-bento-light/50 border-bento-deep shadow-xs" : "bg-white border-stone-150 hover:bg-stone-50"}`}
              >
                <div>
                  <h4 className="font-display font-bold text-xs text-stone-800">{price.commodity}</h4>
                  <p className="text-[10px] text-stone-500 mt-0.5 flex items-center gap-1">
                    <Building size={11} /> {price.market.split(",")[0]}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold font-mono text-bento-deep block">₹{price.currentPrice.toLocaleString()}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${price.demandTrend === "High" ? "bg-bento-light text-bento-deep" : "bg-amber-100 text-amber-800"}`}>
                    {price.demandTrend} Demand
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Price details and Forecast Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bento-card space-y-4">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
              <div>
                <span className="text-[10px] font-mono bg-stone-100 px-2 py-0.5 rounded text-stone-600 uppercase">Interactive Analysis</span>
                <h3 className="font-display font-bold text-bento-deep text-lg mt-1">{selectedCommodity.commodity}</h3>
                <p className="text-xs text-stone-500">{selectedCommodity.market}</p>
              </div>

              <div className="flex gap-4">
                <div className="bg-bento-light/40 p-3 border border-bento-mint/20 rounded-2xl text-center min-w-[100px]">
                  <span className="text-[9px] font-bold text-stone-500 uppercase block">Spot Price</span>
                  <span className="text-sm font-bold font-mono text-bento-forest">₹{selectedCommodity.currentPrice.toLocaleString()}</span>
                </div>
                <div className="bg-stone-50 p-3 border border-stone-200 rounded-2xl text-center min-w-[100px]">
                  <span className="text-[9px] font-bold text-stone-500 uppercase block">Govt MSP</span>
                  <span className="text-sm font-bold font-mono text-stone-700">₹{selectedCommodity.msp.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Price Forecast Area Chart */}
            <div className="space-y-2">
              <h4 className="font-display font-bold text-bento-deep text-xs flex items-center gap-1.5">
                <Calendar size={14} className="text-bento-forest" />
                6-Month AI Price Trend Forecast
              </h4>
              <div className="h-60 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedCommodity.priceForecast} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#52B788" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#52B788" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" stroke="#78716c" />
                    <YAxis stroke="#78716c" domain={['auto', 'auto']} />
                    <Tooltip formatter={(value) => [`₹${(value as number).toLocaleString()}`, "Price Forecast"]} />
                    <Legend />
                    <Area type="monotone" dataKey="price" stroke="#40916C" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" name="Forecast price (₹/q)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Action Advice banner */}
            <div className="p-4 bg-bento-light/40 rounded-2xl border border-bento-mint/30 flex items-start gap-3 text-xs leading-relaxed">
              <Landmark size={18} className="text-bento-forest shrink-0 mt-0.5" />
              <div>
                <strong className="text-bento-deep block font-display">Mandi Sell Strategy Advice:</strong>
                {selectedCommodity.currentPrice > selectedCommodity.msp ? (
                  <span>The spot price is currently <span className="text-bento-forest font-bold">above the Government MSP by ₹{selectedCommodity.currentPrice - selectedCommodity.msp}</span>. Demand signal remains high. It is recommended to sell 60% of your stock now and store the remainder, as prices are forecasted to plateau next month.</span>
                ) : (
                  <span>The spot price is soft right now. Since the Minimum Support Price (MSP) is guaranteed, we advise taking your produce to the nearest state procurement center to avail of the guaranteed rate, rather than selling to local brokers at a discount.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
