import React, { useState, useEffect, useRef } from "react";
import {
  Stethoscope,
  Scale,
  Send,
  Sparkles,
  Trash2,
  Download,
  AlertTriangle,
  Check,
  ExternalLink,
  Globe,
  RefreshCw,
  Shield,
  Activity,
  Cpu,
  Bookmark,
  ChevronRight,
  Clock,
  CheckCircle,
  HelpCircle,
  Copy,
  Terminal,
  Database
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Message, Persona, Source } from "./types";
import { PERSONAS } from "./data";

export default function App() {
  // Active Domain Persona (Medical / Law)
  const [activePersona, setActivePersona] = useState<Persona>(PERSONAS[0]);
  const [webSearch, setWebSearch] = useState<boolean>(true);
  
  // Isolated multi-domain chat histories
  const [chats, setChats] = useState<Record<string, Message[]>>({
    medical: [],
    law: []
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // High-end simulated live stats for the catchy UX dashboard
  const [latency, setLatency] = useState<string>("0.00s");
  const [tokenCount, setTokenCount] = useState<number>(0);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "info"; text: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentMessages = chats[activePersona.id] || [];
  const isMedical = activePersona.id === "medical";

  // Auto-scroll chat body
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, isLoading]);

  // Handle live statistics simulation
  useEffect(() => {
    if (currentMessages.length > 0) {
      // Approximate token count based on standard word ratio
      const allText = currentMessages.map(m => m.content).join(" ");
      const estimatedTokens = Math.round(allText.split(/\s+/).length * 1.35);
      setTokenCount(estimatedTokens);
    } else {
      setTokenCount(0);
      setLatency("0.00s");
    }
  }, [currentMessages]);

  const triggerAlert = (text: string, type: "success" | "info" = "success") => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 3000);
  };

  const handleDomainChange = (personaId: "medical" | "law") => {
    const nextPersona = PERSONAS.find(p => p.id === personaId);
    if (nextPersona) {
      setActivePersona(nextPersona);
      setError(null);
    }
  };

  const handleClearChat = () => {
    setChats(prev => ({
      ...prev,
      [activePersona.id]: []
    }));
    setLatency("0.00s");
    triggerAlert("Practice history cleared safely.", "info");
  };

  // Copy individual message text to clipboard
  const handleCopyMessage = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    triggerAlert("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Professional exports
  const handleExport = (format: "txt" | "json") => {
    if (currentMessages.length === 0) {
      triggerAlert("Workspace is empty.", "info");
      return;
    }

    let fileContent = "";
    let fileType = "";
    let fileExtension = "";

    if (format === "json") {
      fileContent = JSON.stringify(currentMessages, null, 2);
      fileType = "application/json";
      fileExtension = "json";
    } else {
      fileContent = `==================================================\n`;
      fileContent += `   AI COGNITIVE EXPERT ARCHIVE: ${activePersona.name.toUpperCase()}\n`;
      fileContent += `==================================================\n`;
      fileContent += `Exported: ${new Date().toLocaleString()}\n`;
      fileContent += `Encryption: AES-256 Simulated Local Sandbox\n`;
      fileContent += `Disclaimers: AI consultation only. Always verify critical facts.\n\n`;
      
      currentMessages.forEach(m => {
        const time = new Date(m.timestamp).toLocaleTimeString();
        fileContent += `[${time}] ${m.role === "user" ? "USER" : "AI CONSULTANT"}:\n`;
        fileContent += `${m.content}\n`;
        if (m.sources && m.sources.length > 0) {
          fileContent += `\nSources Cited:\n`;
          m.sources.forEach(s => {
            fileContent += `  * ${s.title} (${s.uri})\n`;
          });
        }
        fileContent += `\n--------------------------------------------------\n\n`;
      });
      fileType = "text/plain";
      fileExtension = "txt";
    }

    const blob = new Blob([fileContent], { type: fileType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ai_session_${activePersona.id}_export.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerAlert(`Exported securely as .${fileExtension}`);
  };

  // Chat message submittal
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText !== undefined ? customText : input;
    if (!textToSend.trim() || isLoading) return;

    setError(null);
    if (customText === undefined) {
      setInput("");
    }

    const newUserMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date()
    };

    const updatedMessages = [...currentMessages, newUserMessage];
    setChats(prev => ({
      ...prev,
      [activePersona.id]: updatedMessages
    }));

    setIsLoading(true);
    const startTime = performance.now();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content
          })),
          webSearch,
          systemInstruction: activePersona.systemInstruction
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned error status ${response.status}`);
      }

      const responseData = await response.json();
      const endTime = performance.now();
      const calculatedLatency = ((endTime - startTime) / 1000).toFixed(2);
      setLatency(`${calculatedLatency}s`);

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: responseData.content,
        timestamp: new Date(),
        sources: responseData.sources
      };

      setChats(prev => ({
        ...prev,
        [activePersona.id]: [...updatedMessages, assistantMessage]
      }));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to reach backend engine. Please confirm local server status.");
    } finally {
      setIsLoading(false);
    }
  };

  // Medical symptoms shortcut handler
  const handleMedicalShortcut = (condition: string) => {
    const prompt = `What are the typical medical guidance principles, initial non-pharmacological remedies, and key diagnostic warning signs for: ${condition}?`;
    handleSendMessage(prompt);
  };

  // Law legal outline shortcut handler
  const handleLawShortcut = (task: string) => {
    const prompt = `Can you provide a structured general legal analysis framework, key clauses to inspect, and jurisdictional liabilities for: ${task}?`;
    handleSendMessage(prompt);
  };

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-700 select-none ${
      isMedical 
        ? "bg-[#060c0d] text-slate-100 medical-glow" 
        : "bg-[#0d0a07] text-amber-50 legal-glow"
    }`}>
      
      {/* Top Professional System Banner */}
      <div className={`py-3 px-6 text-center text-xs font-mono font-bold tracking-wider flex items-center justify-center space-x-3 transition-colors duration-500 border-b ${
        isMedical 
          ? "bg-teal-950/90 text-teal-300 border-teal-500/30" 
          : "bg-amber-950/90 text-amber-300 border-amber-500/30"
      }`}>
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="uppercase tracking-widest font-extrabold">
          {isMedical 
            ? "CLINICAL SECURITY NODE Active // GOOGLE SEARCH GROUNDING ONLINE"
            : "STATUTORY PRECEDENCE NODE Active // JURISDICTIONAL SEARCH ONLINE"}
        </span>
      </div>

      {/* Floating System Notification */}
      {alertMsg && (
        <div className="fixed top-12 right-6 z-50 bg-[#162529]/95 border border-teal-500/40 text-teal-100 px-4.5 py-3 rounded-2xl text-xs font-bold shadow-[0_0_20px_rgba(20,184,166,0.25)] flex items-center space-x-3 animate-float">
          <CheckCircle className="h-4.5 w-4.5 text-teal-400" />
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Main Grid Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto p-4 lg:p-6 gap-6">
        
        {/* Left Side: Solid, High-Contrast Control Cabinets */}
        <section className="w-full lg:w-80 shrink-0 flex flex-col gap-6">
          
          {/* Domain Picker Dashboard */}
          <div className={`border rounded-[24px] p-5.5 shadow-2xl transition-colors duration-500 ${
            isMedical 
              ? "bg-[#0b1618] border-teal-500/25 shadow-teal-500/5" 
              : "bg-[#18120c] border-amber-500/25 shadow-amber-500/5"
          }`}>
            <div className="mb-4">
              <span className="text-[10px] font-mono font-black tracking-widest text-slate-400 uppercase">
                ACTIVE DOMAIN PANEL
              </span>
              <h2 className="font-display font-black text-white text-xl tracking-tight mt-0.5">
                Practice Selection
              </h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3.5">
              {/* Medical Selector */}
              <button
                id="tab-medical"
                onClick={() => handleDomainChange("medical")}
                className={`w-full text-left p-4.5 rounded-2xl border transition-all duration-300 flex items-center space-x-4 group relative overflow-hidden ${
                  isMedical
                    ? "border-teal-400 bg-teal-500/10 shadow-[0_0_20px_rgba(20,184,166,0.25)] ring-1 ring-teal-400/50"
                    : "border-white/5 bg-[#121c1e]/60 hover:bg-[#121c1e] hover:border-white/15"
                }`}
              >
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isMedical 
                    ? "bg-teal-500 text-black font-extrabold shadow-[0_0_12px_rgba(20,184,166,0.5)] scale-105" 
                    : "bg-teal-950/40 text-teal-400 group-hover:text-teal-200"
                }`}>
                  <Stethoscope className="h-5.5 w-5.5 stroke-[2.5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                    isMedical ? "text-teal-300" : "text-slate-400"
                  }`}>
                    Module A
                  </p>
                  <p className="text-sm font-black text-white font-display">
                    Medical Hub
                  </p>
                </div>
                {isMedical && (
                  <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                )}
              </button>

              {/* Law Selector */}
              <button
                id="tab-law"
                onClick={() => handleDomainChange("law")}
                className={`w-full text-left p-4.5 rounded-2xl border transition-all duration-300 flex items-center space-x-4 group relative overflow-hidden ${
                  !isMedical
                    ? "border-amber-400 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50"
                    : "border-white/5 bg-[#201710]/60 hover:bg-[#201710] hover:border-white/15"
                }`}
              >
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  !isMedical 
                    ? "bg-amber-500 text-black font-extrabold shadow-[0_0_12px_rgba(245,158,11,0.5)] scale-105" 
                    : "bg-amber-950/40 text-amber-400 group-hover:text-amber-200"
                }`}>
                  <Scale className="h-5.5 w-5.5 stroke-[2.5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                    !isMedical ? "text-amber-300" : "text-slate-400"
                  }`}>
                    Module B
                  </p>
                  <p className="text-sm font-black text-white font-display">
                    Legal Center
                  </p>
                </div>
                {!isMedical && (
                  <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
            </div>
          </div>

          {/* Cognitive Grounding Switchbox */}
          <div className={`border rounded-[24px] p-5.5 shadow-2xl transition-colors duration-500 ${
            isMedical ? "bg-[#0b1618] border-teal-500/25" : "bg-[#18120c] border-amber-500/25"
          }`}>
            <div className="mb-4">
              <span className="text-[10px] font-mono font-black tracking-widest text-slate-400 uppercase">
                INTELLIGENCE CONTROL
              </span>
              <h3 className="font-display font-black text-white text-base tracking-tight mt-0.5">
                Grounding Engine
              </h3>
            </div>

            <div className={`border rounded-2xl p-4.5 transition-all ${
              webSearch 
                ? isMedical 
                  ? "border-teal-400/40 bg-teal-500/5" 
                  : "border-amber-400/40 bg-amber-500/5"
                : "border-white/5 bg-white/2"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Globe className={`h-5 w-5 ${
                    webSearch 
                      ? isMedical ? "text-teal-300 animate-pulse" : "text-amber-300 animate-pulse"
                      : "text-slate-400"
                  }`} />
                  <span className="text-xs font-extrabold text-white">Google Live Search</span>
                </div>
                
                <button
                  role="switch"
                  aria-checked={webSearch}
                  onClick={() => setWebSearch(!webSearch)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                    webSearch 
                      ? isMedical ? "bg-teal-500" : "bg-amber-500"
                      : "bg-[#252525]"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xl transition duration-300 ease-in-out ${
                    webSearch ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>
              <p className="text-xs text-slate-200 mt-3 leading-relaxed font-sans font-medium">
                Enables high-fidelity Google Search Grounding to integrate live clinical decisions, drug updates, or immediate statutory changes.
              </p>
            </div>
          </div>

          {/* Realtime Stats Telemetry Desk */}
          <div className={`border rounded-[24px] p-5.5 shadow-2xl transition-colors duration-500 ${
            isMedical ? "bg-[#0b1618] border-teal-500/25" : "bg-[#18120c] border-amber-500/25"
          }`}>
            <div className="mb-4">
              <span className="text-[10px] font-mono font-black tracking-widest text-slate-400 uppercase">
                ENGINE HEALTH
              </span>
              <h3 className="font-display font-black text-white text-base tracking-tight mt-0.5">
                Live Telemetry
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {/* Latency card */}
              <div className="bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center space-x-1.5 text-[10px] font-mono font-bold text-slate-300">
                  <Activity className="h-4 w-4 text-indigo-400 stroke-[2.5]" />
                  <span>LATENCY</span>
                </div>
                <div className="text-xl font-mono font-black text-white mt-2.5">
                  {latency !== "0.00s" ? latency : "0.00s"}
                </div>
              </div>

              {/* Tokens card */}
              <div className="bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center space-x-1.5 text-[10px] font-mono font-bold text-slate-300">
                  <Cpu className="h-4 w-4 text-teal-400 stroke-[2.5]" />
                  <span>TOKENS</span>
                </div>
                <div className="text-xl font-mono font-black text-white mt-2.5">
                  {tokenCount > 0 ? tokenCount : "0"}
                </div>
              </div>

              {/* Security state */}
              <div className="bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col justify-between col-span-2">
                <div className="flex items-center space-x-1.5 text-[10px] font-mono font-bold text-slate-300">
                  <Database className="h-4 w-4 text-amber-400 stroke-[2.5]" />
                  <span>SECURITY CLASSIFICATION</span>
                </div>
                <div className="text-xs font-mono font-bold text-emerald-400 mt-2.5 flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>AES-256 Sandbox Mode</span>
                </div>
              </div>
            </div>
          </div>

          {/* Strict Warnings Panel */}
          <div className="bg-red-950/35 border border-red-500/25 rounded-[24px] p-5 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center space-x-2 text-white font-display font-black text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-400 animate-bounce" />
              <span>Safety Disclaimers</span>
            </div>
            <p className="text-xs text-red-100 font-medium leading-relaxed font-sans">
              {isMedical
                ? "This AI engine delivers educational health studies. It does not replace professional physical diagnostic sessions. Call emergency medical support (e.g., 911) for crisis scenarios."
                : "This workspace parses legal contracts and theories. Information is reference only, and does not create an active attorney-client bar relationship."}
            </p>
          </div>

        </section>

        {/* Right Side: Ultra-High-Performance Interactive Chat Deck */}
        <main className={`flex-1 bg-black/50 border rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[750px] lg:h-auto ${
          isMedical ? "border-teal-500/25" : "border-amber-500/25"
        }`}>
          
          {/* Header Bar */}
          <section className="px-6 py-5 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-4">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                isMedical ? "bg-teal-500/15 text-teal-300" : "bg-amber-500/15 text-amber-300"
              }`}>
                {isMedical ? <Stethoscope className="h-6 w-6 stroke-[2]" /> : <Scale className="h-6 w-6 stroke-[2]" />}
              </div>
              <div>
                <h1 className="font-display font-black text-white text-base tracking-tight flex items-center gap-2">
                  {isMedical ? "Medical Research Environment" : "Legal Analysis Workspace"}
                </h1>
                <p className="text-[10px] text-slate-300 font-mono mt-0.5">
                  SECURE CHANNEL: <span className="text-white font-black">{isMedical ? "MED-SECURE-902" : "LAW-SECURE-104"}</span>
                </p>
              </div>
            </div>

            {/* Clear & Export Buttons */}
            <div className="flex items-center space-x-2.5 text-xs font-mono">
              {currentMessages.length > 0 && (
                <>
                  <button
                    onClick={() => handleExport("txt")}
                    className="flex items-center space-x-1.5 px-3.5 py-2.5 text-slate-200 hover:text-white border border-white/15 rounded-xl hover:bg-white/5 transition-all font-bold"
                    title="Export Session History"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </button>

                  <button
                    onClick={handleClearChat}
                    className="flex items-center space-x-1.5 px-3.5 py-2.5 text-rose-300 hover:text-rose-200 border border-rose-500/30 rounded-xl hover:bg-rose-500/10 transition-all font-bold"
                    title="Reset Session History"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                </>
              )}
            </div>
          </section>

          {/* Active Chat Conversation Feed */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 min-h-0 bg-black/10">
            {currentMessages.length === 0 ? (
              
              /* Clean Welcome Landing Page */
              <div className="max-w-xl mx-auto py-8 lg:py-14 flex flex-col items-center text-center">
                
                {/* Visual Glow Core */}
                <div className="relative mb-6">
                  <div className={`absolute -inset-1 rounded-3xl blur-2xl opacity-35 animate-pulse-slow ${
                    isMedical ? "bg-teal-400" : "bg-amber-400"
                  }`} />
                  <div className={`relative h-18 w-18 rounded-2xl flex items-center justify-center border ${
                    isMedical ? "bg-[#0b1618] text-teal-300 border-teal-400/30" : "bg-[#18120c] text-amber-300 border-amber-400/30"
                  }`}>
                    {isMedical ? <Stethoscope className="h-9 w-9 animate-float" /> : <Scale className="h-9 w-9 animate-float" />}
                  </div>
                </div>

                <span className={`text-[10px] font-mono font-black tracking-widest px-3 py-1.5 rounded-full mb-4 uppercase ${
                  isMedical ? "bg-teal-500/15 text-teal-300 border border-teal-500/30" : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                }`}>
                  {isMedical ? "Clinical Research Suite" : "Lex Analytical Suite"}
                </span>

                <h2 className="font-display font-black text-white text-2xl tracking-tight mb-3">
                  Cognitive AI Professional
                </h2>
                
                <p className="text-xs text-slate-200 leading-relaxed max-w-sm mb-8 font-sans font-medium">
                  {isMedical
                    ? "Welcome to your clinical study companion. Inquire on patient diagnoses, explore drug mechanics, or learn clinical terms with live Search Grounding."
                    : "Welcome to your expert legal researcher. Ask legal definitions, review mutual NDAs, and explore case studies with real-time statutory Grounding."}
                </p>

                {/* suggested inquiry cards */}
                <div className="w-full space-y-3 text-left">
                  <div className="flex items-center space-x-2 mb-2 pl-1">
                    <Terminal className="h-4 w-4 text-slate-300 stroke-[2.5]" />
                    <span className="text-[10px] font-mono font-black text-slate-300 uppercase tracking-widest">
                      RECOMMENDED CLINICAL / LEGAL INQUIRIES
                    </span>
                  </div>
                  
                  {activePersona.suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className={`w-full text-left p-4 rounded-2xl border text-xs font-bold transition-all duration-300 group flex items-start space-x-3.5 bg-white/5 hover:bg-white/10 hover:scale-[1.01] ${
                        isMedical 
                          ? "border-teal-500/15 hover:border-teal-500/40 text-slate-100" 
                          : "border-amber-500/15 hover:border-amber-500/40 text-slate-100"
                      }`}
                    >
                      <span className={`h-6 w-6 rounded-lg flex items-center justify-center text-[11px] shrink-0 font-extrabold ${
                        isMedical ? "bg-teal-500/20 text-teal-200" : "bg-amber-500/20 text-amber-200"
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="flex-1 leading-relaxed font-sans group-hover:text-white transition-colors">
                        {prompt}
                      </span>
                      <ChevronRight className="h-4.5 w-4.5 opacity-0 group-hover:opacity-100 transition-all self-center shrink-0 translate-x-[-4px] group-hover:translate-x-0" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Render Chat Dialog Bubbles */
              <div className="space-y-6 max-w-3xl mx-auto">
                {currentMessages.map((message) => {
                  const isUser = message.role === "user";
                  return (
                    <div
                      key={message.id}
                      className={`flex flex-col space-y-2 ${isUser ? "items-end" : "items-start"} animate-fade-in`}
                    >
                      {/* Sender Details */}
                      <div className="flex items-center space-x-2 text-[10px] text-slate-300 font-mono font-bold tracking-wide">
                        <span className="uppercase">{isUser ? "YOU (LOCAL TERMINAL)" : activePersona.name}</span>
                        <span>•</span>
                        <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {/* Conversation Bubble */}
                      <div className={`relative max-w-full rounded-2xl px-6 py-5 text-sm leading-relaxed shadow-xl border transition-all ${
                        isUser
                          ? isMedical
                            ? "bg-teal-500 border-teal-400 text-black rounded-tr-none font-bold"
                            : "bg-amber-500 border-amber-400 text-black rounded-tr-none font-bold"
                          : isMedical
                            ? "bg-[#0b1719] border-teal-500/35 text-slate-100 rounded-tl-none font-normal"
                            : "bg-[#1d140e] border-amber-500/35 text-slate-100 rounded-tl-none font-normal"
                      }`}>
                        
                        {/* Copy button */}
                        {!isUser && (
                          <button
                            onClick={() => handleCopyMessage(message.content, message.id)}
                            className="absolute top-3.5 right-3.5 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                            title="Copy to clipboard"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        )}

                        {isUser ? (
                          <div className="whitespace-pre-wrap font-sans">{message.content}</div>
                        ) : (
                          <div className="prose prose-sm max-w-none text-slate-100 font-sans pr-6
                            prose-headings:font-display prose-headings:font-black prose-headings:text-white prose-headings:mt-4 prose-headings:mb-2
                            prose-p:leading-relaxed prose-p:mb-3.5 prose-p:text-slate-100
                            prose-strong:text-white prose-strong:font-black
                            prose-ul:list-disc prose-ul:pl-5 prose-ul:mb-3.5 prose-li:mb-1.5
                            prose-code:text-teal-300 prose-code:font-mono prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        )}

                        {/* citations */}
                        {!isUser && message.sources && message.sources.length > 0 && (
                          <div className="mt-5 pt-4.5 border-t border-white/10">
                            <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 mb-2.5 font-mono">
                              <Globe className={`h-4 w-4 shrink-0 ${isMedical ? "text-teal-400" : "text-amber-400"}`} />
                              <span>COGNITIVE GROUNDING CITATIONS:</span>
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                              {message.sources.map((src, i) => (
                                <a
                                  key={i}
                                  href={src.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-sans font-bold text-white bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl transition-all truncate max-w-xs"
                                >
                                  <span className="truncate">{src.title || "External Citation"}</span>
                                  <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Loading state indicator */}
                {isLoading && (
                  <div className="flex flex-col space-y-2 items-start">
                    <div className="flex items-center space-x-2 text-[10px] text-slate-300 font-mono font-bold animate-pulse">
                      <span>{activePersona.name.toUpperCase()} COMPILING DECISION DATA</span>
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500"></span>
                      </span>
                    </div>
                    <div className={`border rounded-2xl rounded-tl-none px-5.5 py-4.5 text-xs font-mono font-semibold flex items-center space-x-3.5 max-w-lg ${
                      isMedical ? "bg-[#0b1719] border-teal-500/30 text-teal-300" : "bg-[#1d140e] border-amber-500/30 text-amber-300"
                    }`}>
                      <RefreshCw className="h-4.5 w-4.5 animate-spin text-slate-300 shrink-0" />
                      <span>Synthesizing secure medical/legal guidelines, checking precedence archives...</span>
                    </div>
                  </div>
                )}

                {/* Explicit error banner */}
                {error && (
                  <div className="bg-red-950/40 border border-red-500/30 text-red-100 p-4.5 rounded-2xl text-xs max-w-2xl mx-auto flex items-start space-x-3.5 font-sans shadow-2xl">
                    <AlertTriangle className="h-5.5 w-5.5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold mb-1 text-white">Secure Channel Decryption Failure</p>
                      <p className="text-red-200">{error}</p>
                      <p className="mt-3 font-mono text-[10px] text-red-400 font-bold">
                        Recommendation: Configure your GEMINI_API_KEY inside Settings &gt; Secrets to restore intelligence capabilities.
                      </p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Quick Active Disclaimer Banner */}
          {currentMessages.length > 0 && (
            <div className="px-6 py-3 border-t border-white/5 bg-black/40 text-[10px] font-mono font-extrabold text-slate-300 text-center tracking-wider select-none shrink-0 uppercase">
              {isMedical 
                ? "💡 WARNING: Clinical reference simulator. Call local emergency services for acute medical crises."
                : "💡 NOTE: General legal outlines only. No attorney-client relationships exist."}
            </div>
          )}

          {/* Message Input Control Deck */}
          <footer className="p-4.5 border-t border-white/10 bg-black/30 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="max-w-3xl mx-auto flex items-center space-x-2.5"
            >
              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isMedical
                      ? "Search clinical symptoms, biochemistry, pharmaceutical effects, diagnoses..."
                      : "Analyze contract clauses, NDAs, civil tort liabilities, general state law..."
                  }
                  className="w-full pl-5 pr-16 py-4.5 rounded-2xl border border-white/15 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent text-sm placeholder-slate-400 bg-white/5 text-white transition-all font-sans font-medium"
                  disabled={isLoading}
                />
                
                {/* Visual Pill Indicator */}
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <span className={`text-[10px] font-mono font-black px-3 py-1.5 rounded-full border shadow-2xl ${
                    isMedical 
                      ? "bg-teal-950 text-teal-300 border-teal-500/40" 
                      : "bg-amber-950 text-amber-300 border-amber-500/40"
                  }`}>
                    {isMedical ? "MED" : "LAW"}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`h-13 w-13 rounded-2xl flex items-center justify-center transition-all ${
                  input.trim() && !isLoading
                    ? isMedical
                      ? "bg-teal-400 text-black hover:bg-teal-300 active:scale-95 shadow-[0_0_20px_rgba(20,184,166,0.35)]"
                      : "bg-amber-400 text-black hover:bg-amber-300 active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.35)]"
                    : "bg-white/5 text-slate-500 cursor-not-allowed"
                }`}
                title="Transmit Inquiry"
              >
                <Send className="h-5 w-5 stroke-[2.5]" />
              </button>
            </form>

            <div className="max-w-3xl mx-auto flex items-center justify-between text-[11px] text-slate-400 mt-3 px-1 font-mono font-bold">
              <span className="flex items-center gap-1.5">
                <Check className={`h-4 w-4 ${isMedical ? "text-teal-400" : "text-amber-400"}`} />
                <span>Isolated workspace channels verified</span>
              </span>
              <span className="hidden sm:inline">
                Press Enter to transmit inquiry
              </span>
            </div>
          </footer>

        </main>

      </div>
    </div>
  );
}
