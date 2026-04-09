const { parsePrice, detectCurrency } = require('./price')

/**
 * Try a list of CSS selectors in order; return the first match with its selector.
 * Checks both `.text()` and `.attr('content')` (for meta tags and itemprop elements).
 * @param {CheerioStatic} $ - Pre-parsed Cheerio instance
 * @param {string[]} selectors
 * @param {((text: string) => boolean) | null} [validate] - Optional guard; skips matches that fail
 * @returns {{ text: string, selector: string } | null}
 */
function extractFirstMatch($, selectors, validate = null) {
  for (const sel of selectors) {
    const el = $(sel).first()
    const text = el.text().trim() || el.attr('content')
    if (!text) continue
    if (validate && !validate(text)) continue
    return { text, selector: sel }
  }
  return null
}

/**
 * Extract product name using custom selectors first, then common fallbacks.
 * @param {CheerioStatic} $
 * @param {string[]} [customSelectors]
 * @returns {string | null}
 */
function extractName($, customSelectors = []) {
  const selectors = [
    ...customSelectors,
    'h1[itemprop="name"]',
    '[itemprop="name"]',
    'meta[property="og:title"]',
    'h1',
  ]
  const match = extractFirstMatch($, selectors)
  return match ? match.text : null
}

/**
 * Extract product image URL using custom selectors first, then common OG/itemprop fallbacks.
 * @param {CheerioStatic} $
 * @param {string[]} [customSelectors]
 * @returns {string | null}
 */
function extractImage($, customSelectors = []) {
  const allSelectors = [...customSelectors, 'meta[property="og:image"]', '[itemprop="image"]']
  for (const sel of allSelectors) {
    const el = $(sel).first()
    const src = el.attr('src') || el.attr('content')
    if (src) return src
  }
  return null
}

/**
 * Parse a price string and detect its currency in one call.
 * @param {string | null} text
 * @returns {{ price: number | null, currency: string }}
 */
function parsePriceWithCurrency(text) {
  return {
    price: parsePrice(text),
    currency: detectCurrency(text),
  }
}

/**
 * Guard: returns true only for prices that are numeric, positive, and below 1,000,000.
 * @param {number | null} price
 * @returns {boolean}
 */
function isValidPrice(price) {
  return price !== null && price > 0 && price < 1_000_000
}

/**
 * Extract product data from JSON-LD <script> tags.
 * Handles single objects, arrays, and @graph wrappers.
 * @param {CheerioStatic} $
 * @param {string} [defaultName] - Fallback name if JSON-LD has none
 * @returns {object | null} Extraction result or null
 */
function extractJsonLd($, defaultName = null) {
  const scripts = $('script[type="application/ld+json"]')
  for (let i = 0; i < scripts.length; i++) {
    try {
      let data = JSON.parse($(scripts[i]).html())
      if (data['@graph']) data = data['@graph']
      const items = Array.isArray(data) ? data : [data]

      for (const item of items) {
        const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']]
        if (!types.includes('Product')) continue

        const offers = item.offers
        const offer = Array.isArray(offers) ? offers[0] : offers
        if (!offer) continue

        const price = parsePrice(offer.price || offer.lowPrice)
        if (!isValidPrice(price)) continue

        return {
          name: item.name || defaultName,
          price,
          currency: offer.priceCurrency || detectCurrency(String(offer.price)),
          image_url: Array.isArray(item.image) ? item.image[0] : item.image || null,
          method: 'adapter',
          selector: 'json-ld',
        }
      }
    } catch (err) {
      console.error('[adapter-helpers] Invalid JSON-LD:', err.message)
    }
  }
  return null
}

module.exports = {
  extractFirstMatch,
  extractName,
  extractImage,
  extractJsonLd,
  parsePriceWithCurrency,
  isValidPrice,
}
