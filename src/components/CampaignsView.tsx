import React, { useState } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Share2, 
  TrendingUp, 
  DollarSign, 
  Eye, 
  MousePointerClick, 
  Target, 
  Coins, 
  Link2, 
  Unlink,
  ExternalLink,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Bell,
  BellRing,
  AlertTriangle,
  X
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { Campaign } from "../types";

export const BUDGET_LIMITS: Record<string, number> = {
  "Facebook Ads": 5000,
  "Instagram Ads": 4000,
  "Google Ads": 8000,
  "LinkedIn Ads": 3000
};

interface CampaignsViewProps {
  campaigns: Campaign[];
  onToggleCampaign: (platform: string) => void;
  onSyncCampaigns: () => void;
  globalSearchQuery?: string;
  onAddActivity?: (type: "lead" | "email" | "deal" | "task" | "system", message: string) => void;
}

export default function CampaignsView({ campaigns, onToggleCampaign, onSyncCampaigns, globalSearchQuery = "", onAddActivity }: CampaignsViewProps) {
  const [budgetAlertEnabled, setBudgetAlertEnabled] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Record<string, boolean>>({});
  const [budgetMultipliers, setBudgetMultipliers] = useState<Record<string, number>>({
    "Facebook Ads": 1.0,
    "Instagram Ads": 1.0,
    "Google Ads": 1.0,
    "LinkedIn Ads": 1.0
  });

  const filteredCampaigns = campaigns.filter(camp => {
    if (!globalSearchQuery) return true;
    return camp.platform.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
           camp.status.toLowerCase().includes(globalSearchQuery.toLowerCase());
  });

  const handleAdjustBudget = (platform: string, change: number) => {
    const current = budgetMultipliers[platform] || 1.0;
    const newVal = Math.max(0.2, Number((current + change).toFixed(1)));
    setBudgetMultipliers({
      ...budgetMultipliers,
      [platform]: newVal
    });
  };

  const handleToggleBudgetAlert = () => {
    const nextState = !budgetAlertEnabled;
    setBudgetAlertEnabled(nextState);
    if (nextState) {
      setDismissedAlerts({});
      
      if (onAddActivity) {
        campaigns.forEach(camp => {
          if (camp.status === "Active") {
            const scaledSpent = getScaledMetric(camp.spent, camp.platform);
            const limit = BUDGET_LIMITS[camp.platform] || 5000;
            const percentage = (scaledSpent / limit) * 100;
            if (percentage >= 80) {
              onAddActivity("system", `🚨 BUDGET WARNING: Campaign on ${camp.platform} has reached ${percentage.toFixed(0)}% of monthly budget ($${scaledSpent.toLocaleString()} of $${limit.toLocaleString()}).`);
            }
          }
        });
      }
    }
  };

  const getScaledMetric = (baseVal: number, platform: string, isInt: boolean = true) => {
    const mult = budgetMultipliers[platform] || 1.0;
    const val = baseVal * mult;
    return isInt ? Math.floor(val) : Number(val.toFixed(1));
  };

  const getPlatformTrends = (platform: string, currentSpent: number) => {
    switch (platform) {
      case "Facebook Ads":
        return {
          roiChange: "+0.3x",
          roiPercent: "+12.5%",
          roiIsUp: true,
          spendChange: `+$${Math.floor(currentSpent * 0.041).toLocaleString()}`,
          spendPercent: "+4.1%",
          spendIsUp: true
        };
      case "Instagram Ads":
        return {
          roiChange: "+0.5x",
          roiPercent: "+16.7%",
          roiIsUp: true,
          spendChange: `+$${Math.floor(currentSpent * 0.082).toLocaleString()}`,
          spendPercent: "+8.2%",
          spendIsUp: true
        };
      case "Google Ads":
        return {
          roiChange: "-0.2x",
          roiPercent: "-4.8%",
          roiIsUp: false,
          spendChange: `+$${Math.floor(currentSpent * 0.015).toLocaleString()}`,
          spendPercent: "+1.5%",
          spendIsUp: true
        };
      case "LinkedIn Ads":
        return {
          roiChange: "+0.1x",
          roiPercent: "+3.2%",
          roiIsUp: true,
          spendChange: `-$${Math.floor(currentSpent * 0.054).toLocaleString()}`,
          spendPercent: "-5.4%",
          spendIsUp: false
        };
      default:
        return {
          roiChange: "+0.2x",
          roiPercent: "+5.0%",
          roiIsUp: true,
          spendChange: `+$${Math.floor(currentSpent * 0.03).toLocaleString()}`,
          spendPercent: "+3.0%",
          spendIsUp: true
        };
    }
  };

  const platformIcon = (platform: string) => {
    switch (platform) {
      case "Facebook Ads":
        return <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">F</div>;
      case "Instagram Ads":
        return <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-yellow-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">I</div>;
      case "Google Ads":
        return <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold text-xs">G</div>;
      case "LinkedIn Ads":
        return <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white font-bold text-xs">In</div>;
      default:
        return <div className="w-8 h-8 rounded-lg bg-gray-500 flex items-center justify-center text-white font-bold text-xs">Ad</div>;
    }
  };

  // Historical ROI Comparison data for Recharts (scaled by budget multipliers to be fully interactive!)
  const baseRoiHistory = [
    { name: "Jan", "Facebook Ads": 2.2, "Instagram Ads": 1.7, "Google Ads": 3.1, "LinkedIn Ads": 1.1 },
    { name: "Feb", "Facebook Ads": 2.4, "Instagram Ads": 2.0, "Google Ads": 3.0, "LinkedIn Ads": 1.4 },
    { name: "Mar", "Facebook Ads": 2.9, "Instagram Ads": 2.4, "Google Ads": 3.5, "LinkedIn Ads": 1.7 },
    { name: "Apr", "Facebook Ads": 3.1, "Instagram Ads": 2.8, "Google Ads": 3.7, "LinkedIn Ads": 1.9 },
    { name: "May", "Facebook Ads": 3.4, "Instagram Ads": 3.5, "Google Ads": 3.4, "LinkedIn Ads": 2.3 },
    { name: "Jun", "Facebook Ads": 3.6, "Instagram Ads": 3.9, "Google Ads": 3.3, "LinkedIn Ads": 2.2 }
  ];

  const scaledRoiHistory = baseRoiHistory.map(item => {
    return {
      name: item.name,
      "Facebook Ads": Number((item["Facebook Ads"] * (budgetMultipliers["Facebook Ads"] || 1.0)).toFixed(1)),
      "Instagram Ads": Number((item["Instagram Ads"] * (budgetMultipliers["Instagram Ads"] || 1.0)).toFixed(1)),
      "Google Ads": Number((item["Google Ads"] * (budgetMultipliers["Google Ads"] || 1.0)).toFixed(1)),
      "LinkedIn Ads": Number((item["LinkedIn Ads"] * (budgetMultipliers["LinkedIn Ads"] || 1.0)).toFixed(1))
    };
  });

  // Find which active campaigns are >= 80% of their limit
  const activeAlerts = campaigns
    .filter(camp => camp.status === "Active")
    .map(camp => {
      const scaledSpent = getScaledMetric(camp.spent, camp.platform);
      const limit = BUDGET_LIMITS[camp.platform] || 5000;
      const percentage = (scaledSpent / limit) * 100;
      return {
        platform: camp.platform,
        spent: scaledSpent,
        limit,
        percentage,
        isTriggered: percentage >= 80
      };
    })
    .filter(alert => alert.isTriggered && !dismissedAlerts[alert.platform]);

  return (
    <div className="space-y-6 animate-fadeIn" id="campaigns-integrations-view">
      
      {/* Dynamic Toast Notifications container */}
      {budgetAlertEnabled && activeAlerts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-auto animate-slideUp">
          {activeAlerts.map(alert => (
            <div 
              key={alert.platform}
              className="bg-slate-900 text-white rounded-xl shadow-2xl border border-rose-500/30 p-4 flex gap-3 relative overflow-hidden"
              id={`toast-budget-${alert.platform.toLowerCase().replace(' ', '-')}`}
            >
              {/* Left accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-505 bg-rose-500" />
              
              <div className="p-1 bg-rose-500/10 text-rose-400 rounded-lg h-fit">
                <AlertTriangle size={16} />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  Budget Warning: {alert.platform}
                </p>
                <p className="text-[11px] text-slate-300 mt-1 leading-normal">
                  Allocated spend limit is at <strong className="text-rose-400 font-bold">{alert.percentage.toFixed(0)}%</strong>. Spent <strong className="text-white font-mono font-bold">${alert.spent.toLocaleString()}</strong> of <strong className="text-slate-400 font-mono">${alert.limit.toLocaleString()}</strong>.
                </p>
                {/* Progress bar inside toast */}
                <div className="w-full bg-slate-800 rounded-full h-1 mt-2 overflow-hidden">
                  <div className="bg-rose-500 h-full" style={{ width: `${Math.min(100, alert.percentage)}%` }} />
                </div>
              </div>

              {/* Dismiss button */}
              <button
                onClick={() => setDismissedAlerts({ ...dismissedAlerts, [alert.platform]: true })}
                className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Dismiss warning"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Social Media Ad Integrations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Connect major social advertising APIs to monitor real-time spend, CTR, conversion attribution, and ROI metrics.
          </p>
        </div>
        <div>
          <button 
            id="sync-campaign-data-btn"
            onClick={onSyncCampaigns}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw size={13} className="text-indigo-500 animate-spin" />
            Pull Fresh Ad Analytics
          </button>
        </div>
      </div>

      {/* Budget Alert Toggle Switch Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4" id="budget-alert-banner">
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-xl ${budgetAlertEnabled ? 'bg-indigo-50 text-indigo-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
            {budgetAlertEnabled ? <BellRing size={18} /> : <Bell size={18} />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              Automated Budget Safeguard Monitoring
              {budgetAlertEnabled && (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Enable real-time tracking of platform spends. Triggers toast warnings and system logs when any campaign spend hits or exceeds <strong className="text-indigo-600 font-semibold">80% of its monthly limit</strong>.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400 font-mono font-medium mt-2">
              <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">Facebook Limit: $5,000</span>
              <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">Instagram Limit: $4,000</span>
              <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">Google Ads Limit: $8,000</span>
              <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">LinkedIn Limit: $3,000</span>
            </div>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
          <span className="text-xs font-bold text-slate-600">
            {budgetAlertEnabled ? "Monitoring Enabled" : "Monitoring Disabled"}
          </span>
          <button
            id="budget-alert-toggle-btn"
            onClick={handleToggleBudgetAlert}
            className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-300 focus:outline-hidden cursor-pointer flex items-center ${
              budgetAlertEnabled ? "bg-indigo-600" : "bg-slate-200"
            }`}
            title="Toggle Safeguard Alerts"
          >
            <div
              className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-300 ${
                budgetAlertEnabled ? "translate-x-5.5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Overview stats block for active accounts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="campaigns-roi-kpi">
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp size={18} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Connected Platforms</span>
              <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">
                {campaigns.filter(c => c.status !== "Disconnected").length} / {campaigns.length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
              <DollarSign size={18} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Scaled Ad Spend (This Month)</span>
              <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">
                ${campaigns
                  .filter(c => c.status === "Active")
                  .reduce((sum, c) => sum + getScaledMetric(c.spent, c.platform), 0)
                  .toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full" title="Spend trend compared to last week">
              <ArrowUpRight size={12} />
              +3.4%
            </span>
            <span className="text-[9px] text-slate-400 mt-1">vs last week</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Target size={18} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Average Campaign ROI</span>
              <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">
                {(campaigns.filter(c => c.status === "Active").reduce((acc, c) => acc + c.roi, 0) / 
                  (campaigns.filter(c => c.status === "Active").length || 1)).toFixed(1)}x
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full" title="ROI trend compared to last week">
              <ArrowUpRight size={12} />
              +0.2x
            </span>
            <span className="text-[9px] text-slate-400 mt-1">vs last week</span>
          </div>
        </div>
      </div>

      {/* Historical Campaign ROI Comparison (Recharts) */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs" id="campaigns-roi-comparison-chart-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100/50 pb-4 mb-6 gap-4">
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500 animate-pulse" />
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Historical ROI Comparison (Interactive)</h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Simulated real-time predictive ROI shifts across connected channels based on custom budget multipliers.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-600 block" /> Facebook</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-pink-500 block" /> Instagram</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-500 block" /> Google</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-700 block" /> LinkedIn</span>
          </div>
        </div>

        <div className="h-[280px] w-full" id="historical-roi-chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={scaledRoiHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorFb" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorInsta" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorGoogle" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorLinkedIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} 
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} 
                unit="x"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderRadius: '12px', 
                  border: 'none',
                  color: '#fff',
                  fontSize: '11px',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                }}
                itemStyle={{ color: '#fff' }}
                labelStyle={{ fontWeight: 'bold', color: '#38bdf8', marginBottom: '4px' }}
              />
              <Area 
                type="monotone" 
                dataKey="Facebook Ads" 
                stroke="#2563eb" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorFb)" 
              />
              <Area 
                type="monotone" 
                dataKey="Instagram Ads" 
                stroke="#ec4899" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorInsta)" 
              />
              <Area 
                type="monotone" 
                dataKey="Google Ads" 
                stroke="#ef4444" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorGoogle)" 
              />
              <Area 
                type="monotone" 
                dataKey="LinkedIn Ads" 
                stroke="#1d4ed8" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorLinkedIn)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {globalSearchQuery && (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 text-xs text-indigo-700 flex items-center justify-between font-medium" id="campaigns-global-filter-info">
          <span>Filtering integrations by keyword: "{globalSearchQuery}"</span>
          <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-mono">{filteredCampaigns.length} matches found</span>
        </div>
      )}

      {/* List of Connected / Connectable Ad Integrations */}
      <div className="space-y-6" id="platforms-grid-container">
        {filteredCampaigns.map((camp) => {
          const mult = budgetMultipliers[camp.platform] || 1.0;
          const isConnected = camp.status !== "Disconnected";
          const isActive = camp.status === "Active";
          const trends = getPlatformTrends(camp.platform, getScaledMetric(camp.spent, camp.platform));

          return (
            <div 
              key={camp.platform} 
              id={`platform-card-${camp.platform.toLowerCase().replace(' ', '-')}`}
              className={`bg-white border rounded-2xl shadow-2xs overflow-hidden transition-all ${
                isConnected ? "border-slate-100" : "border-slate-200 bg-slate-50/50 opacity-75"
              }`}
            >
              {/* Card Header */}
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-50 gap-4">
                <div className="flex items-center gap-3">
                  {platformIcon(camp.platform)}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{camp.platform}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        isActive ? "bg-emerald-500 animate-pulse" :
                        isConnected ? "bg-amber-500" : "bg-slate-400"
                      }`} />
                      <span className="text-[10px] font-semibold font-mono text-slate-500 capitalize">{camp.status}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isConnected && (
                    <button 
                      id={`toggle-status-${camp.platform.toLowerCase().replace(' ', '-')}`}
                      onClick={() => onToggleCampaign(camp.platform)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        isActive ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {isActive ? "Pause Campaign" : "Resume Campaign"}
                    </button>
                  )}

                  <button 
                    id={`connect-disconnect-${camp.platform.toLowerCase().replace(' ', '-')}`}
                    onClick={() => onToggleCampaign(camp.platform)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      isConnected 
                        ? "bg-white text-red-600 border-red-100 hover:bg-red-50" 
                        : "bg-gold-500 text-slate-950 border-gold-600 hover:bg-gold-600 hover:shadow-xs"
                    }`}
                  >
                    {isConnected ? <Unlink size={12} /> : <Link2 size={12} />}
                    {isConnected ? "Disconnect Integration" : "Establish Integration API"}
                  </button>
                </div>
              </div>

              {/* Card Body - Display performance metrics if connected */}
              {isConnected ? (
                <div className="p-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-y-4 gap-x-2">
                  
                  {/* Metric 1 */}
                  <div className="text-center sm:text-left sm:pr-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                      <Eye size={12} className="text-indigo-500" /> Impressions
                    </span>
                    <span className="text-lg font-bold text-slate-800 font-mono block mt-1.5">
                      {getScaledMetric(camp.impressions, camp.platform).toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Live impressions count</span>
                  </div>

                  {/* Metric 2 */}
                  <div className="text-center sm:text-left sm:px-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                      <MousePointerClick size={12} className="text-purple-500" /> Clicks
                    </span>
                    <span className="text-lg font-bold text-slate-800 font-mono block mt-1.5">
                      {getScaledMetric(camp.clicks, camp.platform).toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Ad traffic clickthroughs</span>
                  </div>

                  {/* Metric 3 */}
                  <div className="text-center sm:text-left sm:px-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                      <Target size={12} className="text-pink-500" /> Conversions
                    </span>
                    <span className="text-lg font-bold text-slate-800 font-mono block mt-1.5">
                      {getScaledMetric(camp.conversions, camp.platform).toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Attributed sales signups</span>
                  </div>

                  {/* Metric 4 */}
                  <div className="text-center sm:text-left sm:px-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                      <TrendingUp size={12} className="text-amber-500" /> CTR & ROI
                    </span>
                    <div className="flex items-baseline justify-center sm:justify-start gap-2 mt-1.5">
                      <span className="text-lg font-bold text-slate-800 font-mono">{camp.ctr}%</span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded font-mono">{camp.roi}x ROI</span>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-1 mt-1 text-[9px] font-bold">
                      <span className={`flex items-center gap-0.5 ${trends.roiIsUp ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'} px-1 rounded`}>
                        {trends.roiIsUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {trends.roiChange}
                      </span>
                      <span className="text-slate-400">vs last week</span>
                    </div>
                  </div>

                  {/* Metric 5 */}
                  <div className="text-center sm:text-left sm:px-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                      <DollarSign size={12} className="text-emerald-500" /> Ad Spent
                    </span>
                    <span className="text-lg font-bold text-slate-800 font-mono block mt-1.5">
                      ${getScaledMetric(camp.spent, camp.platform).toLocaleString()}
                    </span>
                    <div className="flex items-center justify-center sm:justify-start gap-1 mt-1 text-[9px] font-bold">
                      <span className={`flex items-center gap-0.5 ${trends.spendIsUp ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'} px-1 rounded`}>
                        {trends.spendIsUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {trends.spendPercent}
                      </span>
                      <span className="text-slate-400">vs last week</span>
                    </div>
                  </div>

                  {/* Budget Scaling adjuster */}
                  <div className="text-center sm:text-left sm:pl-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Scale Ad Budget</span>
                    <div className="flex items-center justify-between mt-1">
                      <button 
                        id={`scale-budget-down-${camp.platform.toLowerCase().replace(' ', '-')}`}
                        onClick={() => handleAdjustBudget(camp.platform, -0.2)}
                        className="w-6 h-6 rounded bg-white border border-slate-200 hover:bg-slate-100 text-xs font-extrabold flex items-center justify-center cursor-pointer"
                        title="Reduce budget scaling factor"
                      >
                        -
                      </button>
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {mult}x
                      </span>
                      <button 
                        id={`scale-budget-up-${camp.platform.toLowerCase().replace(' ', '-')}`}
                        onClick={() => handleAdjustBudget(camp.platform, 0.2)}
                        className="w-6 h-6 rounded bg-white border border-slate-200 hover:bg-slate-100 text-xs font-extrabold flex items-center justify-center cursor-pointer"
                        title="Boost budget scaling multiplier"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-[8px] text-slate-400 block text-center mt-1">Simulates real-time ad reach</span>
                  </div>

                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs">
                  <div className="max-w-md mx-auto py-2">
                    <p className="font-semibold text-slate-500">API connection inactive for {camp.platform}</p>
                    <p className="text-slate-400 mt-1">Establish API synchronization above to automatically extract campaign budgets, conversion ratios, and CPC metrics into your dashboard.</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Useful educational links section */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden" id="ad-campaigns-help-card">
        <div className="absolute right-0 top-0 opacity-15 translate-x-5 -translate-y-5">
          <Share2 size={120} />
        </div>
        <div className="max-w-xl">
          <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">Education & Benchmarks</span>
          <h3 className="text-base font-bold mt-1">Ad Multi-attribution Fundamentals</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Understanding lead flow begins with solid attribution models. Aligning parameters correctly across Google Search, Facebook Leads, and Instagram Forms will prevent duplicate scores and maintain accurate CAC metrics.
          </p>
          
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <a 
              href="https://www.hubspot.com/digital-marketing" 
              target="_blank" 
              rel="noreferrer" 
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Digital Marketing Basics <ExternalLink size={10} />
            </a>
            <span className="text-slate-600">•</span>
            <a 
              href="https://www.shopify.com/learn" 
              target="_blank" 
              rel="noreferrer" 
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              E-Commerce Optimization <ExternalLink size={10} />
            </a>
            <span className="text-slate-600">•</span>
            <a 
              href="https://clevertap.com/blog/ai-use-cases-in-e-commerce" 
              target="_blank" 
              rel="noreferrer" 
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              AI Marketing Use Cases <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}
