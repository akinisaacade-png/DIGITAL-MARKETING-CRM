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
  RefreshCcw,
  Mail,
  Linkedin,
  MessageSquare,
  Copy,
  Users,
  FileText
} from "lucide-react";
import { Lead, Activity as CRMActivity } from "../types";
import { safeCRMRequest } from "../lib/api";

interface ChatbotViewProps {
  leads: Lead[];
  activities?: CRMActivity[];
  onAddActivity?: (type: "lead" | "email" | "deal" | "task" | "system", message: string) => Promise<void>;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatbotView({ leads, activities = [], onAddActivity }: ChatbotViewProps) {
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

  // Quick replies suggestion state
  const [sidebarTab, setSidebarTab] = useState<"actions" | "lead-responder">("actions");
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loggedId, setLoggedId] = useState<string | null>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isReplying]);

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  // Load quick-reply templates dynamically when lead is selected
  useEffect(() => {
    if (!selectedLead) {
      setTemplates([]);
      return;
    }

    const fetchTemplates = async () => {
      setIsLoadingTemplates(true);
      setTemplatesError(null);
      try {
        // Filter activities for this lead
        const leadActivities = activities
          .filter(act => act.message.toLowerCase().includes(selectedLead.name.toLowerCase()))
          .map(act => act.message);

        const response = await fetch("/api/gemini/quick-replies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadName: selectedLead.name,
            leadStage: selectedLead.stage,
            leadCompany: selectedLead.company,
            leadSource: selectedLead.source,
            leadValue: selectedLead.value,
            activities: leadActivities
          })
        });

        const data = await response.json();
        if (data.success && Array.isArray(data.templates)) {
          setTemplates(data.templates);
        } else {
          setTemplatesError(data.message || "Failed to generate templates.");
        }
      } catch (err: any) {
        console.error("Error loading templates:", err);
        setTemplatesError("Network or server error generating templates.");
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, [selectedLeadId, activities]);

  const handleUseInChat = (template: any) => {
    const intro = template.channel === "email" 
      ? `Refine this Email template (Subject: "${template.subject || ''}")` 
      : `Refine this ${template.channel.toUpperCase()} template`;
    
    setInputMessage(`${intro} for ${selectedLead?.name || 'prospect'}:\n\n${template.body}`);
    const inputEl = document.getElementById("chatbot-text-input");
    inputEl?.focus();
  };

  const handleLogOutreach = async (template: any) => {
    if (!selectedLead || !onAddActivity) return;
    setLoggedId(template.id);
    
    const type = template.channel === "email" ? "email" : "lead";
    const channelLabel = template.channel === "email" 
      ? "Email" 
      : template.channel === "linkedin" 
      ? "LinkedIn" 
      : template.channel === "sms" 
      ? "SMS" 
      : "General Outreach";
      
    const subjectStr = template.subject ? ` (Subject: ${template.subject})` : "";
    const message = `Sent AI-Generated Quick-Reply ${channelLabel}${subjectStr} to ${selectedLead.name} (${selectedLead.company})`;

    try {
      await onAddActivity(type, message);
    } catch (err) {
      console.error("Error logging outreach activity:", err);
    } finally {
      setTimeout(() => setLoggedId(null), 2000);
    }
  };

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
      const data = await safeCRMRequest<any>("/api/gemini/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: updatedMsgs,
          context: getCrmContext()
        })
      });

      if (data && "success" in data && data.success) {
        setMessages([
          ...updatedMsgs,
          { role: "assistant", content: data.text }
        ]);
      } else {
        const errorMsg = (data && "message" in data) ? data.message : (data?.error || "No response text available");
        setMessages([
          ...updatedMsgs,
          { role: "assistant", content: `⚠️ **Error contacting Gemini assistant:** ${errorMsg}` }
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
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start" id="chatbot-workspace-grid">
        
        {/* Left Side: Segmented tabs for Quick Prompts or Lead Quick-Replies */}
        <div className="space-y-4 xl:col-span-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-3xs" id="chatbot-sidebar-panel">
          
          {/* Segmented control tabs */}
          <div className="flex border-b border-slate-100 mb-4 p-0.5 bg-slate-50 rounded-xl" id="chatbot-sidebar-tabs">
            <button
              id="sidebar-tab-actions"
              type="button"
              onClick={() => setSidebarTab("actions")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                sidebarTab === "actions"
                  ? "bg-white text-indigo-600 shadow-3xs border border-slate-100"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Cpu size={13} />
              Marketing Actions
            </button>
            <button
              id="sidebar-tab-replies"
              type="button"
              onClick={() => setSidebarTab("lead-responder")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 relative ${
                sidebarTab === "lead-responder"
                  ? "bg-white text-indigo-600 shadow-3xs border border-slate-100"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Users size={13} />
              Lead Quick-Replies
              {selectedLeadId && (
                <span className="absolute right-2 top-2.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              )}
            </button>
          </div>

          {/* TAB 1: Marketing Actions */}
          {sidebarTab === "actions" && (
            <div className="space-y-4 animate-fadeIn" id="marketing-actions-sidebar-content">
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
          )}

          {/* TAB 2: Lead Quick-Replies */}
          {sidebarTab === "lead-responder" && (
            <div className="space-y-4 animate-fadeIn" id="lead-responder-sidebar-content">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                  Select Target Lead
                </label>
                <select
                  id="lead-selection-dropdown"
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="">-- Choose a lead to reply --</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.company || "No Company"}) — {l.stage}
                    </option>
                  ))}
                </select>
              </div>

              {selectedLead ? (
                <div className="space-y-4">
                  {/* Selected Lead details mini-card */}
                  <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-xl space-y-2.5" id="selected-lead-context-card">
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-bold text-slate-900 text-xs">{selectedLead.name}</h5>
                        <p className="text-[10px] text-slate-400">{selectedLead.company || "Independent"}</p>
                      </div>
                      {/* Stage badge */}
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        selectedLead.stage === "Won" 
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : selectedLead.stage === "Lost"
                          ? "bg-rose-50 text-rose-600 border border-rose-100"
                          : selectedLead.stage === "Proposal"
                          ? "bg-purple-50 text-purple-600 border border-purple-100"
                          : selectedLead.stage === "Qualified"
                          ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                          : selectedLead.stage === "Contacted"
                          ? "bg-blue-50 text-blue-600 border border-blue-100"
                          : "bg-amber-50 text-amber-600 border border-amber-100"
                      }`}>
                        {selectedLead.stage}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 pt-1.5 border-t border-slate-200/60">
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">Source</span>
                        <strong className="text-slate-700">{selectedLead.source}</strong>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">Value</span>
                        <strong className="text-slate-700">${selectedLead.value.toLocaleString()}</strong>
                      </div>
                    </div>

                    {/* Past communication history summary list */}
                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                        Communication History ({activities.filter(act => act.message.toLowerCase().includes(selectedLead.name.toLowerCase())).length})
                      </span>
                      {activities.filter(act => act.message.toLowerCase().includes(selectedLead.name.toLowerCase())).length > 0 ? (
                        <div className="max-h-[75px] overflow-y-auto space-y-1.5 pr-1" id="lead-mini-history">
                          {activities
                            .filter(act => act.message.toLowerCase().includes(selectedLead.name.toLowerCase()))
                            .slice(0, 3)
                            .map((act, idx) => (
                              <div key={idx} className="text-[9px] text-slate-600 leading-normal bg-white border border-slate-150 p-1.5 rounded-md flex items-start gap-1">
                                <span className="text-indigo-400 mt-0.5">●</span>
                                <p className="truncate max-w-[200px]" title={act.message}>{act.message}</p>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-[9px] text-slate-400 italic">No past communication logged yet.</p>
                      )}
                    </div>
                  </div>

                  {/* AI Templates */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles size={11} className="text-indigo-500 animate-pulse" />
                        AI Quick Replies
                      </span>
                      <button
                        id="regenerate-templates-btn"
                        type="button"
                        onClick={() => {
                          setSelectedLeadId("");
                          setTimeout(() => setSelectedLeadId(selectedLead.id), 50);
                        }}
                        disabled={isLoadingTemplates}
                        className="text-[9px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCcw size={8} className={isLoadingTemplates ? "animate-spin" : ""} />
                        Regenerate
                      </button>
                    </div>

                    {isLoadingTemplates ? (
                      <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center gap-2">
                        <Sparkles className="text-indigo-500 animate-pulse" size={16} />
                        <p className="text-[10px] text-slate-400 font-medium">Crafting custom proposals...</p>
                      </div>
                    ) : templatesError ? (
                      <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-[10px] leading-relaxed">
                        <p className="font-bold">Failed to load templates</p>
                        <p className="mt-0.5">{templatesError}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLeadId("");
                            setTimeout(() => setSelectedLeadId(selectedLead.id), 50);
                          }}
                          className="mt-2 text-[9px] font-bold underline text-red-700 block cursor-pointer"
                        >
                          Retry Request
                        </button>
                      </div>
                    ) : templates.length > 0 ? (
                      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1" id="templates-cards-list">
                        {templates.map((tpl) => {
                          const isCopied = copiedId === tpl.id;
                          const isLogged = loggedId === tpl.id;
                          
                          return (
                            <div 
                              key={tpl.id} 
                              className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-3.5 transition-all text-xs space-y-2.5 shadow-3xs group relative"
                            >
                              {/* Template Header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                                    tpl.channel === "email" 
                                      ? "bg-blue-50 text-blue-600" 
                                      : tpl.channel === "linkedin"
                                      ? "bg-sky-50 text-sky-700"
                                      : tpl.channel === "sms"
                                      ? "bg-emerald-50 text-emerald-600"
                                      : "bg-slate-100 text-slate-600"
                                  }`}>
                                    {tpl.channel === "email" ? (
                                      <Mail size={10} />
                                    ) : tpl.channel === "linkedin" ? (
                                      <Linkedin size={10} />
                                    ) : tpl.channel === "sms" ? (
                                      <MessageSquare size={10} />
                                    ) : (
                                      <FileText size={10} />
                                    )}
                                  </span>
                                  <span className="font-bold text-slate-800 text-[11px] truncate max-w-[130px]" title={tpl.title}>
                                    {tpl.title}
                                  </span>
                                </div>
                                
                                {/* Copy action */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(tpl.body);
                                    setCopiedId(tpl.id);
                                    setTimeout(() => setCopiedId(null), 1500);
                                  }}
                                  className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-50 rounded-md cursor-pointer flex items-center justify-center"
                                  title="Copy to clipboard"
                                >
                                  {isCopied ? <CheckCircle2 size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                </button>
                              </div>

                              {/* Email Subject Block */}
                              {tpl.channel === "email" && tpl.subject && (
                                <div className="bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg text-[10px] text-slate-600 leading-normal">
                                  <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block">Subject</span>
                                  <span className="font-medium truncate block">{tpl.subject}</span>
                                </div>
                              )}

                              {/* Body text block */}
                              <div className="max-h-[90px] overflow-y-auto bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 text-[10px] text-slate-600 leading-relaxed font-mono whitespace-pre-wrap">
                                {tpl.body}
                              </div>

                              {/* Footer action controls */}
                              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => handleUseInChat(tpl)}
                                  className="py-1 px-2 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/10 rounded-lg text-[9px] font-semibold text-slate-600 hover:text-indigo-600 transition-all flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <RefreshCcw size={10} />
                                  Refine in Chat
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleLogOutreach(tpl)}
                                  disabled={isLogged || !onAddActivity}
                                  className="py-1 px-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[9px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:bg-emerald-50 disabled:text-emerald-700 disabled:border-emerald-100 disabled:opacity-80"
                                >
                                  {isLogged ? (
                                    <>
                                      <CheckCircle2 size={10} />
                                      Logged!
                                    </>
                                  ) : (
                                    <>
                                      <Send size={10} />
                                      Log Outreach
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic text-center py-4">No templates generated.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-center space-y-2">
                  <Users className="mx-auto text-slate-300" size={24} />
                  <p className="text-xs text-slate-500 font-medium">No Lead Selected</p>
                  <p className="text-[10px] text-slate-400 max-w-[180px] mx-auto leading-relaxed">
                    Select a lead from the list above to immediately view customized marketing outreach templates.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Conversation stream panel */}
        <div className="xl:col-span-8 bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs flex flex-col justify-between min-h-[520px]" id="chatbot-conversation-card">
          
          {/* Messages window stream */}
          <div className="flex-1 overflow-y-auto space-y-4 max-h-[420px] pr-2 mb-4 animate-fadeIn" id="chat-stream-window">
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
