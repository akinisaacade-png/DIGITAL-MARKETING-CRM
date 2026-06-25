import React, { useState } from "react";
import { 
  Mail, 
  Plus, 
  Send, 
  Clock, 
  CheckCircle, 
  HelpCircle, 
  ChevronRight, 
  Sparkles, 
  Wand2, 
  Trash2,
  ListOrdered,
  BookOpen,
  X,
  User
} from "lucide-react";
import { EmailSequence } from "../types";

interface SequencerViewProps {
  sequences: EmailSequence[];
  onAddSequence: (name: string, trigger: string, steps: { subject: string; delay: string; body: string }[]) => void;
  globalSearchQuery?: string;
}

export default function SequencerView({ sequences, onAddSequence, globalSearchQuery = "" }: SequencerViewProps) {
  const filteredSequences = sequences.filter(seq => {
    if (!globalSearchQuery) return true;
    return seq.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
           seq.trigger.toLowerCase().includes(globalSearchQuery.toLowerCase());
  });

  const [selectedSequenceId, setSelectedSequenceId] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedStepForPreview, setSelectedStepForPreview] = useState<{ step: number; subject: string; delay: string; body: string } | null>(null);
  const [previewLead, setPreviewLead] = useState({
    firstName: "Sarah",
    lastName: "Jenkins",
    company: "Digital Spark Co",
    email: "sarah@digitalspark.io"
  });

  const mockLeads = [
    { firstName: "Sarah", lastName: "Jenkins", company: "Digital Spark Co", email: "sarah@digitalspark.io" },
    { firstName: "David", lastName: "Kim", company: "MarketFlow Solutions", email: "dkim@marketflow.com" },
    { firstName: "Marcus", lastName: "Vance", company: "Apex Systems", email: "mvance@apexcorp.com" },
    { firstName: "Jessica", lastName: "Chen", company: "TechVentures Capital", email: "jessica.chen@techventures.io" }
  ];

  // Manual Creation state
  const [manualName, setManualName] = useState("");
  const [manualTrigger, setManualTrigger] = useState("New Lead Added");
  const [manualSteps, setManualSteps] = useState([
    { subject: "Welcome to our brand! 👋", delay: "Immediate", body: "Hi [First Name],\n\nThanks for signing up to check out our product. Let's schedule a chat!\n\nBest,\nTeam" }
  ]);

  // AI Generation state
  const [aiProduct, setAiProduct] = useState("");
  const [aiTone, setAiTone] = useState("Professional");
  const [aiHook, setAiHook] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<{ subject: string; delay: string; body: string }[] | null>(null);

  // Sync selectedSequenceId if it becomes empty or invalid
  const activeSeq = filteredSequences.find(s => s.id === selectedSequenceId) || filteredSequences[0];

  const handleAddManualStep = () => {
    setManualSteps([
      ...manualSteps,
      { subject: "", delay: "1 Day Later", body: "" }
    ]);
  };

  const handleRemoveManualStep = (index: number) => {
    setManualSteps(manualSteps.filter((_, i) => i !== index));
  };

  const handleStepChange = (index: number, field: string, value: string) => {
    const updated = [...manualSteps];
    updated[index] = { ...updated[index], [field]: value };
    setManualSteps(updated);
  };

  const handleSaveManualSequence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName || !manualSteps.length) return;

    onAddSequence(manualName, manualTrigger, manualSteps);
    
    // reset form
    setManualName("");
    setManualTrigger("New Lead Added");
    setManualSteps([{ subject: "Welcome 👋", delay: "Immediate", body: "" }]);
    setShowAddForm(false);
  };

  // Generate automated onboarding sequences with Gemini
  const handleTriggerAiSequencer = async () => {
    if (!aiProduct) return;
    setIsAiGenerating(true);
    setAiResult(null);

    try {
      const response = await fetch("/api/gemini/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Email Sequence",
          productName: aiProduct,
          tone: aiTone,
          extraNotes: `Generate an email sequence. IMPORTANT: Return the output as a valid JSON object in this exact format, with no markdown wrappers or text outside the JSON:
[
  {
    "subject": "First high-converting subject line",
    "delay": "Immediate",
    "body": "Detailed body copy of the first email, using [First Name] as the placeholder."
  },
  {
    "subject": "Second follow-up subject line focusing on benefits",
    "delay": "1 Day Later",
    "body": "Detailed body copy of the second email."
  },
  {
    "subject": "Third subject line creating gentle urgency",
    "delay": "3 Days Later",
    "body": "Detailed body copy of the third email."
  }
]`,
        }),
      });

      const data = await response.json();
      if (data.success) {
        let generatedText = data.text || "";
        // Clean markdown backticks if returned
        if (generatedText.includes("```json")) {
          generatedText = generatedText.split("```json")[1].split("```")[0].trim();
        } else if (generatedText.includes("```")) {
          generatedText = generatedText.split("```")[1].split("```")[0].trim();
        }

        try {
          const parsed = JSON.parse(generatedText);
          if (Array.isArray(parsed)) {
            setAiResult(parsed);
          } else {
            throw new Error("Parsed result is not an array");
          }
        } catch (e) {
          // Fallback parser / parser failed
          console.warn("AI didn't return perfect JSON array. Falling back to structured parse:", e);
          setAiResult([
            { 
              subject: `Welcome to ${aiProduct}! 🚀`, 
              delay: "Immediate", 
              body: `Hi [First Name],\n\nWelcome to ${aiProduct}. We are thrilled to have you onboard!\n\nOur system uses AI-driven technology to boost your performance. Here is how to get started...\n\nTo your success,\nThe ${aiProduct} Team` 
            },
            { 
              subject: `Engage leads 24/7 with ${aiProduct}`, 
              delay: "1 Day Later", 
              body: `Hi [First Name],\n\nDid you know that 78% of leads convert when responded to within 5 minutes? With ${aiProduct}, you can scale automatic responses seamlessly.\n\nBest,\nThe ${aiProduct} Team` 
            },
            { 
              subject: "⏰ Unlock your growth potential", 
              delay: "3 Days Later", 
              body: `Hi [First Name],\n\nTime is ticking on your setup! Upgrade your ${aiProduct} workspace today with code GROW20 to claim your 20% discount.\n\nTalk soon,\nThe ${aiProduct} Team` 
            }
          ]);
        }
      }
    } catch (err) {
      console.error("Failed to generate AI sequences:", err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSaveAiGeneratedSequence = () => {
    if (!aiResult || !aiProduct) return;
    onAddSequence(`${aiProduct} Onboarding Trigger`, "Automated Lead Intake", aiResult);
    setAiResult(null);
    setAiProduct("");
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="email-sequencer-view">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Automated Email Sequences</h1>
          <p className="text-xs text-slate-500 mt-1">
            Build multi-step, behavior-triggered follow-up tracks to engage leads 24/7 on autopilot.
          </p>
        </div>
        <div>
          <button 
            id="create-sequence-btn"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Plus size={14} />
            {showAddForm ? "Show Active Sequences" : "Design New Sequence"}
          </button>
        </div>
      </div>

      {!showAddForm ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="sequences-split-view">
          
          {/* Left Panel: List of available sequences */}
          <div className="space-y-3" id="sequence-list-column">
            <div className="flex justify-between items-center px-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Workflows</h4>
              {globalSearchQuery && (
                <span className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                  {filteredSequences.length} matches
                </span>
              )}
            </div>

            {globalSearchQuery && (
              <p className="text-[10px] text-slate-400 italic px-1">
                Filtered by: "{globalSearchQuery}"
              </p>
            )}

            {filteredSequences.map((seq) => (
              <div 
                key={seq.id}
                id={`seq-item-${seq.id}`}
                onClick={() => setSelectedSequenceId(seq.id)}
                className={`p-4 border rounded-xl cursor-pointer transition-all ${
                  selectedSequenceId === seq.id 
                    ? "border-indigo-500 bg-indigo-50/20 shadow-2xs" 
                    : "border-slate-100 bg-white hover:border-slate-200"
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-900 line-clamp-1">{seq.name}</span>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">
                    {seq.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1 font-semibold">
                    <Clock size={11} className="text-slate-400" />
                    Trigger: {seq.trigger}
                  </span>
                  <span>•</span>
                  <span>{seq.steps.length} Step{seq.steps.length > 1 ? "s" : ""}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right Panel: Selected Sequence Details */}
          <div className="lg:col-span-2 space-y-4" id="sequence-details-column">
            {activeSeq ? (
              <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{activeSeq.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">Trigger: <strong className="text-slate-700">{activeSeq.trigger}</strong></p>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                    {activeSeq.steps.length} step sequence
                  </span>
                </div>

                <div className="space-y-6 mt-6" id="sequence-steps-list">
                  {activeSeq.steps.map((step, idx) => (
                    <div key={idx} className="relative pl-6 border-l-2 border-dashed border-slate-100 last:border-0 pb-2">
                      {/* Bullet step count node */}
                      <div className="absolute -left-[11px] top-0.5 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold font-mono">
                        {step.step}
                      </div>

                      <div className="bg-slate-50/50 border border-slate-100/50 rounded-xl p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100/50 pb-2">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Mail size={12} className="text-indigo-500" />
                            Subject: {step.subject}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 bg-white border border-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Clock size={10} />
                            Delay: {step.delay}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap font-sans">
                          {step.body}
                        </p>

                        <div className="flex justify-end pt-2 border-t border-slate-100/50">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStepForPreview({
                                step: step.step,
                                subject: step.subject,
                                delay: step.delay,
                                body: step.body
                              });
                              setShowPreviewModal(true);
                            }}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1 cursor-pointer hover:underline"
                          >
                            <BookOpen size={12} />
                            Preview Rendered Step
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-xl p-12 text-center text-slate-400 text-xs">
                Select or create a campaign sequence to inspect the automated triggers.
              </div>
            )}
          </div>

        </div>
      ) : (
        /* CREATION AND AI SEQUENCER WORKBENCH */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn" id="sequence-builder-workbench">
          
          {/* Left panel: Gemini AI sequence generator */}
          <div className="bg-gradient-to-br from-indigo-50/30 to-purple-50/30 border border-indigo-100/40 rounded-2xl p-6 space-y-6" id="ai-sequencer-card">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                <Sparkles size={18} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Gemini AI Auto-Sequencer</h3>
                <p className="text-[11px] text-slate-500">Draft full onboarding tracks instantly using marketing models.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Product or Offer Name *</label>
                <input 
                  id="ai-seq-product-input"
                  type="text"
                  placeholder="e.g. UltraClean Carpet Cleaner or ProFit Coaching"
                  value={aiProduct}
                  onChange={(e) => setAiProduct(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Brand Voice Tone</label>
                <select
                  id="ai-seq-tone-select"
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  <option value="Professional & Empowering">Professional & Empowering</option>
                  <option value="Friendly & Welcoming">Friendly & Welcoming</option>
                  <option value="Bold & Conversational">Bold & Conversational</option>
                  <option value="Aspirational & Premium">Aspirational & Premium</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Key Offer / Value Proposition (Optional)</label>
                <textarea 
                  id="ai-seq-hook-textarea"
                  rows={2}
                  placeholder="e.g. 10% off first purchase, save 15 hours a week, AES-256 secure"
                  value={aiHook}
                  onChange={(e) => setAiHook(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-white"
                />
              </div>

              <button
                id="ai-seq-generate-btn"
                type="button"
                onClick={handleTriggerAiSequencer}
                disabled={isAiGenerating || !aiProduct}
                className="w-full py-2 bg-gold-500 hover:bg-gold-600 disabled:bg-slate-300 text-slate-950 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Wand2 size={13} className="text-slate-950 stroke-[2.5px]" />
                {isAiGenerating ? "Assembling Sequence (Gemini 3.5)..." : "Draft with Gemini Intelligence"}
              </button>
            </div>

            {aiResult && (
              <div className="border-t border-indigo-100/50 pt-4 space-y-4 animate-fadeIn" id="ai-sequence-preview">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <CheckCircle size={13} className="text-emerald-500" />
                  Gemini Draft Ready
                </h4>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {aiResult.map((step, idx) => (
                    <div key={idx} className="bg-white border border-slate-150 p-3 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Email {idx+1} ({step.delay})</span>
                        <span className="text-indigo-500">Drafted</span>
                      </div>
                      <span className="font-bold text-slate-800 block">Subject: {step.subject}</span>
                      <p className="text-slate-500 text-[11px] line-clamp-2">{step.body}</p>
                    </div>
                  ))}
                </div>

                <button
                  id="save-ai-sequence-btn"
                  onClick={handleSaveAiGeneratedSequence}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  Save Sequence to Active Workflows
                </button>
              </div>
            )}
          </div>

          {/* Right panel: Manual sequence builder */}
          <div className="bg-white border border-slate-150 rounded-2xl p-6" id="manual-sequencer-card">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <ListOrdered size={16} className="text-slate-700" />
              Manual Sequence Composer
            </h3>
            <p className="text-xs text-slate-400 mt-1">Design step delays and triggers by hand for absolute pipeline control.</p>

            <form onSubmit={handleSaveManualSequence} className="space-y-4 mt-6">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Sequence Name *</label>
                <input 
                  id="manual-seq-name-input"
                  type="text"
                  required
                  placeholder="e.g. VIP Re-engagement Track"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Trigger Event</label>
                <input 
                  id="manual-seq-trigger-input"
                  type="text"
                  placeholder="e.g. Form Submitted or Lead marked Won"
                  value={manualTrigger}
                  onChange={(e) => setManualTrigger(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                />
              </div>

              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-800">Email Steps ({manualSteps.length})</h4>
                  <button
                    id="add-manual-step-btn"
                    type="button"
                    onClick={handleAddManualStep}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                  >
                    + Add Step Delay
                  </button>
                </div>

                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {manualSteps.map((step, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3 relative">
                      {idx > 0 && (
                        <button
                          id={`remove-manual-step-${idx}`}
                          type="button"
                          onClick={() => handleRemoveManualStep(idx)}
                          className="absolute right-3 top-3 text-red-500 hover:text-red-700 p-0.5 rounded"
                          title="Remove Step"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="text-[10px] font-semibold text-slate-500 block mb-1">Subject *</label>
                          <input 
                            id={`manual-step-subject-${idx}`}
                            type="text"
                            required
                            placeholder="Email Subject"
                            value={step.subject}
                            onChange={(e) => handleStepChange(idx, "subject", e.target.value)}
                            className="w-full px-2.5 py-1 text-[11px] border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-1">Delay *</label>
                          <input 
                            id={`manual-step-delay-${idx}`}
                            type="text"
                            required
                            placeholder="e.g. 2 Days Later"
                            value={step.delay}
                            onChange={(e) => handleStepChange(idx, "delay", e.target.value)}
                            className="w-full px-2.5 py-1 text-[11px] border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-1">Body Text</label>
                        <textarea 
                          id={`manual-step-body-${idx}`}
                          rows={3}
                          placeholder="Email body copy..."
                          value={step.body}
                          onChange={(e) => handleStepChange(idx, "body", e.target.value)}
                          className="w-full px-2.5 py-1 text-[11px] border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                <button
                  id="cancel-compose-btn"
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel Composer
                </button>
                <button
                  id="save-manual-sequence-btn"
                  type="submit"
                  disabled={!manualName}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Save Sequence
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* EMAIL PREVIEW MODAL */}
      {showPreviewModal && selectedStepForPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="email-preview-modal">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden flex flex-col md:flex-row h-[550px] max-h-[90vh]">
            
            {/* Sidebar selector for mock leads */}
            <div className="bg-slate-50 border-r border-slate-100 p-5 md:w-60 flex flex-col shrink-0">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Simulated Leads</h4>
              <p className="text-[11px] text-slate-500 mb-4">Select a lead to render dynamic placeholders:</p>
              
              <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                {mockLeads.map((lead, idx) => {
                  const isSelected = previewLead.email === lead.email;
                  return (
                    <button
                      key={idx}
                      onClick={() => setPreviewLead(lead)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center gap-2 cursor-pointer ${
                        isSelected 
                          ? "bg-indigo-50 border-indigo-200 font-semibold text-indigo-700 shadow-3xs" 
                          : "bg-white border-slate-200/60 text-slate-600 hover:bg-slate-100/50"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                        isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                      }`}>
                        {lead.firstName[0]}
                      </div>
                      <div className="min-w-0">
                        <span className="block font-bold truncate">{lead.firstName} {lead.lastName}</span>
                        <span className="block text-[10px] text-slate-400 truncate font-mono">{lead.company}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-slate-200/50 pt-4 mt-4">
                <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase">Matched Placeholders</span>
                <div className="grid grid-cols-2 gap-1.5 mt-2 text-[10px] font-mono">
                  <span className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded truncate" title="[First Name]">[First Name]</span>
                  <span className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded truncate" title="[Company]">[Company]</span>
                  <span className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded truncate" title="[Email]">[Email]</span>
                </div>
              </div>
            </div>

            {/* Email sandbox client container */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
              {/* Client header */}
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-mono text-slate-400 ml-2 font-bold">Email Preview Sandbox</span>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Email meta bar */}
              <div className="border-b border-slate-100 p-4 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-14 font-semibold text-slate-400 text-[10px] uppercase font-mono">From:</span>
                  <span className="font-semibold text-slate-800">Digital CRM Automation &lt;nurture@marketing-crm.com&gt;</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-14 font-semibold text-slate-400 text-[10px] uppercase font-mono">To:</span>
                  <span className="font-medium text-indigo-600 bg-indigo-50/60 px-1.5 py-0.5 rounded">
                    {previewLead.firstName} {previewLead.lastName} &lt;{previewLead.email}&gt;
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-slate-50">
                  <span className="w-14 font-semibold text-slate-400 text-[10px] uppercase font-mono">Subject:</span>
                  <span className="font-bold text-slate-900">
                    {selectedStepForPreview.subject
                      .replace(/\[First Name\]/g, previewLead.firstName)
                      .replace(/\[First_Name\]/g, previewLead.firstName)
                      .replace(/\[FirstName\]/g, previewLead.firstName)
                      .replace(/\[Company\]/g, previewLead.company)
                      .replace(/\[Company Name\]/g, previewLead.company)
                      .replace(/\[Email\]/g, previewLead.email)}
                  </span>
                </div>
              </div>

              {/* Rendered Email Body viewport */}
              <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
                <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs min-h-full font-sans text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">
                  {selectedStepForPreview.body
                    .replace(/\[First Name\]/g, previewLead.firstName)
                    .replace(/\[First_Name\]/g, previewLead.firstName)
                    .replace(/\[FirstName\]/g, previewLead.firstName)
                    .replace(/\[Company\]/g, previewLead.company)
                    .replace(/\[Company Name\]/g, previewLead.company)
                    .replace(/\[Email\]/g, previewLead.email)}
                </div>
              </div>

              {/* Client Footer */}
              <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-mono">Delay trigger: <strong className="text-indigo-600 bg-white border border-slate-100 px-1.5 py-0.5 rounded">{selectedStepForPreview.delay}</strong></span>
                <span className="flex items-center gap-1"><CheckCircle size={10} className="text-emerald-500" /> Secure Sandbox Preview</span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
