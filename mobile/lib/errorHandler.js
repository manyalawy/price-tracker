/**
 * Parse and normalize errors from various sources.
 */
export function parseError(error) {
  if (!error) return 'An unknown error occurred';

  // Supabase errors
  if (error.code === 'PGRST301') return 'Session expired. Please sign in again.';
  if (error.code === '23505') return 'This item already exists.';
  if (error.code === '42501') return 'You do not have permission to perform this action.';

  // Network errors
  if (error.message?.includes('Network request failed')) return 'No internet connection. Please check your network.';
  if (error.message?.includes('timeout')) return 'Request timed out. Please try again.';

  // API errors
  if (error.status === 401) return 'Unauthorized. Please sign in again.';
  if (error.status === 429) return 'Too many requests. Please wait a moment.';
  if (error.status >= 500) return 'Server error. Please try again later.';

  // Extraction errors
  if (error.message?.includes('Failed to extract')) return 'Could not extract product data. The site may not be supported.';
  if (error.message?.includes('HTTP 4')) return 'Could not access the product page. Please check the URL.';

  return error.message || 'Something went wrong. Please try again.';
}
