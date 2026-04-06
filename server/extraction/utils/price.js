// Currency symbol/code mapping for detection
const CURRENCY_PATTERNS = [
  { symbol: '$', code: 'USD', regex: /^\$|USD/ },
  { symbol: '€', code: 'EUR', regex: /€|EUR/ },
  { symbol: '£', code: 'GBP', regex: /£|GBP/ },
  { symbol: '¥', code: 'JPY', regex: /¥|JPY|CNY/ },
  { symbol: '₹', code: 'INR', regex: /₹|INR/ },
  { symbol: 'A$', code: 'AUD', regex: /A\$|AUD/ },
  { symbol: 'C$', code: 'CAD', regex: /C\$|CAD/ },
  { symbol: 'CHF', code: 'CHF', regex: /CHF/ },
  { symbol: 'kr', code: 'SEK', regex: /kr|SEK|NOK|DKK/ },
  { symbol: 'R$', code: 'BRL', regex: /R\$|BRL/ },
  { symbol: '₩', code: 'KRW', regex: /₩|KRW/ },
  { symbol: 'zł', code: 'PLN', regex: /zł|PLN/ },
  { symbol: 'Kč', code: 'CZK', regex: /Kč|CZK/ },
  { symbol: '₺', code: 'TRY', regex: /₺|TRY/ },
  { symbol: 'د.إ', code: 'AED', regex: /د\.إ|AED/ },
  { symbol: 'ج.م', code: 'EGP', regex: /ج\.م|EGP|EGP£/ },
];

/**
 * Parse a price string into a numeric value.
 * Handles: leading/trailing symbols, commas as thousands separators,
 * European decimal commas, and price ranges (returns the lower bound).
 *
 * @param {string} input - Raw price string, e.g. "$1,299.99", "€1.299,99", "29.99 - 49.99"
 * @returns {number|null} Parsed numeric price, or null if unparseable.
 */
function parsePrice(input) {
  if (input == null) return null;

  const str = String(input).trim();

  // Handle price ranges — take the lower value
  const rangeSeparators = [' - ', ' – ', ' — ', ' to ', '–', '—'];
  for (const sep of rangeSeparators) {
    if (str.includes(sep)) {
      const parts = str.split(sep);
      const lower = parsePrice(parts[0]);
      return lower;
    }
  }

  // Strip currency symbols, letters (except for decimal/thousands markers), and whitespace
  let cleaned = str
    .replace(/[^\d.,\-]/g, '') // keep digits, dot, comma, minus
    .trim();

  if (!cleaned) return null;

  // Detect European format: e.g. "1.299,99" — period as thousands, comma as decimal
  const europeanFormat = /^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(cleaned);
  if (europeanFormat) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // Standard format: remove commas used as thousands separators
    cleaned = cleaned.replace(/,/g, '');
  }

  const value = parseFloat(cleaned);
  if (isNaN(value)) return null;
  if (value < 0) return null; // prices shouldn't be negative

  return value;
}

/**
 * Detect the currency from a price string or surrounding context.
 *
 * @param {string} input - Price string or text containing a currency symbol/code.
 * @returns {string} ISO 4217 currency code (e.g. "USD"), or "USD" as default fallback.
 */
function detectCurrency(input) {
  if (input == null) return 'USD';

  const str = String(input).trim();

  for (const currency of CURRENCY_PATTERNS) {
    if (currency.regex.test(str)) {
      return currency.code;
    }
  }

  return 'USD';
}

module.exports = { parsePrice, detectCurrency };
