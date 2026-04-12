const { parsePrice, detectCurrency } = require('../utils/price')

// Common price CSS patterns found across e-commerce sites
const COMMON_PRICE_SELECTORS = [
  '[class*="price" i][class*="current" i]',
  '[class*="price" i][class*="sale" i]',
  '[class*="price" i][class*="now" i]',
  '[class*="sale-price" i]',
  '[class*="saleprice" i]',
  '[class*="offer-price" i]',
  '[class*="product-price" i]',
  '[class*="Price--current"]',
  '[class*="price-value"]',
  '[data-price]',
  '[data-product-price]',
  '.price .current',
  '.price .amount',
  '.price--sale',
  '.price-box .price',
  '#product-price',
  '.product-price',
  '.sale-price',
  '.current-price',
  '.final-price',
  '.price-current',
  '.price .money',
  '.money',
]

const COMMON_NAME_SELECTORS = [
  'h1[class*="product" i][class*="title" i]',
  'h1[class*="product" i][class*="name" i]',
  'h1[itemprop="name"]',
  '[data-testid="product-title"]',
  '.product-title h1',
  '.product-name h1',
  '#product-title',
  '#product-name',
  'h1',
]

/**
 * Extract product price using CSS heuristics.
 * Optionally tries a cached selector first.
 */
function extract($, url, cachedSelector) {
  // Try cached selector first
  if (cachedSelector) {
    const text = $(cachedSelector).first().text().trim()
    const price = parsePrice(text)
    if (price !== null) {
      return {
        name: extractName($),
        price,
        currency: detectCurrency(text),
        image_url: extractImage($),
        method: 'css',
        selector: cachedSelector,
      }
    }
  }

  // Try data-price attributes
  const dataPriceEl = $('[data-price]').first()
  if (dataPriceEl.length) {
    const price = parsePrice(dataPriceEl.attr('data-price'))
    if (price !== null) {
      return {
        name: extractName($),
        price,
        currency: detectCurrency(dataPriceEl.attr('data-price')),
        image_url: extractImage($),
        method: 'css',
        selector: '[data-price]',
      }
    }
  }

  // Try common price selectors
  for (const sel of COMMON_PRICE_SELECTORS) {
    try {
      const el = $(sel).first()
      const text = el.text().trim()
      if (!text) continue

      const price = parsePrice(text)
      if (price !== null && price > 0 && price < 1000000) {
        return {
          name: extractName($),
          price,
          currency: detectCurrency(text),
          image_url: extractImage($),
          method: 'css',
          selector: sel,
        }
      }
    } catch (e) {
      /* skip invalid selector */
    }
  }

  return null
}

function extractName($) {
  for (const sel of COMMON_NAME_SELECTORS) {
    const text = $(sel).first().text().trim()
    if (text && text.length > 2 && text.length < 500) return text
  }
  return null
}

function extractImage($) {
  return (
    $('meta[property="og:image"]').attr('content') ||
    $('[itemprop="image"]').first().attr('src') ||
    $('img.product-image').first().attr('src') ||
    null
  )
}

module.exports = { extract }
