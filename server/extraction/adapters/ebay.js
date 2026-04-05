const cheerio = require('cheerio');
const { parsePrice, detectCurrency } = require('../utils/price');

function extract(html, url) {
  const $ = cheerio.load(html);

  // Buy-now price selectors
  const PRICE_SELECTORS = [
    '.x-price-primary span.ux-textspans',
    '#prcIsum',
    '#prcIsum_bid498',
    '[itemprop="price"]',
    '.display-price',
    '#mm-saleDscPrc',
  ];

  // Bid price selectors
  const BID_SELECTORS = [
    '#prcIsum_bid498',
    '.vi-VR-cvipPrice',
    '#bidPrice',
  ];

  let priceText = null;
  let selector = null;

  // Try buy-now first
  for (const sel of PRICE_SELECTORS) {
    const el = $(sel).first();
    const text = el.text().trim() || el.attr('content');
    if (text && parsePrice(text) !== null) {
      priceText = text;
      selector = sel;
      break;
    }
  }

  // Try bid price if no buy-now
  if (!priceText) {
    for (const sel of BID_SELECTORS) {
      const text = $(sel).first().text().trim();
      if (text && parsePrice(text) !== null) {
        priceText = text;
        selector = sel;
        break;
      }
    }
  }

  const price = parsePrice(priceText);
  if (price === null) return null;

  const name = $('h1.x-item-title__mainTitle span').first().text().trim()
    || $('h1#itemTitle').first().text().replace('Details about', '').trim()
    || $('h1').first().text().trim();

  const imageUrl = $('img.ux-image-carousel-item').first().attr('src')
    || $('img#icImg').first().attr('src')
    || $('meta[property="og:image"]').first().attr('content');

  return {
    name: name || 'eBay Item',
    price,
    currency: detectCurrency(priceText),
    image_url: imageUrl || null,
    method: 'adapter',
    selector,
  };
}

module.exports = { extract, domains: ['ebay.com', 'ebay.co.uk', 'ebay.de', 'ebay.fr', 'ebay.ca', 'ebay.com.au'] };
