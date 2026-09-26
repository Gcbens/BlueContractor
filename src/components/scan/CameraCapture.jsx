import React, { useRef, useState } from "react";
import { uploadFile } from "@/lib/uploadFile";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2, X, ScanLine } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function CameraCapture({ photos, setPhotos, onCapture, disabled }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [pending, setPending] = useState([]);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError("");
    const newUrls = [];
    try {
      for (const file of files) {
        const { file_url } = await uploadFile({ file });
        newUrls.push(file_url);
      }
      setPhotos([...photos, ...newUrls]);
      setPending((p) => [...p, ...newUrls]);
    } catch (e) {
      setUploadError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  };

  const runAnalysis = () => {
    if (pending.length === 0 || disabled) return;
    const urls = pending;
    setPending([]);
    onCapture(urls);
  };

  const removePhoto = (index) => {
    const removed = photos[index];
    setPhotos(photos.filter((_, i) => i !== index));
    if (removed) setPending((p) => p.filter((u) => u !== removed));
  };

  return (
    <div className="space-y-5">
      <div className="text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <ScanLine className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Scan a Job Site</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Snap a photo of the materials, area, or job site. AI identifies the scope,
          materials, labor, and hidden costs, then prices the job for you.
        </p>
      </div>

      {/* Dropzone */}
      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!disabled) handleFiles(e.dataTransfer.files);
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
            <p className="text-sm text-muted-foreground">Uploading…</p>
          </>
        ) : (
          <>
            <Camera className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
            <p className="text-sm font-medium">Add job site photos</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Drag here or use a button below
            </p>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploading || disabled}
          className="gap-1.5 bg-primary hover:bg-primary/90 flex-1 h-11"
        >
          <Camera className="w-4 h-4" /> Take Photo
        </Button>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
          variant="outline"
          className="gap-1.5 border-border/50 flex-1 h-11"
        >
          <Upload className="w-4 h-4" /> Upload
        </Button>
      </div>

      {uploadError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {uploadError}
        </div>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {photos.map((url, i) => (
            <div
              key={i}
              className="relative group rounded-lg overflow-hidden aspect-square bg-secondary/30"
            >
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

      {pending.length > 0 && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <ScanLine className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">
              {pending.length} photo{pending.length > 1 ? "s" : ""} ready. Add more, or start the AI analysis when you're ready.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={runAnalysis}
              disabled={disabled}
              className="gap-1.5 bg-primary hover:bg-primary/90 flex-1 h-11"
            >
              <ScanLine className="w-4 h-4" /> Analyze with AI
            </Button>
            <Button
              onClick={() => setPending([])}
              disabled={disabled}
              variant="ghost"
              className="gap-1.5 h-11"
            >
              <X className="w-4 h-4" /> Skip
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}