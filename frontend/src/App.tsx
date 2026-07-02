import React, { useState, useEffect, useRef } from "react";

interface Citation {
  document_id: string;
  chunk_id: string;
  title: string;
  publisher: string;
  source_url: string;
  relevance_score: number;
}

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  status?: "success" | "rejected" | "clarification_required" | "emergency" | "insufficient_evidence";
  domain?: string;
  confidence?: number;
  disclaimer?: string;
  citations?: Citation[];
  requires_professional_help?: boolean;
  requires_jurisdiction?: boolean;
  requestId?: string;
}

interface LogEntry {
  request_id: string;
  timestamp: string;
  domain: string;
  confidence: number;
  input_text: string;
  output_text: string;
  status: string;
  latency_ms: number;
}

interface Stats {
  total: number;
  success: number;
  rejected: number;
  emergencies: number;
  insufficient: number;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Hello! I am MedLaw Guard, a secured assistant for medical and legal education. How can I help you today?",
      status: "success",
      domain: "mixed_medical_legal",
      confidence: 1.0,
      disclaimer: "Educational information only. Not medical diagnosis or legal advice."
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [language, setLanguage] = useState("en");
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"chat" | "admin">("chat");

  // Admin states
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, success: 0, rejected: 0, emergencies: 0, insufficient: 0 });
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<Record<string, boolean>>({});

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const fetchAdminData = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/admin/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setStats(data.stats || { total: 0, success: 0, rejected: 0, emergencies: 0, insufficient: 0 });
      }
    } catch (err) {
      console.error("Failed to fetch admin stats", err);
    }
  };

  useEffect(() => {
    if (viewMode === "admin") {
      fetchAdminData();
    }
  }, [viewMode]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsgText = inputText;
    setInputText("");

    const userMessage: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: userMsgText
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsgText,
          session_id: sessionId,
          jurisdiction: jurisdiction || undefined,
          language: language
        })
      });

      if (res.ok) {
        const data = await res.json();
        const botMessage: Message = {
          id: Math.random().toString(),
          sender: "bot",
          text: data.answer,
          status: data.status,
          domain: data.domain,
          confidence: data.confidence,
          disclaimer: data.disclaimer,
          citations: data.citations,
          requires_professional_help: data.requires_professional_help,
          requires_jurisdiction: data.requires_jurisdiction,
          requestId: data.request_id
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error("API Error");
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "bot",
          text: "An error occurred connecting to the backend server. Please make sure the backend server is running on port 8000.",
          status: "rejected",
          domain: "out_of_domain",
          confidence: 0.0
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (requestId: string, rating: number) => {
    try {
      const res = await fetch("http://localhost:8000/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          rating: rating
        })
      });
      if (res.ok) {
        setFeedbackSubmitted(prev => ({ ...prev, [requestId]: true }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Navbar Header */}
      <header className="glass-panel" style={{ margin: "16px 16px 8px 16px", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "var(--accent-primary)", boxShadow: "0 0 12px var(--accent-primary)" }} />
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.025em" }}>MedLaw Guard</h1>
        </div>
        
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          {/* Jurisdiction Input */}
          <input
            type="text"
            className="glass-input"
            placeholder="Jurisdiction (e.g. USA, Texas)"
            value={jurisdiction}
            onChange={e => setJurisdiction(e.target.value)}
            style={{ padding: "6px 12px", fontSize: "0.875rem", width: "180px" }}
          />

          {/* Language Selector */}
          <select
            className="glass-input"
            value={language}
            onChange={e => setLanguage(e.target.value)}
            style={{ padding: "6px 12px", fontSize: "0.875rem", background: "#0f172a" }}
          >
            <option value="en">English</option>
            <option value="ta">Tamil (தமிழ்)</option>
            <option value="hi">Hindi (हिन्दी)</option>
            <option value="te">Telugu (తెలుగు)</option>
            <option value="ml">Malayalam (മലയാളം)</option>
          </select>

          <button
            onClick={() => setViewMode(prev => prev === "chat" ? "admin" : "chat")}
            className="btn-primary"
            style={{ padding: "6px 16px", fontSize: "0.875rem" }}
          >
            {viewMode === "chat" ? "Admin Audit" : "Chat Console"}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {viewMode === "chat" ? (
        <main style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 16px 16px 16px", overflow: "hidden" }}>
          {/* Chat Window */}
          <div className="glass-panel" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            
            {/* Scrollable conversation */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignSelf: msg.sender === "user" ? "flex-end" : "flex-start", maxWidth: "70%" }}>
                  
                  {/* Sender Metadata Badges */}
                  {msg.sender === "bot" && msg.domain && (
                    <div style={{ display: "flex", gap: "8px", marginBottom: "4px", fontSize: "0.75rem", opacity: 0.85 }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: "12px",
                        background: msg.status === "emergency" ? "rgba(239, 68, 68, 0.2)" : "rgba(99, 102, 241, 0.2)",
                        border: msg.status === "emergency" ? "1px solid var(--accent-danger)" : "1px solid var(--accent-primary)",
                        color: msg.status === "emergency" ? "#fca5a5" : "#a5b4fc",
                        fontWeight: 600
                      }}>
                        {msg.domain.toUpperCase()}
                      </span>
                      <span style={{ padding: "2px 8px", borderRadius: "12px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                        Confidence: {(msg.confidence || 0).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Chat bubble */}
                  <div className="glass-panel animate-fade-in" style={{
                    padding: "16px 20px",
                    borderRadius: msg.sender === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: msg.sender === "user" ? "rgba(99, 102, 241, 0.15)" : "var(--panel-bg)",
                    border: msg.sender === "user" ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid var(--panel-border)"
                  }}>
                    <p style={{ margin: 0, whiteSpace: "pre-line", fontSize: "0.95rem" }}>{msg.text}</p>
                    
                    {/* Disclaimer Panel */}
                    {msg.sender === "bot" && msg.disclaimer && (
                      <div style={{ marginTop: "12px", paddingTop: "8px", borderTop: "1px solid rgba(255, 255, 255, 0.1)", fontSize: "0.8rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                        ⚠️ {msg.disclaimer}
                      </div>
                    )}

                    {/* Citations Drawer */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div style={{ marginTop: "12px", background: "rgba(15, 23, 42, 0.3)", borderRadius: "8px", padding: "10px 14px" }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#a5b4fc", marginBottom: "6px" }}>Verified Sources:</div>
                        <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "6px" }}>
                          {msg.citations.map((cite, i) => (
                            <li key={i}>
                              <a href={cite.source_url} target="_blank" rel="noreferrer" style={{ color: "#60a5fa", textDecoration: "underline" }}>
                                {cite.title}
                              </a> - {cite.publisher} (Relevance: {(cite.relevance_score * 100).toFixed(0)}%)
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Escalation/Emergency Flags */}
                    {msg.requires_professional_help && (
                      <div style={{ marginTop: "8px", padding: "6px 12px", background: "rgba(245, 158, 11, 0.15)", border: "1px solid var(--accent-warning)", borderRadius: "8px", fontSize: "0.8rem", color: "#fcd34d" }}>
                        💡 This query concerns a complex context requiring professional consultant consultation.
                      </div>
                    )}
                  </div>

                  {/* Feedback rating action */}
                  {msg.sender === "bot" && msg.requestId && (
                    <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      <span>Helpful?</span>
                      {feedbackSubmitted[msg.requestId] ? (
                        <span style={{ color: "var(--accent-success)", fontWeight: 600 }}>Thank you for feedback!</span>
                      ) : (
                        <div style={{ display: "flex", gap: "4px" }}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              onClick={() => msg.requestId && handleFeedback(msg.requestId, star)}
                              style={{ background: "none", border: "none", color: "var(--accent-warning)", cursor: "pointer", fontSize: "1rem", padding: 0 }}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ))}

              {loading && (
                <div style={{ alignSelf: "flex-start", display: "flex", gap: "8px", alignItems: "center", opacity: 0.7 }}>
                  <div className="glass-panel" style={{ padding: "12px 20px", borderRadius: "16px 16px 16px 4px" }}>
                    <span>Checking guardrails & retrieving evidence...</span>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} style={{ padding: "16px", borderTop: "1px solid var(--panel-border)", display: "flex", gap: "12px", background: "rgba(15, 23, 42, 0.4)" }}>
              <input
                type="text"
                className="glass-input"
                placeholder="Ask a medical or legal educational question..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                style={{ flex: 1 }}
                disabled={loading}
              />
              <button type="submit" className="btn-primary" disabled={loading}>
                <span>Send</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          </div>

          <footer style={{ marginTop: "12px", textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            MedLaw Guard uses secure local AI and LanceDB vector store. Project sizing constraint enforced (&lt;2GB model space).
          </footer>
        </main>
      ) : (
        /* Admin Dashboard Mode */
        <main style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto" }}>
          
          {/* Stats Bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px" }}>
            <div className="glass-panel" style={{ padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Total Queries</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)" }}>{stats.total}</div>
            </div>
            <div className="glass-panel" style={{ padding: "16px", textAlign: "center", borderLeft: "4px solid var(--accent-success)" }}>
              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Success</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--accent-success)" }}>{stats.success}</div>
            </div>
            <div className="glass-panel" style={{ padding: "16px", textAlign: "center", borderLeft: "4px solid var(--accent-danger)" }}>
              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Blocked / Rejected</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--accent-danger)" }}>{stats.rejected}</div>
            </div>
            <div className="glass-panel" style={{ padding: "16px", textAlign: "center", borderLeft: "4px solid var(--accent-warning)" }}>
              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Emergencies</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--accent-warning)" }}>{stats.emergencies}</div>
            </div>
            <div className="glass-panel" style={{ padding: "16px", textAlign: "center", borderLeft: "4px solid var(--accent-info)" }}>
              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Insufficient Evidence</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--accent-info)" }}>{stats.insufficient}</div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="glass-panel" style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column" }}>
            <h2 style={{ margin: "0 0 16px 0", fontSize: "1.1rem" }}>System Audit and Guardrail Execution Logs</h2>
            <div style={{ flex: 1, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "left" }}>
                    <th style={{ padding: "10px" }}>Timestamp</th>
                    <th style={{ padding: "10px" }}>Domain</th>
                    <th style={{ padding: "10px" }}>Confidence</th>
                    <th style={{ padding: "10px" }}>Query Sample</th>
                    <th style={{ padding: "10px" }}>Status</th>
                    <th style={{ padding: "10px" }}>Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "10px" }}>{new Date(log.timestamp).toLocaleString()}</td>
                      <td style={{ padding: "10px" }}>
                        <span style={{
                          padding: "2px 6px", borderRadius: "8px", fontSize: "0.75rem",
                          background: "rgba(99,102,241,0.1)", color: "#a5b4fc"
                        }}>
                          {log.domain}
                        </span>
                      </td>
                      <td style={{ padding: "10px" }}>{log.confidence.toFixed(2)}</td>
                      <td style={{ padding: "10px", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {log.input_text}
                      </td>
                      <td style={{ padding: "10px" }}>
                        <span style={{
                          padding: "2px 6px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 600,
                          background: log.status === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                          color: log.status === "success" ? "#34d399" : "#fca5a5"
                        }}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px" }}>{log.latency_ms}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
