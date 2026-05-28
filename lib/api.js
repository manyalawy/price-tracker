import { EXTRACTION_API_URL, EXTRACTION_API_KEY } from '../constants/config';
import { supabase } from './supabase';

/**
 * Call the extraction API to get product data from a URL.
 */
export async function extractProduct(url) {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`${EXTRACTION_API_URL}/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': EXTRACTION_API_KEY,
    },
    body: JSON.stringify({ url, user_id: session?.user?.id }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Extraction failed (${response.status})`);
  }

  return response.json();
}
