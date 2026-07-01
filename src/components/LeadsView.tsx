import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  SlidersHorizontal, 
  Award, 
  Mail, 
  Building2, 
  UserPlus, 
  RefreshCcw,
  Sparkles,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  Flame,
  Download,
  Mic,
  MicOff,
  X,
  Volume2,
  Activity as ActivityIcon
} from "lucide-react";
import { Lead, Agent, Activity } from "../types";
import { safeCRMRequest } from "../lib/api";

// Dynamic SVG-based mini sparkline component for 30-day score history visualization
const LeadScoreSparkline = ({ score, id }: { score: number; id: string }) => {
  // Generate a deterministic sequence of 30-day historical scores based on id seed
  const seed = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const dataPoints: number[] = [];
  const totalDays = 6; // 6 points over 30 days
  for (let i = 0; i < totalDays; i++) {
    if (i === totalDays - 1) {
      dataPoints.push(score);
    } else {
      const variation = Math.sin(seed + i * 2) * 15 + (i - totalDays) * 3;
      const point = Math.max(15, Math.min(100, Math.round(score + variation)));
      dataPoints.push(point);
    }
  }

  // Map scores into SVG path coordinates
  const width = 70;
  const height = 18;
  const minVal = 0;
  const maxVal = 100;
  
  const pointsString = dataPoints
    .map((val, idx) => {
      const x = 2 + (idx / (totalDays - 1)) * (width - 4);
      const y = height - 2 - ((val - minVal) / (maxVal - minVal)) * (height - 4);
      return `${x},${y}`;
    })
    .join(" ");

  const areaPointsString = `${pointsString} ${width - 2},${height - 1} 2,${height - 1}`;
  const strokeColor = score >= 85 ? "#10b981" : score >= 60 ? "#6366f1" : "#f59e0b";
  const fillColor = score >= 85 ? "rgba(16, 185, 129, 0.08)" : score >= 60 ? "rgba(99, 102, 241, 0.08)" : "rgba(245, 158, 11, 0.08)";

  return (
    <div className="flex items-center gap-1.5 mt-1" title={`30-day score trend: ${dataPoints.join(" → ")}`}>
      <svg width={width} height={height} className="overflow-visible select-none shrink-0">
        <polygon points={areaPointsString} fill={fillColor} />
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.2"
          points={pointsString}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle 
          cx={width - 2} 
          cy={height - 2 - ((score - minVal) / (maxVal - minVal)) * (height - 4)} 
          r="2" 
          fill={strokeColor} 
        />
      </svg>
      <span className="text-[8px] font-mono font-bold text-slate-400">30d trend</span>
    </div>
  );
};

// Visual Urgency Badge helper component
const LeadUrgencyBadge = ({ score, createdTime, stage }: { score: number; createdTime: string; stage: string }) => {
  // If already closed, it's low urgency
  if (stage === "Won" || stage === "Lost") {
    return (
      <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/50 text-slate-500 font-bold px-2 py-0.5 rounded-lg text-[10px]">
        <CheckCircle size={10} className="text-slate-400" />
        Closed
      </span>
    );
  }

  const timeLower = createdTime.toLowerCase();
  const isVeryRecent = timeLower.includes("now") || timeLower.includes("min") || timeLower.includes("hour");
  const isRecent = timeLower.includes("1 day") || timeLower.includes("2 days");

  let urgency: "High" | "Medium" | "Low" = "Low";

  if (score >= 85 && (isVeryRecent || isRecent)) {
    urgency = "High";
  } else if (score >= 90 && !timeLower.includes("4 days")) {
    urgency = "High";
  } else if (score >= 75 && isVeryRecent) {
    urgency = "High";
  } else if (score >= 60 || isVeryRecent || isRecent) {
    urgency = "Medium";
  }

  if (urgency === "High") {
    return (
      <span className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200/40 text-rose-700 font-extrabold px-2.5 py-0.5 rounded-lg text-[10px] shadow-xs relative">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
        </span>
        <Flame size={10} className="text-rose-500 fill-rose-500/10" />
        High
      </span>
    );
  }

  if (urgency === "Medium") {
    return (
      <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200/40 text-amber-700 font-bold px-2 py-0.5 rounded-lg text-[10px]">
        <Clock size={10} className="text-amber-500" />
        Medium
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 bg-slate-100/70 border border-slate-200/30 text-slate-600 font-medium px-2 py-0.5 rounded-lg text-[10px]">
      <Clock size={10} className="text-slate-400" />
      Low
    </span>
  );
};

interface LeadsViewProps {
  leads: Lead[];
  onAddLead: (leadData: Partial<Lead>) => void;
  onUpdateLeadStage: (id: string, stage: Lead["stage"], assignedAgent?: string) => void;
  onDeleteLead: (id: string) => void;
  onBulkUpdateStage?: (ids: string[], stage: Lead["stage"]) => void;
  onBulkDelete?: (ids: string[]) => void;
  onTriggerMockCapture: () => void;
  globalSearchQuery?: string;
  onAddActivity?: (type: "lead" | "email" | "deal" | "task" | "system", message: string) => void;
  activities?: Activity[];
}

export default function LeadsView({ 
  leads, 
  onAddLead, 
  onUpdateLeadStage, 
  onDeleteLead, 
  onBulkUpdateStage,
  onBulkDelete,
  onTriggerMockCapture, 
  globalSearchQuery = "",
  onAddActivity,
  activities = []
}: LeadsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("All");
  const [selectedSource, setSelectedSource] = useState<string>("All");
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch("/api/settings/agents");
        const data = await res.json();
        if (data.success) {
          setAgents(data.agents);
        }
      } catch (err) {
        console.error("Failed to load agents in LeadsView:", err);
      }
    };
    fetchAgents();
  }, []);
  
  // New lead form modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<Lead | null>(null);

  // AI Lead Scoring state and triggers
  const [isScoringLead, setIsScoringLead] = useState<boolean>(false);
  const [scoringResult, setScoringResult] = useState<string>("");

  const handleStageChangeAndRecalculate = async (lead: Lead, newStage: Lead["stage"]) => {
    setIsScoringLead(true);
    setScoringResult("AI is evaluating lead stage conversion...");
    try {
      // First update the stage locally and on backend so we keep it fast
      onUpdateLeadStage(lead.id, newStage);
      setSelectedLeadForDetail({
        ...lead,
        stage: newStage
      });
      if (onAddActivity) {
        onAddActivity("lead", `🔄 Updated Lead ${lead.name} stage to ${newStage}`);
      }

      // Now query crm_lead_scoring_agent to recalculate score
      const data = await safeCRMRequest<any>("/api/gemini/orchestrate", {
        method: "POST",
        body: JSON.stringify({
          prompt: `Calculate a new numeric lead score between 1 and 100 for lead '${lead.name}' who has been updated to stage '${newStage}'. Source is '${lead.source}' and value is $${lead.value}. Return a JSON object containing exactly 'score' (number) and 'rationale' (string), e.g. {"score": 85, "rationale": "Explanation of score"}.`,
          mode: "lead"
        })
      });
      let calculatedScore = lead.score;
      let rationaleText = "";

      if (data && "success" in data && data.success && data.text) {
        const text = data.text;
        try {
          const jsonMatch = text.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (typeof parsed.score === "number") {
              calculatedScore = parsed.score;
              rationaleText = parsed.rationale || "";
            }
          }
        } catch (e) {
          console.warn("Could not parse JSON from scoring response, falling back to regex", e);
        }

        if (calculatedScore === lead.score) {
          const scoreMatch = text.match(/score["'\s:]+(\d+)/i) || text.match(/(\d+)\s*points/i) || text.match(/score\s*of\s*(\d+)/i);
          if (scoreMatch) {
            calculatedScore = parseInt(scoreMatch[1]);
          }
        }
      }

      // Ensure calculated score is valid 1-100
      if (isNaN(calculatedScore) || calculatedScore < 1 || calculatedScore > 100 || calculatedScore === lead.score) {
        let stageScore = 40;
        if (newStage === "Contacted") stageScore = 55;
        else if (newStage === "Qualified") stageScore = 75;
        else if (newStage === "Proposal") stageScore = 88;
        else if (newStage === "Won") stageScore = 100;
        else if (newStage === "Lost") stageScore = 15;

        let sourceBonus = 0;
        if (lead.source === "Referrals" || lead.source === "Referral") sourceBonus = 12;
        else if (lead.source === "Google Ads") sourceBonus = 8;
        else if (lead.source === "Website") sourceBonus = 5;
        else if (lead.source === "Facebook" || lead.source === "Facebook Ads") sourceBonus = 2;
        else if (lead.source === "Instagram" || lead.source === "Instagram Ads") sourceBonus = 1;

        const valueBonus = Math.min(15, Math.floor((lead.value || 0) / 1500));
        calculatedScore = Math.max(1, Math.min(100, stageScore + sourceBonus + valueBonus));
        rationaleText = `CRM Lead Scoring Agent automated recalculation for updated pipeline stage: ${newStage}.`;
      }

      const updateRes = await fetch(`/api/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage, score: calculatedScore })
      });
      const updateData = await updateRes.json();
      if (updateData.success) {
        setSelectedLeadForDetail({
          ...lead,
          stage: newStage,
          score: calculatedScore
        });
        if (onAddActivity) {
          onAddActivity("lead", `🎯 CRM Lead Scoring Agent updated ${lead.name}'s priority score to ${calculatedScore} based on transition to ${newStage}`);
        }
        setScoringResult(`AI Recalculated Score: ${calculatedScore}. ${rationaleText ? `Rationale: ${rationaleText}` : ""}`);
      }
    } catch (err) {
      console.error("Failed to automatically recalculate lead score:", err);
      setScoringResult("Failed to automatically trigger AI lead scoring recalculation.");
    } finally {
      setIsScoringLead(false);
      setTimeout(() => setScoringResult(""), 10000);
    }
  };
  
  // Web Speech Recognition state & handlers
  const [isListening, setIsListening] = useState(false);
  const [spokenNoteText, setSpokenNoteText] = useState("");
  const [recognitionError, setRecognitionError] = useState("");

  const startSpeechToText = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionError("Web Speech API is not supported in this browser. Please use Google Chrome or Safari.");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
        setRecognitionError("");
      };

      rec.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          }
        }
        if (finalTranscript) {
          setSpokenNoteText(prev => prev ? prev + " " + finalTranscript : finalTranscript);
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error:", e);
        if (e.error === "not-allowed") {
          setRecognitionError("Microphone access denied. Please allow microphone permission in browser settings.");
        } else {
          setRecognitionError("Failed to record audio notes: " + (e.error || "unknown error"));
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      (window as any)._activeRecognition = rec;
      rec.start();
    } catch (err: any) {
      console.error("Failed to start speech recognition:", err);
      setRecognitionError("Speech initiation error.");
      setIsListening(false);
    }
  };

  const stopSpeechToText = () => {
    if ((window as any)._activeRecognition) {
      try {
        (window as any)._activeRecognition.stop();
      } catch (err) {
        console.error("Error stopping recognition:", err);
      }
    }
    setIsListening(false);
  };

  const handleSaveSpokenNote = () => {
    if (!selectedLeadForDetail || !spokenNoteText.trim()) return;
    
    if (onAddActivity) {
      onAddActivity(
        "lead", 
        `🎙️ Voice note recorded for ${selectedLeadForDetail.name}: "${spokenNoteText.trim()}"`
      );
    }
    setSpokenNoteText("");
  };

  const [newLeadForm, setNewLeadForm] = useState({
    name: "",
    email: "",
    company: "",
    source: "Website",
    value: "5000",
    score: "85"
  });

  // Filter logic
  const filteredLeads = leads.filter(lead => {
    const search = globalSearchQuery || searchTerm;
    const matchesSearch = 
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.company.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      lead.source.toLowerCase().includes(search.toLowerCase());
    
    const matchesStage = selectedStage === "All" || lead.stage === selectedStage;
    const matchesSource = selectedSource === "All" || lead.source === selectedSource;

    return matchesSearch && matchesStage && matchesSource;
  });

  const handleExportCSV = () => {
    // 1. Define columns to export
    const headers = ["ID", "Name", "Email", "Company", "Source", "Pipeline Stage", "Value ($)", "Priority Score", "Assigned Agent", "Created At"];
    
    // 2. Map filtered leads into rows
    const rows = filteredLeads.map(lead => [
      lead.id,
      `"${lead.name.replace(/"/g, '""')}"`,
      `"${lead.email.replace(/"/g, '""')}"`,
      `"${lead.company.replace(/"/g, '""')}"`,
      lead.source,
      lead.stage,
      lead.value,
      lead.score,
      lead.assignedAgent || "Unassigned",
      lead.createdTime || "N/A"
    ]);

    // 3. Assemble CSV content with headers
    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    // 4. Create browser download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CRM_Leads_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmitNewLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.name || !newLeadForm.email) return;

    onAddLead({
      name: newLeadForm.name,
      email: newLeadForm.email,
      company: newLeadForm.company || "Self-Employed",
      source: newLeadForm.source,
      value: Number(newLeadForm.value) || 0,
      score: Number(newLeadForm.score) || 75
    });

    // Reset and close
    setNewLeadForm({
      name: "",
      email: "",
      company: "",
      source: "Website",
      value: "5000",
      score: "85"
    });
    setShowAddModal(false);
  };

  // Stage styles map
  const stageStyles: Record<Lead["stage"], { text: string; bg: string; border: string }> = {
    "New": { text: "text-pink-700", bg: "bg-pink-50", border: "border-pink-200" },
    "Contacted": { text: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
    "Qualified": { text: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200" },
    "Proposal": { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
    "Won": { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
    "Lost": { text: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200" }
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="leads-crm-container">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leads & Sales Pipeline CRM</h1>
          <p className="text-xs text-slate-500 mt-1">
            Capture, score, and transition prospects from initial contact to successful closure.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Mock automatic capture generator */}
          <button 
            id="simulate-lead-capture-btn"
            onClick={onTriggerMockCapture}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-all cursor-pointer"
            title="Generates a random realistic lead with multi-channel ad metrics attached."
          >
            <Sparkles size={13} className="text-indigo-600 animate-pulse" />
            Auto-Capture Simulate
          </button>

          <button 
            id="export-leads-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Download the currently filtered list of leads as a CSV spreadsheet."
          >
            <Download size={13} className="text-emerald-500" />
            Export Filtered CSV ({filteredLeads.length})
          </button>
          
          <button 
            id="register-lead-btn"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-gold-500 hover:bg-gold-600 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus size={14} className="text-slate-950 stroke-[3px]" />
            Create Manual Lead
          </button>
        </div>
      </div>

      {/* Stats Counter Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4" id="leads-mini-counters">
        {[
          { label: "Active Pipeline", count: leads.length, color: "text-slate-900", bg: "bg-slate-50" },
          { label: "New Prospects", count: leads.filter(l => l.stage === "New").length, color: "text-pink-600", bg: "bg-pink-50/50" },
          { label: "Contacted Leads", count: leads.filter(l => l.stage === "Contacted").length, color: "text-purple-600", bg: "bg-purple-50/50" },
          { label: "Qualified", count: leads.filter(l => l.stage === "Qualified").length, color: "text-indigo-600", bg: "bg-indigo-50/50" },
          { label: "Proposal Made", count: leads.filter(l => l.stage === "Proposal").length, color: "text-amber-600", bg: "bg-amber-50/50" },
          { label: "Deals Closed", count: leads.filter(l => l.stage === "Won").length, color: "text-emerald-600", bg: "bg-emerald-50/50" }
        ].map((item, idx) => (
          <div key={idx} className={`${item.bg} border border-slate-100/50 rounded-xl p-3 text-center shadow-xs`}>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">{item.label}</span>
            <span className={`text-xl font-bold mt-1 block ${item.color}`}>{item.count}</span>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar controls */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs" id="leads-crm-filters">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">
              <Search size={15} />
            </span>
            <input 
              id="lead-search-input"
              type="text"
              placeholder={globalSearchQuery ? `Filtered by global search: "${globalSearchQuery}"` : "Search leads by name, email, or company..."}
              value={globalSearchQuery || searchTerm}
              onChange={(e) => {
                if (!globalSearchQuery) {
                  setSearchTerm(e.target.value);
                }
              }}
              disabled={!!globalSearchQuery}
              className={`w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all ${
                globalSearchQuery ? "bg-indigo-50/40 text-indigo-700 border-indigo-200 font-semibold" : ""
              }`}
            />
            {globalSearchQuery && (
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-[9px] text-indigo-600 font-bold uppercase tracking-wider animate-pulse">
                Global Active
              </span>
            )}
          </div>

          {/* Stage Filter dropdown */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Filter size={13} />
              <span>Pipeline Stage:</span>
            </div>
            <select
              id="stage-filter-select"
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-hidden focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Stages</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Proposal">Proposal</option>
              <option value="Won">Closed Won</option>
              <option value="Lost">Lost</option>
            </select>

            {/* Source Filter dropdown */}
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <SlidersHorizontal size={13} />
              <span>Lead Source:</span>
            </div>
            <select
              id="source-filter-select"
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-hidden focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Sources</option>
              <option value="Website">Website</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Referrals">Referrals</option>
            </select>

            {/* Reset button */}
            {(searchTerm || selectedStage !== "All" || selectedSource !== "All") && (
              <button
                id="reset-filters-btn"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedStage("All");
                  setSelectedSource("All");
                }}
                className="text-xs text-red-600 hover:text-red-700 font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCcw size={12} />
                Reset Filters
              </button>
            )}
          </div>

        </div>
      </div>

      {selectedLeadIds.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-slideDown shadow-xs" id="bulk-actions-toolbar">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white rounded-lg px-2.5 py-1 text-xs font-black font-mono">
              {selectedLeadIds.length}
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-900 block">Leads Selected</span>
              <span className="text-[10px] text-indigo-500 block leading-none">Apply batch modifications to these records</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Stage Selector */}
            <div className="flex items-center gap-1.5 bg-white border border-indigo-200/50 rounded-lg px-2 py-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Set Stage:</span>
              <select
                id="bulk-stage-select"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value && onBulkUpdateStage) {
                    onBulkUpdateStage(selectedLeadIds, e.target.value as Lead["stage"]);
                    setSelectedLeadIds([]);
                    e.target.value = "";
                  }
                }}
                className="text-[11px] font-bold text-slate-700 bg-transparent outline-hidden cursor-pointer"
              >
                <option value="" disabled>Select...</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Proposal">Proposal</option>
                <option value="Won">Closed Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>

            {/* Bulk Delete */}
            <button
              id="bulk-delete-btn"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete these ${selectedLeadIds.length} leads?`) && onBulkDelete) {
                  onBulkDelete(selectedLeadIds);
                  setSelectedLeadIds([]);
                }
              }}
              className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 border border-rose-200/40 text-rose-600 hover:text-rose-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              Delete Selected
            </button>

            {/* Deselect All */}
            <button
              id="bulk-deselect-btn"
              onClick={() => setSelectedLeadIds([])}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-600 px-2 py-1.5 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* CRM Main Leads Table */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden" id="leads-crm-table-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                <th className="p-4 font-semibold w-10">
                  <input
                    type="checkbox"
                    id="select-all-leads-checkbox"
                    checked={filteredLeads.length > 0 && filteredLeads.every(l => selectedLeadIds.includes(l.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLeadIds(filteredLeads.map(l => l.id));
                      } else {
                        setSelectedLeadIds([]);
                      }
                    }}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                  />
                </th>
                <th className="p-4 font-semibold">Lead Info</th>
                <th className="p-4 font-semibold">Company</th>
                <th className="p-4 font-semibold">AI Lead Score</th>
                <th className="p-4 font-semibold">Urgency</th>
                <th className="p-4 font-semibold">Attribution Source</th>
                <th className="p-4 font-semibold">Pipeline Stage</th>
                <th className="p-4 font-semibold">Assignee</th>
                <th className="p-4 font-semibold">Deal Value</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100" id="crm-leads-table-body">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Mail size={24} className="text-slate-300" />
                      <p className="font-medium text-sm text-slate-500">No leads found matching current filter parameters.</p>
                      <p className="text-[11px] text-slate-400">Try adjusting your keyword searches or select "All Stages".</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* Checkbox */}
                    <td className="p-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.includes(lead.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeadIds([...selectedLeadIds, lead.id]);
                          } else {
                            setSelectedLeadIds(selectedLeadIds.filter(id => id !== lead.id));
                          }
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                      />
                    </td>

                    {/* Lead Info (Click to view details profile) */}
                    <td className="p-4 cursor-pointer group" onClick={() => setSelectedLeadForDetail(lead)}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${lead.avatarColor || 'bg-indigo-500'} flex items-center justify-center text-white font-bold text-xs shadow-xs group-hover:scale-105 transition-transform`}>
                          {lead.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 text-xs block group-hover:text-indigo-600 group-hover:underline transition-colors">{lead.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono block">{lead.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Company */}
                    <td className="p-4">
                      <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                        <Building2 size={13} className="text-slate-400" />
                        {lead.company}
                      </span>
                    </td>

                    {/* AI Lead Score */}
                    <td className="p-4">
                      <div className="flex flex-col gap-1 max-w-[130px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[60px] bg-slate-100 rounded-full h-1.5">
                            <div 
                              className={`h-full rounded-full ${
                                lead.score >= 85 ? "bg-emerald-500" :
                                lead.score >= 60 ? "bg-indigo-500" :
                                "bg-amber-500"
                              }`}
                              style={{ width: `${lead.score}%` }}
                            />
                          </div>
                          <span className={`font-mono font-bold text-[11px] flex items-center gap-0.5 ${
                            lead.score >= 85 ? "text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded" :
                            lead.score >= 60 ? "text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded" :
                            "text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded"
                          }`}>
                            <Award size={10} />
                            {lead.score}
                          </span>
                        </div>
                        <LeadScoreSparkline score={lead.score} id={lead.id} />
                      </div>
                    </td>

                    {/* Urgency Score */}
                    <td className="p-4">
                      <LeadUrgencyBadge score={lead.score} createdTime={lead.createdTime} stage={lead.stage} />
                    </td>

                    {/* Source */}
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded text-[10px]">
                        {lead.source}
                      </span>
                    </td>

                    {/* Pipeline Stage Dropdown */}
                    <td className="p-4">
                      <select
                        id={`update-stage-${lead.id}`}
                        value={lead.stage}
                        onChange={(e) => onUpdateLeadStage(lead.id, e.target.value as Lead["stage"])}
                        className={`text-[11px] font-bold border rounded-lg px-2 py-1 outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer ${stageStyles[lead.stage].bg} ${stageStyles[lead.stage].text} ${stageStyles[lead.stage].border}`}
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Proposal">Proposal</option>
                        <option value="Won">Closed Won</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </td>

                    {/* Owner / Assignee */}
                    <td className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2" id={`lead-assignee-${lead.id}`}>
                        {/* Visual Badge showing current assigned agent */}
                        {lead.assignedAgent && lead.assignedAgent !== "Unassigned" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-50 border border-indigo-200/60 text-indigo-700 shadow-3xs shrink-0 select-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            {lead.assignedAgent}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-400 shrink-0 select-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Unassigned
                          </span>
                        )}

                        {/* Quick-Assign Dropdown Selector */}
                        <select
                          id={`quick-assign-${lead.id}`}
                          value={lead.assignedAgent || lead.assignedTo || "Unassigned"}
                          onChange={(e) => {
                            const newAgentVal = e.target.value;
                            onUpdateLeadStage(lead.id, lead.stage, newAgentVal);
                          }}
                          className="text-[10px] font-semibold border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 cursor-pointer max-w-[120px] transition-all"
                          title="Assign to another sales agent"
                        >
                          <option value="Unassigned">Assign...</option>
                          {agents.map((agent) => (
                            <option key={agent.id} value={agent.name}>
                              {agent.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* Deal Value */}
                    <td className="p-4">
                      <span className="font-bold text-slate-800 font-mono">
                        ${lead.value.toLocaleString()}
                      </span>
                    </td>

                    {/* Quick actions delete */}
                    <td className="p-4 text-right">
                      <button 
                        id={`delete-lead-${lead.id}`}
                        onClick={() => onDeleteLead(lead.id)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-slate-100 transition-all cursor-pointer"
                        title="Remove Lead from pipeline"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info stats */}
        <div className="bg-slate-50 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 flex justify-between items-center">
          <span>Showing <strong>{filteredLeads.length}</strong> of <strong>{leads.length}</strong> records in CRM</span>
          <span className="flex items-center gap-1 text-[11px] font-mono">
            <Clock size={11} /> Real-time database synchronizing
          </span>
        </div>
      </div>

      {/* CREATE MANUAL LEAD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="add-lead-modal">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-md w-full p-6 relative">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserPlus size={18} className="text-indigo-600" />
              Register New Lead
            </h3>

            <form onSubmit={handleSubmitNewLead} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Prospect Name *</label>
                <input 
                  id="new-lead-name-input"
                  type="text"
                  required
                  placeholder="e.g. Johnathan Miller"
                  value={newLeadForm.name}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Company / Brand</label>
                  <input 
                    id="new-lead-company-input"
                    type="text"
                    placeholder="e.g. Acme Agency"
                    value={newLeadForm.company}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, company: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Email Address *</label>
                  <input 
                    id="new-lead-email-input"
                    type="email"
                    required
                    placeholder="e.g. j.miller@acme.com"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Attribution Source</label>
                  <select
                    id="new-lead-source-select"
                    value={newLeadForm.source}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, source: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white outline-hidden focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Website">Website</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="Referrals">Referrals</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Deal Value ($)</label>
                  <input 
                    id="new-lead-value-input"
                    type="number"
                    min="0"
                    placeholder="5000"
                    value={newLeadForm.value}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, value: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">AI Score (0-100)</label>
                  <input 
                    id="new-lead-score-input"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="85"
                    value={newLeadForm.score}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, score: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <CheckCircle size={13} className="text-slate-950 stroke-[3px]" />
                  Add to Active Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- LEAD DETAIL & PROFILE MODAL (WITH WEB SPEECH VOICE NOTE CAPABILITY) --- */}
      {selectedLeadForDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-100 flex flex-col overflow-hidden max-h-[90vh] animate-slideUp">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full ${selectedLeadForDetail.avatarColor || 'bg-indigo-500'} flex items-center justify-center text-white font-black text-lg shadow-sm`}>
                  {selectedLeadForDetail.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">{selectedLeadForDetail.name}</h2>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      selectedLeadForDetail.stage === 'Won' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      selectedLeadForDetail.stage === 'Lost' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                      selectedLeadForDetail.stage === 'Nurturing' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                      'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {selectedLeadForDetail.stage}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedLeadForDetail.email}</p>
                </div>
              </div>

              <button 
                onClick={() => {
                  stopSpeechToText();
                  setSelectedLeadForDetail(null);
                  setSpokenNoteText("");
                  setRecognitionError("");
                }}
                className="p-1.5 hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-5 gap-6">
              
              {/* Left Column: Metadata Details (2/5 span) */}
              <div className="md:col-span-2 space-y-5 border-r border-slate-100 pr-0 md:pr-6">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Core Pipeline Status</span>
                  
                  {/* Live Stage dropdown selector inside Detail view */}
                  <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <label className="text-[11px] text-slate-500 font-bold block mb-1">Pipeline Stage</label>
                      <select
                        value={selectedLeadForDetail.stage}
                        onChange={(e) => {
                          const newStage = e.target.value as Lead["stage"];
                          handleStageChangeAndRecalculate(selectedLeadForDetail, newStage);
                        }}
                        className="w-full text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                      >
                        <option value="Lead Captured">Lead Captured</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Demo Scheduled">Demo Scheduled</option>
                        <option value="Proposal Sent">Proposal Sent</option>
                        <option value="Nurturing">Nurturing</option>
                        <option value="Won">Won</option>
                        <option value="Lost">Lost</option>
                      </select>

                      {/* AI lead scoring loading/success status */}
                      {(isScoringLead || scoringResult) && (
                        <div className={`mt-2 p-2 rounded-lg text-[10px] flex items-start gap-1.5 leading-relaxed font-medium ${
                          isScoringLead ? "bg-amber-50 text-amber-800 border border-amber-100 animate-pulse" : "bg-emerald-50 text-emerald-800 border border-emerald-100"
                        }`}>
                          <Sparkles size={11} className={`mt-0.5 shrink-0 ${isScoringLead ? "text-amber-500 animate-spin" : "text-emerald-500"}`} />
                          <span>{isScoringLead ? "AI Score recalculating..." : scoringResult}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-500 font-bold block mb-1">Assigned Executive</label>
                      <select
                        value={selectedLeadForDetail.assignedTo || selectedLeadForDetail.assignedAgent || ""}
                        onChange={(e) => {
                          const newAgent = e.target.value;
                          onUpdateLeadStage(selectedLeadForDetail.id, selectedLeadForDetail.stage, newAgent);
                          setSelectedLeadForDetail({
                            ...selectedLeadForDetail,
                            assignedTo: newAgent,
                            assignedAgent: newAgent
                          });
                          if (onAddActivity) {
                            onAddActivity("lead", `👤 Reassigned Lead ${selectedLeadForDetail.name} to agent ${newAgent || 'Unassigned'}`);
                          }
                        }}
                        className="w-full text-xs bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                      >
                        <option value="">Unassigned</option>
                        {agents.map(ag => (
                          <option key={ag.id} value={ag.name}>{ag.name} ({ag.role})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Lead Profiling</span>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold block">Company Name</span>
                      <span className="text-xs font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                        <Building2 size={12} className="text-slate-400" />
                        {selectedLeadForDetail.company}
                      </span>
                    </div>

                    <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold block">Traffic Source</span>
                      <span className="text-xs font-bold text-indigo-700 mt-0.5">
                        {selectedLeadForDetail.source}
                      </span>
                    </div>

                    <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold block">Estimated Contract</span>
                      <span className="text-xs font-mono font-bold text-emerald-600 mt-0.5">
                        ${Number(selectedLeadForDetail.value || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold block">Priority Heat Score</span>
                      <span className="text-xs font-mono font-bold text-rose-600 mt-0.5 flex items-center gap-1">
                        <Flame size={12} className="text-rose-500 animate-pulse fill-rose-500/10" />
                        {selectedLeadForDetail.score} / 100
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold block mb-1">Lead Health Sparkline Trend</span>
                    <LeadScoreSparkline score={selectedLeadForDetail.score} id={selectedLeadForDetail.id} />
                  </div>

                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400 font-semibold">Acquisition Stage:</span>
                      <span className="text-slate-700 font-bold">Consideration</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400 font-semibold">Added On:</span>
                      <span className="text-slate-700 font-bold">{selectedLeadForDetail.createdTime || "Just now"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Interaction Hub, Speech to Text and Activity log (3/5 span) */}
              <div className="md:col-span-3 space-y-5 flex flex-col">
                
                {/* Voice Note Module */}
                <div className="bg-indigo-50/30 border border-indigo-100/50 rounded-xl p-4.5 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping" />
                      <h4 className="text-xs font-extrabold text-indigo-900 tracking-wider uppercase">Lead Spoken Notes Dictation</h4>
                    </div>
                    {isListening && (
                      <span className="text-[10px] bg-rose-600 text-white font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                        REC ON
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 leading-normal">
                    Dictate thoughts on this lead hands-free using your device's microphone. Your comments are compiled into structured log feed activities.
                  </p>

                  <div className="flex gap-2">
                    {/* Record Button */}
                    <button
                      type="button"
                      id="mic-record-notes-btn"
                      onClick={isListening ? stopSpeechToText : startSpeechToText}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-3xs flex items-center gap-2 cursor-pointer ${
                        isListening 
                          ? "bg-rose-500 hover:bg-rose-600 text-white animate-pulse" 
                          : "bg-indigo-600 hover:bg-indigo-700 text-white"
                      }`}
                    >
                      {isListening ? <MicOff size={14} className="animate-spin" /> : <Mic size={14} />}
                      {isListening ? "Stop Listening" : "Record Audio Note"}
                    </button>

                    {spokenNoteText.trim() && (
                      <button
                        type="button"
                        id="save-voice-note-btn"
                        onClick={handleSaveSpokenNote}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors shadow-3xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Volume2 size={14} />
                        Save Voice Note
                      </button>
                    )}
                  </div>

                  {recognitionError && (
                    <p className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-2 py-1 rounded border border-rose-100">
                      ⚠️ {recognitionError}
                    </p>
                  )}

                  {/* Transcript Preview Card */}
                  <div className="bg-white border border-indigo-100/30 rounded-lg p-3 min-h-[70px] relative">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider absolute top-2 right-3">Live Transcript</span>
                    {spokenNoteText ? (
                      <p className="text-xs text-slate-800 leading-relaxed font-medium pr-14 mt-1">
                        "{spokenNoteText}"
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic mt-1 pr-14">
                        {isListening ? "Listening... Speak clearly into your microphone." : "Microphone inactive. Click 'Record Audio Note' above to begin dictation."}
                      </p>
                    )}
                  </div>
                </div>

                {/* Filtered Lead Specific Timeline Feed */}
                <div className="flex-1 flex flex-col min-h-[220px]">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Lead Communication History</span>
                  
                  <div className="border border-slate-100 rounded-xl overflow-hidden flex-1 bg-slate-50/30 flex flex-col">
                    <div className="bg-slate-50 p-2.5 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                        <ActivityIcon size={11} className="text-indigo-500" />
                        Audit Trail Log ({activities.filter(act => act.message.toLowerCase().includes(selectedLeadForDetail.name.toLowerCase())).length})
                      </span>
                    </div>

                    <div className="p-3 overflow-y-auto space-y-2.5 max-h-[200px]">
                      {activities.filter(act => act.message.toLowerCase().includes(selectedLeadForDetail.name.toLowerCase())).length > 0 ? (
                        activities
                          .filter(act => act.message.toLowerCase().includes(selectedLeadForDetail.name.toLowerCase()))
                          .map((act) => (
                            <div key={act.id} className="bg-white border border-slate-100/50 p-2.5 rounded-lg shadow-4xs flex gap-2">
                              <div className={`p-1 rounded-md h-fit ${
                                act.type === "lead" ? "bg-indigo-50 text-indigo-600" :
                                act.type === "system" ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"
                              }`}>
                                <ActivityIcon size={12} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] text-slate-700 leading-relaxed font-medium">{act.message}</p>
                                <span className="text-[9px] font-mono text-slate-400 block mt-0.5">{act.timestamp}</span>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <ActivityIcon size={24} className="text-slate-300 stroke-[1.5]" />
                          <p className="text-xs text-slate-400 font-medium mt-1.5">No historic activity logs found for this lead.</p>
                          <p className="text-[10px] text-slate-400">Activities automatically register when status or voice notes are updated.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
