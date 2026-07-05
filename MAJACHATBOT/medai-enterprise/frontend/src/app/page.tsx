"use client";
import React, { useState, useRef, useEffect } from 'react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am your MedAI Enterprise Assistant, specializing in clinical inquiries and Healthcare Law. How can I help you today? (Try asking: "What is HIPAA?", "What is medical malpractice?", or "what is paracetamol used for?")'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // To simulate a conversation ID for the backend
  const [conversationId, setConversationId] = useState<number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // We assume user_id=1 for now as a mock
      const payload = {
        user_id: 1,
        message: userMessage.content,
        conversation_id: conversationId
      };

      const res = await fetch('http://localhost:8005/api/v1/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || "Sorry, I couldn't process that."
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Network error: Unable to reach the MedAI backend. Make sure the FastAPI server is running on port 8005."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-lg z-10 hidden md:flex">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight">MedAI</h1>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mt-1">Kaggle Dataset Chatbot</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="p-4 bg-blue-600 text-white rounded-xl shadow-md cursor-pointer hover:bg-blue-700 transition-all font-medium text-sm flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Conversation
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-gray-50 dark:bg-gray-900">
        <header className="h-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 flex items-center px-6 sticky top-0 z-10 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live Session
          </h2>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 text-blue-700 dark:text-blue-300'}`}>
                  <span className="font-bold text-sm">{msg.role === 'user' ? 'U' : 'AI'}</span>
                </div>
                <div className={`flex flex-col space-y-1 max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none'}`}>
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <div className="space-y-1">
                        {(() => {
                          const parseInline = (text: string) => {
                            const parts = [];
                            const boldRegex = /\*\*(.*?)\*\*/g;
                            let lastIndex = 0;
                            let match;
                            let key = 0;
                            
                            while ((match = boldRegex.exec(text)) !== null) {
                              if (match.index > lastIndex) {
                                parts.push(text.substring(lastIndex, match.index));
                              }
                              parts.push(<strong key={key++} className="font-semibold text-indigo-600 dark:text-indigo-400">{match[1]}</strong>);
                              lastIndex = boldRegex.lastIndex;
                            }
                            
                            if (lastIndex < text.length) {
                              parts.push(text.substring(lastIndex));
                            }
                            
                            return parts.length > 0 ? parts : text;
                          };

                          return msg.content.split('\n').map((line, i) => {
                            if (line.startsWith('### ')) {
                              return <h3 key={i} className="text-base font-bold text-gray-900 dark:text-white mt-2 mb-1">{parseInline(line.substring(4))}</h3>;
                            }
                            if (line.startsWith('• ') || line.startsWith('- ')) {
                              return <li key={i} className="ml-5 list-disc my-1">{parseInline(line.substring(2))}</li>;
                            }
                            if (line.startsWith('---')) {
                              return <hr key={i} className="my-3 border-gray-200 dark:border-gray-700" />;
                            }
                            return <p key={i} className="my-1 min-h-[0.5rem]">{parseInline(line)}</p>;
                          });
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-blue-700 dark:text-blue-300 font-bold text-sm">AI</span>
                </div>
                <div className="p-4 rounded-2xl rounded-tl-none bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex gap-1.5 items-center h-5">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <div className="p-4 md:p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 sticky bottom-0">
          <div className="max-w-4xl mx-auto relative flex items-center shadow-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about clinical symptoms or healthcare laws (e.g., What is HIPAA? or What is medical malpractice?)..." 
              className="w-full p-4 pr-14 rounded-2xl bg-transparent border-none focus:outline-none focus:ring-0 text-gray-800 dark:text-gray-200 placeholder-gray-400"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-3 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl shadow-md transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-3 font-medium">
            Disclaimer: Information provided is for educational purposes only. Not professional medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}
