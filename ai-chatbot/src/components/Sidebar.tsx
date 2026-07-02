import React from "react";
import { Persona } from "../types";
import { PERSONAS } from "../data";
import { Globe, Sparkles, Check, Moon, Sun, HelpCircle } from "lucide-react";

interface SidebarProps {
  activePersona: Persona;
  onChangePersona: (persona: Persona) => void;
  webSearch: boolean;
  onToggleWebSearch: () => void;
  isSidebarOpen: boolean;
  onCloseSidebar: () => void;
}

export default function Sidebar({
  activePersona,
  onChangePersona,
  webSearch,
  onToggleWebSearch,
  isSidebarOpen,
  onCloseSidebar,
}: SidebarProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-72 border-r border-neutral-100 bg-neutral-50/80 backdrop-blur-md transform transition-transform duration-300 md:translate-x-0 md:static md:z-0 flex flex-col justify-between h-[calc(100vh-73px)] ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        {/* Web Search Grounding Toggle */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-medium text-neutral-400 uppercase tracking-wider">
            Intelligence
          </h3>
          <div className="bg-white border border-neutral-200/80 rounded-xl p-4 transition-all duration-200 hover:shadow-sm">
            <div className="flex items-start justify-between space-x-3">
              <div className="flex items-center space-x-2">
                <Globe className={`h-4.5 w-4.5 ${webSearch ? "text-indigo-600 animate-pulse" : "text-neutral-400"}`} />
                <span className="text-sm font-medium text-neutral-800">
                  Google Search Grounding
                </span>
              </div>
              <button
                role="switch"
                aria-checked={webSearch}
                onClick={onToggleWebSearch}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  webSearch ? "bg-indigo-600" : "bg-neutral-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    webSearch ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-neutral-400 mt-2 font-sans leading-relaxed">
              Enables live search integration to ground AI responses in up-to-date web information.
            </p>
          </div>
        </div>

        {/* Persona Selector */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-medium text-neutral-400 uppercase tracking-wider">
            Assistant Presets
          </h3>
          <div className="space-y-2">
            {PERSONAS.map((persona) => {
              const isActive = persona.id === activePersona.id;
              return (
                <button
                  key={persona.id}
                  onClick={() => {
                    onChangePersona(persona);
                    onCloseSidebar();
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col space-y-1 ${
                    isActive
                      ? "border-neutral-900 bg-white shadow-sm ring-1 ring-neutral-900"
                      : "border-neutral-200/60 bg-white/50 hover:bg-white hover:border-neutral-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{persona.emoji}</span>
                      <span className="text-sm font-medium text-neutral-800 font-display">
                        {persona.name}
                      </span>
                    </div>
                    {isActive && (
                      <span className="h-4 w-4 rounded-full bg-neutral-900 flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-white stroke-[3px]" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {persona.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Info footer inside sidebar */}
      <div className="p-6 border-t border-neutral-100 bg-neutral-50/60">
        <div className="flex items-center space-x-2 text-neutral-400 hover:text-neutral-600 transition-colors cursor-help group relative">
          <HelpCircle className="h-3.5 w-3.5" />
          <span className="text-[11px] font-sans">Strictly private & local session</span>
          
          <div className="absolute bottom-10 left-0 bg-neutral-900 text-white text-[10px] p-2 rounded shadow-md hidden group-hover:block w-56 z-50 leading-relaxed">
            All conversations are held locally inside your browser's session state and disappear upon clearing.
          </div>
        </div>
        <p className="text-[10px] text-neutral-300 mt-2 font-mono">
          Model: gemini-3.5-flash
        </p>
      </div>
    </aside>
  );
}
