export interface Source {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: Source[];
}

export interface Persona {
  id: string;
  name: string;
  emoji: string;
  description: string;
  systemInstruction: string;
  accentClass: string;
  suggestedPrompts: string[];
}
