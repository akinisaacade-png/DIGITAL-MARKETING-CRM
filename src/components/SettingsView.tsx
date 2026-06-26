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
  Database,
  X
} from "lucide-react";
import { AssignmentRule, Agent } from "../types";

export default function SettingsView() {
  const [rules, setRules] = useState<AssignmentRule[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAgentsLoading, setIsAgentsLoading] = useState(true);
  
  const [newRule, setNewRule] = useState({
    source: "Website",
    assigneeName: "",
    isActive: true
  });

  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentRole, setNewAgentRole] = useState("Sales Specialist");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

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
    fetchAgents();
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

  const fetchAgents = async () => {
    try {
      setIsAgentsLoading(true);
      const res = await fetch("/api/settings/agents");
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents);
        if (data.agents.length > 0) {
          setNewRule(prev => ({ ...prev, assigneeName: data.agents[0].name }));
        }
      }
    } catch (err) {
      console.error("Failed to load agents:", err);
    } finally {
      setIsAgentsLoading(false);
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
          assigneeName: agents.length > 0 ? agents[0].name : "",
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

  const handleAssignAgentToSource = async (agentName: string, source: string) => {
    const existingRule = rules.find(r => r.source.toLowerCase() === source.toLowerCase());
    try {
      let res;
      if (existingRule) {
        res = await fetch(`/api/settings/rules/${existingRule.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assigneeName: agentName, isActive: true })
        });
      } else {
        res = await fetch("/api/settings/rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source, assigneeName: agentName, isActive: true })
        });
      }
      const data = await res.json();
      if (data.success) {
        setRules(data.rules);
        triggerStatus(`Assigned ${agentName} to ${source} leads.`);
      }
    } catch (err) {
      console.error("Failed to assign agent to lead source rule:", err);
    }
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim() || !newAgentRole.trim()) return;

    try {
      const res = await fetch("/api/settings/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAgentName.trim(), role: newAgentRole.trim(), isActive: true })
      });
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents);
        setNewAgentName("");
        setNewAgentRole("Sales Specialist");
        // Update first assignee name in rules setup if it was empty
        if (!newRule.assigneeName && data.agents.length > 0) {
          setNewRule(prev => ({ ...prev, assigneeName: data.agents[0].name }));
        }
        triggerStatus(`Agent ${newAgentName.trim()} added successfully!`);
      }
    } catch (err) {
      console.error("Failed to add agent:", err);
    }
  };

  const handleDeleteAgent = async (id: string) => {
    try {
      const res = await fetch(`/api/settings/agents/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents);
        triggerStatus("Agent removed from active roster.");
      }
    } catch (err) {
      console.error("Failed to delete agent:", err);
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
                  {isAgentsLoading ? (
                    <option value="" disabled>Loading team members...</option>
                  ) : agents.length === 0 ? (
                    <option value="" disabled>No active agents. Please add one below.</option>
                  ) : (
                    agents.map(agent => (
                      <option key={agent.id} value={agent.name}>
                        {agent.name}
                      </option>
                    ))
                  )}
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

          {/* Assigned Agents Directory Section */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users size={16} className="text-indigo-500" />
                  Assigned Agents Directory
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Manage sales team members available for lead allocation rules.</p>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200/50 px-2.5 py-0.5 rounded-full self-start sm:self-center">
                {agents.length} agent{agents.length !== 1 ? "s" : ""} active
              </span>
            </div>

            {/* List of Agents */}
            {isAgentsLoading ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 rounded-full border-2 border-slate-100 border-t-indigo-600 animate-spin" />
                <span className="text-xs text-slate-400">Syncing sales agents roster...</span>
              </div>
            ) : agents.length === 0 ? (
              <div className="border border-dashed border-slate-100 rounded-2xl p-6 text-center text-slate-400 italic text-xs mb-4">
                No active sales agents registered. Please use the form below to add team members.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" id="settings-agents-list">
                {agents.map((agent) => {
                  const agentRules = rules.filter(r => r.assigneeName.toLowerCase() === agent.name.toLowerCase() && r.isActive);
                  return (
                    <div 
                      key={agent.id}
                      className="flex flex-col p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-slate-100/30 transition-all gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100/50 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase shadow-3xs shrink-0">
                            {agent.name.charAt(0)}
                          </div>
                          <div className="truncate">
                            <span className="text-xs font-bold text-slate-800 block leading-tight">{agent.name}</span>
                            <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">{agent.role}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteAgent(agent.id)}
                          className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition-all md:opacity-0 group-hover:opacity-100 cursor-pointer shrink-0"
                          title={`Remove ${agent.name} from roster`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Rule assignments list with add/remove actions */}
                      <div className="border-t border-slate-200/50 pt-2">
                        <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block mb-1">Lead Assignments</span>
                        
                        {agentRules.length === 0 ? (
                          <p className="text-[10px] text-slate-400 italic">No assigned rules</p>
                        ) : (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {agentRules.map(r => (
                              <span key={r.id} className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-150 text-indigo-700 font-extrabold text-[9px] px-2 py-0.5 rounded-full select-none">
                                {r.source}
                                <button 
                                  onClick={() => handleDeleteRule(r.id)}
                                  className="text-indigo-400 hover:text-indigo-950 transition-colors shrink-0 cursor-pointer animate-pulse"
                                  title={`Remove ${agent.name} from ${r.source} distribution`}
                                >
                                  <X size={10} className="stroke-[2.5px]" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Quick Add Distribution Rule Selection */}
                        <div className="mt-2">
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssignAgentToSource(agent.name, e.target.value);
                                e.target.value = ""; // reset
                              }
                            }}
                            defaultValue=""
                            className="w-full text-[10px] font-bold border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-500 cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-all outline-hidden"
                          >
                            <option value="" disabled>+ Add distribution rule...</option>
                            {leadSources.map(source => {
                              const isAssignedToThisAgent = agentRules.some(r => r.source.toLowerCase() === source.toLowerCase());
                              return (
                                <option key={source} value={source} disabled={isAssignedToThisAgent}>
                                  {source} {isAssignedToThisAgent ? "(Assigned)" : ""}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Agent Inline Form */}
            <form onSubmit={handleAddAgent} className="border-t border-slate-100 pt-5 mt-4">
              <h4 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider text-[10px]">Register New Agent</h4>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sales Specialist"
                    value={newAgentRole}
                    onChange={(e) => setNewAgentRole(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="sm:col-span-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Plus size={14} />
                  Add Agent
                </button>
              </div>
            </form>
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
