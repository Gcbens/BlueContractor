import { supabase } from '@/api/supabaseClient';

const BUCKET = 'estimate-photos';

export async function uploadFile({ file }) {
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { file_url: data.publicUrl };
}
