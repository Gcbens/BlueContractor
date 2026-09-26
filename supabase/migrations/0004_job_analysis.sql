-- Phase 5: structured AI Job Analysis + labor compensation breakdown.
-- Additive only — existing estimates default to empty analysis and keep working unchanged.

alter table public.estimates
  add column if not exists job_analysis jsonb not null default '{}'::jsonb,
  add column if not exists labor_compensation jsonb not null default '{}'::jsonb,
  add column if not exists analysis_confidence numeric;
