const { extractFirstMatch, parsePriceWithCurrency, isValidPrice } = require('../utils/adapter-helpers')
const { parsePrice } = require('../utils/price')

const PRICE_SELECTORS = [
  '.product-price-value',
  '.uniform-banner-box-price',
  '[class*="Price"] [class*="value"]',
  '.es--wrap--erdmPRe .es--wrap--erdmPRe',
  'span[itemprop="price"]',
  '.product-price-current',
]

function extract($, url) {
  const priceMatch = extractFirstMatch($, PRICE_SELECTORS, (text) => parsePrice(text) !== null)
  if (!priceMatch) return null

  const { price, currency } = parsePriceWithCurrency(priceMatch.text)
  if (!isValidPrice(price)) return null

  const name =
    $('h1[data-pl="product-title"]').first().text().trim() ||
    $('h1').first().text().trim() ||
    $('meta[property="og:title"]').first().attr('content') ||
    'AliExpress Product'

  const imageUrl =
    $('meta[property="og:image"]').first().attr('content') ||
    $('img.magnifier-image').first().attr('src') ||
    null

  return { name, price, currency: currency || 'USD', image_url: imageUrl, method: 'adapter', selector: priceMatch.selector }
}

module.exports = { extract, domains: ['aliexpress.com', 'aliexpress.us'] }
