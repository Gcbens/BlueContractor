import { supabase } from '@/api/supabaseClient';

export async function invokeAI(payload) {
  const { data, error } = await supabase.functions.invoke('ai', { body: payload });
  if (error) throw error;
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
  }
  return data;
}
