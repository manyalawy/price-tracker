const cheerio = require('cheerio')
const { extractFirstMatch, parsePriceWithCurrency, isValidPrice } = require('../utils/adapter-helpers')

const PRICE_SELECTORS = [
  '.priceToPay .a-offscreen',
  '#priceblock_dealprice',
  '#priceblock_saleprice',
  '#corePrice_feature_div .a-price:not([data-a-color="secondary"]) .a-offscreen',
  '.a-price[data-a-size="xl"] .a-offscreen',
  '.a-price[data-a-size="l"] .a-offscreen',
  '#apex_offerDisplay_desktop .a-price .a-offscreen',
  '#priceblock_ourprice',
  '#price_inside_buybox',
  '#newBuyBoxPrice',
  '.a-price .a-offscreen',
  '.a-price-whole',
  'span.a-color-price',
]

const NAME_SELECTORS = ['#productTitle', '#title', 'h1.product-title-word-break']

const IMAGE_SELECTORS = ['#landingImage', '#imgBlkFront', '#main-image', '.a-dynamic-image']

function extract(html, url) {
  const $ = cheerio.load(html)

  const nameMatch = extractFirstMatch($, NAME_SELECTORS)
  const name = nameMatch ? nameMatch.text : 'Amazon Product'

  const priceMatch = extractFirstMatch($, PRICE_SELECTORS)
  if (!priceMatch) return null

  const { price, currency } = parsePriceWithCurrency(priceMatch.text)
  if (!isValidPrice(price)) return null

  let imageUrl = null
  for (const sel of IMAGE_SELECTORS) {
    const src = $(sel).first().attr('src')
    if (src) { imageUrl = src; break }
  }

  return { name, price, currency, image_url: imageUrl, method: 'adapter', selector: priceMatch.selector }
}

module.exports = {
  extract,
  domains: [
    'amazon.com', 'amazon.co.uk', 'amazon.ca', 'amazon.de', 'amazon.fr',
    'amazon.it', 'amazon.es', 'amazon.co.jp', 'amazon.in', 'amazon.com.au',
    'amazon.com.br', 'amazon.eg', 'amazon.sa', 'amazon.ae',
  ],
}
