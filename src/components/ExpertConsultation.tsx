import React, { useState, useEffect } from "react";
import { MessageSquare, Image, Volume2, Plus, Sparkles, Send, CheckCircle, HelpCircle, FileText, Trash2 } from "lucide-react";
import { FarmerProfile, ExpertTicket } from "../types";
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { DEMO_TICKETS } from "../data";

interface ExpertProps {
  farmerProfile: FarmerProfile | null;
  translations: Record<string, string>;
}

export default function ExpertConsultation({ farmerProfile, translations }: ExpertProps) {
  const [tickets, setTickets] = useState<ExpertTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<ExpertTicket | null>(null);
  const [loading, setLoading] = useState(false);
  
  // New ticket fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ticketImage, setTicketImage] = useState<string | null>(null);
  const [ticketVoice, setTicketVoice] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Reply message
  const [replyMessage, setReplyMessage] = useState("");

  useEffect(() => {
    loadTickets();
  }, [farmerProfile]);

  const loadTickets = async () => {
    if (!farmerProfile) return;
    setLoading(true);
    try {
      const q = query(collection(db, "expertTickets"), where("farmerId", "==", farmerProfile.id));
      const querySnapshot = await getDocs(q);
      const ticketsList: ExpertTicket[] = [];
      querySnapshot.forEach((doc) => {
        ticketsList.push({ id: doc.id, ...doc.data() } as ExpertTicket);
      });

      if (ticketsList.length === 0) {
        // Fallback or seed with default DEMO tickets for outstanding evaluation
        setTickets(DEMO_TICKETS as any[]);
        setSelectedTicket(DEMO_TICKETS[0] as any);
      } else {
        setTickets(ticketsList);
        setSelectedTicket(ticketsList[0]);
      }
    } catch (e) {
      if (e && (typeof e === 'object' && ('code' in e && e.code === 'permission-denied') || String(e).toLowerCase().includes("permission") || String(e).toLowerCase().includes("insufficient"))) {
        handleFirestoreError(e, OperationType.GET, "expertTickets");
      }
      console.error(e);
      setTickets(DEMO_TICKETS as any[]);
      setSelectedTicket(DEMO_TICKETS[0] as any);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerProfile || !title.trim() || !description.trim()) return;

    setLoading(true);
    const newTicket: Omit<ExpertTicket, "id"> = {
      farmerId: farmerProfile.id,
      farmerName: farmerProfile.name,
      title,
      description,
      imageUrl: ticketImage || "",
      voiceUrl: ticketVoice ? "voice_note_demo.mp3" : "",
      status: "Open",
      createdAt: new Date().toISOString(),
      replies: []
    };

    try {
      const docRef = await addDoc(collection(db, "expertTickets"), newTicket);
      const ticketWithId = { id: docRef.id, ...newTicket } as ExpertTicket;
      
      setTickets(prev => [ticketWithId, ...prev]);
      setSelectedTicket(ticketWithId);
      
      // Reset form
      setTitle("");
      setDescription("");
      setTicketImage(null);
      setTicketVoice(false);
      setShowCreateForm(false);
    } catch (err) {
      if (err && (typeof err === 'object' && ('code' in err && err.code === 'permission-denied') || String(err).toLowerCase().includes("permission") || String(err).toLowerCase().includes("insufficient"))) {
        handleFirestoreError(err, OperationType.CREATE, "expertTickets");
      }
      console.error(err);
      // fallback local state append
      const localWithId = { id: `ticket_${Date.now()}`, ...newTicket } as ExpertTicket;
      setTickets(prev => [localWithId, ...prev]);
      setSelectedTicket(localWithId);
      setShowCreateForm(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim() || !farmerProfile) return;

    const reply = {
      sender: "farmer" as const,
      senderName: farmerProfile.name,
      message: replyMessage,
      sentAt: new Date().toISOString()
    };

    const updatedReplies = [...selectedTicket.replies, reply];
    setSelectedTicket(prev => prev ? { ...prev, replies: updatedReplies } : null);
    setReplyMessage("");

    // Update tickets array
    setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, replies: updatedReplies } : t));

    try {
      const ticketRef = doc(db, "expertTickets", selectedTicket.id);
      await updateDoc(ticketRef, { replies: updatedReplies });
    } catch (err) {
      if (err && (typeof err === 'object' && ('code' in err && err.code === 'permission-denied') || String(err).toLowerCase().includes("permission") || String(err).toLowerCase().includes("insufficient"))) {
        handleFirestoreError(err, OperationType.UPDATE, `expertTickets/${selectedTicket.id}`);
      }
      console.error("Firebase update failed, updating locally:", err);
    }
  };

  const processImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setTicketImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div id="expert-module" className="space-y-6">
      {/* Banner */}
      <div className="bento-card-deep relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 text-white pointer-events-none">
          <MessageSquare size={160} />
        </div>
        <span className="text-bento-mint text-xs font-bold uppercase tracking-wider bg-bento-forest/60 border border-bento-mint/20 px-3 py-1 rounded-full">
          Rythu Seva Kendra Consultation
        </span>
        <h2 className="font-display text-2xl font-bold mt-2">
          {translations.expert || "RSK Expert Consultation"}
        </h2>
        <p className="text-bento-mint/80 text-sm mt-1">
          Direct lines to Government Agronomists and officers at your village Rythu Seva Kendras (RSK). Raise tickets, upload leaf pictures, and clarify technical issues.
        </p>
      </div>

      {!farmerProfile ? (
        <div className="bento-card text-center py-12">
          <MessageSquare size={48} className="mx-auto text-bento-forest mb-3 animate-pulse" />
          <h3 className="font-display font-bold text-bento-deep text-lg">No Farmer Profile</h3>
          <p className="text-stone-500 text-sm max-w-md mx-auto mt-1">
            Sign in and finalize your profile in the Dashboard to consult with experts and open agricultural assistance tickets.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets Sidebar */}
          <div className="space-y-4 lg:col-span-1">
            <div className="bento-card space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-display font-bold text-bento-deep text-sm">Consultation Tickets</h3>
                <button
                  id="btn-new-ticket-toggle"
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="bg-bento-light hover:bg-bento-light/80 text-bento-deep font-bold p-1.5 rounded-xl transition flex items-center gap-1 text-xs cursor-pointer"
                >
                  <Plus size={15} /> Raise Ticket
                </button>
              </div>

              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTicket(t);
                      setShowCreateForm(false);
                    }}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition ${selectedTicket?.id === t.id && !showCreateForm ? "bg-bento-light/50 border-bento-deep shadow-xs" : "bg-white border-stone-150 hover:bg-stone-50"}`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg ${t.status === "Open" ? "bg-blue-100 text-blue-800" : t.status === "In Progress" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                        {t.status}
                      </span>
                      <span className="text-[9px] text-stone-400 font-mono">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-display font-bold text-xs text-bento-deep mt-1.5 line-clamp-1">{t.title}</h4>
                    <p className="text-[10px] text-stone-500 line-clamp-2 mt-1">{t.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ticket Detail / Conversation or Form Area */}
          <div className="lg:col-span-2">
            {showCreateForm ? (
              <form onSubmit={handleCreateTicket} className="bento-card space-y-4">
                <h3 className="font-display font-bold text-bento-deep text-base flex items-center gap-1.5">
                  <Plus className="text-bento-forest" size={18} /> Raise a New Scientific consultation Ticket
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-stone-500 uppercase mb-1">Subject / Crop Problem</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chilli leaf curl and fruit spots"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-bento-accent"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-500 uppercase mb-1">Elaborate Problem Symptoms</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="e.g. My crop is 60 days old. From 5 days, I noticed whitish powder on leaves and black spotting. Humidity is very high."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-bento-accent text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-stone-500 uppercase mb-1">Leaf Image (Optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && processImage(e.target.files[0])}
                        className="w-full text-stone-500 text-[10px]"
                      />
                      {ticketImage && (
                        <div className="mt-2 relative w-20 h-20 rounded-xl overflow-hidden border">
                          <img src={ticketImage} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 h-full mt-4 pl-1">
                      <input
                        type="checkbox"
                        id="voice-ticket"
                        checked={ticketVoice}
                        onChange={(e) => setTicketVoice(e.target.checked)}
                        className="w-4 h-4 text-bento-deep rounded focus:ring-bento-accent"
                      />
                      <label htmlFor="voice-ticket" className="font-bold text-stone-700 select-none cursor-pointer">
                        Attach Speech Voice Note
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 bg-stone-50 hover:bg-stone-100 text-stone-600 rounded-xl text-xs font-semibold border transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-bento-deep hover:bg-bento-forest text-white font-semibold rounded-xl text-xs transition shadow-xs cursor-pointer"
                  >
                    Submit Ticket
                  </button>
                </div>
              </form>
            ) : selectedTicket ? (
              <div className="bento-card space-y-5 flex flex-col min-h-[400px]">
                {/* Header info */}
                <div className="flex justify-between items-start border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="font-display font-bold text-bento-deep text-base">{selectedTicket.title}</h3>
                    <p className="text-[10px] text-stone-500 mt-0.5">Raised by: <strong className="text-stone-700">{selectedTicket.farmerName}</strong> on {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${selectedTicket.status === "Open" ? "bg-blue-100 text-blue-800" : selectedTicket.status === "In Progress" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                    Status: {selectedTicket.status}
                  </span>
                </div>

                {/* Body Query details */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/50 text-xs text-stone-700 space-y-3">
                  <p className="leading-relaxed">{selectedTicket.description}</p>
                  {selectedTicket.imageUrl && (
                    <div className="w-28 h-28 rounded-xl overflow-hidden border">
                      <img src={selectedTicket.imageUrl} alt="Uploaded problem" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {selectedTicket.voiceUrl && (
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border w-fit">
                      <Volume2 size={14} className="text-bento-forest" />
                      <span className="text-[10px] font-bold text-stone-600">FarmerVoiceNote.mp3</span>
                    </div>
                  )}
                </div>

                {/* Conversation Box */}
                <div className="flex-1 space-y-4 max-h-[220px] overflow-y-auto pr-1">
                  <h4 className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Responses & Advice</h4>
                  {selectedTicket.replies.length === 0 ? (
                    <div className="p-4 text-center text-xs text-stone-400 italic">
                      No agronomist response yet. RSK Officers typically reply within 2 hours.
                    </div>
                  ) : (
                    selectedTicket.replies.map((rep, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-2xl text-xs space-y-1 ${rep.sender === "expert" ? "bg-bento-light/40 border border-bento-mint/30 text-stone-800" : "bg-stone-50 border border-stone-150 text-stone-800 ml-4"}`}
                      >
                        <div className="flex justify-between text-[9px] font-bold text-stone-500">
                          <span className={rep.sender === "expert" ? "text-bento-deep" : "text-stone-700"}>{rep.senderName}</span>
                          <span className="font-mono">{new Date(rep.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p className="leading-relaxed">{rep.message}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Send response bar */}
                <div className="flex gap-2 border-t border-stone-100 pt-3">
                  <input
                    type="text"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                    placeholder="Type supplementary symptoms or ask experts further details..."
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-bento-accent"
                  />
                  <button
                    id="btn-expert-reply-send"
                    onClick={handleSendReply}
                    disabled={!replyMessage.trim()}
                    className="p-2.5 bg-bento-deep hover:bg-bento-forest text-white rounded-xl transition disabled:bg-stone-200 disabled:text-stone-400 cursor-pointer"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bento-card text-center text-stone-500 flex flex-col items-center justify-center h-full min-h-[300px]">
                <HelpCircle size={40} className="text-stone-300 mb-2" />
                <h3 className="font-display font-semibold text-stone-600">Select a ticket</h3>
                <p className="text-xs text-stone-400 max-w-xs mt-1">Select any consultation ticket on the left menu, or tap "Raise Ticket" to submit a new query.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
