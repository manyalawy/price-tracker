const cheerio = require('cheerio');
const { parsePrice, detectCurrency } = require('../utils/price');

function extract(html, url) {
  const $ = cheerio.load(html);

  const PRICE_SELECTORS = [
    '.price-current',
    'li.price-current',
    '.product-price .price-current strong',
    '[itemprop="price"]',
  ];

  let priceText = null;
  let selector = null;
  for (const sel of PRICE_SELECTORS) {
    const el = $(sel).first();
    // Newegg splits dollars and cents into separate elements
    const strong = el.find('strong').text().trim();
    const sup = el.find('sup').text().trim();
    if (strong) {
      priceText = strong + (sup ? '.' + sup : '');
      selector = sel;
      break;
    }
    const text = el.text().trim() || el.attr('content');
    if (text && parsePrice(text) !== null) {
      priceText = text;
      selector = sel;
      break;
    }
  }

  const price = parsePrice(priceText);
  if (price === null) return null;

  const name = $('h1.product-title').first().text().trim()
    || $('h1').first().text().trim();

  const imageUrl = $('img.product-view-img-original').first().attr('src')
    || $('meta[property="og:image"]').first().attr('content');

  return {
    name: name || 'Newegg Product',
    price,
    currency: detectCurrency(priceText),
    image_url: imageUrl || null,
    method: 'adapter',
    selector,
  };
}

module.exports = { extract, domains: ['newegg.com'] };
