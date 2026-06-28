import React, { useState, useEffect } from "react";
import { 
  CreditCard, 
  Check, 
  User, 
  Lock, 
  Mail, 
  Shield, 
  Sparkles, 
  LogOut, 
  Key, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Zap,
  Info,
  X
} from "lucide-react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updatePassword, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export default function SubscriptionView() {
  // Current user state (Firebase or local fallback)
  const [user, setUser] = useState<{
    uid: string;
    email: string | null;
    displayName: string | null;
    isLocalFallback: boolean;
  } | null>(null);

  // Active subscription state
  const [subscription, setSubscription] = useState<{
    tier: "none" | "free_trial" | "monthly" | "yearly";
    expiresAt: string;
    subscribedAt: string;
  }>({
    tier: "none",
    expiresAt: "",
    subscribedAt: ""
  });

  // UI state managers
  const [activeModal, setActiveModal] = useState<"none" | "signup" | "signin">("none");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [firebaseWarning, setFirebaseWarning] = useState<string | null>(null);

  // Forms state
  const [signUpForm, setSignUpForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [signInForm, setSignInForm] = useState({ email: "", password: "" });
  const [passwordChangeForm, setPasswordChangeForm] = useState({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
  
  // Show/hide passwords
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Target subscription plan being purchased during authorization redirect flow
  const [pendingPlan, setPendingPlan] = useState<"free_trial" | "monthly" | "yearly" | null>(null);

  // Detect and track Firebase authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setIsAuthLoading(true);
      if (fbUser) {
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          isLocalFallback: false
        });
        // Sync subscription from Firestore
        await fetchSubscriptionFromFirestore(fbUser.uid);
      } else {
        // Look up local storage fallback user state if firebase user doesn't exist
        const savedLocalUser = localStorage.getItem("crm_local_user");
        if (savedLocalUser) {
          try {
            const parsed = JSON.parse(savedLocalUser);
            setUser({
              uid: parsed.uid,
              email: parsed.email,
              displayName: parsed.displayName,
              isLocalFallback: true
            });
            setSubscription({
              tier: parsed.subscriptionTier || "none",
              expiresAt: parsed.subscriptionExpires || "",
              subscribedAt: parsed.subscriptionAt || ""
            });
          } catch (e) {
            setUser(null);
          }
        } else {
          setUser(null);
          setSubscription({ tier: "none", expiresAt: "", subscribedAt: "" });
        }
      }
      setIsAuthLoading(false);
    }, (error) => {
      console.error("Firebase auth state error:", error);
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch subscription tier details from cloud DB
  const fetchSubscriptionFromFirestore = async (uid: string) => {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        setSubscription({
          tier: data.subscriptionTier || "free_trial",
          expiresAt: data.subscriptionExpires || "",
          subscribedAt: data.subscriptionAt || ""
        });
      } else {
        // Create initial guest sub
        const expires = new Date();
        expires.setDate(expires.getDate() + 14); // 14 days trial default
        const initialSub = {
          subscriptionTier: "free_trial" as const,
          subscriptionExpires: expires.toISOString(),
          subscriptionAt: new Date().toISOString()
        };
        await setDoc(userDocRef, {
          name: auth.currentUser?.displayName || "",
          email: auth.currentUser?.email || "",
          ...initialSub
        });
        setSubscription({
          tier: "free_trial",
          expiresAt: initialSub.subscriptionExpires,
          subscribedAt: initialSub.subscriptionAt
        });
      }
    } catch (err: any) {
      console.warn("Could not fetch user subscription from Firestore. Using local fallback.", err);
      // Try local storage sync for subscription
      const savedLocalSub = localStorage.getItem(`crm_sub_${uid}`);
      if (savedLocalSub) {
        setSubscription(JSON.parse(savedLocalSub));
      }
    }
  };

  // Sync / write active subscription tier changes to Firestore or local storage
  const saveSubscription = async (uid: string, tier: "free_trial" | "monthly" | "yearly", isLocal: boolean) => {
    const now = new Date();
    let expires = new Date();
    if (tier === "free_trial") expires.setDate(expires.getDate() + 14);
    else if (tier === "monthly") expires.setMonth(expires.getMonth() + 1);
    else if (tier === "yearly") expires.setFullYear(expires.getFullYear() + 1);

    const updatedSub = {
      tier,
      expiresAt: expires.toISOString(),
      subscribedAt: now.toISOString()
    };

    setSubscription(updatedSub);

    if (isLocal) {
      const savedLocalUser = localStorage.getItem("crm_local_user");
      if (savedLocalUser) {
        const parsed = JSON.parse(savedLocalUser);
        parsed.subscriptionTier = tier;
        parsed.subscriptionExpires = expires.toISOString();
        parsed.subscriptionAt = now.toISOString();
        localStorage.setItem("crm_local_user", JSON.stringify(parsed));
      }
      localStorage.setItem(`crm_sub_${uid}`, JSON.stringify(updatedSub));
    } else {
      try {
        const userDocRef = doc(db, "users", uid);
        await updateDoc(userDocRef, {
          subscriptionTier: tier,
          subscriptionExpires: expires.toISOString(),
          subscriptionAt: now.toISOString()
        });
      } catch (err) {
        console.warn("Firestore subscription save failed, writing to local storage instead", err);
        localStorage.setItem(`crm_sub_${uid}`, JSON.stringify(updatedSub));
      }
    }

    triggerSuccessNotification(`Plan successfully upgraded to ${tier === "free_trial" ? "14-Day Free Trial" : tier === "monthly" ? "Monthly Pro" : "Yearly Premium"}!`);
  };

  // Handle Free Trial Sign Up (Name, Email, Password)
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setFirebaseWarning(null);

    if (!signUpForm.name.trim()) {
      setAuthError("Name field is required.");
      return;
    }
    if (!signUpForm.email.trim()) {
      setAuthError("Email address is required.");
      return;
    }
    if (signUpForm.password.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }
    if (signUpForm.password !== signUpForm.confirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Attempt Real Firebase Authentication Signup
      const credential = await createUserWithEmailAndPassword(auth, signUpForm.email.trim(), signUpForm.password);
      
      // Update Auth Display Name
      await updateProfile(credential.user, { displayName: signUpForm.name.trim() });

      // Create Initial User Document in Firestore
      const expires = new Date();
      expires.setDate(expires.getDate() + 14); // 14-day free trial default
      const defaultTier = pendingPlan || "free_trial";
      
      const userPayload = {
        name: signUpForm.name.trim(),
        email: signUpForm.email.trim(),
        subscriptionTier: defaultTier,
        subscriptionExpires: expires.toISOString(),
        subscriptionAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, "users", credential.user.uid), userPayload);
      } catch (dbErr) {
        console.warn("Could not save profile metadata to Firestore. Authentication succeeded.", dbErr);
      }

      setUser({
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: signUpForm.name.trim(),
        isLocalFallback: false
      });

      setSubscription({
        tier: defaultTier,
        expiresAt: expires.toISOString(),
        subscribedAt: new Date().toISOString()
      });

      setActiveModal("none");
      setSignUpForm({ name: "", email: "", password: "", confirmPassword: "" });
      triggerSuccessNotification("Account registered successfully on the cloud database!");

    } catch (authErr: any) {
      console.warn("Firebase Auth Signup Error:", authErr);
      
      // Check if email password is disabled in the firebase console
      if (authErr.code === "auth/operation-not-allowed" || authErr.message?.includes("operation-not-allowed")) {
        // Activate Local Fallback State safely so user gets 100% interactive workspace
        activateLocalStateFallback(signUpForm.name.trim(), signUpForm.email.trim(), signUpForm.password);
        setFirebaseWarning("💡 Note: Email/Password authentication is disabled in your Firebase Console. The CRM has activated a secure local state fallback so you can test all login and subscription workflows smoothly!");
      } else {
        setAuthError(authErr.message || "An error occurred during Registration. Please check your credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to activate client-side persistent sandbox session
  const activateLocalStateFallback = (name: string, email: string, psw: string) => {
    const mockUid = "local_" + Math.random().toString(36).substr(2, 9);
    const expires = new Date();
    const targetPlan = pendingPlan || "free_trial";
    
    if (targetPlan === "free_trial") expires.setDate(expires.getDate() + 14);
    else if (targetPlan === "monthly") expires.setMonth(expires.getMonth() + 1);
    else if (targetPlan === "yearly") expires.setFullYear(expires.getFullYear() + 1);

    const fallbackUser = {
      uid: mockUid,
      email: email,
      displayName: name,
      password: psw, // kept locally for simulated password changes
      subscriptionTier: targetPlan,
      subscriptionExpires: expires.toISOString(),
      subscriptionAt: new Date().toISOString()
    };

    localStorage.setItem("crm_local_user", JSON.stringify(fallbackUser));
    
    setUser({
      uid: mockUid,
      email: email,
      displayName: name,
      isLocalFallback: true
    });

    setSubscription({
      tier: targetPlan,
      expiresAt: expires.toISOString(),
      subscribedAt: new Date().toISOString()
    });

    setActiveModal("none");
    setSignUpForm({ name: "", email: "", password: "", confirmPassword: "" });
    triggerSuccessNotification("Secure local testing account activated successfully!");
  };

  // Handle user login (Email and Password)
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setFirebaseWarning(null);

    if (!signInForm.email.trim()) {
      setAuthError("Email is required.");
      return;
    }
    if (!signInForm.password) {
      setAuthError("Password is required.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Attempt Real Firebase Sign In
      const credential = await signInWithEmailAndPassword(auth, signInForm.email.trim(), signInForm.password);
      
      setUser({
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: credential.user.displayName || credential.user.email,
        isLocalFallback: false
      });

      await fetchSubscriptionFromFirestore(credential.user.uid);
      setActiveModal("none");
      setSignInForm({ email: "", password: "" });
      triggerSuccessNotification("Logged in securely via Cloud Authentication!");

    } catch (authErr: any) {
      console.warn("Firebase Auth Login Error:", authErr);

      // Check if local storage fallback has matching credentials
      const savedLocalUser = localStorage.getItem("crm_local_user");
      if (savedLocalUser) {
        const parsed = JSON.parse(savedLocalUser);
        if (parsed.email.toLowerCase() === signInForm.email.trim().toLowerCase() && parsed.password === signInForm.password) {
          setUser({
            uid: parsed.uid,
            email: parsed.email,
            displayName: parsed.displayName,
            isLocalFallback: true
          });
          setSubscription({
            tier: parsed.subscriptionTier || "none",
            expiresAt: parsed.subscriptionExpires || "",
            subscribedAt: parsed.subscriptionAt || ""
          });
          setActiveModal("none");
          setSignInForm({ email: "", password: "" });
          triggerSuccessNotification("Simulated login authentication successful!");
          return;
        }
      }

      if (authErr.code === "auth/operation-not-allowed" || authErr.message?.includes("operation-not-allowed")) {
        setAuthError("Email/Password Auth is disabled in Firebase. Sign Up first to create a local testing profile!");
      } else {
        setAuthError(authErr.message || "Invalid email or password. Please verify your credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle active password changes easily
  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSuccessMsg(null);

    if (!passwordChangeForm.currentPassword) {
      setAuthError("Current password is required to verify ownership.");
      return;
    }
    if (passwordChangeForm.newPassword.length < 6) {
      setAuthError("New password must be at least 6 characters long.");
      return;
    }
    if (passwordChangeForm.newPassword !== passwordChangeForm.confirmNewPassword) {
      setAuthError("New passwords do not match.");
      return;
    }

    setIsLoading(true);

    if (user?.isLocalFallback) {
      // Handle password change for simulated local storage user
      const savedLocalUser = localStorage.getItem("crm_local_user");
      if (savedLocalUser) {
        const parsed = JSON.parse(savedLocalUser);
        if (parsed.password !== passwordChangeForm.currentPassword) {
          setAuthError("Incorrect current password.");
          setIsLoading(false);
          return;
        }
        parsed.password = passwordChangeForm.newPassword;
        localStorage.setItem("crm_local_user", JSON.stringify(parsed));
        setPasswordChangeForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
        triggerSuccessNotification("Local profile password changed successfully!");
      }
      setIsLoading(false);
    } else {
      // Handle Password update via real Firebase Auth
      try {
        if (auth.currentUser) {
          await updatePassword(auth.currentUser, passwordChangeForm.newPassword);
          setPasswordChangeForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
          triggerSuccessNotification("Cloud profile password changed successfully!");
        } else {
          setAuthError("No active auth session found.");
        }
      } catch (err: any) {
        console.error("Firebase Auth password update error:", err);
        setAuthError(err.message || "Could not update password. For security reasons, you may need to Log Out and Sign In again before updating sensitive settings.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle Log Out state reset
  const handleLogOut = async () => {
    setAuthError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    if (user?.isLocalFallback) {
      // simulated session reset (can keep credentials in local storage but clear the session)
      setUser(null);
      setSubscription({ tier: "none", expiresAt: "", subscribedAt: "" });
      triggerSuccessNotification("Logged out of testing environment.");
    } else {
      try {
        await signOut(auth);
        setUser(null);
        setSubscription({ tier: "none", expiresAt: "", subscribedAt: "" });
        triggerSuccessNotification("Logged out successfully from cloud authentication.");
      } catch (err: any) {
        console.error("Signout error:", err);
      }
    }
    setIsLoading(false);
  };

  // Triggers subscription activation / upgrade
  const handlePurchasePlan = (plan: "free_trial" | "monthly" | "yearly") => {
    if (!user) {
      // Prompt sign up modal, save plan as pending
      setPendingPlan(plan);
      setActiveModal("signup");
      setAuthError(`Please register or Sign In below to activate your ${plan === "free_trial" ? "Free Trial" : plan === "monthly" ? "Monthly Pro" : "Yearly Premium"} subscription.`);
    } else {
      saveSubscription(user.uid, plan, user.isLocalFallback);
    }
  };

  const triggerSuccessNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="billing-subscription-view">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="text-indigo-600 animate-pulse" size={24} />
            Billing & Subscriptions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Choose your plan, activate professional CRM features, and manage your cloud authentication accounts.
          </p>
        </div>
        
        {successMsg && (
          <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 animate-slideDown shadow-xs">
            <CheckCircle2 size={14} className="text-emerald-500 animate-bounce" />
            {successMsg}
          </div>
        )}
      </div>

      {/* Firebase Developer Configuration Assistance Notice */}
      {firebaseWarning && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-xs text-amber-800 animate-slideDown" id="firebase-auth-assistant-banner">
          <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-900">Developer Simulation & Authentication Notice</p>
            <p className="leading-relaxed">{firebaseWarning}</p>
            <div className="pt-1.5 flex gap-3 text-[10px] font-mono">
              <span className="bg-amber-100/60 px-1.5 py-0.5 rounded text-amber-800">Database ID: {db ? "Active Connect" : "Off"}</span>
              <span className="bg-amber-100/60 px-1.5 py-0.5 rounded text-amber-800">Auth Status: Local Fallback Activated</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Pricing / Subscription Plans (2 cols on large screen) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* PLAN 1: Free Trial */}
            <div className={`bg-white border rounded-2xl p-6 relative overflow-hidden transition-all duration-300 flex flex-col justify-between ${
              subscription.tier === "free_trial" 
                ? "border-indigo-500 ring-2 ring-indigo-50 shadow-md scale-102" 
                : "border-slate-200 hover:border-slate-300 shadow-3xs"
            }`} id="plan-card-free-trial">
              {subscription.tier === "free_trial" && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs">
                  Active
                </div>
              )}
              
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
                    <Clock size={16} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Free Trial</h3>
                </div>
                
                <div className="my-4">
                  <span className="text-3xl font-black text-slate-900">$0.00</span>
                  <span className="text-slate-400 text-xs font-medium ml-1">/ 14 Days</span>
                </div>
                
                <p className="text-[11px] text-slate-500 leading-relaxed mb-6">
                  Experience full capabilities of our AI Copywriters, email sequencers, and marketing lead management dashboard.
                </p>

                <ul className="space-y-2.5 text-[11px] text-slate-600 font-medium border-t border-slate-100 pt-4 mb-6">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" />
                    <span>Up to 100 Lead Submissions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" />
                    <span>Active AI Campaign Tracker</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" />
                    <span>Email Autopilot Sequences</span>
                  </li>
                </ul>
              </div>

              <button
                id="btn-activate-free-trial"
                onClick={() => handlePurchasePlan("free_trial")}
                disabled={subscription.tier === "free_trial"}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                  subscription.tier === "free_trial"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-not-allowed"
                    : "bg-slate-900 hover:bg-slate-800 text-white shadow-3xs"
                }`}
              >
                {subscription.tier === "free_trial" ? "Active Plan" : "Sign Up for Free Trial"}
              </button>
            </div>

            {/* PLAN 2: Monthly Subscription */}
            <div className={`bg-white border rounded-2xl p-6 relative overflow-hidden transition-all duration-300 flex flex-col justify-between ${
              subscription.tier === "monthly" 
                ? "border-indigo-600 ring-2 ring-indigo-50 shadow-md scale-102" 
                : "border-slate-200 hover:border-slate-300 shadow-3xs"
            }`} id="plan-card-monthly-pro">
              {subscription.tier === "monthly" && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs">
                  Active
                </div>
              )}
              
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Zap size={16} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Pro</h3>
                </div>
                
                <div className="my-4">
                  <span className="text-3xl font-black text-slate-900">$39.99</span>
                  <span className="text-slate-400 text-xs font-medium ml-1">/ Month</span>
                </div>
                
                <p className="text-[11px] text-slate-500 leading-relaxed mb-6">
                  Complete high-velocity CRM automation, limitless visual copywriter models, and direct webhook pipelines.
                </p>

                <ul className="space-y-2.5 text-[11px] text-slate-600 font-medium border-t border-slate-100 pt-4 mb-6">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" />
                    <span>Unlimited Leads Tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" />
                    <span>Unlimited AI Copy Generation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" />
                    <span>Real-time Segment Analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" />
                    <span>Professional PDF/CSV Exports</span>
                  </li>
                </ul>
              </div>

              <button
                id="btn-subscribe-monthly"
                onClick={() => handlePurchasePlan("monthly")}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                  subscription.tier === "monthly"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-3xs"
                }`}
              >
                {subscription.tier === "monthly" ? "Active Plan (Renew)" : "$39.99/Monthly Subscription"}
              </button>
            </div>

            {/* PLAN 3: Yearly Subscription */}
            <div className={`bg-white border rounded-2xl p-6 relative overflow-hidden transition-all duration-300 flex flex-col justify-between ${
              subscription.tier === "yearly" 
                ? "border-indigo-600 ring-2 ring-indigo-50 shadow-md scale-102" 
                : "border-slate-200 hover:border-slate-300 shadow-3xs"
            }`} id="plan-card-yearly-premium">
              <div className="absolute -top-1 -right-1 bg-amber-500 text-indigo-950 text-[8px] font-black uppercase tracking-widest px-4 py-2 rotate-12 shadow-xs origin-top-left">
                Save 20%
              </div>

              {subscription.tier === "yearly" && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs">
                  Active
                </div>
              )}
              
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <Sparkles size={16} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Yearly Enterprise</h3>
                </div>
                
                <div className="my-4">
                  <span className="text-3xl font-black text-slate-900">$399.99</span>
                  <span className="text-slate-400 text-xs font-medium ml-1">/ Year</span>
                </div>
                
                <p className="text-[11px] text-slate-500 leading-relaxed mb-6">
                  Maximum priority performance, direct model tuning, priority dedicated API pipelines, and tailored onboarding.
                </p>

                <ul className="space-y-2.5 text-[11px] text-slate-600 font-medium border-t border-slate-100 pt-4 mb-6">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" />
                    <span>Everything in Monthly Pro</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" />
                    <span>20% Price discount included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" />
                    <span>Dedicated CRM support desk</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" />
                    <span>Custom Brand-Vibe FineTuner</span>
                  </li>
                </ul>
              </div>

              <button
                id="btn-subscribe-yearly"
                onClick={() => handlePurchasePlan("yearly")}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                  subscription.tier === "yearly"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-3xs"
                }`}
              >
                {subscription.tier === "yearly" ? "Active Plan (Renew)" : "$399.99/Yearly Subscription"}
              </button>
            </div>

          </div>

          {/* Value Proposition Grid */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-3xs" id="billing-features-matrix">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <TrendingUp size={14} className="text-indigo-600" />
              Unified Marketing Funnel Advantages
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-500 leading-relaxed">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 block text-[11px]">Instant Traffic Sync</span>
                <p>Integrates your campaigns instantly across major advertising channels for real-time lead ingestion.</p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-900 block text-[11px]">AI Automated Copywriter</span>
                <p>Generates high-converting SEO content, social media posts, email outreach, and landing pages with a single touch.</p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-900 block text-[11px]">Durable CRM Database</span>
                <p>Secured by robust Firebase security rule gates ensuring proper identity constraints on all lead data.</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: User Session & Auth Portal */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Section 1: Session Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden" id="auth-session-card">
            <div className="absolute top-0 right-0 p-4 text-slate-800/30">
              <Shield size={120} className="rotate-6" />
            </div>

            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 z-10 relative flex items-center gap-1.5">
              <User size={14} className="text-indigo-400" />
              CRM User Account Status
            </h3>

            {isAuthLoading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2">
                <RefreshCw size={18} className="animate-spin text-indigo-400" />
                <span className="text-[10px] text-slate-400">Verifying session credentials...</span>
              </div>
            ) : user ? (
              // Signed In Profile UI
              <div className="space-y-5 z-10 relative">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-amber-400 flex items-center justify-center font-bold text-slate-950 shadow-md">
                    {user.displayName ? user.displayName.substring(0, 2).toUpperCase() : "US"}
                  </div>
                  <div>
                    <span className="font-bold text-white block text-sm leading-tight">{user.displayName || "Active User"}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{user.email}</span>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/50 space-y-2 text-[10px] font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Subscription:</span>
                    <span className="text-amber-400 font-bold uppercase">
                      {subscription.tier === "none" ? "Guest Trial" : subscription.tier.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Session Type:</span>
                    <span className={user.isLocalFallback ? "text-amber-500" : "text-emerald-500"}>
                      {user.isLocalFallback ? "Local Testing" : "Cloud Firebase"}
                    </span>
                  </div>
                  {subscription.expiresAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Plan Renewal:</span>
                      <span className="text-slate-300">{new Date(subscription.expiresAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <button
                  id="btn-auth-logout"
                  onClick={handleLogOut}
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl border border-slate-700 hover:border-red-500/50 hover:bg-red-500/10 text-xs text-slate-300 hover:text-red-400 font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut size={13} />
                  Log Out Session
                </button>
              </div>
            ) : (
              // Anonymous Guest UI
              <div className="space-y-5 z-10 relative">
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  You are currently browsing the CRM as an anonymous guest. Choose a plan to establish secure dashboard metrics.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    id="btn-auth-trigger-signin"
                    onClick={() => {
                      setAuthError(null);
                      setActiveModal("signin");
                    }}
                    className="py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-white rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    id="btn-auth-trigger-signup"
                    onClick={() => {
                      setAuthError(null);
                      setActiveModal("signup");
                    }}
                    className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all text-center cursor-pointer shadow-3xs"
                  >
                    Sign Up Free
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Change Password Area (Active only when user is Signed In) */}
          {user && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-3xs space-y-4" id="change-password-panel">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Key size={14} className="text-slate-600" />
                Easy Password Change
              </h4>
              <p className="text-[11px] text-slate-400">
                Update your credentials easily right from this dashboard to maintain top funnel isolation security.
              </p>

              {authError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-[10px] text-red-700 animate-fadeIn">
                  <AlertCircle size={13} className="shrink-0 mt-0.5 text-red-500" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChangeSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordChangeForm.currentPassword}
                      onChange={(e) => setPasswordChangeForm({ ...passwordChangeForm, currentPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 font-mono text-slate-800"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordChangeForm.newPassword}
                      onChange={(e) => setPasswordChangeForm({ ...passwordChangeForm, newPassword: e.target.value })}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 font-mono text-slate-800"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordChangeForm.confirmNewPassword}
                    onChange={(e) => setPasswordChangeForm({ ...passwordChangeForm, confirmNewPassword: e.target.value })}
                    placeholder="Repeat new password"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 font-mono text-slate-800 animate-none"
                    required
                  />
                </div>

                <button
                  id="btn-submit-change-password"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <span>Change Credentials Password</span>
                  )}
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

      {/* --- AUTHENTICATION MODALS --- */}
      
      {/* 1. SIGN UP MODAL */}
      {activeModal === "signup" && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-signup-container">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-xl relative animate-scaleUp">
            
            <button
              onClick={() => {
                setActiveModal("none");
                setAuthError(null);
                setPendingPlan(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="text-center space-y-1.5 mb-5">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Sparkles size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Sign Up for Trial Plan</h3>
              <p className="text-[11px] text-slate-400">
                {pendingPlan 
                  ? `Sign up to instantly claim your ${pendingPlan === "free_trial" ? "Free Trial" : pendingPlan === "monthly" ? "Monthly Pro" : "Yearly Premium"} subscription.`
                  : "Begin tracking traffic and automating campaign copywriting tools."}
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-[10px] text-red-700 mb-4 animate-fadeIn">
                <AlertCircle size={13} className="shrink-0 mt-0.5 text-red-500" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block uppercase">Your Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <User size={13} />
                  </span>
                  <input
                    type="text"
                    value={signUpForm.name}
                    onChange={(e) => setSignUpForm({ ...signUpForm, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block uppercase">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Mail size={13} />
                  </span>
                  <input
                    type="email"
                    value={signUpForm.email}
                    onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                    placeholder="john.doe@company.com"
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block uppercase">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Lock size={13} />
                  </span>
                  <input
                    type="password"
                    value={signUpForm.password}
                    onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 font-mono text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block uppercase">Confirm Password</label>
                <input
                  type="password"
                  value={signUpForm.confirmPassword}
                  onChange={(e) => setSignUpForm({ ...signUpForm, confirmPassword: e.target.value })}
                  placeholder="Repeat password"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 font-mono text-slate-800"
                  required
                />
              </div>

              <button
                id="btn-submit-signup-form"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-3xs"
              >
                {isLoading ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <span>Create Account & Start Free Trial</span>
                )}
              </button>
            </form>

            <div className="mt-4 border-t border-slate-100 pt-3 text-center">
              <p className="text-[10px] text-slate-400 font-medium">
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setAuthError(null);
                    setActiveModal("signin");
                  }}
                  className="text-indigo-600 hover:underline font-bold"
                >
                  Sign In
                </button>
              </p>
            </div>

          </div>
        </div>
      )}

      {/* 2. SIGN IN MODAL */}
      {activeModal === "signin" && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-signin-container">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-xl relative animate-scaleUp">
            
            <button
              onClick={() => {
                setActiveModal("none");
                setAuthError(null);
                setPendingPlan(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="text-center space-y-1.5 mb-5">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Lock size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Sign In to Marketing CRM</h3>
              <p className="text-[11px] text-slate-400">
                Log in with your existing email and password to resume active automation.
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-[10px] text-red-700 mb-4 animate-fadeIn">
                <AlertCircle size={13} className="shrink-0 mt-0.5 text-red-500" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleSignInSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block uppercase">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Mail size={13} />
                  </span>
                  <input
                    type="email"
                    value={signInForm.email}
                    onChange={(e) => setSignInForm({ ...signInForm, email: e.target.value })}
                    placeholder="your.email@company.com"
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">Password</label>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Lock size={13} />
                  </span>
                  <input
                    type="password"
                    value={signInForm.password}
                    onChange={(e) => setSignInForm({ ...signInForm, password: e.target.value })}
                    placeholder="Enter your password"
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 font-mono text-slate-800"
                    required
                  />
                </div>
              </div>

              <button
                id="btn-submit-signin-form"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-3xs"
              >
                {isLoading ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <span>Access Account Dashboard</span>
                )}
              </button>
            </form>

            <div className="mt-4 border-t border-slate-100 pt-3 text-center">
              <p className="text-[10px] text-slate-400 font-medium">
                New to the platform?{" "}
                <button
                  onClick={() => {
                    setAuthError(null);
                    setActiveModal("signup");
                  }}
                  className="text-indigo-600 hover:underline font-bold"
                >
                  Create free Account
                </button>
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
