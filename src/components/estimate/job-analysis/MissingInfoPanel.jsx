import React from "react";
import { HelpCircle, Camera } from "lucide-react";

// Deliberately placed near the top of the Job Analysis: the whole point of
// this feature is that the AI tries to improve its estimate instead of
// silently producing a low-quality one, so gaps need to be visible first.
export default function MissingInfoPanel({ missingInformation = [], recommendedPhotos = [], onAddPhotos }) {
  if (missingInformation.length === 0 && recommendedPhotos.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
      {missingInformation.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-400">What couldn't be determined</h3>
          </div>
          <ul className="space-y-1">
            {missingInformation.map((item, i) => (
              <li key={i} className="text-sm text-foreground/90 pl-6 relative before:content-['•'] before:absolute before:left-1.5 before:text-amber-400">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {recommendedPhotos.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Camera className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-400">Photos that would help</h3>
          </div>
          <ul className="space-y-1.5">
            {recommendedPhotos.map((item, i) => (
              <li key={i} className="text-sm text-foreground/90 pl-6 relative before:content-['•'] before:absolute before:left-1.5 before:text-amber-400">
                {item}
              </li>
            ))}
          </ul>
          {onAddPhotos && (
            <button
              onClick={onAddPhotos}
              className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <Camera className="w-3.5 h-3.5" /> Add more photos
            </button>
          )}
        </div>
      )}
    </div>
  );
}
