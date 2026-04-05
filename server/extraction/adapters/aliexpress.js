const cheerio = require('cheerio');
const { parsePrice, detectCurrency } = require('../utils/price');

function extract(html, url) {
  const $ = cheerio.load(html);

  const PRICE_SELECTORS = [
    '.product-price-value',
    '.uniform-banner-box-price',
    '[class*="Price"] [class*="value"]',
    '.es--wrap--erdmPRe .es--wrap--erdmPRe',
    'span[itemprop="price"]',
    '.product-price-current',
  ];

  let priceText = null;
  let selector = null;
  for (const sel of PRICE_SELECTORS) {
    const el = $(sel).first();
    const text = el.text().trim() || el.attr('content');
    if (text && parsePrice(text) !== null) {
      priceText = text;
      selector = sel;
      break;
    }
  }

  const price = parsePrice(priceText);
  if (price === null) return null;

  const name = $('h1[data-pl="product-title"]').first().text().trim()
    || $('h1').first().text().trim()
    || $('meta[property="og:title"]').first().attr('content');

  const imageUrl = $('meta[property="og:image"]').first().attr('content')
    || $('img.magnifier-image').first().attr('src');

  return {
    name: name || 'AliExpress Product',
    price,
    currency: detectCurrency(priceText) || 'USD',
    image_url: imageUrl || null,
    method: 'adapter',
    selector,
  };
}

module.exports = { extract, domains: ['aliexpress.com', 'aliexpress.us'] };
