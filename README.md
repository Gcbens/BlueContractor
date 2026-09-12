# BlueContractor

A contractor estimating app: turn job-site photos and job details into profitable, accurate estimates. Built with React + Vite + Tailwind, backed by Supabase (Postgres, Auth, Storage, Edge Functions) and Anthropic's Claude API for AI-assisted estimation.

## Prerequisites

1. Clone the repository and `cd` into it.
2. Install dependencies: `npm install`.
3. A Supabase project (create one at [supabase.com](https://supabase.com) if you don't have one).

## Environment Variables

Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-or-publishable-key>
```

These are the only client-exposed variables — anything without a `VITE_` prefix stays server-side only and is never bundled into the app.

## Database Setup

Run the SQL migrations in `supabase/migrations/` against your Supabase project, in order (via the Dashboard's SQL Editor, or `supabase db push` with the CLI). They set up:

- `estimates` and `customers` tables, matching the app's data model exactly (including the JSONB `materials`, `photo_urls`, `ai_suggestions`, and `ai_photo_analysis` fields).
- `profiles`, a three-tier role system (`user` / `admin` / `owner`) with Row Level Security — regular users see only their own data, `admin`/`owner` can see all users' estimates and customers, and only `owner` can change roles.
- The `estimate-photos` public Storage bucket used for job-site photo uploads (created via the Storage API — see the bucket note in `supabase/migrations/0003_storage_estimate_photos.sql`).

The first migration seeds an `owner` role for a specific email — update that address in `0001_init_schema.sql` before running it if you're setting this up fresh, or run the equivalent `UPDATE` manually afterward.

## AI Endpoint

AI features (photo scanning, profit review, market benchmarking) run through a Supabase Edge Function at `supabase/functions/ai/`, which calls Anthropic's Claude API server-side. Deploy it and set its secret:

```bash
supabase functions deploy ai --project-ref <your-project-ref>
supabase secrets set ANTHROPIC_API_KEY=<your-anthropic-key> --project-ref <your-project-ref>
```

Get an Anthropic API key from [console.anthropic.com](https://console.anthropic.com) — make sure it's scoped to a specific workspace (create it from within a workspace page), otherwise requests will fail. Anthropic API usage is billed pay-per-token; set a spend limit in the Console if you want a hard cost ceiling.

## Auth

Auth is handled by Supabase Auth (email/password + Google OAuth). To enable Google sign-in, create an OAuth client in Google Cloud Console and add its Client ID/Secret under Supabase Dashboard → Authentication → Providers → Google.

Email confirmation uses a 6-digit code (not a magic link) — this requires custom SMTP (the free Supabase tier can't edit email templates otherwise). See Supabase Dashboard → Authentication → Emails → SMTP Settings; the "Confirm signup" template should use `{{ .Token }}`.

## Run Locally

```bash
npm run dev
```

Open the local URL printed by Vite.

## Build

```bash
npm run build
```
