const cheerio = require('cheerio')
const { extractJsonLd, parsePriceWithCurrency, isValidPrice } = require('../utils/adapter-helpers')

function extract(html, url) {
  const $ = cheerio.load(html)

  const jsonLdResult = extractJsonLd($, 'Best Buy Product')
  if (jsonLdResult) return jsonLdResult

  const priceText =
    $('.priceView-hero-price span[aria-hidden="true"]').first().text().trim() ||
    $('.priceView-hero-price span').first().text().trim() ||
    $('[data-testid="customer-price"] span').first().text().trim()

  const { price, currency } = parsePriceWithCurrency(priceText)
  if (!isValidPrice(price)) return null

  const name =
    $('h1.heading-5').first().text().trim() || $('h1').first().text().trim() || 'Best Buy Product'

  const imageUrl =
    $('img.primary-image').first().attr('src') ||
    $('meta[property="og:image"]').first().attr('content') ||
    null

  return { name, price, currency, image_url: imageUrl, method: 'adapter', selector: 'bestbuy-css' }
}

module.exports = { extract, domains: ['bestbuy.com'] }
