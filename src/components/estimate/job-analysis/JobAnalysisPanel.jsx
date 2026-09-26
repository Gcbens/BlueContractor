import React from "react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Ruler, Boxes, Weight, ArrowUpFromLine, Wrench, ShieldAlert, Users, ClipboardList, Layers, CloudSun } from "lucide-react";
import { buildLaborCompensation, updateAnalysisField } from "@/lib/jobAnalysis";
import LaborCompensationCard from "@/components/estimate/job-analysis/LaborCompensationCard";
import MissingInfoPanel from "@/components/estimate/job-analysis/MissingInfoPanel";
import FollowUpQuestions from "@/components/estimate/job-analysis/FollowUpQuestions";

// Preserve an empty field while the contractor is mid-edit instead of
// snapping it back to 0 — matches the pattern used elsewhere (StepLabor.jsx).
const numOrEmpty = (v) => (v === "" ? "" : Number(v));

const LEVEL_LABELS = {
  // working height
  ground_level: "Ground level", under_6ft: "Under 6 ft", "6_to_10ft": "6-10 ft",
  "10_to_20ft": "10-20 ft", "20ft_plus": "20+ ft", roof_level: "Roof level", multiple_stories: "Multiple stories",
  // access / demand / complexity / risk (shared low..very_high style)
  easy: "Easy", moderate: "Moderate", difficult: "Difficult", very_difficult: "Very difficult",
  low: "Low", high: "High", very_high: "Very high",
  simple: "Simple", complex: "Complex", highly_complex: "Highly complex",
  // skill level
  entry_level: "Entry level", intermediate: "Intermediate", experienced: "Experienced",
  specialist: "Specialist", licensed_professional: "Licensed professional", master: "Master level",
};

const RISK_TONE = { low: "outline", moderate: "secondary", high: "destructive", very_high: "destructive" };

function label(key) {
  return LEVEL_LABELS[key] || String(key || "").replace(/_/g, " ");
}

function ConfidencePill({ confidence }) {
  if (confidence == null) return null;
  const tone = confidence >= 70 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
    : confidence >= 45 ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
    : "bg-red-500/10 text-red-400 border-red-500/30";
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${tone}`}>
      {Math.round(confidence)}% confidence
    </span>
  );
}

function SourcePill({ source }) {
  if (!source) return null;
  const labelText = source === "user_provided" ? "User confirmed" : source === "observed" ? "Observed" : source === "unknown" ? "Unknown" : "Estimated";
  return <Badge variant={source === "user_provided" ? "default" : "outline"} className="text-[10px] font-normal">{labelText}</Badge>;
}

function TrackedRow({ label: rowLabel, field, onEdit, suffix = "", type = "number" }) {
  if (!field) return null;
  const displayValue = field.value ?? "";
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-border/30 last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{rowLabel}</span>
      <div className="flex items-center gap-2">
        {onEdit ? (
          <Input
            type={type}
            value={displayValue}
            onChange={(e) => onEdit(type === "number" ? numOrEmpty(e.target.value) : e.target.value)}
            className="h-7 w-24 text-right text-sm bg-input/50"
          />
        ) : (
          <span className="text-sm font-medium">{displayValue}{suffix}</span>
        )}
        <ConfidencePill confidence={field.confidence} />
        <SourcePill source={field.source} />
      </div>
    </div>
  );
}

function LevelRow({ rowLabel, level, reasons, confidence, options, onEdit, tone }) {
  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{rowLabel}</span>
        <div className="flex items-center gap-2">
          {onEdit ? (
            <select
              value={level || ""}
              onChange={(e) => onEdit(e.target.value)}
              className="h-7 rounded-md border border-input bg-input/50 px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {options.map((o) => <option key={o} value={o}>{label(o)}</option>)}
            </select>
          ) : (
            <Badge variant={tone ? RISK_TONE[tone] : "secondary"}>{label(level)}</Badge>
          )}
          <ConfidencePill confidence={confidence} />
        </div>
      </div>
      {reasons && reasons.length > 0 && (
        <p className="text-xs text-muted-foreground mt-1">{reasons.join(" · ")}</p>
      )}
    </div>
  );
}

const HEIGHT_OPTIONS = ["ground_level", "under_6ft", "6_to_10ft", "10_to_20ft", "20ft_plus", "roof_level", "multiple_stories"];
const FOUR_LEVEL = { access: ["easy", "moderate", "difficult", "very_difficult"], std: ["low", "moderate", "high", "very_high"] };
const COMPLEXITY_OPTIONS = ["simple", "moderate", "complex", "highly_complex"];
const SKILL_OPTIONS = ["entry_level", "intermediate", "experienced", "specialist", "licensed_professional", "master"];

export default function JobAnalysisPanel({ data, onChange, onAddPhotos }) {
  const analysis = data.job_analysis;
  if (!analysis || Object.keys(analysis).length === 0) return null;

  const laborComp = data.labor_compensation && Object.keys(data.labor_compensation).length > 0
    ? data.labor_compensation
    : buildLaborCompensation(analysis, data.hourly_rate);

  const updateField = (path, value) => {
    onChange({ ...data, ...updateAnalysisField(data, path, value) });
  };

  const m = analysis.measurements || {};
  const lb = analysis.laborBreakdown || {};
  const overrides = analysis.overrides || {};
  const answeredPaths = new Set(Object.keys(overrides));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Job Analysis</h2>
          {analysis.jobSummary && <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">{analysis.jobSummary}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ConfidencePill confidence={data.analysis_confidence ?? analysis.overallConfidence} />
          {analysis.risk?.level && <Badge variant={RISK_TONE[analysis.risk.level] || "secondary"}>{label(analysis.risk.level)} risk</Badge>}
          <Badge variant="outline">{analysis.crewSize?.recommended || 1} worker{(analysis.crewSize?.recommended || 1) > 1 ? "s" : ""}</Badge>
        </div>
      </div>

      <FollowUpQuestions
        questions={analysis.followUpQuestions || []}
        answeredPaths={answeredPaths}
        onAnswer={updateField}
      />

      <MissingInfoPanel
        missingInformation={analysis.missingInformation || []}
        recommendedPhotos={analysis.recommendedPhotos || []}
        onAddPhotos={onAddPhotos}
      />

      <LaborCompensationCard comp={laborComp} />

      <Accordion type="multiple" defaultValue={[]} className="rounded-xl border border-border/50 bg-card/50 px-4">
        <AccordionItem value="dimensions">
          <AccordionTrigger className="text-sm"><span className="flex items-center gap-2"><Ruler className="w-4 h-4 text-muted-foreground" /> Dimensions & Measurements</span></AccordionTrigger>
          <AccordionContent>
            {(analysis.keyQuantities || []).map((q, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-1.5 border-b border-border/30 last:border-0">
                <span className="text-sm text-muted-foreground shrink-0">{q.label}</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={q.value ?? ""}
                    onChange={(e) => updateField(`keyQuantities.${i}.value`, numOrEmpty(e.target.value))}
                    className="h-7 w-20 text-right text-sm bg-input/50"
                  />
                  <span className="text-xs text-muted-foreground">{q.unit}</span>
                  <ConfidencePill confidence={q.confidence} />
                  <SourcePill source={q.source} />
                </div>
              </div>
            ))}
            <TrackedRow rowLabel="Length" field={m.length} suffix=" ft" onEdit={(v) => updateField("measurements.length.value", v)} />
            <TrackedRow rowLabel="Width" field={m.width} suffix=" ft" onEdit={(v) => updateField("measurements.width.value", v)} />
            <TrackedRow rowLabel="Height" field={m.height} suffix=" ft" onEdit={(v) => updateField("measurements.height.value", v)} />
            <TrackedRow rowLabel="Square footage" field={m.squareFootage} suffix=" sqft" onEdit={(v) => updateField("measurements.squareFootage.value", v)} />
            <TrackedRow rowLabel="Volume" field={m.volume} suffix=" cu ft" onEdit={(v) => updateField("measurements.volume.value", v)} />
            <TrackedRow rowLabel="# Objects" field={m.numObjects} onEdit={(v) => updateField("measurements.numObjects.value", v)} />
            <TrackedRow rowLabel="# Rooms" field={m.numRooms} onEdit={(v) => updateField("measurements.numRooms.value", v)} />
            {m.approximateDistances && <p className="text-xs text-muted-foreground pt-2">{m.approximateDistances}</p>}
            {m.referenceObjectUsed && <p className="text-xs text-muted-foreground pt-1">Scale reference: {m.referenceObjectUsed}</p>}
            {m.perspectiveNotes && <p className="text-xs text-muted-foreground pt-1">{m.perspectiveNotes}</p>}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="materials">
          <AccordionTrigger className="text-sm"><span className="flex items-center gap-2"><Boxes className="w-4 h-4 text-muted-foreground" /> Materials & Weight</span></AccordionTrigger>
          <AccordionContent className="space-y-3">
            {(analysis.materials || []).map((mat, i) => (
              <div key={i} className="flex items-center justify-between gap-2 py-1">
                <Input
                  value={mat.name || ""}
                  onChange={(e) => updateField(`materials.${i}.name`, e.target.value)}
                  className="h-8 text-sm bg-input/50 flex-1"
                />
                <ConfidencePill confidence={mat.confidence} />
                <SourcePill source={mat.source} />
              </div>
            ))}
            {analysis.estimatedWeight && (
              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Weight className="w-3.5 h-3.5" /> Estimated weight</span>
                <span className="text-sm font-medium">
                  {Math.round(analysis.estimatedWeight.low || 0).toLocaleString()} to {Math.round(analysis.estimatedWeight.high || 0).toLocaleString()} lb
                </span>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="access">
          <AccordionTrigger className="text-sm"><span className="flex items-center gap-2"><ArrowUpFromLine className="w-4 h-4 text-muted-foreground" /> Height, Access & Physical Demand</span></AccordionTrigger>
          <AccordionContent>
            <LevelRow rowLabel="Working height" level={analysis.workingHeight?.level} reasons={analysis.workingHeight?.reasons} confidence={analysis.workingHeight?.confidence} options={HEIGHT_OPTIONS} onEdit={(v) => updateField("workingHeight.level", v)} />
            <LevelRow rowLabel="Access difficulty" level={analysis.accessDifficulty?.level} reasons={analysis.accessDifficulty?.reasons} confidence={analysis.accessDifficulty?.confidence} options={FOUR_LEVEL.access} onEdit={(v) => updateField("accessDifficulty.level", v)} />
            <LevelRow rowLabel="Physical demand" level={analysis.physicalDemand?.level} reasons={analysis.physicalDemand?.reasons} confidence={analysis.physicalDemand?.confidence} options={FOUR_LEVEL.std} onEdit={(v) => updateField("physicalDemand.level", v)} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="scope">
          <AccordionTrigger className="text-sm"><span className="flex items-center gap-2"><Layers className="w-4 h-4 text-muted-foreground" /> Complexity, Trade & Crew</span></AccordionTrigger>
          <AccordionContent>
            <LevelRow rowLabel="Complexity" level={analysis.complexity?.level} reasons={analysis.complexity?.reasons} confidence={analysis.complexity?.confidence} options={COMPLEXITY_OPTIONS} onEdit={(v) => updateField("complexity.level", v)} />
            <LevelRow rowLabel="Required skill level" level={analysis.skillLevel} options={SKILL_OPTIONS} onEdit={(v) => updateField("skillLevel", v)} />
            <LevelRow rowLabel="Risk" level={analysis.risk?.level} reasons={analysis.risk?.reasons} confidence={analysis.risk?.confidence} options={FOUR_LEVEL.std} tone={analysis.risk?.level} onEdit={(v) => updateField("risk.level", v)} />
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Recommended crew</span>
              <Input type="number" value={analysis.crewSize?.recommended ?? ""} onChange={(e) => updateField("crewSize.recommended", numOrEmpty(e.target.value))} className="h-7 w-16 text-right text-sm bg-input/50" />
            </div>
            {analysis.crewSize?.reason && <p className="text-xs text-muted-foreground">{analysis.crewSize.reason}</p>}
            {(analysis.tradesRequired || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {analysis.tradesRequired.map((t, i) => <Badge key={i} variant="outline">{t}</Badge>)}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="labor">
          <AccordionTrigger className="text-sm"><span className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-muted-foreground" /> Labor Breakdown</span></AccordionTrigger>
          <AccordionContent>
            {["preparation", "demolition", "removal", "installation", "repair", "finishing", "testing", "cleanup", "loading"].map((phase) => (
              lb[phase] != null && lb[phase] !== 0 ? (
                <div key={phase} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                  <span className="text-sm text-muted-foreground capitalize">{phase}</span>
                  <Input type="number" step="0.5" value={lb[phase] ?? ""} onChange={(e) => updateField(`laborBreakdown.${phase}`, numOrEmpty(e.target.value))} className="h-7 w-20 text-right text-sm bg-input/50" />
                </div>
              ) : null
            ))}
            <div className="flex items-center justify-between pt-3">
              <span className="text-sm font-semibold">Total labor hours</span>
              <div className="flex items-center gap-2">
                <Input type="number" step="0.5" value={analysis.totalLaborHours ?? ""} onChange={(e) => updateField("totalLaborHours", numOrEmpty(e.target.value))} className="h-8 w-20 text-right text-sm font-semibold bg-input/50" />
                {overrides.totalLaborHours && <Badge variant="default" className="text-[10px]">Edited</Badge>}
              </div>
            </div>
            {analysis.estimatedDuration != null && (
              <p className="text-xs text-muted-foreground pt-1">Estimated job duration: {analysis.estimatedDuration} hrs (with {analysis.crewSize?.recommended || 1} workers in parallel)</p>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tools">
          <AccordionTrigger className="text-sm"><span className="flex items-center gap-2"><Wrench className="w-4 h-4 text-muted-foreground" /> Tools, Equipment, Prep & Cleanup</span></AccordionTrigger>
          <AccordionContent className="space-y-3">
            {(analysis.tools || []).length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Contractor tools</p>
                <div className="flex flex-wrap gap-1.5">{analysis.tools.map((t, i) => <Badge key={i} variant="outline">{t}</Badge>)}</div>
              </div>
            )}
            {(analysis.equipment || []).length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Equipment</p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.equipment.map((eq, i) => (
                    <Badge key={i} variant={eq.likelyRental ? "secondary" : "outline"}>{eq.name}{eq.likelyRental ? " · rental" : ""}</Badge>
                  ))}
                </div>
              </div>
            )}
            {analysis.demolition?.required && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Demolition & removal</p>
                <ul className="text-sm space-y-0.5">{(analysis.demolition.tasks || []).map((t, i) => <li key={i}>• {t}</li>)}</ul>
                {analysis.demolition.debrisWeight && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Debris: {analysis.demolition.debrisWeight.low}-{analysis.demolition.debrisWeight.high} lb
                  </p>
                )}
              </div>
            )}
            {(analysis.preparation || []).length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Preparation</p>
                <ul className="text-sm space-y-0.5">{analysis.preparation.map((t, i) => <li key={i}>• {t}</li>)}</ul>
              </div>
            )}
            {(analysis.cleanup || []).length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Cleanup</p>
                <ul className="text-sm space-y-0.5">{analysis.cleanup.map((t, i) => <li key={i}>• {t}</li>)}</ul>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {(analysis.possibleRequirements?.length > 0 || analysis.groundConditions?.length > 0 || analysis.weather?.relevant) && (
          <AccordionItem value="conditions">
            <AccordionTrigger className="text-sm"><span className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-muted-foreground" /> Permits, Ground & Weather</span></AccordionTrigger>
            <AccordionContent className="space-y-2">
              {(analysis.possibleRequirements || []).map((r, i) => (
                <p key={i} className="text-sm text-amber-400">{r}</p>
              ))}
              {(analysis.groundConditions || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {analysis.groundConditions.map((g, i) => <Badge key={i} variant="outline">{g}</Badge>)}
                </div>
              )}
              {analysis.weather?.relevant && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5"><CloudSun className="w-3.5 h-3.5" /> {analysis.weather.notes}</p>
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {(analysis.jobComponents || []).length > 0 && (
          <AccordionItem value="components">
            <AccordionTrigger className="text-sm">Job Components ({analysis.jobComponents.length})</AccordionTrigger>
            <AccordionContent className="space-y-2">
              {analysis.jobComponents.map((c, i) => (
                <div key={i} className="rounded-lg bg-secondary/30 p-3">
                  <p className="text-sm font-medium">{c.name} <span className="text-xs text-muted-foreground font-normal">· {c.trade}</span></p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.laborHours} hrs · {c.crewSize} worker{c.crewSize > 1 ? "s" : ""}{c.notes ? ` · ${c.notes}` : ""}</p>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}

        {(analysis.assumptions || []).length > 0 && (
          <AccordionItem value="assumptions">
            <AccordionTrigger className="text-sm">Assumptions</AccordionTrigger>
            <AccordionContent>
              <ul className="text-sm space-y-1 text-muted-foreground">
                {analysis.assumptions.map((a, i) => <li key={i}>• {a}</li>)}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}
