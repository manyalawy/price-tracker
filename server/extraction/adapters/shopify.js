const cheerio = require('cheerio')
const { extractJsonLd, parsePriceWithCurrency, isValidPrice } = require('../utils/adapter-helpers')
const { fetchPage } = require('../utils/html')
const { parsePrice } = require('../utils/price')

async function extract(html, url) {
  const $ = cheerio.load(html)

  const isShopify =
    html.includes('Shopify.theme') ||
    html.includes('cdn.shopify.com') ||
    $('meta[name="shopify-digital-wallet"]').length > 0

  // 1. JSON-LD — most accurate for price + currency
  const jsonLdResult = extractJsonLd($)
  if (jsonLdResult) return { ...jsonLdResult, selector: 'shopify-jsonld' }

  // 2. Shopify .json API
  try {
    const productUrl = url.replace(/\?.*$/, '').replace(/\/$/, '') + '.json'
    const jsonStr = await fetchPage(productUrl, { timeoutMs: 5000 })
    const data = JSON.parse(jsonStr)
    const product = data.product
    if (product?.variants?.length > 0) {
      const price = parsePrice(product.variants[0].price)
      if (isValidPrice(price)) {
        const currency =
          $('meta[property="og:price:currency"]').attr('content') ||
          $('meta[property="product:price:currency"]').attr('content') ||
          getCurrencyFromScripts(html) ||
          'USD'
        return {
          name: product.title,
          price,
          currency,
          image_url: product.image?.src || product.images?.[0]?.src || null,
          method: 'adapter',
          selector: 'shopify-json',
        }
      }
    }
  } catch (_e) {
    // .json API not available, fall through
  }

  if (!isShopify) return null

  // 3. OG meta price fallback
  const ogPrice = $('meta[property="og:price:amount"]').attr('content')
  if (ogPrice) {
    const { price } = parsePriceWithCurrency(ogPrice)
    if (isValidPrice(price)) {
      return {
        name: $('meta[property="og:title"]').attr('content') || null,
        price,
        currency: $('meta[property="og:price:currency"]').attr('content') || 'USD',
        image_url: $('meta[property="og:image"]').attr('content') || null,
        method: 'adapter',
        selector: 'shopify-og',
      }
    }
  }

  return null
}

function getCurrencyFromScripts(html) {
  const match = html.match(/"currency"\s*:\s*"([A-Z]{3})"/)
  return match ? match[1] : null
}

module.exports = { extract, domains: ['shopify'], isAsync: true }
