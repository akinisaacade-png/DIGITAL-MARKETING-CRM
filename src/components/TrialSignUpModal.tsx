import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Sparkles, AlertCircle, User, Mail, Lock, RefreshCw, X } from "lucide-react";

// Initialize Stripe with the provided live publishable key
const stripePromise = loadStripe("pk_live_Y8I4kIWBXPdQIfZ2tthPIFwV00DlqCjZva");

interface TrialSignUpModalProps {
  planType: "monthly" | "yearly";
  onClose?: () => void;
  onSuccess?: (url: string) => void;
}

export default function TrialSignUpModal({ planType, onClose, onSuccess }: TrialSignUpModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Basic Validation matching UI constraints
    if (formData.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register-and-subscribe", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          planType: planType // Must be strictly string: 'monthly' or 'yearly'
        }),
      });

      // Check if the server responded with a non-200 level status code
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status code ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.url) {
        if (onSuccess) {
          onSuccess(data.url);
        }
        // Direct redirect path to Stripe checkout gateway interface
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "The checkout creation payload failed.");
      }
    } catch (err: any) {
      // Dynamically prints the exact internal server stack break onto your UI
      setErrorMsg(`⚠️ Failed to initiate checkout session: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="trial-signup-modal-overlay">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-xl relative animate-scaleUp" id="trial-signup-modal-box">
        
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        )}

        <div className="text-center space-y-1.5 mb-5">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-2xs">
            <Sparkles size={18} className="animate-spin" style={{ animationDuration: "3s" }} />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Sign Up for Trial Plan</h2>
          <p className="text-[11px] text-slate-400">
            Sign up to instantly claim your {planType === "yearly" ? "Yearly Premium" : "Monthly Pro"} subscription.
          </p>
        </div>

        {/* Dynamic Alert Banner matching your UI */}
        <div className="p-3 bg-indigo-50 border border-indigo-100/80 rounded-xl text-indigo-700 text-[10px] font-medium leading-relaxed mb-4">
          <span>Please register or Sign In below to activate your {planType === "yearly" ? "Yearly Premium" : "Monthly Pro"} subscription.</span>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-[10px] text-rose-700 mb-4 animate-fadeIn">
            <AlertCircle size={13} className="shrink-0 mt-0.5 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">YOUR NAME</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <User size={13} />
              </span>
              <input
                type="text"
                name="name"
                value={formData.name}
                placeholder="e.g. John Doe"
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 text-slate-800"
                required
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">EMAIL ADDRESS</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Mail size={13} />
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                placeholder="john.doe@company.com"
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 text-slate-800"
                required
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">PASSWORD</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Lock size={13} />
              </span>
              <input
                type="password"
                name="password"
                value={formData.password}
                placeholder="Minimum 6 characters"
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 font-mono text-slate-800"
                required
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">CONFIRM PASSWORD</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              placeholder="Repeat password"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 font-mono text-slate-800"
              required
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-3xs"
          >
            {loading ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <span>Create Account & Start Free Trial</span>
            )}
          </button>
        </form>

        <div className="mt-4 border-t border-slate-100 pt-3 text-center">
          <p className="text-[10px] text-slate-400 font-medium">
            Already have an account?{" "}
            <a href="/signin" className="text-indigo-600 hover:underline font-bold" onClick={(e) => {
              if (onClose) {
                e.preventDefault();
                onClose();
              }
            }}>
              Sign In
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
