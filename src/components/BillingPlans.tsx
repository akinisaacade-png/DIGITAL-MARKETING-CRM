import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Zap, Sparkles, CheckCircle2, ShieldCheck, Copy, Check, Terminal } from "lucide-react";
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
  const [activeCodeTab, setActiveCodeTab] = useState<"python" | "nodejs" | "php">("python");
  const [copied, setCopied] = useState(false);

  const pythonCode = `import stripe
stripe.api_key = "your_secret_key_here"

def create_subscription_session(customer_email):
    session = stripe.checkout.Session.create(
        mode="subscription",
        customer_email=customer_email,
        payment_method_types=["card"], # Forces standard card entry, bypassing Link verification
        line_items=[
            {
                "price": "price_1234XYZ", # Replace with your Price ID
                "quantity": 1,
            },
        ],
        success_url="https://your-site.com/success",
        cancel_url="https://your-site.com/cancel",
    )
    return session.url`;

  const nodeCode = `const stripe = require('stripe')('your_secret_key_here');

async function createSubscriptionSession(customerEmail) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: customerEmail, // Optional: pre-fills email safely without triggering Link
    payment_method_types: ['card'], // CRITICAL: Only allow standard card inputs
    line_items: [
      {
        price: 'price_1234XYZ', // Replace with your monthly/annual subscription Price ID
        quantity: 1,
      },
    ],
    success_url: 'https://your-site.com/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://your-site.com/cancel',
  });

  return session.url;
}`;

  const phpCode = `require 'vendor/autoload.php';
$stripe = new \\Stripe\\StripeClient('your_secret_key_here');

$session = $stripe->checkout->sessions->create([
  'mode' => 'subscription',
  'customer_email' => 'customer@example.com',
  'payment_method_types' => ['card'], // Disables accelerated wallet/Link features
  'line_items' => [[
    'price' => 'price_1234XYZ',
    'quantity' => 1,
  ]],
  'success_url' => 'https://your-site.com/success',
  'cancel_url' => 'https://your-site.com/cancel',
]);

header("Location: " . $session->url);`;

  const handleCopyCode = () => {
    let codeToCopy = pythonCode;
    if (activeCodeTab === "nodejs") {
      codeToCopy = nodeCode;
    } else if (activeCodeTab === "php") {
      codeToCopy = phpCode;
    }
    navigator.clipboard.writeText(codeToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

      {/* Developer API Integration Section */}
      <div className="border-t border-slate-100 pt-5 mt-4 space-y-4" id="developer-stripe-sdk-section">
        <div className="bg-slate-900 rounded-xl p-5 text-white shadow-md border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-indigo-400" />
              <div>
                <h4 className="text-xs font-bold tracking-tight text-slate-100">Stripe Backend API Integration</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Connect your top-of-funnel marketing leads with secure checkout session flows.
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyCode}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg border border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
              title="Copy checkout session code snippet"
            >
              {copied ? (
                <>
                  <Check size={11} className="text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={11} />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Tab selectors */}
          <div className="flex gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveCodeTab("python")}
              className={`pb-1.5 px-1 text-[11px] font-bold border-b-2 transition-all cursor-pointer ${
                activeCodeTab === "python"
                  ? "border-indigo-400 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Python SDK
            </button>
            <button
              onClick={() => setActiveCodeTab("nodejs")}
              className={`pb-1.5 px-1 text-[11px] font-bold border-b-2 transition-all cursor-pointer ${
                activeCodeTab === "nodejs"
                  ? "border-indigo-400 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Node.js SDK
            </button>
            <button
              onClick={() => setActiveCodeTab("php")}
              className={`pb-1.5 px-1 text-[11px] font-bold border-b-2 transition-all cursor-pointer ${
                activeCodeTab === "php"
                  ? "border-indigo-400 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              PHP SDK
            </button>
          </div>

          {/* Code Viewer */}
          <div className="bg-slate-950 rounded-lg p-3.5 border border-slate-800/80 overflow-x-auto">
            <pre className="font-mono text-[10px] text-slate-300 leading-relaxed whitespace-pre">
              <code>
                {activeCodeTab === "python"
                  ? pythonCode
                  : activeCodeTab === "nodejs"
                  ? nodeCode
                  : phpCode}
              </code>
            </pre>
          </div>

          <div className="flex items-start gap-1.5 text-[9px] text-slate-400 leading-normal font-mono">
            <span className="text-indigo-400 shrink-0">ℹ️ Note:</span>
            <p>
              Setting <code className="text-slate-200">payment_method_types: ["card"]</code> is critical for direct checkout gates. It bypasses mobile browser Link login overlays, guaranteeing friction-free conversion loops for incoming marketing leads.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
