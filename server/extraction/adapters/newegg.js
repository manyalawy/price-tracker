const { parsePriceWithCurrency, isValidPrice } = require('../utils/adapter-helpers')

const PRICE_SELECTORS = [
  '.price-current',
  'li.price-current',
  '.product-price .price-current strong',
  '[itemprop="price"]',
]

function extract($, _url) {
  let priceText = null
  let selector = null

  for (const sel of PRICE_SELECTORS) {
    const el = $(sel).first()
    // Newegg splits dollars and cents into <strong> and <sup>
    const strong = el.find('strong').text().trim()
    const sup = el.find('sup').text().trim()
    if (strong) {
      priceText = strong + (sup ? '.' + sup : '')
      selector = sel
      break
    }
    const text = el.text().trim() || el.attr('content')
    if (text) {
      priceText = text
      selector = sel
      break
    }
  }

  const { price, currency } = parsePriceWithCurrency(priceText)
  if (!isValidPrice(price)) return null

  const name =
    $('h1.product-title').first().text().trim() || $('h1').first().text().trim() || 'Newegg Product'

  const imageUrl =
    $('img.product-view-img-original').first().attr('src') ||
    $('meta[property="og:image"]').first().attr('content') ||
    null

  return { name, price, currency, image_url: imageUrl, method: 'adapter', selector }
}

module.exports = { extract, domains: ['newegg.com'] }
