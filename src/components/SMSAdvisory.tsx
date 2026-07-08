import React, { useState } from "react";
import { MessageSquare, Smartphone, Sparkles, Send, Bell, ShieldCheck, RefreshCw, Calendar, Flame } from "lucide-react";
import { FarmerProfile } from "../types";

interface SMSProps {
  farmerProfile: FarmerProfile | null;
  translations: Record<string, string>;
}

interface SMSLog {
  smsText: string;
  englishTranslation: string;
  actionRequired: string;
  type: string;
  timestamp: string;
}

export default function SMSAdvisory({ farmerProfile, translations }: SMSProps) {
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState("Rain Alert");
  const [customDetail, setCustomDetail] = useState("");
  const [phoneMessage, setPhoneMessage] = useState<string | null>(null);

  const alertTypes = [
    { type: "Rain Alert", icon: "🌧️", desc: "Heavy downpours, water stagnation" },
    { type: "Pest Alert", icon: "🐛", desc: "Pink Bollworm, Fall Armyworm alerts" },
    { type: "Irrigation Schedule", icon: "💧", desc: "Water scheduling, dry spells" },
    { type: "Fertilizer Reminder", icon: "🌾", desc: "Nitrogen top-dressing alerts" },
  ];

  const handleTriggerSMS = async () => {
    if (!farmerProfile) return;
    setLoading(true);
    setPhoneMessage(null);

    const details = {
      village: farmerProfile.village,
      district: farmerProfile.district,
      crop: farmerProfile.soilType.includes("Black") ? "Cotton/Maize" : "Paddy",
      custom: customDetail,
    };

    try {
      const response = await fetch("/api/gemini/sms-advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          language: farmerProfile.language,
          farmerName: farmerProfile.name,
          details,
        }),
      });

      if (!response.ok) throw new Error();
      const data = await response.json();

      const newLog: SMSLog = {
        smsText: data.smsText,
        englishTranslation: data.englishTranslation,
        actionRequired: data.actionRequired,
        type: selectedType,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setLogs((prev) => [newLog, ...prev]);
      setPhoneMessage(data.smsText);
      setCustomDetail("");
    } catch (e) {
      // Elegant multi-lingual fallback SMS
      const fallback = getFallbackSMS(selectedType, farmerProfile.language, farmerProfile.name);
      const newLog: SMSLog = {
        smsText: fallback.sms,
        englishTranslation: fallback.eng,
        actionRequired: fallback.act,
        type: selectedType,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setLogs((prev) => [newLog, ...prev]);
      setPhoneMessage(fallback.sms);
    } finally {
      setLoading(false);
    }
  };

  const getFallbackSMS = (type: string, lang: string, name: string) => {
    if (lang === "telugu") {
      if (type === "Rain Alert") {
        return {
          sms: `కృషిమిత్ర హెచ్చరిక: ${name} గారు, రాగల 24 గంటల్లో మీ గ్రామంలో భారీ వర్షాలు కురిసే అవకాశం ఉంది. పొలంలో అదనపు నీరు నిల్వ ఉండకుండా డ్రైనేజీ కాలువలు శుభ్రం చేయండి.`,
          eng: "KrishiMitra Alert: Heavy rains predicted in your village within 24 hours. Clear drainage channels to prevent water stagnation in fields.",
          act: "Clear field channels immediately."
        };
      }
      return {
        sms: `కృషిమిత్ర అడ్వైజరీ: ${name} గారు, ఎరువుల సమయం ఆసన్నమైంది. యూరియా @ 50 కేజీలు ఎకరాకు పత్తి పంట మొదటి దశకు వేయండి. తేమ ఉన్నప్పుడు మాత్రమే జల్లండి.`,
        eng: "KrishiMitra Advisory: Time for fertilization. Top dress Urea @ 50kg/acre for early Cotton stage when there is moisture.",
        act: "Apply Urea dosage to Cotton field."
      };
    } else if (lang === "hindi") {
      if (type === "Rain Alert") {
        return {
          sms: `कृषिमित्र अलर्ट: प्रिय ${name}, अगले 24 घंटों में आपके गाँव में भारी बारिश की चेतावनी है। खेत में जलभराव रोकने के लिए जल निकासी नालियों को तुरंत साफ करें।`,
          eng: "KrishiMitra Alert: Heavy rain alert in your village for next 24h. Clear all drainage pipes to stop waterlogging in soil.",
          act: "Clean farm drainage vents."
        };
      }
      return {
        sms: `कृषिमित्र एडवाइजरी: प्रिय ${name}, अपनी मक्का फसल में नाइट्रोजन खाद छिड़कें। प्रति एकड़ 45 किलोग्राम यूरिया सुबह या शाम के समय मिट्टी नम होने पर ही डालें।`,
        eng: "KrishiMitra Advisory: Apply Nitrogen to Maize. Spread Urea @ 45kg/acre in morning when soil is moist.",
        act: "Add Urea to Maize crops."
      };
    }

    // Default English fallback
    return {
      sms: `KrishiMitra Alert: Dear ${name}, heavy rains expected in 24 hours. Ensure drainage is clear in your farm to prevent waterlogging. Call RSK toll-free for help.`,
      eng: "KrishiMitra Alert: Heavy rains expected. Clear crop stagnation points immediately.",
      act: "Clear drainage vents."
    };
  };

  return (
    <div id="sms-advisory-module" className="space-y-6">
      {/* Banner */}
      <div className="bento-card-deep relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 text-white pointer-events-none">
          <Smartphone size={160} />
        </div>
        <span className="text-bento-mint text-xs font-bold uppercase tracking-wider bg-bento-forest/60 border border-bento-mint/20 px-3 py-1 rounded-full">
          Hyperlocal SMS Advisory Broadcast
        </span>
        <h2 className="font-display text-2xl font-bold mt-2">
          {translations.sms || "Voice & SMS Advisory Dispatcher"}
        </h2>
        <p className="text-bento-mint/80 text-sm mt-1">
          Simulate our automated warning broadcast engine. Generates hyper-local, Native language SMS advisories (Pest notifications, Sowing windows, Frost warnings) calibrated to agricultural profiles.
        </p>
      </div>

      {!farmerProfile ? (
        <div className="bento-card text-center py-12">
          <MessageSquare size={48} className="mx-auto text-bento-forest mb-3 animate-pulse" />
          <h3 className="font-display font-bold text-bento-deep text-lg">No Profile Activated</h3>
          <p className="text-stone-500 text-sm max-w-md mx-auto mt-1">
            Complete your profile card in the Dashboard tab to unlock localized language translation triggers and trigger native SMS templates.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Dispatch controls */}
          <div className="lg:col-span-4 bento-card space-y-4">
            <h3 className="font-display font-bold text-bento-deep text-md border-b border-stone-100 pb-2">
              Select Advisory Category
            </h3>

            <div className="space-y-2">
              {alertTypes.map((alert) => (
                <div
                  key={alert.type}
                  onClick={() => setSelectedType(alert.type)}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition flex items-center gap-3 ${selectedType === alert.type ? "bg-bento-light/50 border-bento-deep shadow-xs" : "bg-white border-stone-150 hover:bg-stone-50"}`}
                >
                  <span className="text-xl">{alert.icon}</span>
                  <div>
                    <h4 className="font-display font-bold text-xs text-bento-deep">{alert.type}</h4>
                    <p className="text-[10px] text-stone-500">{alert.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider">Custom Context (Optional)</label>
              <input
                type="text"
                placeholder="e.g. winds are 30km/h"
                value={customDetail}
                onChange={(e) => setCustomDetail(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-bento-accent"
              />
            </div>

            <button
              id="btn-trigger-sms"
              onClick={handleTriggerSMS}
              disabled={loading}
              className="w-full bg-bento-deep hover:bg-bento-forest disabled:bg-stone-300 text-white font-medium py-3 rounded-xl transition shadow-md shadow-emerald-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  Writing native SMS alert...
                </>
              ) : (
                <>
                  <Bell size={16} />
                  Dispatch Test SMS Alert
                </>
              )}
            </button>
          </div>

          {/* Smartphone Simulator */}
          <div className="lg:col-span-4 flex justify-center items-center">
            <div className="relative w-72 h-[480px] bg-stone-900 rounded-[40px] border-[10px] border-stone-800 shadow-2xl flex flex-col overflow-hidden">
              {/* Speaker notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-stone-800 rounded-b-2xl z-20 flex justify-center items-center">
                <div className="w-12 h-1 bg-stone-700 rounded-full" />
              </div>

              {/* Simulated Screen */}
              <div className="flex-1 bg-[#d8e2dc] pt-8 px-4 pb-4 flex flex-col justify-between overflow-hidden relative">
                {/* Simulated Notification / Incoming text */}
                <div className="space-y-3 flex-1 overflow-y-auto pt-2">
                  <div className="text-center text-[9px] text-stone-600 font-bold tracking-wider mb-2">TODAY • SMS MESSAGE</div>
                  
                  {phoneMessage ? (
                    <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-[11px] leading-snug text-stone-800 border border-stone-200/50 relative animate-fade-in">
                      <div className="font-bold text-bento-forest text-[10px] uppercase mb-1 flex items-center gap-1">
                        <Sparkles size={10} /> KrishiMitra
                      </div>
                      <p>{phoneMessage}</p>
                      <span className="text-[8px] text-stone-400 font-mono block text-right mt-1.5">
                        {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ) : (
                    <div className="text-center text-stone-500 text-[10px] py-10 italic">
                      No advisory messages dispatched yet. Trigger an alert on the left to see it arrive!
                    </div>
                  )}
                </div>

                {/* Simulated Input field */}
                <div className="bg-white/70 backdrop-blur p-2 rounded-2xl flex items-center justify-between border">
                  <span className="text-[10px] text-stone-500 pl-2">Reply to KrishiMitra...</span>
                  <div className="p-1.5 bg-bento-forest text-white rounded-full shrink-0">
                    <Send size={10} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Historical Logs summary list */}
          <div className="lg:col-span-4 bento-card flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-display font-bold text-bento-deep text-sm border-b border-stone-100 pb-2">
                Advisory Outbox Logs
              </h3>

              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1 text-xs">
                {logs.length === 0 ? (
                  <p className="text-stone-400 italic text-center py-12">No messages dispatched.</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="p-3 bg-stone-50 rounded-2xl border border-stone-200/50 space-y-1">
                      <div className="flex justify-between font-bold text-[10px]">
                        <span className="text-bento-forest">{log.type}</span>
                        <span className="text-stone-400">{log.timestamp}</span>
                      </div>
                      <p className="text-stone-700 font-medium font-mono text-[10px] line-clamp-2 mt-0.5">"{log.smsText}"</p>
                      <p className="text-stone-500 italic text-[10px]">Translation: "{log.englishTranslation}"</p>
                      <div className="text-[9px] bg-bento-light/60 text-bento-deep px-2 py-0.5 rounded font-bold w-fit mt-1.5 flex items-center gap-1">
                        <ShieldCheck size={11} /> Action: {log.actionRequired}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
