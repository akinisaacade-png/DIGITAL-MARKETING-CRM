import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Zap, Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";
import StripeDirectCheckout from "./StripeDirectCheckout";

// Initialize Stripe with the user's provided publishable key
const stripePromise = loadStripe("pk_live_Y8I4kIWBXPdQIfZ2tthPIFwV00DlqCjZva");

interface BillingPlansProps {
  userEmail?: string | null;
}

export default function BillingPlans({ userEmail }: BillingPlansProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuickPlan, setSelectedQuickPlan] = useState<"monthly" | "yearly">("monthly");

  const handleSubscribe = async (planType: "monthly" | "yearly") => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          customerEmail: userEmail || "customer@example.com", 
          planType 
        }),
      });

      const session = await response.json();
      
      if (session.url) {
        // Redirect directly to Stripe Hosted Checkout (or simulated checkout success)
        window.location.href = session.url;
      } else {
        setError("Failed to initiate checkout session. Check server configuration.");
      }
    } catch (err: any) {
      console.error("Payment Error:", err);
      setError(err.message || "An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6 space-y-6" id="stripe-billing-plans-section">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Zap size={16} className="text-indigo-600 animate-pulse" />
          Direct Stripe Billing Integration
        </h2>
        <p className="text-[11px] text-slate-500">
          Subscribe using your Stripe checkout gateway. Fully secured, compliant, and processed in real time.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-[11px] font-medium flex items-center gap-2 animate-bounce">
          <span>⚠️ {error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="stripe-plans-grid">
        {/* Monthly Plan Card */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-3xs hover:border-slate-200 transition-all flex flex-col justify-between" id="stripe-card-monthly">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Pro Option
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-700">Monthly Pro Plan</h3>
            <div className="my-3 flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-800">$39.99</span>
              <span className="text-[10px] text-slate-400 font-medium">/ month</span>
            </div>
            <p className="text-[10px] text-slate-400 mb-4">
              Unlock ultimate automation pipelines, instant AI copywriting templates, and live analytics.
            </p>
          </div>
          <button 
            disabled={loading} 
            onClick={() => handleSubscribe("monthly")}
            className="w-full py-2 bg-[#6772e5] hover:bg-[#5469d4] disabled:bg-slate-300 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            {loading ? "Processing..." : "Subscribe Monthly"}
          </button>
        </div>

        {/* Yearly Plan Card */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-3xs hover:border-slate-200 transition-all relative overflow-hidden flex flex-col justify-between" id="stripe-card-yearly">
          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-bl-lg">
            Save $80/yr!
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Elite Option
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-700">Yearly Elite Plan</h3>
            <div className="my-3 flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-800">$399.99</span>
              <span className="text-[10px] text-slate-400 font-medium">/ year</span>
            </div>
            <p className="text-[10px] text-slate-400 mb-4">
              Our maximum limits, highest-priority server instances, and dedicated API quotas.
            </p>
          </div>
          <button 
            disabled={loading} 
            onClick={() => handleSubscribe("yearly")}
            className="w-full py-2 bg-[#24b47e] hover:bg-[#1f9b6c] disabled:bg-slate-300 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            {loading ? "Processing..." : "Subscribe Yearly"}
          </button>
        </div>
      </div>

      {/* Stripe Secure Direct Checkout Section */}
      <div className="border-t border-slate-100 pt-5 mt-4 space-y-4" id="direct-checkout-quick-section">
        <div className="flex items-center justify-between bg-slate-100/50 p-4 rounded-xl border border-slate-200/50">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="text-[#6772e5]" size={14} />
              Stripe Direct Handoff Gateway
            </h4>
            <p className="text-[10px] text-slate-400">
              One-click instant payment processing without mobile browser restrictions.
            </p>
          </div>
          
          <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 text-[10px] font-bold">
            <button
              onClick={() => setSelectedQuickPlan("monthly")}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                selectedQuickPlan === "monthly"
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Monthly Pro
            </button>
            <button
              onClick={() => setSelectedQuickPlan("yearly")}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                selectedQuickPlan === "yearly"
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Yearly Elite
            </button>
          </div>
        </div>

        <StripeDirectCheckout
          currentPlanType={selectedQuickPlan}
          userEmail={userEmail || "customer@example.com"}
        />
      </div>
    </div>
  );
}
