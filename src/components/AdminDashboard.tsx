import React, { useState } from "react";
import { Landmark, Users, MessageSquare, AlertTriangle, Send, Sparkles, ShieldAlert, BarChart, CheckCircle, Smartphone, RefreshCw } from "lucide-react";
import { ExpertTicket } from "../types";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface AdminProps {
  onResolveTicket: (ticketId: string, replyMessage: string) => void;
  allTickets: ExpertTicket[];
  translations: Record<string, string>;
}

export default function AdminDashboard({ onResolveTicket, allTickets, translations }: AdminProps) {
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastLang, setBroadcastLang] = useState("telugu");
  const [broadcastType, setBroadcastType] = useState("Pest Alert");
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Selected ticket to answer
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const activeTickets = allTickets.filter(t => t.status !== "Resolved");

  const handleDispatchBroadcast = () => {
    if (!broadcastMessage.trim()) return;
    setLoading(true);

    setTimeout(() => {
      setBroadcastSuccess(true);
      setBroadcastMessage("");
      setLoading(false);
      setTimeout(() => setBroadcastSuccess(false), 3000);
    }, 1500);
  };

  const handleResolve = (ticketId: string) => {
    if (!replyText.trim()) return;
    onResolveTicket(ticketId, replyText);
    setReplyText("");
    setActiveTicketId(null);
  };

  // Pie chart datasets
  const cropStats = [
    { name: "BT Cotton", value: 450 },
    { name: "Maize", value: 320 },
    { name: "Dry Chilli", value: 240 },
    { name: "Paddy (Rice)", value: 510 },
    { name: "Greengram", value: 120 },
  ];

  const diseaseStats = [
    { name: "Alternaria Spot", value: 45 },
    { name: "Pink Bollworm", value: 30 },
    { name: "Leaf Curl Virus", value: 22 },
    { name: "Blast / Mildew", value: 18 },
    { name: "Healthy / Safe", value: 160 },
  ];

  const COLORS = ["#1B4332", "#2D6A4F", "#40916C", "#52B788", "#74C69D"];

  return (
    <div id="admin-module" className="space-y-6">
      {/* Banner */}
      <div className="bento-card-deep relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 p-8 opacity-10 text-white pointer-events-none">
          <Landmark size={160} />
        </div>
        <span className="text-bento-mint text-xs font-bold uppercase tracking-wider bg-bento-forest/60 border border-bento-mint/20 px-3 py-1 rounded-full">
          Agriculture Command & Control Centre
        </span>
        <h2 className="font-display text-2xl font-bold mt-2">
          {translations.admin || "RSK Administration & Analytics"}
        </h2>
        <p className="text-bento-mint/80 text-sm mt-1">
          Review state-wide agronomic health indicators, trace disease outbreaks, dispatch automated regional warning broadcasts, and respond to farmer tickets.
        </p>
      </div>

      {/* Metrics Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bento-card flex items-center gap-3">
          <div className="p-3 bg-bento-light text-bento-deep rounded-2xl">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[10px] text-stone-500 font-bold uppercase block">Registered Farmers</span>
            <span className="text-xl font-bold font-mono text-bento-deep">1,480</span>
          </div>
        </div>

        <div className="bento-card flex items-center gap-3">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl">
            <MessageSquare size={20} />
          </div>
          <div>
            <span className="text-[10px] text-stone-500 font-bold uppercase block">Pending RSK Tickets</span>
            <span className="text-xl font-bold font-mono text-stone-800">{activeTickets.length}</span>
          </div>
        </div>

        <div className="bento-card flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-800 rounded-2xl">
            <Smartphone size={20} />
          </div>
          <div>
            <span className="text-[10px] text-stone-500 font-bold uppercase block">SMS Advisories Sent</span>
            <span className="text-xl font-bold font-mono text-stone-800">14,240</span>
          </div>
        </div>

        <div className="bento-card flex items-center gap-3">
          <div className="p-3 bg-red-100 text-red-800 rounded-2xl">
            <AlertTriangle size={20} />
          </div>
          <div>
            <span className="text-[10px] text-stone-500 font-bold uppercase block">Disease Alert Hotspots</span>
            <span className="text-xl font-bold font-mono text-stone-800">3 Villages</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts block */}
        <div className="lg:col-span-2 bento-card space-y-6">
          <h3 className="font-display font-bold text-bento-deep text-base">State-wide Crop Distribution & Soil Infection Logs</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pie chart crop choices */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
              <h4 className="text-xs font-bold text-stone-600 uppercase mb-3 text-center">Active Crop Choices (Acres)</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={cropStats} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} fill="#82ca9d" label>
                      {cropStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar chart disease outbreaks */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
              <h4 className="text-xs font-bold text-stone-600 uppercase mb-3 text-center">Pathology Diagnosis Counts</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={diseaseStats} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="#78716c" tick={{ fontSize: 9 }} />
                    <YAxis stroke="#78716c" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1B4332" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency SMS Broadcast Panel */}
        <div className="bento-card space-y-4">
          <h3 className="font-display font-bold text-bento-deep text-md border-b border-stone-100 pb-2">
            Emergency SMS Broadcaster
          </h3>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-stone-500 uppercase mb-1">Advisory Type</label>
              <select
                value={broadcastType}
                onChange={(e) => setBroadcastType(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-bento-accent"
              >
                <option value="Pest Alert">Pest Outbreak Alert</option>
                <option value="Rain Alert">Heavy Precipitation Alert</option>
                <option value="Frost Warning">Frost / Cold Weather alert</option>
                <option value="Government Scheme">New Scheme announcement</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-500 uppercase mb-1">Broadcast Language</label>
              <select
                value={broadcastLang}
                onChange={(e) => setBroadcastLang(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-bento-accent"
              >
                <option value="telugu">Telugu (తెలుగు)</option>
                <option value="hindi">Hindi (हिन्दी)</option>
                <option value="english">English</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-500 uppercase mb-1">Warning Message Content</label>
              <textarea
                rows={3}
                required
                placeholder="Type advisory text to be generated and broadcasted..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-bento-accent"
              />
            </div>

            <button
              onClick={handleDispatchBroadcast}
              disabled={loading || !broadcastMessage.trim()}
              className="w-full bg-bento-deep hover:bg-bento-forest disabled:bg-stone-300 text-white font-medium py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={15} />
                  Broadcasting SMS...
                </>
              ) : (
                <>
                  <Send size={15} />
                  Dispatch Emergency Warning
                </>
              )}
            </button>

            {broadcastSuccess && (
              <div className="p-3 bg-bento-light/60 border border-bento-mint/30 rounded-xl text-[11px] text-bento-deep font-bold flex items-center gap-1.5 animate-bounce">
                <CheckCircle size={15} /> SMS Broadcast dispatched to 1,480 farmers successfully!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Answer Farmer tickets in real-time */}
      <div className="bento-card">
        <h3 className="font-display font-bold text-bento-deep text-md mb-4 flex items-center gap-1.5">
          <MessageSquare className="text-bento-forest" size={18} />
          Respond to Unresolved Farmer Consultations ({activeTickets.length})
        </h3>

        {activeTickets.length === 0 ? (
          <p className="text-stone-400 text-xs italic text-center py-6">All farmer consultation tickets are currently resolved!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTickets.map((ticket) => (
              <div key={ticket.id} className="p-4 bg-white border border-stone-200/60 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-stone-500 mb-1">
                    <span>Farmer: {ticket.farmerName}</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-display font-bold text-xs text-stone-900">{ticket.title}</h4>
                  <p className="text-[11px] text-stone-600 line-clamp-2 mt-1 italic">"{ticket.description}"</p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-150">
                  {activeTicketId === ticket.id ? (
                    <div className="space-y-2">
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type expert agronomy solution..."
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-bento-accent"
                      />
                      <div className="flex justify-end gap-2 text-xs">
                        <button
                          onClick={() => {
                            setActiveTicketId(null);
                            setReplyText("");
                          }}
                          className="px-2.5 py-1 text-stone-600 hover:bg-stone-100 rounded cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleResolve(ticket.id)}
                          className="px-3 py-1 bg-bento-deep hover:bg-bento-forest text-white rounded font-bold cursor-pointer"
                        >
                          Send Answer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveTicketId(ticket.id)}
                      className="text-xs bg-bento-light hover:bg-bento-light/80 text-bento-deep font-bold px-3 py-1.5 rounded-lg border border-bento-mint/30 flex items-center gap-1.5 w-full justify-center transition cursor-pointer"
                    >
                      <Sparkles size={13} /> Respond as Expert Agronomist
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
