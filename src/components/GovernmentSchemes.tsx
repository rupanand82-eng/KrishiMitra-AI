import React, { useState } from "react";
import { Landmark, Award, ShieldCheck, Check, Sparkles, Filter, ExternalLink, HelpCircle, BadgeInfo } from "lucide-react";
import { FarmerProfile } from "../types";
import { DEFAULT_SCHEMES } from "../data";

interface SchemesProps {
  farmerProfile: FarmerProfile | null;
  translations: Record<string, string>;
}

export default function GovernmentSchemes({ farmerProfile, translations }: SchemesProps) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [onlyShowEligible, setOnlyShowEligible] = useState(false);

  const categories = ["All", "Direct Benefit", "Insurance", "Subsidies", "Loans", "Seeds & Fertilisers"];

  const checkEligibility = (schemeId: string): { eligible: boolean; reason: string } => {
    if (!farmerProfile) return { eligible: true, reason: "Login to verify precise eligibility" };

    switch (schemeId) {
      case "pm-kisan":
        if (farmerProfile.farmSize <= 5) {
          return { eligible: true, reason: "Eligible: Verified as a Small and Marginal Farmer (<5 acres)." };
        }
        return { eligible: false, reason: "Ineligible: Typically restricted to landholding sizes below threshold in certain states." };
      case "pmfby":
        return { eligible: true, reason: "Eligible: Approved for active field cultivators in notified crops." };
      case "pmksy":
        if (!farmerProfile.irrigationAvailable) {
          return { eligible: true, reason: "Highly Recommended: You have no active irrigation, qualify for drip installation subsidies (up to 80% cost cover)." };
        }
        return { eligible: true, reason: "Eligible: Qualifies for upgrading to precision micro-irrigation sprinklers." };
      case "kcc":
        return { eligible: true, reason: "Eligible: Valid land possession records make you eligible for quick subsidized credit." };
      case "subsidised-seeds":
        if (farmerProfile.farmSize <= 10) {
          return { eligible: true, reason: "Eligible: Small farmholdings get priority seed/fertiliser dispatch codes." };
        }
        return { eligible: true, reason: "Eligible: Standard seed subsidy scales apply." };
      default:
        return { eligible: true, reason: "Eligible: Open schema." };
    }
  };

  const filteredSchemes = DEFAULT_SCHEMES.filter(scheme => {
    const matchesCategory = activeCategory === "All" || scheme.category === activeCategory;
    if (onlyShowEligible && farmerProfile) {
      const eligibility = checkEligibility(scheme.id);
      return matchesCategory && eligibility.eligible;
    }
    return matchesCategory;
  });

  return (
    <div id="schemes-module" className="space-y-6">
      {/* Banner */}
      <div className="bento-card-deep relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 text-white pointer-events-none">
          <Landmark size={160} />
        </div>
        <span className="text-bento-mint text-xs font-bold uppercase tracking-wider bg-bento-forest/60 border border-bento-mint/20 px-3 py-1 rounded-full">
          Government Welfare & Subsidies
        </span>
        <h2 className="font-display text-2xl font-bold mt-2">
          {translations.schemes || "Government Schemes & Loans"}
        </h2>
        <p className="text-bento-mint/80 text-sm mt-1">
          Explore and apply for central agricultural subsidies, low-interest farm loans, crop insurance plans, and direct cash payouts.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-4 rounded-3xl border border-bento-mint/30 shadow-xs">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${activeCategory === cat ? "bg-bento-deep text-white shadow-xs" : "bg-stone-50 text-stone-600 hover:bg-stone-100"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {farmerProfile && (
          <div className="flex items-center gap-2 bg-bento-light/50 px-3.5 py-1.5 rounded-2xl border border-bento-mint/30">
            <Sparkles size={14} className="text-bento-forest" />
            <span className="text-xs font-bold text-bento-deep">Filter Eligible Only</span>
            <input
              type="checkbox"
              id="eligible-toggle"
              checked={onlyShowEligible}
              onChange={(e) => setOnlyShowEligible(e.target.checked)}
              className="w-4 h-4 text-bento-deep border-stone-300 rounded focus:ring-bento-accent"
            />
          </div>
        )}
      </div>

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSchemes.map((scheme) => {
          const elig = checkEligibility(scheme.id);
          return (
            <div
              key={scheme.id}
              className="bento-card flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <span className="bg-stone-100 text-stone-700 text-[10px] font-bold px-2.5 py-0.5 rounded-lg border border-stone-200/40 uppercase">
                    {scheme.category}
                  </span>
                  {farmerProfile && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${elig.eligible ? "bg-bento-light text-bento-deep" : "bg-stone-100 text-stone-600"}`}>
                      {elig.eligible ? <ShieldCheck size={12} /> : <BadgeInfo size={12} />}
                      {elig.eligible ? "Match Eligible" : "Review Details"}
                    </span>
                  )}
                </div>

                <h3 className="font-display font-bold text-bento-deep text-base">{scheme.name}</h3>
                <p className="text-xs text-stone-600 leading-relaxed">{scheme.description}</p>

                <div className="pt-2 border-t border-stone-100 space-y-2">
                  <p className="text-xs text-stone-700">
                    <strong>Benefits:</strong> {scheme.benefits}
                  </p>
                  <p className="text-xs text-stone-700">
                    <strong>Eligibility:</strong> {scheme.eligibility}
                  </p>
                </div>
              </div>

              {/* Action area */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex flex-col gap-2">
                {farmerProfile && (
                  <div className={`p-2 rounded-xl text-[11px] leading-snug flex gap-1.5 items-start ${elig.eligible ? "bg-bento-light/40 text-bento-deep border border-bento-mint/20" : "bg-stone-50 text-stone-600 border border-stone-100"}`}>
                    <Check size={13} className="shrink-0 mt-0.5 text-bento-forest" />
                    <span>{elig.reason}</span>
                  </div>
                )}
                <a
                  href={scheme.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-stone-50 hover:bg-stone-100 border border-stone-200/80 text-stone-700 font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Apply on Govt Portal
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
