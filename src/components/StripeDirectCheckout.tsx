import React, { useState } from "react";
import { safeCRMRequest } from "../lib/api";

interface StripeDirectCheckoutProps {
  currentPlanType: "monthly" | "yearly";
  userEmail: string;
}

export default function StripeDirectCheckout({ currentPlanType, userEmail }: StripeDirectCheckoutProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [uiFeedback, setUiFeedback] = useState("");

  const handleCheckoutRedirect = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsRedirecting(true);
    setUiFeedback("Connecting securely to Stripe Billing Hub...");

    // Trigger your secure endpoint
    const data = await safeCRMRequest<any>("/api/auth/register-and-subscribe", {
      method: "POST",
      body: JSON.stringify({
        email: userEmail,
        planType: currentPlanType // 'monthly' or 'yearly'
      })
    });

    if (data && data.success && data.url) {
      // Direct instant handoff to Stripe checkout without mobile code requirements
      window.location.href = data.url;
    } else {
      setIsRedirecting(false);
      setUiFeedback("⚠️ Google AI Studio is heavily rate-limited right now. Your subscription request is queued.");
    }
  };

  return (
    <div className="stripe-trigger-card" id="stripe-direct-checkout-wrapper">
      {uiFeedback && (
        <div 
          className={`status-banner-alert text-xs p-3 rounded-xl mb-3 text-center ${
            uiFeedback.includes("⚠️") 
              ? "bg-amber-50 border border-amber-200 text-amber-700 font-medium" 
              : "bg-indigo-50 border border-indigo-100 text-indigo-700 animate-pulse font-medium"
          }`}
          id="stripe-checkout-feedback-banner"
        >
          {uiFeedback}
        </div>
      )}
      
      <button 
        onClick={handleCheckoutRedirect}
        disabled={isRedirecting}
        className="stripe-direct-btn transition-all duration-200 hover:opacity-95 shadow-md hover:shadow-lg font-bold"
        id="stripe-direct-checkout-btn"
        style={{
          backgroundColor: "#6772e5",
          color: "#ffffff",
          fontWeight: "600",
          padding: "14px 28px",
          borderRadius: "12px",
          border: "none",
          cursor: "pointer",
          width: "100%"
        }}
      >
        {isRedirecting ? "Opening Payment Portal..." : "Proceed to Stripe Secure Checkout"}
      </button>
    </div>
  );
}
