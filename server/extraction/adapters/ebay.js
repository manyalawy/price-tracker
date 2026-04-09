const cheerio = require('cheerio')
const { extractFirstMatch, parsePriceWithCurrency, isValidPrice } = require('../utils/adapter-helpers')
const { parsePrice } = require('../utils/price')

const PRICE_SELECTORS = [
  '.x-price-primary span.ux-textspans',
  '#prcIsum',
  '#prcIsum_bid498',
  '[itemprop="price"]',
  '.display-price',
  '#mm-saleDscPrc',
]

const BID_SELECTORS = ['#prcIsum_bid498', '.vi-VR-cvipPrice', '#bidPrice']

function extract(html, url) {
  const $ = cheerio.load(html)

  const validatePrice = (text) => parsePrice(text) !== null

  const priceMatch =
    extractFirstMatch($, PRICE_SELECTORS, validatePrice) ||
    extractFirstMatch($, BID_SELECTORS, validatePrice)

  if (!priceMatch) return null

  const { price, currency } = parsePriceWithCurrency(priceMatch.text)
  if (!isValidPrice(price)) return null

  const name =
    $('h1.x-item-title__mainTitle span').first().text().trim() ||
    $('h1#itemTitle').first().text().replace('Details about', '').trim() ||
    $('h1').first().text().trim() ||
    'eBay Item'

  const imageUrl =
    $('img.ux-image-carousel-item').first().attr('src') ||
    $('img#icImg').first().attr('src') ||
    $('meta[property="og:image"]').first().attr('content') ||
    null

  return { name, price, currency, image_url: imageUrl, method: 'adapter', selector: priceMatch.selector }
}

module.exports = { extract, domains: ['ebay.com', 'ebay.co.uk', 'ebay.de', 'ebay.fr', 'ebay.ca', 'ebay.com.au'] }
