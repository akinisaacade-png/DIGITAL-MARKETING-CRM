import React, { useState } from "react";
import { 
  Wand2, 
  Sparkles, 
  Copy, 
  Check, 
  FileText, 
  Video, 
  Volume2, 
  Share2, 
  Play, 
  Cpu, 
  ExternalLink,
  Smartphone,
  Layers,
  ArrowUpRight,
  Search,
  Mail,
  ShoppingBag
} from "lucide-react";

export default function CopywriterView() {
  const [activeTool, setActiveTool] = useState<"full" | "social" | "description" | "script" | "seo" | "social-suite" | "email-sequence" | "product-page">("full");
  
  // Inputs
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [painPoint, setPainPoint] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [tone, setTone] = useState("Empowering & Professional");
  const [extraDetails, setExtraDetails] = useState("");
  const [platforms, setPlatforms] = useState("TikTok, Instagram, LinkedIn, Community");
  const [offer, setOffer] = useState("");
  const [features, setFeatures] = useState("");
  
  // Script specific
  const [videoStyle, setVideoStyle] = useState("Energetic & Cinematic");
  const [keyPromoOffer, setKeyPromoOffer] = useState("14-day free trial, no credit card required");

  // Output
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState("");
  const [copied, setCopied] = useState(false);

  // Ready-made copy templates for sandbox ease
  const handleSelectTemplate = (templateName: string) => {
    if (templateName === "headphones") {
      setProductName("Wireless Noise Cancelling Headphones");
      setCategory("Consumer Electronics / Premium Audio");
      setTargetAudience("Tech-savvy commuters & audio creators");
      setPainPoint("Distracting noise during transit, quick battery drainage, uncomfortable fit");
      setDesiredOutcome("Immersive high-fidelity audio all day with maximum luxury comfort");
      setTone("Sleek, Premium, & Luxurious");
      setExtraDetails("40-hour battery life, fast USB-C charge, active adaptive audio cancellation.");
      setFeatures("40-hour battery life, active hybrid noise cancellation, high-res audio certified, water resistant IPX4");
      setKeyPromoOffer("Get 10% off your first order today");
      setOffer("Get 10% off your first order today");
      setPlatforms("TikTok, Instagram, YouTube Shorts");
    } else if (templateName === "crm") {
      setProductName("DIGITAL MARKETING CRM™");
      setCategory("SaaS / Marketing Automation");
      setTargetAudience("Remote agencies, business coaches, consultants");
      setPainPoint("High lead leakage, disjointed marketing tools, lack of personalized content sequences");
      setDesiredOutcome("High-converting automated marketing funnel that runs 24/7");
      setTone("Empowering, smart, & action-oriented");
      setExtraDetails("All-in-one hub. Automates leads scoring, connects Facebook ad accounts, includes AI copywriter.");
      setFeatures("All-in-one visual sales CRM, automated lead scoring, integrated AI copywriter, instant social integration");
      setKeyPromoOffer("Start your 7-day free trial. No credit card required.");
      setOffer("Start your 7-day free trial. No credit card required.");
      setPlatforms("TikTok, Instagram, LinkedIn, Threads");
    }
  };

  const handleGenerate = async () => {
    if (!productName) return;
    setIsGenerating(true);
    setGeneratedResult("");

    const endpoint = activeTool === "script" 
      ? "/api/gemini/generate-script" 
      : "/api/gemini/generate-copy";

    const bodyPayload = activeTool === "script" 
      ? { productName, audience: targetAudience, style: videoStyle, keyOffer: keyPromoOffer }
      : activeTool === "full"
      ? { type: "Full Funnel", productName, category, audience: targetAudience, painPoint, desiredOutcome, tone, extraNotes: extraDetails }
      : activeTool === "seo"
      ? { type: "SEO Content Generator", productName, category, audience: targetAudience, painPoint, desiredOutcome, tone, extraNotes: extraDetails }
      : activeTool === "social-suite"
      ? { type: "Social Media Suite", productName, platforms, audience: targetAudience, tone, extraNotes: extraDetails }
      : activeTool === "email-sequence"
      ? { type: "Email Sequence Generator", productName, audience: targetAudience, painPoint, desiredOutcome, offer, tone, extraNotes: extraDetails }
      : activeTool === "product-page"
      ? { type: "Product Page Generator", productName, category, audience: targetAudience, painPoint, desiredOutcome, features, tone, extraNotes: extraDetails }
      : { type: activeTool === "social" ? "Facebook Ad Copy" : "Product Description", productName, audience: targetAudience, tone, extraNotes: extraDetails };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedResult(data.text);
      } else {
        setGeneratedResult(`⚠️ Generation failed: ${data.error || "Unknown server error"}`);
      }
    } catch (err: any) {
      console.error("Copywriter API Error:", err);
      setGeneratedResult(`⚠️ Error: ${err.message || "Failed to reach backend server"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedResult) return;
    navigator.clipboard.writeText(generatedResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="ai-copywriter-suite">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            AI Copywriting & Video Storyboard Suite
            <Sparkles size={16} className="text-indigo-500 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate high-converting social media ads, optimized product listings, or structured 60-second video narration boards.
          </p>
        </div>
        
        {/* Presets */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 p-1.5 border border-slate-100 rounded-lg">
          <span className="font-semibold px-1 text-[10px]">PRESETS:</span>
          <button 
            id="preset-crm-btn"
            onClick={() => handleSelectTemplate("crm")}
            className="px-2 py-1 bg-white hover:bg-slate-100 rounded border border-slate-150 transition-colors text-[10px] cursor-pointer"
          >
            Digital CRM
          </button>
          <button 
            id="preset-headphones-btn"
            onClick={() => handleSelectTemplate("headphones")}
            className="px-2 py-1 bg-white hover:bg-slate-100 rounded border border-slate-150 transition-colors text-[10px] cursor-pointer"
          >
            Premium Audio
          </button>
        </div>
      </div>

      {/* Toolbox switcher */}
      <div className="flex border-b border-slate-100 gap-6 overflow-x-auto pb-px" id="copywriter-tabs">
        {[
          { id: "full", label: "Complete Funnel Suite", icon: <Layers size={14} /> },
          { id: "product-page", label: "Product Page Generator", icon: <ShoppingBag size={14} /> },
          { id: "social-suite", label: "Social Media Suite", icon: <Share2 size={14} /> },
          { id: "seo", label: "SEO Content Generator", icon: <Search size={14} /> },
          { id: "email-sequence", label: "Email Sequence Generator", icon: <Mail size={14} /> },
          { id: "social", label: "Facebook / Instagram Ad", icon: <Smartphone size={14} /> },
          { id: "description", label: "Product Listing Description", icon: <FileText size={14} /> },
          { id: "script", label: "60-Second Video Promo Script", icon: <Video size={14} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            id={`tab-copywriter-${tab.id}`}
            onClick={() => {
              setActiveTool(tab.id as any);
              setGeneratedResult("");
            }}
            className={`flex items-center gap-1.5 pb-3 text-xs font-bold transition-all relative border-b-2 cursor-pointer ${
              activeTool === tab.id 
                ? "border-indigo-600 text-indigo-600 font-extrabold" 
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Editor workbench layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8" id="copywriter-workspace">
        
        {/* Left Inputs block */}
        <div className="lg:col-span-2 space-y-4 bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs" id="copywriter-inputs-card">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Cpu size={14} /> Design parameters
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Product or Offer Name *</label>
              <input 
                id="copywriter-product-input"
                type="text"
                required
                placeholder="e.g. DIGITAL MARKETING CRM™"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Target Audience Profile</label>
              <input 
                id="copywriter-audience-input"
                type="text"
                placeholder="e.g. Specialized e-commerce shop owners"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
              />
            </div>

            {(activeTool === "full" || activeTool === "seo" || activeTool === "email-sequence" || activeTool === "product-page") && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Category / Niche</label>
                  <input 
                    id="copywriter-category-input"
                    type="text"
                    placeholder="e.g. SaaS / Marketing Automation, Apparel, Premium Audio"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Main Pain Point</label>
                  <input 
                    id="copywriter-painpoint-input"
                    type="text"
                    placeholder="e.g. Disjointed tools, high lead leakage, noise during transit"
                    value={painPoint}
                    onChange={(e) => setPainPoint(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Desired Outcome</label>
                  <input 
                    id="copywriter-outcome-input"
                    type="text"
                    placeholder="e.g. Automated marketing funnel running 24/7, high fidelity audio"
                    value={desiredOutcome}
                    onChange={(e) => setDesiredOutcome(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                  />
                </div>

                {activeTool === "email-sequence" && (
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1 font-bold text-indigo-600">Offer Details *</label>
                    <input 
                      id="copywriter-offer-input"
                      type="text"
                      placeholder="e.g. 10% off first purchase, 14-day free trial"
                      value={offer}
                      onChange={(e) => setOffer(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-indigo-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-indigo-50/20"
                    />
                  </div>
                )}

                {activeTool === "product-page" && (
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1 font-bold text-indigo-600">Key Features & Specs *</label>
                    <textarea 
                      id="copywriter-features-textarea"
                      rows={3}
                      placeholder="e.g. 40-hour battery life, active adaptive audio cancellation, fast USB-C charge"
                      value={features}
                      onChange={(e) => setFeatures(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-indigo-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-indigo-50/20"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Brand Voice Tone</label>
                  <select
                    id="copywriter-tone-select-full"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white outline-hidden focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Empowering & Professional">Empowering & Professional</option>
                    <option value="Sleek, Premium, & Luxurious">Sleek, Premium, & Luxurious</option>
                    <option value="Witty, Bold, & Disruptive">Witty, Bold, & Disruptive</option>
                    <option value="Friendly, Trustworthy, & Warm">Friendly, Trustworthy, & Warm</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Extra Details / Custom Specifications</label>
                  <textarea 
                    id="copywriter-details-textarea-full"
                    rows={3}
                    placeholder="e.g. Any custom constraints, size/fit guides, or specific features"
                    value={extraDetails}
                    onChange={(e) => setExtraDetails(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                  />
                </div>
              </>
            )}

            {activeTool === "social-suite" && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Platform Focus</label>
                  <input 
                    id="copywriter-platforms-input"
                    type="text"
                    placeholder="e.g. TikTok, Reels, Instagram, Threads, LinkedIn"
                    value={platforms}
                    onChange={(e) => setPlatforms(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Brand Voice Tone</label>
                  <select
                    id="copywriter-tone-select-social-suite"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white outline-hidden focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Empowering & Professional">Empowering & Professional</option>
                    <option value="Sleek, Premium, & Luxurious">Sleek, Premium, & Luxurious</option>
                    <option value="Witty, Bold, & Disruptive">Witty, Bold, & Disruptive</option>
                    <option value="Friendly, Trustworthy, & Warm">Friendly, Trustworthy, & Warm</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Extra Details / Main Benefit</label>
                  <textarea 
                    id="copywriter-details-textarea-social-suite"
                    rows={4}
                    placeholder="e.g. Any custom details, key benefit to emphasize, promotions"
                    value={extraDetails}
                    onChange={(e) => setExtraDetails(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                  />
                </div>
              </>
            )}

            {(activeTool === "social" || activeTool === "description") && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Brand Voice Tone</label>
                  <select
                    id="copywriter-tone-select"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white outline-hidden focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Empowering & Professional">Empowering & Professional</option>
                    <option value="Sleek, Premium, & Luxurious">Sleek, Premium, & Luxurious</option>
                    <option value="Witty, Bold, & Disruptive">Witty, Bold, & Disruptive</option>
                    <option value="Friendly, Trustworthy, & Warm">Friendly, Trustworthy, & Warm</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Key Product Details & Pain Points</label>
                  <textarea 
                    id="copywriter-details-textarea"
                    rows={4}
                    placeholder="e.g. 40 hour battery, instant auto-lead score, replaces 5 separate tools"
                    value={extraDetails}
                    onChange={(e) => setExtraDetails(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                  />
                </div>
              </>
            )}

            {activeTool === "script" && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Video Direction & Aesthetic Style</label>
                  <select
                    id="copywriter-style-select"
                    value={videoStyle}
                    onChange={(e) => setVideoStyle(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white outline-hidden focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Energetic & Cinematic">Energetic & Cinematic</option>
                    <option value="Fast-paced, Modern, Tech Vlog style">Fast-paced, Modern, Tech Vlog style</option>
                    <option value="Corporate, Empathetic, Trust-building">Corporate, Empathetic, Trust-building</option>
                    <option value="Humorous, High-concept, Narrative hook">Humorous, High-concept, Narrative hook</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Primary Promo Call To Action (CTA)</label>
                  <input 
                    id="copywriter-promo-input"
                    type="text"
                    placeholder="e.g. Start 14-day free trial today"
                    value={keyPromoOffer}
                    onChange={(e) => setKeyPromoOffer(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                  />
                </div>
              </>
            )}

            <button
              id="copywriter-generate-btn"
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !productName}
              className="w-full py-2.5 bg-gold-500 hover:bg-gold-600 disabled:bg-slate-200 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Wand2 size={13} className="text-slate-950 stroke-[2.5px]" />
              {isGenerating ? "Synthesizing Copy..." : "Generate High-Converting Asset"}
            </button>
          </div>
        </div>

        {/* Right Outputs block */}
        <div className="lg:col-span-3 bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs flex flex-col justify-between" id="copywriter-output-card">
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText size={14} className="text-indigo-500" /> Output Content Preview
              </span>

              {generatedResult && (
                <button 
                  id="copy-draft-btn"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-150 hover:bg-slate-100 text-[10px] font-bold text-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                  {copied ? "Copied to Clipboard!" : "Copy Draft Copy"}
                </button>
              )}
            </div>

            {/* Simulated output window */}
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-5 overflow-y-auto max-h-[420px] font-mono text-xs text-slate-700 relative">
              {isGenerating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-xs gap-3">
                  <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
                  <p className="text-[11px] font-sans font-semibold text-slate-500 animate-pulse">
                    Gemini 3.5 is compiling direct-response copywriting structures...
                  </p>
                </div>
              ) : null}

              {generatedResult ? (
                <div className="space-y-4 font-sans leading-relaxed text-xs">
                  <div className="whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed">
                    {generatedResult}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-16 space-y-2">
                  <Sparkles size={24} className="text-slate-300" />
                  <p className="font-semibold text-slate-500 font-sans text-xs">AI Copywriter Standby</p>
                  <p className="text-[11px] text-slate-400 max-w-sm font-sans leading-relaxed">
                    Fill in details about your product on the left, then click generate to craft high-converting campaigns instantly.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-50 pt-4 mt-4 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Powered by Gemini 3.5 Flash Model</span>
            <span className="flex items-center gap-1 font-mono">
              <Cpu size={12} /> Live API Integration Active
            </span>
          </div>
        </div>

      </div>

      {/* Real validated educational tools bar */}
      <div className="border-t border-slate-100 pt-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Top Rated Copywriting Platforms in E-commerce & Copywriting
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          {[
            { name: "Jasper.ai", desc: "Best for brand-consistent product copy & ads", url: "https://www.jasper.ai" },
            { name: "Copy.ai", desc: "Strong templates for social captions & emails", url: "https://www.copy.ai" },
            { name: "Shopify Magic", desc: "Native AI product description helper", url: "https://www.shopify.com/magic" },
            { name: "Synthesia.io", desc: "AI video explainer generation", url: "https://www.synthesia.io" }
          ].map((tool, idx) => (
            <div key={idx} className="bg-white border border-slate-200 p-3.5 rounded-xl flex flex-col justify-between hover:shadow-xs transition-shadow">
              <div>
                <span className="font-bold text-slate-900 block">{tool.name}</span>
                <span className="text-slate-500 text-[11px] mt-0.5 block leading-relaxed">{tool.desc}</span>
              </div>
              <a 
                href={tool.url} 
                target="_blank" 
                rel="noreferrer" 
                className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-0.5 mt-2 text-[10px]"
              >
                Visit official site <ExternalLink size={10} />
              </a>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
