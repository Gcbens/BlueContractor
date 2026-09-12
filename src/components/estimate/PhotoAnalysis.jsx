import React, { useState, useRef } from "react";
import { invokeAI } from "@/lib/aiClient";
import { uploadFile } from "@/lib/uploadFile";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Sparkles, Camera, AlertTriangle, X } from "lucide-react";
import { Image } from "@/components/ui/image";
import { motion, AnimatePresence } from "framer-motion";

const detectableItems = [
  "Furniture", "Cabinets", "Appliances", "Stairs", "Heavy Items",
  "Windows", "Doors", "Walls", "Trees", "Debris", "Hazards",
];

const categoryColors = {
  labor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  equipment: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  material: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  hidden_cost: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  safety: "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function PhotoAnalysis({ data, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(data.ai_photo_analysis || []);
  const [detectedItems, setDetectedItems] = useState([]);
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
    analyzePhotos(newUrls);
  };

  const analyzePhotos = async (urls) => {
    if (!urls || urls.length === 0) return;
    setAnalyzing(true);
    const desc = (data.job_description || "").trim();
    let prompt = `You are an expert contractor estimator analyzing job site photos. For each photo, identify relevant items and suggest how they affect the estimate.

Look for: furniture, cabinets, appliances, stairs, heavy items, windows, doors, walls, trees, debris, and hazards.

Pay special attention to weight — heavy or bulky items (appliances, furniture, debris, construction materials) increase labor, equipment, fuel, and disposal costs. Note estimated weight where it affects the estimate.

For each detected item, provide:
- The item name
- A suggestion for additional labor, equipment, material, or hidden cost
- Category: "labor", "equipment", "material", "hidden_cost", or "safety"

Be practical and specific. Focus on things that affect cost or safety.`;
    if (desc) {
      prompt += `\n\nThe contractor described the job as: "${desc}". Use this context to make your suggestions more accurate.`;
    }

    try {
      const result = await invokeAI({
        prompt,
        file_urls: urls,
        response_json_schema: {
          type: "object",
          properties: {
            detected_items: {
              type: "array",
              items: { type: "string" },
            },
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item: { type: "string" },
                  suggestion: { type: "string" },
                  category: { type: "string", enum: ["labor", "equipment", "material", "hidden_cost", "safety"] },
                },
                required: ["item", "suggestion", "category"],
              },
            },
          },
        },
      });
      setDetectedItems(result.detected_items || []);
      const newAnalysis = result.suggestions || [];
      const combined = [...analysis, ...newAnalysis];
      setAnalysis(combined);
      onChange({ ...data, photo_urls: photos, ai_photo_analysis: combined });
    } catch (e) {
      /* keep existing analysis */
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
          Upload job site photos — AI identifies items and suggests additional costs
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
          <p className="text-sm text-muted-foreground">AI analyzing photos for hidden costs...</p>
        </div>
      )}

      {/* Detected Items */}
      {!analyzing && detectedItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            AI Detected
          </p>
          <div className="flex flex-wrap gap-2">
            {detectedItems.map((item, i) => (
              <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary/50 text-muted-foreground">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      <AnimatePresence>
        {!analyzing && analysis.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                AI Suggestions from Photos
              </p>
            </div>
            {analysis.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-xl border p-4 ${categoryColors[s.category] || categoryColors.hidden_cost}`}
              >
                <div className="flex items-start gap-3">
                  {s.category === "safety" ? (
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  ) : (
                    <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide opacity-70 mb-0.5">
                      {s.item}
                    </p>
                    <p className="text-sm">{s.suggestion}</p>
                  </div>
                  <span className="text-xs font-medium capitalize opacity-60 shrink-0">
                    {s.category.replace("_", " ")}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Re-analyze button */}
      {photos.length > 0 && !analyzing && analysis.length === 0 && (
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