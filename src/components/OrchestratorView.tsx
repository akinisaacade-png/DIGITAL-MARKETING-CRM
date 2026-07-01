import React, { useState } from "react";
import { safeCRMRequest } from "../lib/api";
import { 
  Sparkles, 
  Cpu, 
  Users, 
  TrendingUp, 
  Network, 
  ChevronRight, 
  Play, 
  Code, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  FileText,
  Workflow,
  Copy,
  Check
} from "lucide-react";

// Simple custom component to render basic markdown safely for React 19
function SimpleMarkdown({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split("\n");
  return (
    <div className="space-y-3 text-slate-800 font-sans leading-relaxed text-xs">
      {lines.map((line, index) => {
        // Headers
        if (line.startsWith("### ")) {
          return (
            <h3 key={index} className="text-sm font-bold text-slate-900 pt-3 pb-1 border-b border-slate-100 flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-indigo-500 rounded-xs"></span>
              {line.replace("### ", "")}
            </h3>
          );
        }
        if (line.startsWith("#### ")) {
          return (
            <h4 key={index} className="text-xs font-bold text-indigo-900 pt-2 pb-0.5">
              {line.replace("#### ", "")}
            </h4>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={index} className="text-base font-extrabold text-slate-900 pt-4 pb-1 border-b border-slate-200">
              {line.replace("## ", "")}
            </h2>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <h1 key={index} className="text-lg font-black text-slate-900 pt-5 pb-2">
              {line.replace("# ", "")}
            </h1>
          );
        }
        
        // Unordered lists
        if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
          // Parse potential bold text inside list item
          const cleanLine = line.trim().substring(2);
          return (
            <ul key={index} className="list-disc pl-5 space-y-1">
              <li className="text-slate-700">
                <ParsedText text={cleanLine} />
              </li>
            </ul>
          );
        }

        // Numbered lists
        const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
        if (numMatch) {
          return (
            <ol key={index} className="list-decimal pl-5 space-y-1">
              <li className="text-slate-700">
                <ParsedText text={numMatch[2]} />
              </li>
            </ol>
          );
        }

        // Empty line
        if (!line.trim()) {
          return <div key={index} className="h-2"></div>;
        }

        // Default paragraph
        return (
          <p key={index} className="text-slate-600">
            <ParsedText text={line} />
          </p>
        );
      })}
    </div>
  );
}

// Utility to render bold segments like **text**
function ParsedText({ text }: { text: string }) {
  const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (i % 2 === 1) {
          return <strong key={i} className="font-extrabold text-slate-900 bg-slate-50 px-1 rounded-sm border border-slate-100">{part}</strong>;
        }
        return part;
      })}
    </span>
  );
}

export default function OrchestratorView() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"orchestrator" | "campaign" | "lead" | "analytics">("orchestrator");
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  // Output response state
  const [response, setResponse] = useState<{
    success: boolean;
    isDemo?: boolean;
    orchestratedBy?: string;
    agent?: string;
    agentName?: string;
    reasoning?: string;
    derivedInputs?: any;
    logs?: string[];
    text?: string;
    error?: string;
  } | null>(null);

  // Preset prompts for marketing workloads
  const presets = [
    {
      title: "1. Lead Scoring & Risks",
      description: "Classify incoming pipeline prospects and surface deal leakage risk",
      icon: <Users size={14} className="text-amber-500" />,
      prompt: "Score the current CRM lead database. Identify our highest-intent prospects, find deals with low conversion probability, and recommend next-step sequencing triggers.",
      mode: "lead"
    },
    {
      title: "2. Copy & Campaign Generator",
      description: "Create an on-brand 4-pillar campaign content funnel for high-scoring leads",
      icon: <Sparkles size={14} className="text-indigo-500" />,
      prompt: "Generate a multi-channel campaign. Include SEO title/description keywords, a high-impact LinkedIn hook, a re-engagement email sequence copy, and targeted conversion Facebook ad copies.",
      mode: "campaign"
    },
    {
      title: "3. Analytics & Benchmarking",
      description: "Audit CTR, CPC, and ROI against standard industry benchmarks",
      icon: <TrendingUp size={14} className="text-emerald-500" />,
      prompt: "Run an audit on current integration campaign metrics. Diagnose underperforming channels, contrast CPC/CTR with industry averages ($1.84 and 2.15%), and provide optimization recommendations.",
      mode: "analytics"
    },
    {
      title: "🤖 Smart Orchestration Task",
      description: "Let the central AI reason, choose the optimal agent, and compile solutions",
      icon: <Network size={14} className="text-violet-500" />,
      prompt: "We are launching a new high-value trial promotion. I want you to evaluate our leads scoring to find the top target group, write a targeted email subject line for them, and recommend which platform to spend the budget on based on active CTR ratios.",
      mode: "orchestrator"
    }
  ];

  const handleApplyPreset = (preset: typeof presets[0]) => {
    setPrompt(preset.prompt);
    setMode(preset.mode as any);
  };

  const handleExecute = async () => {
    if (!prompt.trim()) return;

    setIsRunning(true);
    setResponse(null);

    try {
      const data = await safeCRMRequest<any>("/api/gemini/orchestrate", {
        method: "POST",
        body: JSON.stringify({
          prompt,
          mode
        })
      });

      if (data && "error" in data && data.error) {
        setResponse({
          success: false,
          error: data.message || "Failed to orchestrate task."
        });
      } else {
        setResponse(data);
      }
    } catch (err: any) {
      setResponse({
        success: false,
        error: err.message || "Could not connect to marketing intelligence services."
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = () => {
    if (!response?.text) return;
    navigator.clipboard.writeText(response.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="multi-agent-orchestrator-view">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
              Gemini + ADK System
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5 mt-1.5">
            AI Campaign Intelligence & Multi-Agent Orchestrator
            <Workflow size={20} className="text-indigo-600 animate-spin-slow" />
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Prototype and operate the core AI orchestration layer. The central Orchestrator coordinates dedicated specialized agents to scoring leads, draft multi-channel copy, and interpret raw campaign statistics.
          </p>
        </div>
      </div>

      {/* High-Level Architecture Visualization Diagram */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-slate-300 rounded-2xl p-6 border border-indigo-900/40 shadow-xl relative overflow-hidden" id="architecture-blueprint-panel">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-12 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-gold-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Applet Core AI Orchestration Diagram</h3>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-900/50 px-2.5 py-1 rounded-md border border-slate-800">
            Model: gemini-3.5-flash / gemini-3.1-pro-preview
          </span>
        </div>

        {/* Nodes and Links Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-7 items-center gap-4 relative" id="blueprint-nodes-flow">
          
          {/* Node 1: User / Trigger */}
          <div className="lg:col-span-2 bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-center relative z-10">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-2 text-white font-mono font-bold text-xs border border-slate-700">
              01
            </div>
            <h4 className="text-xs font-bold text-white">CRM User Request</h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              Triggers marketing or analytics instruction in natural language.
            </p>
          </div>

          {/* Arrow 1 */}
          <div className="hidden lg:flex lg:col-span-1 justify-center items-center text-indigo-400">
            <ChevronRight size={24} className="animate-pulse" />
          </div>

          {/* Node 2: Central Orchestrator */}
          <div className="lg:col-span-1 bg-indigo-950/80 p-4 rounded-xl border-2 border-indigo-500 text-center relative z-10 shadow-lg shadow-indigo-950">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center mx-auto mb-2 text-white">
              <Network size={14} className="animate-pulse" />
            </div>
            <h4 className="text-xs font-bold text-white">Orchestrator</h4>
            <p className="text-[9px] text-indigo-300 mt-1 uppercase font-mono tracking-wider font-bold">
              gemini-3.5
            </p>
            <p className="text-[9px] text-slate-400 mt-1.5 leading-tight">
              Classifies intent & derives parameters.
            </p>
          </div>

          {/* Arrow 2 */}
          <div className="hidden lg:flex lg:col-span-1 justify-center items-center text-indigo-400">
            <ChevronRight size={24} className="animate-pulse" />
          </div>

          {/* Node 3: Specialized Workers */}
          <div className="lg:col-span-2 space-y-2.5 relative z-10">
            
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-amber-500/30 flex items-center gap-3">
              <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                <Users size={12} />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-bold text-white block leading-none">Lead Scoring Agent</span>
                <span className="text-[9px] text-slate-400 font-mono">Scores leads & surfaces risk benchmarks</span>
              </div>
            </div>

            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-indigo-500/30 flex items-center gap-3">
              <div className="w-6 h-6 rounded-md bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                <Sparkles size={12} />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-bold text-white block leading-none">Campaign Content Agent</span>
                <span className="text-[9px] text-slate-400 font-mono">Generates multi-pillar SEO & email copy</span>
              </div>
            </div>

            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-emerald-500/30 flex items-center gap-3">
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                <TrendingUp size={12} />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-bold text-white block leading-none">Marketing Analytics Agent</span>
                <span className="text-[9px] text-slate-400 font-mono">Diagnoses CPC/CTR and spent telemetry</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Main interactive grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch" id="orchestrator-interaction-workspace">
        
        {/* Left Side: Input Workspace (7 cols) */}
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-between" id="workspace-input-column">
          
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-3xs space-y-5 flex-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Code size={13} className="text-indigo-600" />
              Intelligence Control Center
            </h3>

            {/* Presets Grid */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Select Core Workload Preset to Load:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="presets-selector-grid">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleApplyPreset(preset)}
                    className="p-3 text-left bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all group flex flex-col justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-md bg-white border border-slate-200 shadow-3xs group-hover:bg-indigo-100/50">
                        {preset.icon}
                      </span>
                      <span className="text-[11px] font-bold text-slate-800 leading-none group-hover:text-indigo-950">
                        {preset.title}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 leading-snug group-hover:text-slate-600">
                      {preset.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt input field */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Custom Agent Instruction Prompt:
                </label>
                
                {/* Routing Mode toggle */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
                  <span className="text-[9px] font-extrabold text-slate-400 px-1.5 uppercase">Mode:</span>
                  {[
                    { id: "orchestrator", label: "Smart Orchestration" },
                    { id: "campaign", label: "Direct Content" },
                    { id: "lead", label: "Direct Scoring" },
                    { id: "analytics", label: "Direct Analytics" }
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => setMode(btn.id as any)}
                      className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all cursor-pointer ${
                        mode === btn.id
                          ? "bg-white text-indigo-600 shadow-3xs border border-slate-200/60 font-black"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                id="orchestrator-task-textarea"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to achieve (e.g. 'Generate Facebook copy targeting SaaS startup founders', 'Which Leads are ready to buy?', 'Compare my current spent ROI against industry averages'...)"
                className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-hidden focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all text-xs font-sans text-slate-800 resize-none leading-relaxed"
              />
            </div>

            {/* Execute trigger */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <AlertCircle size={12} className="text-indigo-400" />
                <span>Automatically feeds live database telemetry metadata to agents.</span>
              </div>
              <button
                id="execute-orchestration-btn"
                onClick={handleExecute}
                disabled={isRunning || !prompt.trim()}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-md cursor-pointer ${
                  isRunning || !prompt.trim()
                    ? "bg-slate-100 text-slate-400 border border-slate-200/80 cursor-not-allowed shadow-none"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 hover:scale-102"
                }`}
              >
                {isRunning ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-white rounded-full animate-spin"></div>
                    <span>Orchestrating...</span>
                  </>
                ) : (
                  <>
                    <Play size={12} className="fill-white" />
                    <span>Run Multi-Agent Cycle</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

        {/* Right Side: Console trace & Output report (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6" id="workspace-output-column">
          
          {/* Real-time routing terminal */}
          <div className="bg-slate-950 text-slate-300 border border-slate-900 rounded-2xl p-4 shadow-xl flex flex-col justify-between font-mono text-[10px] leading-relaxed h-[180px]">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2 mb-2 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-pulse" />
                ADK Micro-Agent Routing Terminal
              </span>
              <span>LIVE FEED</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              {isRunning ? (
                <div className="space-y-1 animate-pulse text-indigo-400 font-mono">
                  <p>&gt; [ORCHESTRATOR-THINKING] Instantiating central broker model context...</p>
                  <p>&gt; [ORCHESTRATOR-ANALYSIS] Extracting system semantic triggers...</p>
                  <p>&gt; [ROUTING-GATEWAY] Checking payload constraints against BigQuery state...</p>
                </div>
              ) : response ? (
                response.logs?.map((log, lidx) => (
                  <p key={lidx} className={
                    log.includes("[DONE]") || log.includes("[SUCCESS]") ? "text-emerald-400" :
                    log.includes("[ERROR]") || log.includes("[WARN]") ? "text-red-400" :
                    log.includes("[ROUTING]") || log.includes("[ORCHESTRATOR-ROUTING]") ? "text-amber-400 font-extrabold" :
                    "text-slate-400"
                  }>
                    &gt; {log}
                  </p>
                ))
              ) : (
                <div className="text-slate-500 italic h-full flex items-center justify-center text-center px-4 font-sans text-xs">
                  Orchestration pipeline idle. Trigger a micro-agent cycle above to see live routing reasoning logs.
                </div>
              )}
            </div>
          </div>

          {/* Reasoning & Agent Decision Card */}
          {response?.success && (
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 text-xs space-y-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-indigo-600 shrink-0" />
                <span className="font-extrabold text-slate-900 font-sans">Orchestrated Decision:</span>
                <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full text-[9px] font-black font-mono">
                  {response.agentName}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed font-sans text-[11px]">
                <strong>Reasoning Summary:</strong> {response.reasoning}
              </p>
            </div>
          )}

        </div>

      </div>

      {/* Main output container */}
      {(isRunning || response) && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-3xs overflow-hidden" id="orchestrator-output-report">
          
          <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-indigo-600" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                {isRunning ? "Generating Intelligent Response..." : "AI Generated Marketing Solution & Pipeline Insights"}
              </span>
              {response?.isDemo && (
                <span className="text-[9px] font-bold font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
                  Demo Sandbox Mode
                </span>
              )}
            </div>

            {response?.text && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-slate-200 hover:border-indigo-100 rounded-lg px-3 py-1.5 shadow-3xs cursor-pointer transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy Solution Report</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="p-6">
            {isRunning ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
                <p className="text-xs font-semibold text-slate-500 animate-pulse">
                  Wait while child micro-agent processes live database parameters and compiles the final copy report...
                </p>
              </div>
            ) : response?.success ? (
              <div className="bg-slate-50/50 border border-slate-100 p-6 rounded-xl shadow-2xs">
                <SimpleMarkdown text={response.text || ""} />
              </div>
            ) : response ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2.5">
                <AlertCircle size={16} className="text-red-600 shrink-0" />
                <div>
                  <h4 className="font-bold">Orchestrator Compile Handshake Error</h4>
                  <p className="mt-0.5 text-red-600">{response.error || "The micro-agent failed to output the response. Please check terminal logs."}</p>
                </div>
              </div>
            ) : null}
          </div>

        </div>
      )}

    </div>
  );
}
