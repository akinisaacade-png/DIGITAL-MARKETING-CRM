import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Plus, 
  Trash2, 
  CheckCircle, 
  User, 
  HelpCircle, 
  Zap, 
  ToggleLeft, 
  ToggleRight, 
  Users,
  Shield,
  ArrowRight,
  Database
} from "lucide-react";
import { AssignmentRule } from "../types";

export default function SettingsView() {
  const [rules, setRules] = useState<AssignmentRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newRule, setNewRule] = useState({
    source: "Website",
    assigneeName: "Alex Mercer",
    isActive: true
  });
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Suggested team members
  const teamMembers = [
    "Alex Mercer",
    "Sarah Connor",
    "Marcus Wright",
    "Elena Rostova",
    "David Kim",
    "Chloe Frazier"
  ];

  // Common sources
  const leadSources = [
    "Website",
    "Facebook",
    "Instagram",
    "Google Ads",
    "Referrals",
    "LinkedIn"
  ];

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/settings/rules");
      const data = await res.json();
      if (data.success) {
        setRules(data.rules);
      }
    } catch (err) {
      console.error("Failed to load assignment rules:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.source || !newRule.assigneeName) return;

    try {
      const res = await fetch("/api/settings/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRule)
      });
      const data = await res.json();
      if (data.success) {
        setRules(data.rules);
        setNewRule({
          source: "Website",
          assigneeName: "Alex Mercer",
          isActive: true
        });
        triggerStatus("Rule created successfully!");
      }
    } catch (err) {
      console.error("Failed to add rule:", err);
    }
  };

  const handleToggleRule = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/settings/rules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        setRules(data.rules);
        triggerStatus(`Rule ${!currentStatus ? "enabled" : "disabled"}`);
      }
    } catch (err) {
      console.error("Failed to toggle rule:", err);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      const res = await fetch(`/api/settings/rules/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        setRules(data.rules);
        triggerStatus("Rule deleted successfully.");
      }
    } catch (err) {
      console.error("Failed to delete rule:", err);
    }
  };

  const triggerStatus = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="crm-settings-view">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="text-slate-700 animate-spin-slow" size={24} />
            CRM Settings & Automation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure system rules, automatic routing triggers, and customize lead allocations.
          </p>
        </div>
        
        {saveStatus && (
          <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 animate-slideDown shadow-xs">
            <CheckCircle size={14} className="text-emerald-500" />
            {saveStatus}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Rules Setup Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 text-slate-100/50">
              <Zap size={64} className="rotate-12" />
            </div>

            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1 z-10 relative">
              <Plus size={16} className="text-indigo-500" />
              Create Allocation Rule
            </h3>
            <p className="text-xs text-slate-400 mb-5 z-10 relative">
              Automatically match incoming leads to specific agents.
            </p>

            <form onSubmit={handleCreateRule} className="space-y-4 z-10 relative">
              
              {/* Source Field */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">When Lead Source is:</label>
                <select
                  id="rule-source-select"
                  value={newRule.source}
                  onChange={(e) => setNewRule({ ...newRule, source: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-white text-slate-700 outline-hidden focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer font-medium"
                >
                  {leadSources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>

              {/* Connector visualization line */}
              <div className="flex items-center justify-center py-1">
                <div className="h-8 w-0.5 bg-dashed border-l border-slate-200/80 relative">
                  <div className="absolute -left-1.5 top-2 bg-indigo-50 text-indigo-600 rounded-full p-0.5 border border-indigo-100/30">
                    <ArrowRight size={10} className="rotate-90" />
                  </div>
                </div>
              </div>

              {/* Assignee Field */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Assign Lead To:</label>
                <select
                  id="rule-assignee-select"
                  value={newRule.assigneeName}
                  onChange={(e) => setNewRule({ ...newRule, assigneeName: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-white text-slate-700 outline-hidden focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer font-medium"
                >
                  {teamMembers.map(member => (
                    <option key={member} value={member}>{member}</option>
                  ))}
                </select>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                <div className="text-[11px]">
                  <span className="font-bold text-slate-700 block">Deploy immediately</span>
                  <span className="text-slate-400 block leading-tight">Activate rule upon saving.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setNewRule({ ...newRule, isActive: !newRule.isActive })}
                  className="text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                >
                  {newRule.isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-slate-400" />}
                </button>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                id="save-rule-btn"
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-gold-500 hover:bg-gold-600 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-gold-500/10 transition-all cursor-pointer"
              >
                <CheckCircle size={14} className="text-slate-950 stroke-[2.5px]" />
                Save Routing Rule
              </button>
            </form>
          </div>

          {/* Allocation Tips Block */}
          <div className="bg-slate-900 text-slate-300 rounded-2xl p-5 space-y-3 shadow-xs border border-slate-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={14} className="text-indigo-400" />
              Routing Rules Guide
            </h4>
            <ul className="space-y-2 text-[11px] leading-relaxed text-slate-400 list-disc list-inside">
              <li>Rules trigger <strong>instantly</strong> when lead submits details.</li>
              <li>Only <strong>one active rule</strong> applies per attribution channel.</li>
              <li>Leads with no matching rules assign to <strong>Chloe Frazier</strong> (Default Intake).</li>
              <li>Historical pipeline leads are unaffected by modifications.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Rules List & Live Connection Diagram */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Database size={16} className="text-slate-500" />
                  Active Allocations Directory
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Rules evaluating incoming traffic channels.</p>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200/50 px-2.5 py-0.5 rounded-full">
                {rules.length} rule{rules.length !== 1 ? "s" : ""} registered
              </span>
            </div>

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-slate-100 border-t-indigo-600 animate-spin" />
                <span className="text-xs text-slate-400 font-medium animate-pulse">Syncing routing guidelines...</span>
              </div>
            ) : rules.length === 0 ? (
              <div className="border border-dashed border-slate-100 rounded-2xl p-12 text-center text-slate-400 italic text-xs">
                No routing rules found. Add one on the left to activate smart assignments.
              </div>
            ) : (
              <div className="space-y-3.5" id="settings-rules-list">
                {rules.map((rule) => (
                  <div 
                    key={rule.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 bg-slate-50/50 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all group"
                  >
                    {/* Routing logic layout */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1">
                      <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-3xs">
                        <span className="text-[9px] text-slate-400 uppercase font-black block tracking-wider leading-none">Traffic Source</span>
                        <span className="text-xs font-bold text-slate-800 block mt-1 font-mono">{rule.source}</span>
                      </div>

                      <div className="text-slate-400 flex items-center shrink-0">
                        <ArrowRight size={14} className="text-slate-300 animate-pulse" />
                      </div>

                      <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-3xs flex items-center gap-2.5 min-w-[140px]">
                        <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-100/50">
                          {rule.assigneeName.charAt(0)}
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-black block tracking-wider leading-none">Assigned Owner</span>
                          <span className="text-xs font-extrabold text-indigo-600 block mt-0.5">{rule.assigneeName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3 sm:border-l sm:border-slate-100 sm:pl-4">
                      {/* Active Toggle Switch */}
                      <button
                        onClick={() => handleToggleRule(rule.id, rule.isActive)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                        title={rule.isActive ? "Disable allocation rule" : "Enable allocation rule"}
                      >
                        {rule.isActive ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-bold font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">ACTIVE</span>
                            <ToggleRight size={24} className="text-indigo-600" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-bold font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">PAUSED</span>
                            <ToggleLeft size={24} className="text-slate-400" />
                          </div>
                        )}
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-slate-400 hover:text-red-500 p-1.5 rounded-xl hover:bg-white border border-transparent hover:border-slate-100 shadow-3xs sm:opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        title="Delete allocation rule"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Diagnostic overview flow block */}
          <div className="bg-gradient-to-br from-indigo-50/20 to-slate-50/40 border border-slate-100 rounded-2xl p-6 shadow-3xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={15} className="text-slate-500" />
              Allocations Status Health Matrix
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-100 rounded-xl p-3.5">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Evaluated Channels</span>
                <span className="text-base font-extrabold text-slate-800 block mt-1 font-mono">
                  {rules.filter(r => r.isActive).length} / 6
                </span>
                <p className="text-[10px] text-slate-400 mt-1">Matched campaigns automated.</p>
              </div>
              <div className="bg-white border border-slate-100 rounded-xl p-3.5">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Default Intake</span>
                <span className="text-base font-extrabold text-indigo-600 block mt-1">
                  Chloe Frazier
                </span>
                <p className="text-[10px] text-slate-400 mt-1">Intakes unmatched sources.</p>
              </div>
              <div className="bg-white border border-slate-100 rounded-xl p-3.5">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Trigger Performance</span>
                <span className="text-base font-extrabold text-emerald-600 block mt-1 font-mono">
                  &lt; 5ms
                </span>
                <p className="text-[10px] text-slate-400 mt-1">Database trigger latency.</p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
