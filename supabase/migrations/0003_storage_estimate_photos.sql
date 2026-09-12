-- Phase 4: RLS for the public estimate-photos storage bucket.
-- Bucket itself created via the Storage API (public:true), not SQL.

create policy "estimate_photos_insert_authenticated"
on storage.objects for insert
to authenticated
with check (bucket_id = 'estimate-photos');

create policy "estimate_photos_select_public"
on storage.objects for select
using (bucket_id = 'estimate-photos');
