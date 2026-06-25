import React, { useState, useEffect } from "react";
import { 
  Terminal, 
  Settings, 
  Cpu, 
  Database, 
  ShieldAlert, 
  CheckCircle2, 
  Wrench, 
  RefreshCw, 
  ShieldCheck, 
  Zap, 
  BookOpen, 
  TrendingUp, 
  Search, 
  Award,
  Maximize2,
  Check,
  Copy,
  Sparkles,
  AlertTriangle
} from "lucide-react";
import { MaintenanceStatus } from "../types";

interface MaintenanceViewProps {
  status: MaintenanceStatus;
  onRunAgentAction: (action: "diagnose" | "optimize" | "syncBenchmarks") => Promise<string[]>;
}

export default function MaintenanceView({ status, onRunAgentAction }: MaintenanceViewProps) {
  const [subTab, setSubTab] = useState<"system" | "agent">("system");
  const [agentMode, setAgentMode] = useState<"health_check" | "bug_clustering" | "release_plan" | "release_notes">("health_check");
  
  const sampleInputs = {
    health_check: `[2026-06-25 10:12:05] SYSTEM_HEALTH: WARNING\n[DATABASE] Connection pool size: 45/50 (High Load)\n[ATTRIBUTION] Google Ads webhook latency: 450ms (Threshold: 300ms)\n[MEM] Memory consumption: 88%\n[CPU] User CPU load: 74%\n[WARN] 12 failed attempts to sync Instagram API token`,
    bug_clustering: `ERROR 1: Error: "Instagram token handshake timed out" at src/api/instagram.ts:42 (12 occurrences)\nERROR 2: ConnectionError: "Failed to establish secure connection to facebook.com" at node_modules/http:112 (8 occurrences)\nERROR 3: TypeError: "Cannot read properties of undefined (reading 'split')" in server.ts:474 (2 occurrences)\nERROR 4: Error: "Instagram token handshake timed out" at src/api/instagram.ts:58 (4 occurrences)`,
    release_plan: `FEATURES TO DEPLOY:\n- Brand new E-commerce Product Page Generator tool with AI copy optimization.\n- New robust automated leads bulk delete action.\n\nBUG FIXES COMPLETED:\n- Patched API splits handler in server.ts to prevent crashes on undefined inputs.\n- Solved Instagram token expiring refresh loop token timing mismatch.`,
    release_notes: `RELEASE VERSION: v1.5.0\nCOMMITS SUMMARY:\n- feat: add e-commerce product page generator for complete unified funnels (Akin)\n- fix: stabilize facebook ad sync state toggle behavior (Akin)\n- chore: update lucide icons suite & boost tailwind viewport responsiveness (Akin)\n- fix: resolve token split indexing crash under null category exceptions (Akin)`
  };

  const [inputText, setInputText] = useState(sampleInputs.health_check);
  const [riskMitigation, setRiskMitigation] = useState("Rollback release instantly if any main transaction flows report latency increase above 150ms.");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setInputText(sampleInputs[agentMode]);
  }, [agentMode]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const response = await fetch("/api/maintenance/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: agentMode,
          inputText,
          riskMitigation
        })
      });
      const data = await response.json();
      if (data.success) {
        setAnalysisResult(data.analysis);
      } else {
        setAnalysisResult(`⚠️ Error: ${data.error || "Failed to compile agent report."}`);
      }
    } catch (err: any) {
      setAnalysisResult(`⚠️ Connection Error: Failed to execute agent. ${err.message || ""}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyAnalysis = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SYSTEM BOOT] DIGITAL MARKETING CRM™ v1.4.2 active.",
    "[SEC-INIT] AES-256 bank-level encryption handshake successful.",
    "[AI-AGENT] Background maintenance crawler initialized. Status: VIGILANT.",
    "[CRAWL-LOG] Periodically scanning lead scoring latency and ad account integration webhooks.",
    "Ready. Select an AI Agent command below to execute system-level improvements."
  ]);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const triggerAction = async (action: "diagnose" | "optimize" | "syncBenchmarks", label: string) => {
    setActiveAction(action);
    // Add initiating message
    setTerminalLogs(prev => [
      ...prev,
      `\n>>> [EXEC] Triggered AI agent command: "${label}"...`,
      `[PROCESS] Initializing micro-agent compiler, checking current industry parameters...`
    ]);

    try {
      const logs = await onRunAgentAction(action);
      setTerminalLogs(prev => [
        ...prev,
        ...logs,
        `>>> [SUCCESS] "${label}" action completed successfully. State values updated.`
      ]);
    } catch (err: any) {
      setTerminalLogs(prev => [
        ...prev,
        `>>> [ERROR] Failover reported: ${err.message || "Failed to execute server instruction."}`
      ]);
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="maintenance-agent-view">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            AI Maintenance Agent Control
            <Wrench size={18} className="text-indigo-500 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automate daily software patches, coordinate security audits, and pull up-to-date marketing cost-per-click indices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
            <ShieldCheck size={14} /> App Status: {status.health}
          </span>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-200/80 gap-6" id="maintenance-sub-tabs">
        <button
          onClick={() => setSubTab("system")}
          className={`pb-3 text-xs font-bold transition-all border-b-2 px-1 flex items-center gap-1.5 cursor-pointer ${
            subTab === "system"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Settings size={13} />
          System Health & Diagnostic Routines
        </button>
        <button
          onClick={() => setSubTab("agent")}
          className={`pb-3 text-xs font-bold transition-all border-b-2 px-1 flex items-center gap-1.5 cursor-pointer ${
            subTab === "agent"
              ? "border-indigo-600 text-indigo-600 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Sparkles size={13} className="text-indigo-500 animate-pulse" />
          Specialized AI Maintenance Agent
        </button>
      </div>

      {subTab === "system" ? (
        <>
          {/* Grid of System statuses */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6" id="maintenance-kpis-grid">
            
            {/* Status 1 */}
            <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-3xs flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                <Settings size={18} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Core App Version</span>
                <span className="text-sm font-extrabold text-slate-800 font-mono mt-0.5 block">v1.4.2 [STABLE]</span>
              </div>
            </div>

            {/* Status 2 */}
            <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-3xs flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                <Cpu size={18} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Self-Applied Patches</span>
                <span className="text-sm font-extrabold text-slate-800 font-mono mt-0.5 block">{status.totalFixes} minor updates</span>
              </div>
            </div>

            {/* Status 3 */}
            <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-3xs flex items-center gap-4">
              <div className="p-3 bg-pink-50 text-pink-600 rounded-lg">
                <Database size={18} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Database Integrity</span>
                <span className="text-sm font-extrabold text-slate-800 font-mono mt-0.5 block">100% [AES-256 SECURE]</span>
              </div>
            </div>

            {/* Status 4 */}
            <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-3xs flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                <Zap size={18} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Active Process</span>
                <span className="text-sm font-extrabold text-slate-800 mt-0.5 block truncate max-w-[130px]">{status.activeOptimization}</span>
              </div>
            </div>

          </div>

          {/* Main Workbench: Controls left, Terminal right */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8" id="maintenance-workbench">
            
            {/* Left: Controls */}
            <div className="lg:col-span-2 space-y-4 bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs" id="agent-actions-card">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                <Cpu size={14} /> Trigger AI Agent Routines
              </h3>

              <div className="space-y-4">
                
                {/* Button 1 */}
                <div className="border border-slate-150 p-4 rounded-xl space-y-2 hover:border-slate-200 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">Run Diagnostics Check</span>
                    <span className="text-[9px] font-mono font-bold text-slate-400">Diag scan</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Verifies multi-channel ad API token statuses, ensures lead scoring latency, and validates webhook health.
                  </p>
                  <button
                    id="run-diagnostics-btn"
                    onClick={() => triggerAction("diagnose", "Diagnostics Check")}
                    disabled={activeAction !== null}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    {activeAction === "diagnose" ? "Diagnosing..." : "Run Diagnostic Check"}
                  </button>
                </div>

                {/* Button 2 */}
                <div className="border border-slate-150 p-4 rounded-xl space-y-2 hover:border-slate-200 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">Performance Optimization sweep</span>
                    <span className="text-[9px] font-mono font-bold text-slate-400">DB Optimizer</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Refreshes indexing for high-converting keywords, reduces dashboard bundle lag, and increases local query speeds.
                  </p>
                  <button
                    id="run-optimization-btn"
                    onClick={() => triggerAction("optimize", "Performance Optimization")}
                    disabled={activeAction !== null}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    {activeAction === "optimize" ? "Optimizing..." : "Boost Funnel Performance"}
                  </button>
                </div>

                {/* Button 3 */}
                <div className="border border-slate-150 p-4 rounded-xl space-y-2 hover:border-slate-200 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">Sync 2026 Industry Benchmarks</span>
                    <span className="text-[9px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Live Fetch</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Contacts market intelligence services (such as aitoolverify) to synchronize typical CPC, CTR, and lead attribution ratios.
                  </p>
                  <button
                    id="run-benchmark-sync-btn"
                    onClick={() => triggerAction("syncBenchmarks", "Sync Industry Benchmarks")}
                    disabled={activeAction !== null}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    {activeAction === "syncBenchmarks" ? "Synchronizing..." : "Sync Marketing Indices"}
                  </button>
                </div>

              </div>
            </div>

            {/* Right: Live Terminal */}
            <div className="lg:col-span-3 bg-slate-950 border border-slate-900 rounded-2xl p-6 flex flex-col justify-between" id="agent-terminal-card">
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
                  <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5">
                    <Terminal size={14} className="text-indigo-500 animate-pulse" /> AI Agent Console Output
                  </span>
                  <span className="text-[10px] font-mono text-emerald-500 bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded">
                    Live Console
                  </span>
                </div>

                {/* Simulated scrollable shell */}
                <div className="flex-1 bg-black/40 border border-slate-900 rounded-xl p-4 font-mono text-[11px] text-indigo-400 overflow-y-auto max-h-[340px] space-y-1.5 min-h-[300px]">
                  {terminalLogs.map((log, idx) => (
                    <div key={idx} className={
                      log.startsWith(">>>") ? "text-emerald-400 font-bold" :
                      log.startsWith("[SYSTEM BOOT]") ? "text-white" :
                      log.includes("[ERROR]") ? "text-red-400 font-bold" : "text-indigo-300"
                    }>
                      {log}
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Live Benchmark Table widget */}
              <div className="mt-6 border-t border-slate-900 pt-4" id="live-benchmarks-widget">
                <h4 className="text-xs font-bold text-slate-400 font-mono flex items-center gap-1.5 mb-2.5">
                  <Award size={13} className="text-indigo-500" /> Active Synchronized Industry Benchmarks
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono text-slate-400">
                  <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-900/30">
                    <span className="text-[10px] block text-slate-500">Typical CPC</span>
                    <span className="text-xs font-bold text-indigo-400 block mt-1">${status.industryBenchmarks.averageCpc}</span>
                  </div>
                  <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-900/30">
                    <span className="text-[10px] block text-slate-500">Typical CTR</span>
                    <span className="text-xs font-bold text-purple-400 block mt-1">{status.industryBenchmarks.averageCtr}%</span>
                  </div>
                  <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-900/30">
                    <span className="text-[10px] block text-slate-500">Top Channel</span>
                    <span className="text-xs font-bold text-pink-400 block mt-1">{status.industryBenchmarks.topTrafficSource}</span>
                  </div>
                  <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-900/30">
                    <span className="text-[10px] block text-slate-500">Industry CAGR</span>
                    <span className="text-xs font-bold text-emerald-400 block mt-1">{status.industryBenchmarks.marketGrowthRate}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </>
      ) : (
        /* SPECIALIZED AI MAINTENANCE AGENT INTERACTIVE PLAYGROUND */
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-fadeIn" id="specialized-agent-workbench">
          
          {/* Left Panel: Configuration & Input templates */}
          <div className="lg:col-span-2 space-y-6" id="specialized-agent-controls">
            
            {/* Agent Info card */}
            <div className="bg-indigo-950 text-indigo-200 p-5 rounded-2xl border border-indigo-900/50 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Cpu className="text-indigo-400 animate-pulse" size={18} />
                <h2 className="text-xs font-black tracking-wider text-white uppercase">Maintenance Agent Registry</h2>
              </div>
              <p className="text-[11px] text-indigo-300 leading-relaxed">
                Configure, deploy, and execute systemic workflows utilizing Google Gemini's reasoning layers. Always explicit about system risk, impact matrices, and rollback considerations.
              </p>
              <div className="pt-2 border-t border-indigo-900 flex justify-between items-center text-[10px] font-mono">
                <span>Model: <strong className="text-white">gemini-1.5-pro</strong></span>
                <span>Temp: <strong className="text-white">0.25</strong></span>
              </div>
            </div>

            {/* Mode Selectors */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs space-y-3">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Select Active Agent Mode</label>
              <div className="grid grid-cols-2 gap-2">
                
                {[
                  { id: "health_check", label: "Health Check", desc: "Summarize status & risks" },
                  { id: "bug_clustering", label: "Bug Clustering", desc: "Isolate repetitive exceptions" },
                  { id: "release_plan", label: "Release Plan", desc: "Define rollout roadmap" },
                  { id: "release_notes", label: "Release Notes", desc: "Draft public changelog" }
                ].map((m) => (
                  <button
                    key={m.id}
                    id={`agent-mode-btn-${m.id}`}
                    onClick={() => setAgentMode(m.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      agentMode === m.id
                        ? "bg-indigo-50 border-indigo-500 text-indigo-900 shadow-3xs"
                        : "bg-white border-slate-150 hover:border-slate-200 text-slate-600"
                    }`}
                  >
                    <span className="text-xs font-bold block">{m.label}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5 leading-tight">{m.desc}</span>
                  </button>
                ))}

              </div>
            </div>

            {/* Input Data Workspace */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Workspace Logs & Data</label>
                  <span className="text-[9px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Pre-filled template</span>
                </div>
                <textarea
                  id="agent-workspace-logs-textarea"
                  rows={6}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste system logs, error dumps, features, or commits here..."
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-150 rounded-xl focus:outline-hidden focus:border-indigo-500 bg-slate-50/50 font-mono text-slate-700 leading-normal"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1.5">Rollback & Risk Policy constraints</label>
                <input
                  id="agent-risk-policy-input"
                  type="text"
                  value={riskMitigation}
                  onChange={(e) => setRiskMitigation(e.target.value)}
                  placeholder="e.g. Rollback release if latency exceeds 200ms"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-150 rounded-xl focus:outline-hidden focus:border-indigo-500 bg-slate-50/50 text-slate-700 font-semibold"
                />
              </div>

              <button
                id="execute-agent-analysis-btn"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !inputText}
                className="w-full py-3 bg-gold-500 hover:bg-gold-600 disabled:bg-slate-200 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Cpu size={14} className={isAnalyzing ? "animate-spin text-slate-950" : "text-slate-950 stroke-[2.5px]"} />
                {isAnalyzing ? "Processing Workspace Metrics..." : "Compile Agent Analysis"}
              </button>
            </div>

          </div>

          {/* Right Panel: Output report & markdown renderer */}
          <div className="lg:col-span-3 bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs flex flex-col justify-between" id="specialized-agent-output">
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-indigo-500 animate-pulse" />
                  Specialized Report: {agentMode.toUpperCase().replace("_", " ")}
                </span>

                {analysisResult && (
                  <button
                    id="copy-agent-report-btn"
                    onClick={handleCopyAnalysis}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-150 hover:bg-slate-100 text-[10px] font-bold text-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    {copied ? "Copied!" : "Copy Report"}
                  </button>
                )}
              </div>

              {/* Report display pane with customized renderer */}
              <div className="flex-1 bg-slate-50/50 border border-slate-150/60 rounded-2xl p-6 overflow-y-auto max-h-[520px] relative min-h-[380px]">
                
                {isAnalyzing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs gap-3">
                    <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
                    <p className="text-[11px] font-sans font-bold text-indigo-700 animate-pulse">
                      Maintenance Agent is reasoning over inputs...
                    </p>
                    <span className="text-[9px] font-mono text-slate-400 max-w-xs text-center leading-normal">
                      Applying system constraints & validating rollback guidelines under temperature 0.25.
                    </span>
                  </div>
                )}

                {analysisResult ? (
                  <div className="space-y-3 font-sans text-xs text-slate-800">
                    {renderMarkdown(analysisResult)}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-24 space-y-3">
                    <Terminal size={28} className="text-slate-300 animate-pulse" />
                    <p className="font-bold text-slate-500 text-xs">AI Maintenance Agent Standby</p>
                    <p className="text-[11px] text-slate-400 max-w-md leading-relaxed">
                      Select a mode on the left (e.g. bug clustering or release planning), customize your system telemetry metrics input, and run compilation to generate a professional health & risk report.
                    </p>
                  </div>
                )}

              </div>
            </div>

            <div className="border-t border-slate-50 pt-4 mt-4 text-[10px] text-slate-400 flex items-center justify-between font-mono">
              <span>Policy Status: SECURE</span>
              <span className="flex items-center gap-1 text-[10px]">
                <ShieldCheck size={12} className="text-emerald-500" /> AES-256 System Integrity Verified
              </span>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

// Inline Markdown formatter designed to style the Maintenance Agent output beautifully
const renderMarkdown = (text: string) => {
  const lines = text.split("\n");
  let inCodeBlock = false;
  let codeLines: string[] = [];
  const renderedElements: React.ReactNode[] = [];

  lines.forEach((line, idx) => {
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        inCodeBlock = false;
        const rawCode = codeLines.join("\n");
        codeLines = [];
        renderedElements.push(
          <pre key={`code-${idx}`} className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[10px] overflow-x-auto my-3 border border-slate-800 leading-normal">
            <code>{rawCode}</code>
          </pre>
        );
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      return;
    }

    // Headers
    if (line.startsWith("### ")) {
      renderedElements.push(
        <h3 key={idx} className="text-xs font-black text-slate-900 mt-5 mb-2 uppercase tracking-wide flex items-center gap-1.5">
          {line.replace("### ", "")}
        </h3>
      );
      return;
    }
    if (line.startsWith("## ")) {
      renderedElements.push(
        <h2 key={idx} className="text-sm font-black text-indigo-700 mt-6 mb-2 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
          {line.replace("## ", "")}
        </h2>
      );
      return;
    }
    if (line.startsWith("# ")) {
      renderedElements.push(
        <h1 key={idx} className="text-base font-black text-slate-900 mt-6 mb-3">
          {line.replace("# ", "")}
        </h1>
      );
      return;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      renderedElements.push(
        <blockquote key={idx} className="border-l-4 border-indigo-500 bg-indigo-50/40 px-4 py-2.5 rounded-r-xl text-slate-600 italic my-3 text-[11px] leading-relaxed">
          {line.replace("> ", "")}
        </blockquote>
      );
      return;
    }

    // Bullet points
    if (line.startsWith("* ") || line.startsWith("- ")) {
      const cleanLine = line.substring(2);
      renderedElements.push(
        <ul key={idx} className="list-disc pl-5 space-y-1 my-1">
          <li className="text-slate-700 leading-relaxed text-xs">
            {parseInlineStyles(cleanLine)}
          </li>
        </ul>
      );
      return;
    }

    // Divider line
    if (line.trim() === "---") {
      renderedElements.push(<hr key={idx} className="border-slate-150 my-4" />);
      return;
    }

    // Standard paragraph
    if (line.trim() === "") {
      renderedElements.push(<div key={idx} className="h-2.5" />);
      return;
    }

    renderedElements.push(
      <p key={idx} className="text-slate-600 leading-relaxed text-xs my-1">
        {parseInlineStyles(line)}
      </p>
    );
  });

  return renderedElements;
};

const parseInlineStyles = (line: string) => {
  const parts = line.split("**");
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="font-extrabold text-slate-900">{part}</strong>;
    }
    const subParts = part.split("`");
    return subParts.map((subPart, j) => {
      if (j % 2 === 1) {
        return <code key={j} className="bg-slate-100 text-pink-600 px-1 py-0.5 rounded font-mono text-[10px]">{subPart}</code>;
      }
      return subPart;
    });
  });
};
