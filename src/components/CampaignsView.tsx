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
  ArrowDownRight
} from "lucide-react";
import { Campaign } from "../types";

interface CampaignsViewProps {
  campaigns: Campaign[];
  onToggleCampaign: (platform: string) => void;
  onSyncCampaigns: () => void;
  globalSearchQuery?: string;
}

export default function CampaignsView({ campaigns, onToggleCampaign, onSyncCampaigns, globalSearchQuery = "" }: CampaignsViewProps) {
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

  return (
    <div className="space-y-6 animate-fadeIn" id="campaigns-integrations-view">
      
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
