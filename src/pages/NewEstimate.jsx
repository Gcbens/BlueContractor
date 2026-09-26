import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Estimate, Customer } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Save, Loader2, ScanLine, ListChecks } from "lucide-react";
import { calculateEstimate, formatCurrency } from "@/lib/estimateCalculations";
import StepIndicator from "@/components/estimate/StepIndicator";
import StepCustomer from "@/components/estimate/StepCustomer";
import StepJobInfo from "@/components/estimate/StepJobInfo";
import StepMeasurements from "@/components/estimate/StepMeasurements";
import PhotoAnalysis from "@/components/estimate/PhotoAnalysis";
import StepLabor from "@/components/estimate/StepLabor";
import StepMaterials from "@/components/estimate/StepMaterials";
import StepEquipment from "@/components/estimate/StepEquipment";
import ProfitEngine from "@/components/estimate/ProfitEngine";
import MarketBenchmark from "@/components/estimate/MarketBenchmark";
import AIReview from "@/components/estimate/AIReview";
import JobAnalysisPanel from "@/components/estimate/job-analysis/JobAnalysisPanel";
import { motion, AnimatePresence } from "framer-motion";
import CameraCapture from "@/components/scan/CameraCapture";
import { analyzeJobPhotos } from "@/lib/scanEstimate";

const INITIAL = {
  customer_name: "",
  phone: "",
  email: "",
  address: "",
  job_type: "",
  job_description: "",
  property_type: "residential",
  difficulty: "moderate",
  square_footage: 0,
  linear_feet: 0,
  num_floors: 1,
  has_stairs: false,
  walking_distance: 0,
  distance_from_truck: 0,
  weight: 0,
  dimensions: "",
  num_workers: 2,
  hourly_rate: 50,
  estimated_hours: 4,
  travel_time: 0.5,
  setup_time: 0.5,
  cleanup_time: 0.5,
  travel_miles: 0,
  cost_per_mile: 0.67,
  materials: [],
  equipment_rental: 0,
  fuel_cost: 0,
  consumables: 0,
  tool_wear: 0,
  hidden_costs: 0,
  overhead_pct: 0,
  contingency_pct: 0,
  tax_rate: 8,
  market_low: 0,
  market_typical: 0,
  market_high: 0,
  market_notes: "",
  profit_score: 0,
  ai_suggestions: [],
};

export default function NewEstimate() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState(INITIAL);
  const [saving, setSaving] = useState(false);
  const [scanPhotos, setScanPhotos] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState("");
  const [scanError, setScanError] = useState("");
  const [scanMeta, setScanMeta] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [mode, setMode] = useState(null);

  const handleScan = async (urls) => {
    setScanning(true);
    setScanError("");
    setScanNote("");
    setScanMeta(null);
    try {
      const { estimateFields, ai_photo_analysis, job_analysis, labor_compensation, analysis_confidence, meta } = await analyzeJobPhotos(urls, data.job_description);
      // Never let the AI overwrite the contractor's own typed description.
      const { job_description, ...fields } = estimateFields;
      setData((d) => ({
        ...d,
        ...fields,
        photo_urls: [...(d.photo_urls || []), ...urls],
        ai_photo_analysis: [...(d.ai_photo_analysis || []), ...ai_photo_analysis],
        job_analysis,
        labor_compensation,
        analysis_confidence,
      }));
      setScanMeta(meta || null);
      const weightNote = estimateFields.weight
        ? ` · estimated weight ${Number(estimateFields.weight).toLocaleString()} lbs`
        : "";
      setScanNote(
        `AI pre-filled your estimate${estimateFields.job_type ? ` for ${estimateFields.job_type}` : ""}${weightNote}${meta && meta.escalated ? " · low-confidence scan, re-checked with a stronger model" : ""}. Review the steps below.`
      );
    } catch (e) {
      console.error("Job analysis failed:", e);
      setScanError("AI scan failed. You can still fill the estimate manually below.");
    }
    setScanning(false);
  };

  const totalSteps = 9;

  const renderQuickReview = () => {
    const calc = calculateEstimate(data);
    const ready = (data.customer_name || "").trim().length > 0;
    return (
      <>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Quick Estimate Ready</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Add a customer name and save, or refine in detailed steps.</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-primary">{formatCurrency(calc.recommended_price)}</p>
            <p className="text-xs text-muted-foreground">Recommended price</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="min-w-0 rounded-lg bg-secondary/40 p-3">
            <p className="text-xs text-muted-foreground break-words leading-tight">Net profit</p>
            <p className="text-base font-semibold text-foreground truncate">{formatCurrency(calc.net_profit)}</p>
          </div>
          <div className="min-w-0 rounded-lg bg-secondary/40 p-3">
            <p className="text-xs text-muted-foreground break-words leading-tight">Margin</p>
            <p className="text-base font-semibold text-foreground truncate">{calc.profit_margin}%</p>
          </div>
          <div className="min-w-0 rounded-lg bg-secondary/40 p-3">
            <p className="text-xs text-muted-foreground break-words leading-tight">Min price</p>
            <p className="text-base font-semibold text-foreground truncate">{formatCurrency(calc.minimum_price)}</p>
          </div>
        </div>
        {data.weight ? (
          <div className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/20 px-3 py-2">
            <span className="text-xs text-muted-foreground">AI-estimated weight</span>
            <span className="text-sm font-semibold text-foreground">{Number(data.weight).toLocaleString()} lbs</span>
          </div>
        ) : null}
        {scanMeta && scanMeta.notes ? (
          <div className="rounded-lg border border-border/50 bg-secondary/20 px-3 py-2.5 space-y-1.5">
            <span className="text-xs font-medium text-primary">AI reasoning {scanMeta.confidence ? `· ${scanMeta.confidence} confidence` : ""}</span>
            <p className="text-xs text-muted-foreground leading-relaxed">{scanMeta.notes}</p>
          </div>
        ) : null}
        {data.job_analysis && (
          <JobAnalysisPanel data={data} onChange={setData} onAddPhotos={() => setMode("detailed")} />
        )}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Customer name <span className="text-destructive">*</span></label>
          <input
            value={data.customer_name}
            onChange={(e) => setData((d) => ({ ...d, customer_name: e.target.value }))}
            placeholder="e.g. John Smith"
            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => setMode("detailed")} className="text-sm font-medium text-primary hover:underline">
            Refine in detailed steps →
          </button>
          <Button onClick={handleSave} disabled={!ready || saving} className="gap-1.5 h-11 px-5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Estimate
          </Button>
        </div>
      </>
    );
  };

  const canProceed = () => {
    if (step === 1) return (data.customer_name || "").trim().length > 0;
    if (step === 2) return (data.job_type || "").trim().length > 0;
    return true;
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const calc = calculateEstimate(data);

      // Save or find customer
      let customerId = null;
      if (data.customer_name) {
        const customer = await Customer.create({
          name: data.customer_name,
          phone: data.phone,
          email: data.email,
          address: data.address,
        });
        customerId = customer.id;
      }

      const estimate = await Estimate.create({
        ...data,
        ...calc,
        customer_id: customerId,
        status: "completed",
      });

      navigate(`/estimate/${estimate.id}`);
    } catch (e) {
      setSaveError("Couldn't save the estimate. Please try again.");
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1: return <StepCustomer data={data} onChange={setData} />;
      case 2: return <StepJobInfo data={data} onChange={setData} />;
      case 3: return <StepMeasurements data={data} onChange={setData} />;
      case 4: return <PhotoAnalysis data={data} onChange={setData} />;
      case 5: return <StepLabor data={data} onChange={setData} />;
      case 6: return <StepMaterials data={data} onChange={setData} />;
      case 7: return <StepEquipment data={data} onChange={setData} />;
      case 8: return (
        <div className="space-y-8">
          <ProfitEngine data={data} onChange={setData} />
          <div className="border-t border-border/40" />
          <MarketBenchmark data={data} onChange={setData} />
        </div>
      );
      case 9: return (
        <AIReview
          data={data}
          onApplySuggestions={(suggestions) => setData((d) => ({ ...d, ai_suggestions: suggestions }))}
        />
      );
      default: return null;
    }
  };

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 space-y-5 sm:space-y-7">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/")}
            className="h-9 w-9 border-border bg-card"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">New Estimate</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {mode === "detailed"
                ? `Step ${step} of ${totalSteps}`
                : mode === "quick"
                ? "Scan a job site for a fast quote"
                : "Choose how you'd like to estimate"}
            </p>
          </div>
        </div>

        {!mode ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <button
              onClick={() => setMode("quick")}
              className="group text-left rounded-2xl border border-border bg-card p-6 hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                <ScanLine className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Quick Estimate</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                Scan a job site photo and let AI build your estimate in seconds. Best for fast, ballpark quotes.
              </p>
              <span className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-primary group-hover:gap-1.5 transition-all">
                Start Scan <ArrowRight className="w-4 h-4" />
              </span>
            </button>
            <button
              onClick={() => setMode("detailed")}
              className="group text-left rounded-2xl border border-border bg-card p-6 hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                <ListChecks className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Detailed Estimate</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                Build a precise, in-depth estimate across 9 stages. Best for accuracy and full control.
              </p>
              <span className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-primary group-hover:gap-1.5 transition-all">
                Start Detailed <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card p-1.5 w-full sm:w-auto">
            <button
              onClick={() => setMode("quick")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                mode === "quick" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ScanLine className="w-4 h-4" /> Quick
            </button>
            <button
              onClick={() => setMode("detailed")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                mode === "detailed" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ListChecks className="w-4 h-4" /> Detailed (9 steps)
            </button>
          </div>
        )}

        {saveError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {saveError}
          </div>
        )}

        {mode === "quick" && (
          <div className="space-y-7">
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Describe the job <span className="text-muted-foreground font-normal">(optional, helps the AI)</span>
                </label>
                <textarea
                  value={data.job_description || ""}
                  onChange={(e) => setData((d) => ({ ...d, job_description: e.target.value }))}
                  placeholder="e.g. Remove old carpet and haul away debris from a 2nd floor apartment, about 600 sq ft, heavy furniture needs moving"
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Mention materials, quantities, or weight for a more accurate scan.
                </p>
              </div>
              <CameraCapture
                photos={scanPhotos}
                setPhotos={setScanPhotos}
                onCapture={handleScan}
                disabled={scanning}
              />
              {scanning && (
                <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  AI analyzing job site…
                </div>
              )}
              {scanNote && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
                  {scanNote}
                </div>
              )}
              {scanError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {scanError}
                </div>
              )}
            </div>
            {scanNote && !scanError && (
              <div className="rounded-xl border border-border bg-card p-6 space-y-5">
                {renderQuickReview()}
              </div>
            )}
          </div>
        )}

        {mode === "detailed" && (
          <>
            <StepIndicator currentStep={step} />

            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 md:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="gap-1.5 h-11 px-5 border-border bg-card"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              {step === totalSteps ? (
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-1.5 h-11 px-5 bg-primary hover:bg-primary/90"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Estimate
                </Button>
              ) : (
                <Button
                  onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}
                  disabled={!canProceed()}
                  className="gap-1.5 h-11 px-5 bg-primary hover:bg-primary/90"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}