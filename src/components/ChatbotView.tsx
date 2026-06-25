import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  HelpCircle, 
  Activity, 
  TrendingUp, 
  CheckCircle2, 
  Cpu,
  Trash2,
  RefreshCcw
} from "lucide-react";
import { Lead } from "../types";

interface ChatbotViewProps {
  leads: Lead[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatbotView({ leads }: ChatbotViewProps) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "assistant", 
      content: `👋 **Welcome to your DIGITAL MARKETING CRM™ AI CMO Assistant!**

I am your growth-hacking partner, built directly into the CRM. I can help you draft marketing funnels, optimize budgets, write copy, or perform an intelligent audit on your active leads database.

Here are a few ways we can work together:
- **Analyze CRM Stats**: Click below and I'll review your leads, calculate close ratios, and identify bottlenecks.
- **Formulate AIDA Copy**: Get custom ad drafts using tested direct-response frameworks.
- **ROI Optimization**: Ask how to lower CPC or enhance attribution.

What business goal are we targeting today?`
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isReplying]);

  // CRM Aggregate stats to send as context
  const getCrmContext = () => {
    const totalLeads = leads.length;
    const opportunities = leads.filter(l => l.stage !== "Won" && l.stage !== "Lost");
    const wonCount = leads.filter(l => l.stage === "Won").length;
    const totalWonValue = leads.filter(l => l.stage === "Won").reduce((acc, curr) => acc + curr.value, 0);
    const totalPipelineValue = leads.filter(l => l.stage !== "Won" && l.stage !== "Lost").reduce((acc, curr) => acc + curr.value, 0);
    
    // Group leads by source
    const sources: Record<string, number> = {};
    leads.forEach(l => {
      sources[l.source] = (sources[l.source] || 0) + 1;
    });

    return {
      leadsCount: totalLeads,
      opportunitiesCount: opportunities.length,
      wonCount,
      wonValue: totalWonValue,
      pipelineValue: totalPipelineValue,
      sourcesBreakdown: JSON.stringify(sources)
    };
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    // Add user message
    const updatedMsgs = [...messages, { role: "user", content: text } as Message];
    setMessages(updatedMsgs);
    setInputMessage("");
    setIsReplying(true);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMsgs,
          context: getCrmContext()
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessages([
          ...updatedMsgs,
          { role: "assistant", content: data.text }
        ]);
      } else {
        setMessages([
          ...updatedMsgs,
          { role: "assistant", content: `⚠️ **Error contacting Gemini assistant:** ${data.error || "No response text available"}` }
        ]);
      }
    } catch (err: any) {
      console.error("Chat Assistant API Error:", err);
      setMessages([
        ...updatedMsgs,
        { role: "assistant", content: `⚠️ **Connection Error:** Could not connect to Express server. Please make sure the dev server is fully active.` }
      ]);
    } finally {
      setIsReplying(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      { 
        role: "assistant", 
        content: "Cleared chat logs. How can I help you grow today?"
      }
    ]);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="ai-cmo-chatbot-view">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            AI CMO Growth Advisor
            <Bot size={18} className="text-indigo-500 animate-bounce" />
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Collaborate with an AI marketing expert trained on conversion rate optimization, direct copywriting, and ad funnels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="clear-chatbot-btn"
            onClick={handleClearChat}
            className="flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition-colors cursor-pointer"
          >
            <Trash2 size={12} />
            Reset Chat
          </button>
        </div>
      </div>

      {/* Main chat layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch" id="chatbot-workspace-grid">
        
        {/* Left Side: Quick Prompt triggers */}
        <div className="space-y-4 lg:col-span-1" id="chatbot-prompts-panel">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Quick Action Triggers</h4>
          
          <div className="space-y-2.5">
            <button
              id="prompt-crm-stats-btn"
              onClick={() => handleSendMessage("Analyze my current CRM statistics and suggest conversions improvements.")}
              className="w-full text-left p-3 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/10 rounded-xl transition-all text-xs space-y-1 block cursor-pointer group"
            >
              <span className="font-bold text-slate-800 flex items-center gap-1 group-hover:text-indigo-600">
                <Activity size={13} className="text-indigo-500" />
                Analyze CRM Statistics
              </span>
              <p className="text-[10px] text-slate-400 leading-normal">Reviews live lead counts, pipeline value, and calculates close ratios.</p>
            </button>

            <button
              id="prompt-lower-cpc-btn"
              onClick={() => handleSendMessage("Give me a step-by-step strategy to lower Cost-Per-Click (CPC) and boost Quality Score on Facebook Ads.")}
              className="w-full text-left p-3 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/10 rounded-xl transition-all text-xs space-y-1 block cursor-pointer group"
            >
              <span className="font-bold text-slate-800 flex items-center gap-1 group-hover:text-indigo-600">
                <TrendingUp size={13} className="text-purple-500" />
                Lower Cost-Per-Click
              </span>
              <p className="text-[10px] text-slate-400 leading-normal">Strategies to optimize ad creative relevance and audience segmentation.</p>
            </button>

            <button
              id="prompt-organic-hooks-btn"
              onClick={() => handleSendMessage("Generate 5 high-converting Instagram hooks for services and digital product founders.")}
              className="w-full text-left p-3 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/10 rounded-xl transition-all text-xs space-y-1 block cursor-pointer group"
            >
              <span className="font-bold text-slate-800 flex items-center gap-1 group-hover:text-indigo-600">
                <Sparkles size={13} className="text-pink-500" />
                Organic Social Hooks
              </span>
              <p className="text-[10px] text-slate-400 leading-normal">Fast, scroll-stopping video structures designed to attract warm leads.</p>
            </button>
          </div>

          <div className="bg-indigo-50/30 border border-indigo-100/40 p-4 rounded-xl text-[11px] text-slate-500 space-y-2">
            <span className="font-bold text-indigo-800 flex items-center gap-1">
              <Cpu size={12} />
              AI Context Sync
            </span>
            <p className="leading-relaxed">
              When chatting, the assistant automatically reviews your CRM database value of <strong>${getCrmContext().pipelineValue.toLocaleString()}</strong> in active opportunities to provide realistic strategic marketing feedback.
            </p>
          </div>
        </div>

        {/* Right Side: Conversation stream panel */}
        <div className="lg:col-span-3 bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs flex flex-col justify-between min-h-[480px]" id="chatbot-conversation-card">
          
          {/* Messages window stream */}
          <div className="flex-1 overflow-y-auto space-y-4 max-h-[380px] pr-2 mb-4" id="chat-stream-window">
            {messages.map((msg, idx) => (
              <div 
                key={idx}
                className={`flex gap-3 text-xs leading-relaxed max-w-[85%] ${
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {/* Icon wrapper */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-3xs ${
                  msg.role === "user" ? "bg-slate-800 text-white" : "bg-indigo-600 text-white"
                }`}>
                  {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                </div>

                {/* Message body */}
                <div className={`p-4 rounded-2xl ${
                  msg.role === "user" 
                    ? "bg-slate-100 text-slate-800 rounded-tr-none" 
                    : "bg-indigo-50/30 border border-indigo-100/30 text-slate-800 rounded-tl-none"
                }`}>
                  <p className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}

            {isReplying && (
              <div className="flex gap-3 text-xs max-w-[85%] animate-pulse">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bot size={14} />
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 text-slate-500 rounded-2xl rounded-tl-none flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-slate-400 font-medium">CMO is analyzing CRM parameters...</span>
                </div>
              </div>
            )}
            
            <div ref={scrollRef} />
          </div>

          {/* Chat Input form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }} 
            className="flex gap-2 border-t border-slate-100 pt-4"
            id="chatbot-input-form"
          >
            <input 
              id="chatbot-text-input"
              type="text"
              placeholder="Ask your CMO growth advisor anything..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all"
            />
            <button
              id="send-chat-msg-btn"
              type="submit"
              disabled={!inputMessage.trim() || isReplying}
              className="px-4 py-2 bg-gold-500 hover:bg-gold-600 disabled:bg-slate-300 text-slate-950 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-sm"
            >
              <Send size={13} className="text-slate-950 stroke-[2.5px]" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
