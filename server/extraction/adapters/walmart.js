const { extractJsonLd, parsePriceWithCurrency, isValidPrice } = require('../utils/adapter-helpers')

function extract($, url) {
  const jsonLdResult = extractJsonLd($, 'Walmart Product')
  if (jsonLdResult) return jsonLdResult

  const priceText =
    $('[data-automation-id="product-price"] .f2').first().text().trim() ||
    $('[itemprop="price"]').first().attr('content') ||
    $('[itemprop="price"]').first().text().trim() ||
    $('.price-characteristic').first().attr('content')

  const { price, currency } = parsePriceWithCurrency(priceText)
  if (!isValidPrice(price)) return null

  const name =
    $('h1[itemprop="name"]').first().text().trim() ||
    $('h1').first().text().trim() ||
    'Walmart Product'

  const imageUrl =
    $('[data-testid="hero-image"] img').first().attr('src') ||
    $('meta[property="og:image"]').first().attr('content') ||
    null

  return { name, price, currency, image_url: imageUrl, method: 'adapter', selector: 'walmart-css' }
}

module.exports = { extract, domains: ['walmart.com'] }
