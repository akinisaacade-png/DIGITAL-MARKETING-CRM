import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Users, 
  Share2, 
  Mail, 
  Bot, 
  Sliders, 
  Settings, 
  Cpu, 
  Layers, 
  Menu, 
  X,
  Sparkles,
  HelpCircle,
  Search
} from "lucide-react";

import { Lead, Campaign, Activity, EmailSequence, MaintenanceStatus } from "./types";
import DashboardView from "./components/DashboardView";
import LeadsView from "./components/LeadsView";
import CampaignsView from "./components/CampaignsView";
import SequencerView from "./components/SequencerView";
import CopywriterView from "./components/CopywriterView";
import ChatbotView from "./components/ChatbotView";
import MaintenanceView from "./components/MaintenanceView";
import SettingsView from "./components/SettingsView";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");

  // Core database state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [maintenanceStatus, setMaintenanceStatus] = useState<MaintenanceStatus>({
    lastRun: "2 hours ago",
    health: "Healthy",
    totalFixes: 34,
    activeOptimization: "Idle",
    benchmarkSyncTime: "2026-06-24",
    industryBenchmarks: {
      averageCpc: 1.84,
      averageCtr: 2.15,
      topTrafficSource: "Google Ads",
      marketGrowthRate: "14.2%"
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data on mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        // Execute fetches in parallel
        const [leadsRes, campaignsRes, activitiesRes, sequencesRes, maintenanceRes] = await Promise.all([
          fetch("/api/leads"),
          fetch("/api/campaigns"),
          fetch("/api/activities"),
          fetch("/api/sequences"),
          fetch("/api/maintenance/status")
        ]);

        const leadsData = await leadsRes.json();
        const campaignsData = await campaignsRes.json();
        const activitiesData = await activitiesRes.json();
        const sequencesData = await sequencesRes.json();
        const maintenanceData = await maintenanceRes.json();

        if (leadsData.success) setLeads(leadsData.leads);
        if (campaignsData.success) setCampaigns(campaignsData.campaigns);
        if (activitiesData.success) setActivities(activitiesData.activities);
        if (sequencesData.success) setSequences(sequencesData.sequences);
        if (maintenanceData.success) setMaintenanceStatus(maintenanceData.status);

      } catch (err) {
        console.error("Error synchronizing with local database server:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Periodic background polling for live heat-score changes & campaign updates
  useEffect(() => {
    const pollUpdates = async () => {
      try {
        const [leadsRes, activitiesRes] = await Promise.all([
          fetch("/api/leads"),
          fetch("/api/activities")
        ]);
        const leadsData = await leadsRes.json();
        const activitiesData = await activitiesRes.json();
        if (leadsData.success) setLeads(leadsData.leads);
        if (activitiesData.success) setActivities(activitiesData.activities);
      } catch (err) {
        console.error("Error polling background updates:", err);
      }
    };

    const interval = setInterval(pollUpdates, 12000); // Poll every 12s for active visual updates
    return () => clearInterval(interval);
  }, []);

  // --- DATABASE MUTATION DISPATCHERS ---

  const handleAddLead = async (leadData: Partial<Lead>) => {
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadData)
      });
      const data = await response.json();
      if (data.success) {
        setLeads(data.leads);
        // Re-fetch activities to keep sync
        const actRes = await fetch("/api/activities");
        const actData = await actRes.json();
        if (actData.success) setActivities(actData.activities);
      }
    } catch (err) {
      console.error("Failed to append lead to database:", err);
    }
  };

  const handleUpdateLeadStage = async (id: string, stage: Lead["stage"], assignedAgent?: string) => {
    try {
      const body: any = { stage };
      if (assignedAgent !== undefined) {
        body.assignedAgent = assignedAgent;
        body.assignedTo = assignedAgent;
      }
      const response = await fetch(`/api/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (data.success) {
        setLeads(data.leads);
        // Refresh activities log
        const actRes = await fetch("/api/activities");
        const actData = await actRes.json();
        if (actData.success) setActivities(actData.activities);
      }
    } catch (err) {
      console.error("Failed to update pipeline stage:", err);
    }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: "DELETE"
      });
      const data = await response.json();
      if (data.success) {
        setLeads(data.leads);
        // Refresh activities log
        const actRes = await fetch("/api/activities");
        const actData = await actRes.json();
        if (actData.success) setActivities(actData.activities);
      }
    } catch (err) {
      console.error("Failed to delete lead records:", err);
    }
  };

  const handleAddActivity = async (type: "lead" | "email" | "deal" | "task" | "system", message: string) => {
    try {
      const response = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message })
      });
      const data = await response.json();
      if (data.success) {
        setActivities(data.activities);
      }
    } catch (err) {
      console.error("Failed to add activity record:", err);
    }
  };

  const handleBulkUpdateStage = async (ids: string[], stage: Lead["stage"]) => {
    try {
      const response = await fetch("/api/leads/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, stage })
      });
      const data = await response.json();
      if (data.success) {
        setLeads(data.leads);
        const actRes = await fetch("/api/activities");
        const actData = await actRes.json();
        if (actData.success) setActivities(actData.activities);
      }
    } catch (err) {
      console.error("Failed to bulk update stage:", err);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      const response = await fetch("/api/leads/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids })
      });
      const data = await response.json();
      if (data.success) {
        setLeads(data.leads);
        const actRes = await fetch("/api/activities");
        const actData = await actRes.json();
        if (actData.success) setActivities(actData.activities);
      }
    } catch (err) {
      console.error("Failed to bulk delete leads:", err);
    }
  };

  const handleToggleCampaign = async (platform: string) => {
    try {
      const response = await fetch("/api/campaigns/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform })
      });
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.campaigns);
        // Refresh activities
        const actRes = await fetch("/api/activities");
        const actData = await actRes.json();
        if (actData.success) setActivities(actData.activities);
      }
    } catch (err) {
      console.error("Failed to change campaign integration state:", err);
    }
  };

  const handleAddSequence = async (name: string, trigger: string, steps: any[]) => {
    try {
      const response = await fetch("/api/sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, trigger, steps })
      });
      const data = await response.json();
      if (data.success) {
        setSequences(data.sequences);
        // Refresh activities
        const actRes = await fetch("/api/activities");
        const actData = await actRes.json();
        if (actData.success) setActivities(actData.activities);
      }
    } catch (err) {
      console.error("Failed to register automated email sequence:", err);
    }
  };

  const handleRunAgentAction = async (action: "diagnose" | "optimize" | "syncBenchmarks") => {
    try {
      const response = await fetch("/api/maintenance/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const data = await response.json();
      if (data.success) {
        setMaintenanceStatus(data.status);
        if (data.activities) setActivities(data.activities);
        return data.logs || [];
      }
    } catch (err) {
      console.error("Maintenance action failed:", err);
    }
    return ["⚠️ Error: Connection failed during remote agent execution."];
  };

  const handleSyncAdData = async () => {
    // Simulates an API pull by triggering a benchmark sync
    await handleRunAgentAction("syncBenchmarks");
    const campRes = await fetch("/api/campaigns");
    const campData = await campRes.json();
    if (campData.success) setCampaigns(campData.campaigns);
  };

  // Automated Quick Capture simulation from frontend
  const handleTriggerMockCapture = () => {
    const firstNames = ["Liam", "Sophia", "Noah", "Emma", "Jackson", "Olivia", "Lucas", "Ava", "Henry", "Isabella"];
    const lastNames = ["Miller", "Davis", "Garcia", "Rodriguez", "Wilson", "Martinez", "Anderson", "Taylor", "Thomas", "Moore"];
    const companies = ["Apex Growth", "Pixel Studio", "Zenith Consultants", "Ecom Launchers", "Stripe Partners", "Glow Retail", "Tech Bloom"];
    const sources = ["Website", "Facebook", "Instagram", "Google Ads", "Referrals"];

    const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const company = companies[Math.floor(Math.random() * companies.length)];
    const email = `${name.toLowerCase().replace(" ", ".")}@${company.toLowerCase().replace(" ", "")}.com`;
    const source = sources[Math.floor(Math.random() * sources.length)];
    const value = Math.floor(Math.random() * 8000) + 1500;
    const score = Math.floor(Math.random() * 40) + 60; // 60 - 100

    handleAddLead({ name, company, email, source, value, score });
  };

  // Render view router
  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardView 
            leads={leads} 
            campaigns={campaigns} 
            activities={activities} 
            onNavigate={setActiveTab} 
            globalSearchQuery={globalSearchQuery}
            onClearGlobalSearch={() => setGlobalSearchQuery("")}
            maintenanceStatus={maintenanceStatus}
          />
        );
      case "leads":
        return (
          <LeadsView 
            leads={leads} 
            onAddLead={handleAddLead} 
            onUpdateLeadStage={handleUpdateLeadStage} 
            onDeleteLead={handleDeleteLead} 
            onBulkUpdateStage={handleBulkUpdateStage}
            onBulkDelete={handleBulkDelete}
            onTriggerMockCapture={handleTriggerMockCapture} 
            globalSearchQuery={globalSearchQuery}
            onAddActivity={handleAddActivity}
            activities={activities}
          />
        );
      case "marketing":
        return (
          <CampaignsView 
            campaigns={campaigns} 
            onToggleCampaign={handleToggleCampaign} 
            onSyncCampaigns={handleSyncAdData} 
            globalSearchQuery={globalSearchQuery}
            onAddActivity={handleAddActivity}
          />
        );
      case "automation":
        return (
          <SequencerView 
            sequences={sequences} 
            onAddSequence={handleAddSequence} 
            globalSearchQuery={globalSearchQuery}
          />
        );
      case "copywriter":
        return <CopywriterView />;
      case "chatbot":
        return <ChatbotView leads={leads} />;
      case "maintenance":
        return <MaintenanceView status={maintenanceStatus} onRunAgentAction={handleRunAgentAction} />;
      case "settings":
        return <SettingsView />;
      default:
        return (
          <DashboardView 
            leads={leads} 
            campaigns={campaigns} 
            activities={activities} 
            onNavigate={setActiveTab} 
            globalSearchQuery={globalSearchQuery}
            onClearGlobalSearch={() => setGlobalSearchQuery("")}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans" id="applet-main-canvas">
      
      {/* Mobile Header bar */}
      <header className="md:hidden bg-slate-950 text-white flex items-center justify-between px-4 py-3 border-b border-slate-900 z-10" id="mobile-header-bar">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center shadow-md">
            <div className="w-4 h-4 bg-indigo-950 rounded-sm rotate-45"></div>
          </div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-white">DIGITAL MARKETING CRM™</span>
        </div>
        <button 
          id="mobile-drawer-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* LEFT SIDEBAR PANEL */}
      <aside 
        id="applet-sidebar"
        className={`bg-slate-950 text-slate-300 w-64 shrink-0 flex flex-col justify-between border-r border-slate-900 md:static fixed inset-y-0 left-0 z-40 transition-transform duration-300 md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div>
          <div className="p-6 flex items-center justify-between border-b border-slate-900">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center shadow-md">
                <div className="w-4 h-4 bg-indigo-950 rounded-sm rotate-45"></div>
              </div>
              <div>
                <h2 className="text-xs font-black tracking-wider text-white uppercase leading-none">MARKETING CRM™</h2>
                <span className="text-[9px] text-gold-500 font-bold font-mono tracking-wider block mt-1 uppercase">Powered by AI</span>
              </div>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-slate-500 hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5" id="sidebar-navigation">
            {[
              { id: "dashboard", label: "Dashboard Overview", icon: <LayoutDashboard size={14} /> },
              { id: "leads", label: "Leads & Contacts CRM", icon: <Users size={14} /> },
              { id: "marketing", label: "Platform Integrations", icon: <Share2 size={14} /> },
              { id: "automation", label: "Email Sequences", icon: <Mail size={14} /> },
              { id: "copywriter", label: "AI Copy & Video Storyboard", icon: <Sparkles size={14} /> },
              { id: "chatbot", label: "AI CMO Assistant", icon: <Bot size={14} /> },
              { id: "maintenance", label: "Maintenance & Agent Logs", icon: <Cpu size={14} /> },
              { id: "settings", label: "CRM Settings & Rules", icon: <Settings size={14} /> },
            ].map((item) => (
              <button
                key={item.id}
                id={`sidebar-nav-item-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all text-left cursor-pointer border-l-4 ${
                  activeTab === item.id 
                    ? "bg-indigo-600 text-white border-gold-500 shadow-lg shadow-indigo-950/50" 
                    : "text-slate-400 hover:bg-slate-900 hover:text-white border-transparent"
                }`}
              >
                <span className={activeTab === item.id ? "text-gold-500" : ""}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer info block */}
        <div className="p-6 border-t border-slate-900 space-y-4" id="sidebar-footer-info">
          <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-900 flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-gold-500 animate-pulse" />
            <div className="text-[10px]">
              <span className="font-bold text-white block">Connected API Agent</span>
              <span className="text-slate-400 block font-mono">Status: Vigilant</span>
            </div>
          </div>
          <div className="text-[9px] text-slate-500 font-mono text-center">
            DIGITAL MARKETING CRM v1.4.2
          </div>
        </div>

      </aside>

      {/* Main content display viewport */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative" id="main-content-viewport">
        {isLoading ? (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center gap-4 z-30">
            <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
            <p className="text-xs font-semibold text-slate-500 animate-pulse">Initializing DIGITAL MARKETING CRM Full-Stack Database Context...</p>
          </div>
        ) : null}

        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Global Search Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-3xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="global-search-header-container">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative w-full">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Search size={16} />
                </span>
                <input
                  id="global-crm-search-input"
                  type="text"
                  placeholder="Global search: Type lead name, company, email, campaign platform, or sequence trigger..."
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-hidden focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all font-sans text-slate-800"
                />
                {globalSearchQuery && (
                  <button
                    onClick={() => setGlobalSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-500 font-medium">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              <span>Current Space: </span>
              <strong className="text-slate-700 uppercase bg-slate-100 px-2.5 py-1 rounded-lg text-[10px] tracking-wider border border-slate-200/50">{activeTab}</strong>
            </div>
          </div>

          {/* Real-time Filtered Results Summary overlay */}
          {globalSearchQuery && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-5 space-y-4 animate-slideDown z-20 relative" id="global-search-results">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <span className="text-xs font-bold text-indigo-600 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-indigo-500 animate-pulse" />
                  Live Search Matches for "{globalSearchQuery}"
                </span>
                <button 
                  onClick={() => setGlobalSearchQuery("")}
                  className="text-[11px] text-slate-400 hover:text-slate-600 hover:underline transition-all font-semibold cursor-pointer"
                >
                  Dismiss Results
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                {/* Leads Segment */}
                <div className="space-y-3 md:border-r border-slate-100 pr-0 md:pr-4">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Leads CRM Matches</span>
                    <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-mono text-[10px]">
                      {leads.filter(l => 
                        l.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) || 
                        l.company.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                        l.email.toLowerCase().includes(globalSearchQuery.toLowerCase())
                      ).length}
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {leads
                      .filter(l => 
                        l.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) || 
                        l.company.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                        l.email.toLowerCase().includes(globalSearchQuery.toLowerCase())
                      )
                      .slice(0, 5)
                      .map(lead => (
                        <div 
                          key={lead.id} 
                          onClick={() => {
                            setActiveTab("leads");
                          }}
                          className="p-2.5 bg-slate-50 hover:bg-indigo-50/40 rounded-xl cursor-pointer transition-all border border-slate-100 hover:border-indigo-100 group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 block group-hover:text-indigo-600 transition-colors leading-tight">{lead.name}</span>
                            <span className="text-[9px] font-mono font-bold bg-slate-200/60 text-slate-600 px-1.5 py-0.5 rounded uppercase">{lead.stage}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 block leading-tight mt-1">{lead.company} • {lead.email}</span>
                        </div>
                      ))}
                    {leads.filter(l => 
                      l.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) || 
                      l.company.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                      l.email.toLowerCase().includes(globalSearchQuery.toLowerCase())
                    ).length === 0 && (
                      <p className="text-[11px] text-slate-400 italic py-2">No matching leads found</p>
                    )}
                  </div>
                </div>

                {/* Campaigns Segment */}
                <div className="space-y-3 md:border-r border-slate-100 pr-0 md:pr-4">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Campaign Matches</span>
                    <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-mono text-[10px]">
                      {campaigns.filter(c => c.platform.toLowerCase().includes(globalSearchQuery.toLowerCase())).length}
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {campaigns
                      .filter(c => c.platform.toLowerCase().includes(globalSearchQuery.toLowerCase()))
                      .slice(0, 5)
                      .map(camp => (
                        <div 
                          key={camp.platform} 
                          onClick={() => {
                            setActiveTab("marketing");
                          }}
                          className="p-2.5 bg-slate-50 hover:bg-purple-50/40 rounded-xl cursor-pointer transition-all border border-slate-100 hover:border-purple-100 group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 block group-hover:text-purple-600 transition-colors leading-tight">{camp.platform}</span>
                            <span className="text-[9px] font-mono font-bold bg-purple-100/50 text-purple-600 px-1.5 py-0.5 rounded uppercase">{camp.status}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 block leading-tight mt-1">Spend: ${camp.spent.toLocaleString()} • ROI: {camp.roi}x</span>
                        </div>
                      ))}
                    {campaigns.filter(c => c.platform.toLowerCase().includes(globalSearchQuery.toLowerCase())).length === 0 && (
                      <p className="text-[11px] text-slate-400 italic py-2">No matching campaigns found</p>
                    )}
                  </div>
                </div>

                {/* Sequences Segment */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Sequences Matches</span>
                    <span className="bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full font-mono text-[10px]">
                      {sequences.filter(s => 
                        s.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) || 
                        s.trigger.toLowerCase().includes(globalSearchQuery.toLowerCase())
                      ).length}
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {sequences
                      .filter(s => 
                        s.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) || 
                        s.trigger.toLowerCase().includes(globalSearchQuery.toLowerCase())
                      )
                      .slice(0, 5)
                      .map(seq => (
                        <div 
                          key={seq.id} 
                          onClick={() => {
                            setActiveTab("automation");
                          }}
                          className="p-2.5 bg-slate-50 hover:bg-pink-50/40 rounded-xl cursor-pointer transition-all border border-slate-100 hover:border-pink-100 group"
                        >
                          <span className="font-bold text-slate-800 block group-hover:text-pink-600 transition-colors leading-tight truncate">{seq.name}</span>
                          <span className="text-[10px] text-slate-500 block leading-tight mt-1">Trigger: {seq.trigger} • {seq.steps.length} emails</span>
                        </div>
                      ))}
                    {sequences.filter(s => 
                      s.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) || 
                      s.trigger.toLowerCase().includes(globalSearchQuery.toLowerCase())
                    ).length === 0 && (
                      <p className="text-[11px] text-slate-400 italic py-2">No matching sequences found</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-indigo-50/30 p-2.5 rounded-xl text-[10px] text-indigo-500 text-center font-medium border border-indigo-100/30">
                💡 Matches are filtered dynamically across views. Type keywords above and switch pages to view results.
              </div>
            </div>
          )}

          {renderActiveView()}
        </div>
      </main>

      {/* Backdrop overlay for mobile drawer */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          id="mobile-drawer-backdrop"
        />
      )}

    </div>
  );
}
