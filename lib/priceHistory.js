import { supabase } from './supabase';

/**
 * Fetch price history for a product within a given time range.
 * @param {string} productId
 * @param {number} days - Number of days of history (7, 30, 90, or null for all)
 * @returns {Promise<Array<{price: number, checked_at: string}>>}
 */
export async function fetchPriceHistory(productId, days = 30) {
  let query = supabase
    .from('price_history')
    .select('price, checked_at')
    .eq('product_id', productId)
    .order('checked_at', { ascending: true });

  if (days) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    query = query.gte('checked_at', since.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Format price history data for the chart component.
 */
export function formatChartData(history) {
  if (!history || history.length === 0) {
    return { labels: [], datasets: [{ data: [0] }] };
  }

  // Limit to ~15 data points for readability
  const step = Math.max(1, Math.floor(history.length / 15));
  const sampled = history.filter((_, i) => i % step === 0 || i === history.length - 1);

  const labels = sampled.map(h => {
    const d = new Date(h.checked_at);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });

  const data = sampled.map(h => h.price);

  return {
    labels,
    datasets: [{ data, strokeWidth: 2 }],
  };
}
