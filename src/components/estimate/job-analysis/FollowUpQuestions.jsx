import React, { useState } from "react";
import { HelpCircle, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const IMPACT_RANK = { high: 0, medium: 1, low: 2 };
const IMPACT_TONE = {
  high: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  medium: "bg-secondary text-muted-foreground",
  low: "bg-secondary text-muted-foreground",
};

// Only the handful of questions that could actually move the price. This is
// the core of "photo-first" estimating: the AI decides what's worth asking,
// the contractor answers a couple of one-line questions instead of filling
// out a form. Answering one immediately corrects that field and re-prices.
export default function FollowUpQuestions({ questions, answeredPaths, onAnswer, maxShown = 4 }) {
  const [drafts, setDrafts] = useState({});

  const open = (questions || [])
    .filter((q) => q.field && q.question && q.question.trim() && !answeredPaths.has(q.field))
    .sort((a, b) => (IMPACT_RANK[a.impact] ?? 3) - (IMPACT_RANK[b.impact] ?? 3))
    .slice(0, maxShown);

  if (open.length === 0) return null;

  const submit = (q) => {
    const raw = drafts[q.field];
    if (raw == null || raw === "") return;
    const value = q.inputType === "number" ? Number(raw) : raw;
    onAnswer(q.field, value);
    setDrafts((d) => ({ ...d, [q.field]: undefined }));
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">A few quick questions</h3>
        <span className="text-xs text-muted-foreground">these change the price, everything else is already handled</span>
      </div>
      <div className="space-y-2.5">
        {open.map((q, i) => (
          <div key={`${q.field}-${i}`} className="flex items-center gap-2">
            <Badge className={`text-[10px] shrink-0 ${IMPACT_TONE[q.impact] || IMPACT_TONE.medium}`} variant="outline">
              {q.impact || "medium"}
            </Badge>
            <span className="text-sm text-foreground flex-1 min-w-0">{q.question}</span>
            <Input
              type={q.inputType === "number" ? "number" : "text"}
              value={drafts[q.field] ?? ""}
              onChange={(e) => setDrafts((d) => ({ ...d, [q.field]: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && submit(q)}
              placeholder={q.unit || "answer"}
              className="h-8 w-28 text-sm bg-input/50 shrink-0"
            />
            <button
              onClick={() => submit(q)}
              disabled={drafts[q.field] == null || drafts[q.field] === ""}
              className="w-8 h-8 shrink-0 rounded-md flex items-center justify-center text-primary hover:bg-primary/10 disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Submit answer"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
