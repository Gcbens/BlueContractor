import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Estimate } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertCircle, ScanLine } from "lucide-react";
import { calculateEstimate } from "@/lib/estimateCalculations";
import CameraCapture from "@/components/scan/CameraCapture";
import ScanResults from "@/components/scan/ScanResults";
import { analyzeJobPhotos, fetchSimilarJobs } from "@/lib/scanEstimate";

const DEFAULT_DATA = {
  customer_name: "",
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
  materials: [],
  equipment_rental: 0,
  fuel_cost: 0,
  consumables: 0,
  tool_wear: 0,
  hidden_costs: 0,
  tax_rate: 8,
  photo_urls: [],
  ai_photo_analysis: [],
};

export default function ScanEstimate() {
  const navigate = useNavigate();
  const [stage, setStage] = useState("capture");
  const [photos, setPhotos] = useState([]);
  const [data, setData] = useState(DEFAULT_DATA);
  const [aiMeta, setAiMeta] = useState({ confidence: "", notes: "", detected_items: [] });
  const [similarJobs, setSimilarJobs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const calc = useMemo(() => calculateEstimate(data), [data]);

  const analyze = async (urls) => {
    setStage("analyzing");
    setError("");
    try {
      const { estimateFields, ai_photo_analysis, meta } = await analyzeJobPhotos(urls);
      setData({
        ...DEFAULT_DATA,
        ...estimateFields,
        photo_urls: photos,
        ai_photo_analysis,
      });
      setAiMeta(meta);
      setSimilarJobs(await fetchSimilarJobs(estimateFields.job_type));
      setStage("results");
    } catch (e) {
      setError("AI analysis failed. Try retaking the photo or uploading a clearer image.");
      setStage("capture");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const c = calculateEstimate(data);
      const estimate = await Estimate.create({
        ...data,
        ...c,
        customer_name: (data.customer_name || "").trim() || "Quick Scan",
        status: "completed",
      });
      navigate(`/estimate/${estimate.id}`);
    } catch (e) {
      setError("Could not save the estimate. Please try again.");
      setSaving(false);
    }
  };

  const rescan = () => {
    setStage("capture");
    setPhotos([]);
    setData(DEFAULT_DATA);
    setAiMeta({ confidence: "", notes: "", detected_items: [] });
    setSimilarJobs([]);
    setError("");
  };

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-3xl px-6 py-8 space-y-7">
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ScanLine className="w-6 h-6 text-primary" /> Scan Estimate
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stage === "capture" && "Snap a photo — AI prices the job"}
              {stage === "analyzing" && "AI is analyzing your photo…"}
              {stage === "results" && "Review and adjust the AI estimate"}
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-6 md:p-8">
          {stage === "capture" && (
            <CameraCapture
              photos={photos}
              setPhotos={setPhotos}
              onCapture={analyze}
              disabled={false}
            />
          )}

          {stage === "analyzing" && (
            <div className="py-16 text-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
              <p className="text-sm font-medium">Analyzing job site…</p>
              <p className="text-xs text-muted-foreground mt-1">
                Identifying materials, measurements, labor, and hidden costs
              </p>
            </div>
          )}

          {stage === "results" && (
            <ScanResults
              data={data}
              setData={setData}
              calc={calc}
              aiMeta={aiMeta}
              similarJobs={similarJobs}
              onSave={handleSave}
              saving={saving}
              onRescan={rescan}
            />
          )}
        </div>
      </div>
    </div>
  );
}