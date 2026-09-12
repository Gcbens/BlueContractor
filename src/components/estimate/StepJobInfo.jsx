import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function StepJobInfo({ data, onChange }) {
  const set = (field, value) => onChange({ ...data, [field]: value });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Job Information</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Describe the work to be done
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label className="text-xs text-muted-foreground">Job Type *</Label>
          <Input
            placeholder="e.g. Painting, Roofing, Flooring"
            value={data.job_type || ""}
            onChange={(e) => set("job_type", e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Property Type</Label>
          <Select value={data.property_type || "residential"} onValueChange={(v) => set("property_type", v)}>
            <SelectTrigger className="bg-secondary/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Difficulty</Label>
          <Select value={data.difficulty || "moderate"} onValueChange={(v) => set("difficulty", v)}>
            <SelectTrigger className="bg-secondary/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
              <SelectItem value="extreme">Extreme</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Description</Label>
        <Textarea
          placeholder="Describe the scope of work..."
          value={data.job_description || ""}
          onChange={(e) => set("job_description", e.target.value)}
          rows={3}
          className="bg-secondary/50 border-border/50 resize-none"
        />
      </div>
    </div>
  );
}