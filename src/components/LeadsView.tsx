import React, { useState } from "react";
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
  Flame
} from "lucide-react";
import { Lead } from "../types";

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
  onUpdateLeadStage: (id: string, stage: Lead["stage"]) => void;
  onDeleteLead: (id: string) => void;
  onBulkUpdateStage?: (ids: string[], stage: Lead["stage"]) => void;
  onBulkDelete?: (ids: string[]) => void;
  onTriggerMockCapture: () => void;
  globalSearchQuery?: string;
}

export default function LeadsView({ 
  leads, 
  onAddLead, 
  onUpdateLeadStage, 
  onDeleteLead, 
  onBulkUpdateStage,
  onBulkDelete,
  onTriggerMockCapture, 
  globalSearchQuery = "" 
}: LeadsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("All");
  const [selectedSource, setSelectedSource] = useState<string>("All");
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  
  // New lead form modal states
  const [showAddModal, setShowAddModal] = useState(false);
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

                    {/* Lead Info */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${lead.avatarColor || 'bg-indigo-500'} flex items-center justify-center text-white font-bold text-xs shadow-xs`}>
                          {lead.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 text-xs block">{lead.name}</span>
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
                      <div className="flex items-center gap-1.5" id={`lead-assignee-${lead.id}`}>
                        <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-indigo-600 flex items-center justify-center font-bold text-[9px] uppercase shrink-0">
                          {(lead.assignedTo || "Unassigned").charAt(0)}
                        </div>
                        <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[100px]" title={lead.assignedTo || "Unassigned"}>
                          {lead.assignedTo || "Unassigned"}
                        </span>
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

    </div>
  );
}
