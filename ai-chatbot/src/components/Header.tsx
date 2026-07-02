import React, { useState } from "react";
import { Trash2, Download, Sparkles, Check, ChevronDown } from "lucide-react";
import { Persona } from "../types";

interface HeaderProps {
  activePersona: Persona;
  onClearChat: () => void;
  onExportChat: (format: "txt" | "json") => void;
  messageCount: number;
}

export default function Header({
  activePersona,
  onClearChat,
  onExportChat,
  messageCount,
}: HeaderProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState(false);

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear your conversation history?")) {
      onClearChat();
    }
  };

  return (
    <header className="border-b border-neutral-100 bg-white/85 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="h-8 w-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-display text-lg font-bold tracking-tight">
          {activePersona.emoji}
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-display font-medium text-neutral-950 tracking-tight">
              AI Chatbot
            </span>
            <span className="text-neutral-300">•</span>
            <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-medium border border-neutral-200 bg-neutral-50 text-neutral-600 transition-all duration-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span>{activePersona.name}</span>
            </div>
          </div>
          <p className="text-xs text-neutral-400 font-sans mt-0.5 hidden sm:block">
            Minimalist, distraction-free conversational companion
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {messageCount > 0 && (
          <>
            {/* Export Menu */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                title="Export conversation"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-1.5 w-36 bg-white border border-neutral-200 rounded-lg shadow-sm py-1 z-50 text-xs">
                  <button
                    onClick={() => {
                      onExportChat("txt");
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    Text Document (.txt)
                  </button>
                  <button
                    onClick={() => {
                      onExportChat("json");
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    JSON History (.json)
                  </button>
                </div>
              )}
            </div>

            {/* Clear Button */}
            <button
              onClick={handleClear}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 border border-rose-100 rounded-lg hover:bg-rose-50/50 transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
