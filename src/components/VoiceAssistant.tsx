import React, { useState, useEffect, useRef } from "react";
import { Brain, Volume2, VolumeX, Mic, MicOff, Send, HelpCircle, Sparkles, RefreshCw, Compass } from "lucide-react";
import { FarmerProfile, ChatMessage } from "../types";

interface VoiceProps {
  farmerProfile: FarmerProfile | null;
  translations: Record<string, string>;
}

export default function VoiceAssistant({ farmerProfile, translations }: VoiceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Initial welcome greeting
  useEffect(() => {
    const welcome = getWelcomeMessage();
    setMessages([
      {
        role: "model",
        content: welcome,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, [farmerProfile]);

  const getWelcomeMessage = () => {
    const name = farmerProfile?.name || "Kisan Mitra";
    const lang = farmerProfile?.language || "english";

    switch (lang) {
      case "telugu":
        return `నమస్తే ${name}! నేను మీ కృషిమిత్ర సహాయకుడిని. ఈ రోజు మీకు ఎలాంటి సలహాలు కావాలి? పంటలు, వాతావరణం లేదా ఎరువుల గురించి నన్ను అడగండి.`;
      case "hindi":
        return `नमस्ते ${name}! मैं आपका कृषिमित्र सहायक हूँ। आज आपको खेती के बारे में क्या जानकारी चाहिए? फसलों, मौसम या खाद के बारे में मुझसे पूछें।`;
      case "tamil":
        return `வணக்கம் ${name}! நான் உங்களின் கிருஷிமித்ரா உதவியாளர். இன்று உங்களுக்கு என்ன ஆலோசனை வேண்டும்? பயிர்கள், வானிலை அல்லது உரங்கள் பற்றி என்னிடம் கேளுங்கள்.`;
      default:
        return `Namaste ${name}! I am your KrishiMitra AI voice assistant. How can I guide you today? Ask me about crop selections, weather forecasts, or fertilizer usage.`;
    }
  };

  const handleSpeech = (text: string) => {
    if (!speechEnabled) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const lang = farmerProfile?.language || "english";

      if (lang === "hindi") utterance.lang = "hi-IN";
      else if (lang === "telugu") utterance.lang = "te-IN";
      else if (lang === "tamil") utterance.lang = "ta-IN";
      else utterance.lang = "en-IN";

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error(e);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleSend = async (textToSend?: string) => {
    const messageContent = textToSend || input;
    if (!messageContent.trim()) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Gather relevant history for conversational flow
      const historyToSend = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: historyToSend,
          message: messageContent,
          language: farmerProfile?.language || "english",
          farmerProfile: farmerProfile || undefined,
        }),
      });

      if (!response.ok) throw new Error();
      const data = await response.json();

      const modelMessage: ChatMessage = {
        role: "model",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, modelMessage]);
      handleSpeech(data.reply);
    } catch (e) {
      const errorReply = "I encountered a minor network glitch. Please try again in a moment!";
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: errorReply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      handleSpeech(errorReply);
    } finally {
      setLoading(false);
    }
  };

  // Web Speech API Recording
  const handleToggleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Simulation for frames/browsers without recognition
      setIsRecording(true);
      setTimeout(() => {
        const simulatedQuestions = [
          "Will it rain in my village tomorrow?",
          "Which fertilizer should I put on Cotton?",
          "Which government schemes do I qualify for?"
        ];
        const randomQ = simulatedQuestions[Math.floor(Math.random() * simulatedQuestions.length)];
        setIsRecording(false);
        handleSend(randomQ);
      }, 3000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      const lang = farmerProfile?.language || "english";
      recognition.lang = lang === "telugu" ? "te-IN" : lang === "hindi" ? "hi-IN" : lang === "tamil" ? "ta-IN" : "en-IN";
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
        stopSpeaking();
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleSend(transcript);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (e) {
      setIsRecording(false);
    }
  };

  const samplePrompts = [
    { text: "When should I irrigate?", label: "Irrigation advice" },
    { text: "Suggest cotton pesticide", label: "Pest remedy" },
    { text: "Tell me about PM Kisan eligibility", label: "Govt Subsidies" },
  ];

  return (
    <div id="voice-assistant-module" className="flex flex-col h-[75vh] max-w-4xl mx-auto bg-white rounded-3xl border border-bento-mint/30 overflow-hidden shadow-md">
      {/* Header */}
      <div className="bg-bento-deep text-white p-4 flex justify-between items-center shrink-0 border-b border-bento-forest/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-bento-forest rounded-2xl text-bento-mint animate-pulse">
            <Brain size={22} />
          </div>
          <div>
            <h3 className="font-display font-bold text-base leading-tight">
              {translations.voice || "KrishiMitra Voice Assistant"}
            </h3>
            <span className="text-[10px] text-bento-mint flex items-center gap-1">
              <Sparkles size={11} /> Conversational Indian Language Intelligence
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-stone-900 px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
            >
              <VolumeX size={13} /> Stop Voice
            </button>
          )}
          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`p-2 rounded-xl border border-white/20 transition cursor-pointer ${speechEnabled ? "bg-white/15 text-white" : "bg-stone-700/40 text-stone-300"}`}
          >
            {speechEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 overflow-y-auto p-5 bg-stone-50 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${msg.role === "user" ? "bg-bento-deep text-white rounded-tr-none" : "bg-white border border-stone-200/60 text-stone-800 rounded-tl-none"}`}
            >
              <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <div className="flex justify-between items-center mt-2 border-t border-black/5 pt-1">
                <span className={`text-[9px] ${msg.role === "user" ? "text-bento-mint" : "text-stone-400"}`}>
                  {msg.timestamp}
                </span>
                {msg.role === "model" && speechEnabled && (
                  <button
                    onClick={() => handleSpeech(msg.content)}
                    className="p-1 hover:bg-stone-100 rounded text-bento-forest cursor-pointer"
                  >
                    <Volume2 size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-stone-200/60 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2 text-xs text-stone-500">
              <RefreshCw className="animate-spin text-bento-forest" size={14} />
              <span>KrishiMitra is analyzing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Sample Prompt Tags */}
      {messages.length <= 1 && (
        <div className="p-3 bg-stone-50 border-t border-stone-100 flex flex-wrap gap-2 justify-center shrink-0">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p.text)}
              className="px-3 py-1.5 bg-white border border-stone-200 hover:border-bento-accent hover:bg-bento-light/10 rounded-xl text-[11px] font-medium text-stone-600 transition cursor-pointer"
            >
              {p.label}: "{p.text}"
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className="p-4 bg-white border-t border-stone-200 flex items-center gap-2.5 shrink-0">
        <button
          id="btn-voice-assistant-record"
          onClick={handleToggleRecord}
          className={`p-3.5 rounded-full transition duration-200 flex items-center justify-center shrink-0 cursor-pointer ${isRecording ? "bg-rose-600 text-white animate-pulse" : "bg-bento-light/55 text-bento-deep hover:bg-bento-light/90"}`}
        >
          {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={translations.askPlaceholder || "Ask anything about farming..."}
          className="flex-1 bg-stone-50 border border-stone-200 rounded-full px-5 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-bento-accent"
        />

        <button
          id="btn-voice-send"
          onClick={() => handleSend()}
          disabled={!input.trim()}
          className="p-3 bg-bento-deep hover:bg-bento-forest text-white rounded-full transition disabled:bg-stone-200 disabled:text-stone-400 shrink-0 cursor-pointer"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
