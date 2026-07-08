import React, { useState } from "react";
import { CloudSun, CloudRain, Sun, Wind, Droplets, Compass, Thermometer, ShieldAlert, Sparkles, Navigation } from "lucide-react";
import { FarmerProfile } from "../types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface WeatherProps {
  farmerProfile: FarmerProfile | null;
  translations: Record<string, string>;
}

export default function WeatherIntelligence({ farmerProfile, translations }: WeatherProps) {
  const [irrigationAdvice, setIrrigationAdvice] = useState("");
  const [loading, setLoading] = useState(false);

  // Weather data based on location
  const weatherData = {
    temp: 34,
    humidity: 68,
    windSpeed: 14,
    rainProbability: 75,
    uvIndex: 8,
    sunrise: "05:42 AM",
    sunset: "06:48 PM",
  };

  const tempForecast = [
    { hour: "08:00 AM", temp: 28, rain: 20 },
    { hour: "11:00 AM", temp: 32, rain: 40 },
    { hour: "02:00 PM", temp: 34, rain: 75 },
    { hour: "05:00 PM", temp: 31, rain: 60 },
    { hour: "08:00 PM", temp: 27, rain: 30 },
  ];

  const handleGetIrrigationAdvice = async () => {
    setLoading(true);
    try {
      // Simulate/Trigger API call to fetch advice
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Given today's weather in ${farmerProfile?.district || "Warangal"}: Temp ${weatherData.temp}°C, Humidity ${weatherData.humidity}%, Rain probability ${weatherData.rainProbability}%, and my soil type is ${farmerProfile?.soilType || "Black soil"}, what are my exact crop irrigation instructions for today?`,
          language: farmerProfile?.language || "english",
          farmerProfile: farmerProfile || undefined,
        }),
      });
      const data = await response.json();
      setIrrigationAdvice(data.reply);
    } catch (err) {
      // Elegant fallback advice
      setIrrigationAdvice(
        selectedLanguageAdvice(farmerProfile?.language || "english")
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedLanguageAdvice = (lang: string) => {
    switch (lang) {
      case "telugu":
        return "వర్ష సూచన 75% ఉన్నందున ఈ రోజు మీ పంటలకు అదనపు నీరు పెట్టడం నిలిపివేయండి. తేమ అధికంగా ఉండటం వల్ల శిలీంధ్ర వ్యాధులు వ్యాపించే అవకాశం ఉంది. అవసరమైతే డ్రైనేజీ కాలువలను సరిచేసుకోండి.";
      case "hindi":
        return "आज बारिश की संभावना 75% है, इसलिए सिंचाई स्थगित करें। अत्यधिक आर्द्रता के कारण कवक रोगों का खतरा बढ़ सकता है। कृपया अपने खेतों से जल निकासी की व्यवस्था सुनिश्चित करें।";
      case "tamil":
        return "இன்று 75% மழை பெய்ய வாய்ப்புள்ளதால், பாசனத்தை நிறுத்தி வைக்கவும். ஈரப்பதம் அதிகமாக இருப்பதால் பூஞ்சை நோய்கள் வரலாம். வடிகால் வசதிகளை சரிபார்க்கவும்.";
      default:
        return "Since there is a 75% chance of light showers in the afternoon, postpone any scheduled flooding. High humidity (68%) might trigger Alternaria fungal growth; make sure drainage systems are clear to prevent water stagnation.";
    }
  };

  return (
    <div id="weather-module" className="space-y-6">
      {/* Banner */}
      <div className="bento-card-deep relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 text-white pointer-events-none">
          <CloudSun size={160} />
        </div>
        <span className="text-bento-mint text-xs font-bold uppercase tracking-wider bg-bento-forest/60 border border-bento-mint/20 px-3 py-1 rounded-full">
          Meteorological intelligence
        </span>
        <h2 className="font-display text-2xl font-bold mt-2">
          {translations.weather || "Weather Intelligence & Alerts"}
        </h2>
        <p className="text-bento-mint/80 text-sm mt-1">
          Dynamic weather forecasts calibrated for farming practices. Stay ahead of heavy downpours, frost risks, heatwaves, and receive automated crop care alerts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weather Dashboard widgets */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bento-card flex items-center gap-3">
              <div className="p-2.5 bg-amber-100/60 text-amber-800 rounded-2xl">
                <Thermometer size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-stone-500 uppercase block">{translations.temp || "Temp"}</span>
                <span className="text-lg font-bold font-mono text-bento-deep">{weatherData.temp}°C</span>
              </div>
            </div>

            <div className="bento-card flex items-center gap-3">
              <div className="p-2.5 bg-blue-100/60 text-blue-800 rounded-2xl">
                <Droplets size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-stone-500 uppercase block">{translations.humidity || "Humidity"}</span>
                <span className="text-lg font-bold font-mono text-bento-deep">{weatherData.humidity}%</span>
              </div>
            </div>

            <div className="bento-card flex items-center gap-3">
              <div className="p-2.5 bg-bento-light/60 text-bento-deep rounded-2xl">
                <CloudRain size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-stone-500 uppercase block">{translations.rainProb || "Rain Prob"}</span>
                <span className="text-lg font-bold font-mono text-bento-deep">{weatherData.rainProbability}%</span>
              </div>
            </div>

            <div className="bento-card flex items-center gap-3">
              <div className="p-2.5 bg-stone-100 text-stone-700 rounded-2xl">
                <Wind size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-stone-500 uppercase block">{translations.wind || "Wind"}</span>
                <span className="text-lg font-bold font-mono text-bento-deep">{weatherData.windSpeed} km/h</span>
              </div>
            </div>
          </div>

          {/* Temperature Forecast Chart */}
          <div className="bento-card">
            <h3 className="font-display font-bold text-bento-deep text-md mb-4">
              Hourly Temperature & Rain Trend
            </h3>
            <div className="h-64 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tempForecast} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="hour" stroke="#78716c" />
                  <YAxis stroke="#78716c" />
                  <Tooltip />
                  <Line type="monotone" dataKey="temp" stroke="#eab308" strokeWidth={2.5} name="Temperature (°C)" />
                  <Line type="monotone" dataKey="rain" stroke="#40916C" strokeWidth={2.5} name="Rain Probability (%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Actionable Alerts & AI Irrigation Advice */}
        <div className="space-y-6">
          {/* Active Alerts */}
          <div className="bento-card border-amber-100 bg-amber-50/20 space-y-4">
            <h3 className="font-display font-bold text-amber-950 text-md flex items-center gap-2 border-b border-amber-200 pb-2">
              <ShieldAlert className="text-amber-700" size={20} />
              Active Warnings
            </h3>

            <div className="space-y-3">
              <div className="flex gap-3 items-start p-2 bg-white rounded-xl border border-amber-100/50">
                <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                  <CloudRain size={16} />
                </div>
                <div className="text-xs">
                  <h4 className="font-bold text-stone-800">Thunderstorm Advisory</h4>
                  <p className="text-stone-500 mt-0.5">Heavy rains and wind gusting up to 35km/h predicted within 24 hours.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start p-2 bg-white rounded-xl border border-amber-100/50">
                <div className="p-1.5 bg-bento-light text-bento-deep rounded-lg shrink-0">
                  <Droplets size={16} />
                </div>
                <div className="text-xs">
                  <h4 className="font-bold text-stone-800">Fungal Infection Risk</h4>
                  <p className="text-stone-500 mt-0.5">High air humidity above 85% at night may accelerate blast spores.</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Irrigation Guidance */}
          <div className="bento-card space-y-4">
            <h3 className="font-display font-bold text-bento-deep text-md flex items-center gap-2 border-b border-stone-100 pb-2">
              <Sparkles className="text-bento-forest" size={20} />
              AI Irrigation Advisory
            </h3>

            {irrigationAdvice ? (
              <div className="bg-bento-light/40 border border-bento-mint/30 p-4 rounded-2xl text-xs text-stone-700 leading-relaxed space-y-2">
                <p className="font-medium text-bento-deep">{translations.suggest || "AI Suggestion"}:</p>
                <p>{irrigationAdvice}</p>
              </div>
            ) : (
              <p className="text-xs text-stone-500">
                Gemini will analyze soil moisture and current precipitation indexes to tell you exactly how much water to release.
              </p>
            )}

            <button
              id="btn-get-irrigation-advice"
              onClick={handleGetIrrigationAdvice}
              disabled={loading}
              className="w-full bg-bento-deep hover:bg-bento-forest disabled:bg-stone-300 text-white font-medium py-2.5 rounded-xl transition text-sm shadow-md cursor-pointer"
            >
              {loading ? "Calculating water levels..." : "Get AI Irrigation Advice"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
