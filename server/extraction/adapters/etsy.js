const cheerio = require('cheerio')
const { extractJsonLd, parsePriceWithCurrency, isValidPrice } = require('../utils/adapter-helpers')

function extract(html, url) {
  const $ = cheerio.load(html)

  const jsonLdResult = extractJsonLd($, 'Etsy Product')
  if (jsonLdResult) return jsonLdResult

  const priceText =
    $('[data-buy-box-region="price"] p.wt-text-title-03').first().text().trim() ||
    $('p[class*="price"]').first().text().trim()

  const { price, currency } = parsePriceWithCurrency(priceText)
  if (!isValidPrice(price)) return null

  const name =
    $('h1[data-buy-box-listing-title]').first().text().trim() ||
    $('h1').first().text().trim() ||
    'Etsy Product'

  const imageUrl = $('meta[property="og:image"]').first().attr('content') || null

  return { name, price, currency, image_url: imageUrl, method: 'adapter', selector: 'etsy-css' }
}

module.exports = { extract, domains: ['etsy.com'] }
