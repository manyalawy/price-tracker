const cheerio = require('cheerio')
const { parsePriceWithCurrency, isValidPrice } = require('../utils/adapter-helpers')
const { fetchPage } = require('../utils/html')
const { parsePrice } = require('../utils/price')

async function extract(html, url) {
  const $ = cheerio.load(html)

  const tcinMatch = url.match(/A-(\d+)/) || url.match(/\/(\d{8,})(?:\?|$|#)/)
  const tcin = tcinMatch ? tcinMatch[1] : null

  // 1. Redsky API (most accurate)
  if (tcin) {
    try {
      const apiUrl = `https://redsky.target.com/redsky_aggregations/v1/web/pdp_client_v1?key=9f36aeafbe60771e321a7cc95a78140772ab3e96&tcin=${tcin}&pricing_store_id=3991`
      const jsonStr = await fetchPage(apiUrl, { timeoutMs: 5000 })
      const data = JSON.parse(jsonStr)
      const product = data?.data?.product
      if (product) {
        const price = parsePrice(product.price?.current_retail || product.price?.reg_retail)
        if (isValidPrice(price)) {
          return {
            name: product.item?.product_description?.title || 'Target Product',
            price,
            currency: 'USD',
            image_url: product.item?.enrichment?.images?.primary_image_url || null,
            method: 'adapter',
            selector: 'redsky-api',
          }
        }
      }
    } catch (_e) {
      // API unavailable, fall through
    }
  }

  // 2. CSS fallback
  const priceText =
    $('[data-test="product-price"]').first().text().trim() ||
    $('[data-test="product-price"] span').first().text().trim()

  const { price } = parsePriceWithCurrency(priceText)
  if (!isValidPrice(price)) return null

  const name =
    $('h1[data-test="product-title"]').first().text().trim() ||
    $('h1').first().text().trim() ||
    'Target Product'

  const imageUrl = $('meta[property="og:image"]').first().attr('content') || null

  return { name, price, currency: 'USD', image_url: imageUrl, method: 'adapter', selector: 'target-css' }
}

module.exports = { extract, domains: ['target.com'], isAsync: true }
