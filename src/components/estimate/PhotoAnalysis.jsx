import React, { useState, useRef } from "react";
import { uploadFile } from "@/lib/uploadFile";
import { runJobAnalysis, flattenForPricing, buildLaborCompensation, computeOverallConfidence, mergeWithOverrides } from "@/lib/jobAnalysis";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Sparkles, Camera, X } from "lucide-react";
import { Image } from "@/components/ui/image";
import JobAnalysisPanel from "@/components/estimate/job-analysis/JobAnalysisPanel";

export default function PhotoAnalysis({ data, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const photos = data.photo_urls || [];

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls = [];
    for (const file of files) {
      const { file_url } = await uploadFile({ file });
      newUrls.push(file_url);
    }
    const updated = [...photos, ...newUrls];
    onChange({ ...data, photo_urls: updated });
    setUploading(false);
    analyzePhotos(updated);
  };

  const analyzePhotos = async (urls) => {
    if (!urls || urls.length === 0) return;
    setAnalyzing(true);
    setError("");
    try {
      let analysis = await runJobAnalysis(urls, data.job_description);
      // A re-analysis (e.g. after adding more photos) must never silently
      // discard fields the contractor already corrected by hand, or the
      // AI-vs-confirmed feedback history recorded for them.
      analysis = mergeWithOverrides(analysis, data.job_analysis?.overrides, data.job_analysis?.feedback);

      const flattened = flattenForPricing(analysis);
      const laborComp = buildLaborCompensation(analysis, data.hourly_rate || flattened.hourly_rate);
      const confidence = computeOverallConfidence(analysis);
      // Never let the AI overwrite the contractor's own typed description.
      const { job_description, ...fields } = flattened;

      onChange({
        ...data,
        ...fields,
        photo_urls: urls,
        job_analysis: analysis,
        labor_compensation: laborComp,
        analysis_confidence: confidence,
      });
    } catch (e) {
      console.error("Job analysis failed:", e);
      setError("AI analysis failed. You can still fill the estimate manually below.");
    }
    setAnalyzing(false);
  };

  const removePhoto = (index) => {
    const updated = photos.filter((_, i) => i !== index);
    onChange({ ...data, photo_urls: updated });
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">AI Photo Analysis</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          Upload job site photos and AI identifies items and suggests additional costs
        </p>
      </div>

      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="rounded-xl border-2 border-dashed border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-colors p-8 text-center cursor-pointer"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <>
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Camera className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm font-medium">Add job site photos</p>
            <p className="text-xs text-muted-foreground mt-0.5">Drag here or use a button below</p>
          </>
        )}
      </div>

      {/* Capture Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploading || analyzing}
          className="gap-1.5 bg-primary hover:bg-primary/90 flex-1"
        >
          <Camera className="w-4 h-4" /> Take Photo
        </Button>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || analyzing}
          variant="outline"
          className="gap-1.5 border-border/50 flex-1"
        >
          <Upload className="w-4 h-4" /> Upload
        </Button>
      </div>

      {/* Uploaded Photos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {photos.map((url, i) => (
            <div key={i} className="relative group rounded-lg overflow-hidden aspect-square bg-secondary/30">
              <Image src={url} alt={`Job site ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Analyzing State */}
      {analyzing && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-6 text-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">AI analyzing the job like an estimator would: dimensions, materials, access, labor…</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {!analyzing && (
        <JobAnalysisPanel data={data} onChange={onChange} onAddPhotos={() => fileInputRef.current?.click()} />
      )}

      {/* Re-analyze button */}
      {photos.length > 0 && !analyzing && !data.job_analysis?.jobType && (
        <Button
          onClick={() => analyzePhotos(photos)}
          variant="outline"
          className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
        >
          <Sparkles className="w-4 h-4" /> Analyze Photos
        </Button>
      )}
    </div>
  );
}