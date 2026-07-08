import React, { useState } from "react";
import { Sprout, TrendingUp, Info, ShieldAlert, Award, Compass, RefreshCw, Calendar, Droplet, Wallet, ShieldCheck } from "lucide-react";
import { FarmerProfile, CropRecommendation as CropRecType } from "../types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface CropRecommendationProps {
  farmerProfile: FarmerProfile | null;
  translations: Record<string, string>;
}

export default function CropRecommendation({ farmerProfile, translations }: CropRecommendationProps) {
  const [recommendations, setRecommendations] = useState<CropRecType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFetchRecommendations = async () => {
    if (!farmerProfile) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/gemini/crop-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          district: farmerProfile.district,
          village: farmerProfile.village,
          soilType: farmerProfile.soilType,
          soilPh: farmerProfile.soilPh,
          nitrogen: farmerProfile.nitrogen,
          phosphorus: farmerProfile.phosphorus,
          potassium: farmerProfile.potassium,
          groundwaterDepth: farmerProfile.groundwaterDepth,
          irrigationAvailable: farmerProfile.irrigationAvailable,
          farmSize: farmerProfile.farmSize,
          language: farmerProfile.language,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate recommendations from Gemini");
      }

      const data = await response.json();
      if (data && data.recommendations) {
        setRecommendations(data.recommendations);
      } else {
        throw new Error("No crop recommendations found in Gemini response");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred. Please check your network and API key.");
      // Fallback crop recommendation for a beautiful, responsive demo in case of key absence
      setRecommendations([
        {
          cropName: "BT Cotton (Kharif)",
          confidence: 95,
          expectedYield: "8-10 Quintals/Acre",
          profitPrediction: "₹45,000 - ₹55,000 per Acre",
          waterRequirement: "Medium intensity. Requires 4 irrigations during flowering and boll development.",
          fertilizerRequirement: "NPK 120:60:60 kg/ha. Apply 5 tons of farmyard manure before sowing.",
          bestSowingDate: "June 15 - July 10",
          riskLevel: "Low",
          riskDescription: "Prone to Pink Bollworm if sown late. Keep monitoring traps.",
          marketDemand: "High (Steady textile industry demands)",
          expectedSellingPrice: "₹7,200/Quintal"
        },
        {
          cropName: "Maize (Korn)",
          confidence: 88,
          expectedYield: "20-25 Quintals/Acre",
          profitPrediction: "₹35,000 - ₹42,000 per Acre",
          waterRequirement: "Moderate water. Crop is sensitive to waterlogging, ensure good drainage.",
          fertilizerRequirement: "NPK 150:75:75 kg/ha. Top dress Nitrogen at knee-high stage.",
          bestSowingDate: "June 1 - June 25",
          riskLevel: "Low",
          riskDescription: "Susceptible to Fall Armyworm. Early chemical spray recommended.",
          marketDemand: "High (Strong demand for poultry feed and starch)",
          expectedSellingPrice: "₹2,150/Quintal"
        },
        {
          cropName: "Chilli (Teja Variety)",
          confidence: 82,
          expectedYield: "12-15 Quintals Dry Chilli/Acre",
          profitPrediction: "₹80,000 - ₹1,200,000 per Acre",
          waterRequirement: "High frequency, low volume. Best suited for Drip irrigation.",
          fertilizerRequirement: "NPK 180:90:90 kg/ha with micronutrient spray (Zinc & Boron).",
          bestSowingDate: "July 1 - July 30",
          riskLevel: "Medium",
          riskDescription: "Vulnerable to Thrips and Leaf Curl virus in cloudy weather.",
          marketDemand: "Excellent (Significant export value)",
          expectedSellingPrice: "₹18,500/Quintal"
        },
        {
          cropName: "Groundnut (Kharif)",
          confidence: 76,
          expectedYield: "10-12 Quintals/Acre",
          profitPrediction: "₹28,000 - ₹34,000 per Acre",
          waterRequirement: "Low water requirements. Highly drought tolerant once established.",
          fertilizerRequirement: "NPK 20:40:40 kg/ha. Gypsum application (400kg/ha) at pegging stage is critical.",
          bestSowingDate: "June 15 - July 5",
          riskLevel: "Low",
          riskDescription: "Root rot and leaf miner in high rain years.",
          marketDemand: "Medium-High",
          expectedSellingPrice: "₹6,400/Quintal"
        },
        {
          cropName: "Black Gram (Urad)",
          confidence: 72,
          expectedYield: "4-5 Quintals/Acre",
          profitPrediction: "₹20,000 - ₹24,000 per Acre",
          waterRequirement: "Very low. Survives purely on residual rain or 1-2 minor irrigations.",
          fertilizerRequirement: "NPK 20:40:20 kg/ha. Treat seeds with Rhizobium culture before planting.",
          bestSowingDate: "July 5 - July 25",
          riskLevel: "Low",
          riskDescription: "Mildew in foggy/wet conditions.",
          marketDemand: "High (Excellent domestic consumption)",
          expectedSellingPrice: "₹7,000/Quintal"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Convert profit strings to clean integers for chart visualization
  const getChartData = () => {
    return recommendations.map((rec) => {
      // Extract first number found inside profit string
      const match = rec.profitPrediction.replace(/,/g, "").match(/\d+/);
      const profit = match ? parseInt(match[0]) : 30000;
      return {
        name: rec.cropName.split(" ")[0],
        profit: profit,
        fullName: rec.cropName,
      };
    });
  };

  const colors = ["#1B4332", "#2D6A4F", "#40916C", "#52B788", "#74C69D"];

  return (
    <div id="crop-rec-module" className="space-y-6">
      {/* Banner */}
      <div className="bento-card-deep relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 text-white pointer-events-none">
          <Compass size={160} />
        </div>
        <span className="text-bento-mint text-xs font-bold uppercase tracking-wider bg-bento-forest/60 border border-bento-mint/20 px-3 py-1 rounded-full">
          AI Agronomic Analysis
        </span>
        <h2 className="font-display text-2xl font-bold mt-2">
          {translations.cropRec || "Smart Crop Recommendation"}
        </h2>
        <p className="text-bento-mint/80 text-sm mt-1">
          Input your chemical parameters to run scientific crop matching using historic weather, rainfall patterns, and local market demand.
        </p>
      </div>

      {!farmerProfile ? (
        <div className="bento-card text-center">
          <Sprout size={48} className="mx-auto text-bento-forest mb-3 animate-bounce" />
          <h3 className="font-display font-bold text-stone-800 text-lg">No Profile Active</h3>
          <p className="text-stone-500 text-sm max-w-md mx-auto mt-1">
            Please fill in your farmer profile details in the Dashboard tab first so that our AI can customize crop matches!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Farm Profile Summary */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bento-card space-y-4">
              <h3 className="font-display font-bold text-bento-deep text-md border-b border-stone-100 pb-2">
                Active Parameters
              </h3>

              <div className="space-y-2.5 text-xs text-stone-600">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Location</span>
                  <span className="font-bold text-stone-800">{farmerProfile.village}, {farmerProfile.district}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Soil Type</span>
                  <span className="font-bold text-stone-800">{farmerProfile.soilType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Soil pH</span>
                  <span className="font-bold text-stone-800 font-mono">{farmerProfile.soilPh || "Not tested"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">NPK Values</span>
                  <span className="font-bold text-stone-800 font-mono">
                    {farmerProfile.nitrogen || 0}N : {farmerProfile.phosphorus || 0}P : {farmerProfile.potassium || 0}K
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Irrigation Available</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${farmerProfile.irrigationAvailable ? "bg-bento-light/50 text-bento-deep" : "bg-amber-100 text-amber-800"}`}>
                    {farmerProfile.irrigationAvailable ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Water Table</span>
                  <span className="font-bold text-stone-800 font-mono">{farmerProfile.groundwaterDepth} meters</span>
                </div>
              </div>

              <button
                id="btn-generate-rec"
                onClick={handleFetchRecommendations}
                disabled={loading}
                className="w-full mt-4 bg-bento-deep hover:bg-bento-forest disabled:bg-stone-300 text-white font-medium py-3 rounded-xl transition shadow-md shadow-emerald-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" size={18} />
                    Analyzing Soil & Satellite Data...
                  </>
                ) : (
                  <>
                    <Sprout size={18} />
                    {translations.recommendButton || "Generate Crop Recommendation"}
                  </>
                )}
              </button>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 flex items-start gap-2">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Profit Chart */}
            {recommendations.length > 0 && (
              <div className="bento-card">
                <h4 className="font-display font-bold text-bento-deep text-sm mb-3">
                  Estimated Profit per Acre (INR)
                </h4>
                <div className="h-56 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#78716c" />
                      <YAxis stroke="#78716c" />
                      <Tooltip formatter={(value) => [`₹${(value as number).toLocaleString()}`, "Estimated Profit"]} />
                      <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                        {getChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Results Recommendations list */}
          <div className="lg:col-span-2 space-y-4">
            {recommendations.length === 0 ? (
              <div className="bento-card border-dashed border-bento-mint/40 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
                <Award size={40} className="text-stone-300 mb-3" />
                <h3 className="font-display font-semibold text-stone-600">No Recommendations Generated</h3>
                <p className="text-stone-400 text-xs mt-1 max-w-sm">
                  Click the button on the left to trigger the Gemini AI model. It will analyze your soil composition and recommend the absolute best crops to grow.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-display font-bold text-bento-deep text-lg flex items-center gap-2">
                  <Award className="text-bento-forest" size={22} />
                  Top 5 Suitable Crops For Your Farm
                </h3>

                <div className="space-y-4">
                  {recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="bento-card border-bento-mint/30 relative overflow-hidden"
                    >
                      {/* Left color bar matching index */}
                      <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: colors[idx % colors.length] }} />

                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-100 pb-3 mb-4 pl-2">
                        <div>
                          <h4 className="font-display font-bold text-bento-deep text-lg flex items-center gap-2">
                            {rec.cropName}
                          </h4>
                          <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                            <Calendar size={13} className="text-bento-forest" />
                            Best Sowing: <span className="font-semibold text-stone-700">{rec.bestSowingDate}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-stone-400">Match Confidence</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-bento-deep font-mono">{rec.confidence}%</span>
                              <div className="w-20 bg-stone-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-bento-deep h-full rounded-full" style={{ width: `${rec.confidence}%` }} />
                              </div>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1 ${rec.riskLevel === "Low" ? "bg-bento-light text-bento-deep" : rec.riskLevel === "Medium" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"}`}>
                            {rec.riskLevel === "Low" ? <ShieldCheck size={14} className="text-bento-deep" /> : <ShieldAlert size={14} />}
                            {rec.riskLevel} Risk
                          </span>
                        </div>
                      </div>

                      {/* Detail Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pl-2">
                        <div className="space-y-1">
                          <span className="font-bold text-stone-500 uppercase tracking-wide flex items-center gap-1">
                            <TrendingUp size={13} className="text-bento-forest" /> Expected Yield & Price
                          </span>
                          <p className="text-stone-800">Yield: <span className="font-semibold">{rec.expectedYield}</span></p>
                          <p className="text-stone-800">Expected Sale Price: <span className="font-semibold font-mono">{rec.expectedSellingPrice}</span></p>
                          <p className="text-stone-800">Demand: <span className="font-semibold">{rec.marketDemand}</span></p>
                        </div>

                        <div className="space-y-1">
                          <span className="font-bold text-stone-500 uppercase tracking-wide flex items-center gap-1">
                            <Wallet size={13} className="text-amber-700" /> Profitability Prediction
                          </span>
                          <p className="text-bento-deep font-semibold bg-bento-light/40 border border-bento-mint/30 px-2 py-1 rounded-lg inline-block font-mono">
                            {rec.profitPrediction}
                          </p>
                        </div>

                        <div className="md:col-span-2 space-y-1 bg-stone-50/50 p-3 rounded-2xl border border-stone-100/60 mt-1">
                          <p className="text-stone-700">
                            <span className="font-bold text-stone-800 flex items-center gap-1">
                              <Droplet size={14} className="text-bento-forest" /> Water Requirement:
                            </span>
                            {rec.waterRequirement}
                          </p>
                          <p className="text-stone-700 mt-2">
                            <span className="font-bold text-stone-800 flex items-center gap-1">
                              <Sprout size={14} className="text-bento-forest" /> Fertilizer & Organic Schedule:
                            </span>
                            {rec.fertilizerRequirement}
                          </p>
                          <p className="text-stone-700 mt-2 text-rose-800 bg-rose-50/50 p-2 rounded-xl border border-rose-100/60 flex gap-1.5 items-start">
                            <ShieldAlert size={14} className="shrink-0 mt-0.5 text-rose-600" />
                            <span><strong className="text-rose-900">Crop Risk Note:</strong> {rec.riskDescription}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
