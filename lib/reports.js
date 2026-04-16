import { supabase } from './supabase';

export async function reportURL(url, note, userId) {
  const { error } = await supabase.from('reported_urls').insert({
    url,
    note: note || null,
    user_id: userId,
  });

  if (error) throw error;
}
