const cheerio = require('cheerio');
const { parsePrice, detectCurrency } = require('../utils/price');

function extract(html, url) {
  const $ = cheerio.load(html);

  // Try JSON-LD first
  const jsonLdScripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < jsonLdScripts.length; i++) {
    try {
      const data = JSON.parse($(jsonLdScripts[i]).html());
      const product = Array.isArray(data) ? data.find(d => d['@type'] === 'Product') : (data['@type'] === 'Product' ? data : null);
      if (product) {
        const offers = product.offers;
        const offer = Array.isArray(offers) ? offers[0] : offers;
        const price = parsePrice(offer?.price || offer?.lowPrice);
        if (price !== null) {
          return {
            name: product.name || 'Best Buy Product',
            price,
            currency: offer?.priceCurrency || 'USD',
            image_url: Array.isArray(product.image) ? product.image[0] : product.image || null,
            method: 'adapter',
            selector: 'json-ld',
          };
        }
      }
    } catch (e) { /* skip */ }
  }

  // Fallback CSS
  const priceText = $('.priceView-hero-price span[aria-hidden="true"]').first().text().trim()
    || $('.priceView-hero-price span').first().text().trim()
    || $('[data-testid="customer-price"] span').first().text().trim();

  const price = parsePrice(priceText);
  if (price === null) return null;

  const name = $('h1.heading-5').first().text().trim()
    || $('h1').first().text().trim();

  const imageUrl = $('img.primary-image').first().attr('src')
    || $('meta[property="og:image"]').first().attr('content');

  return {
    name: name || 'Best Buy Product',
    price,
    currency: detectCurrency(priceText),
    image_url: imageUrl || null,
    method: 'adapter',
    selector: 'bestbuy-css',
  };
}

module.exports = { extract, domains: ['bestbuy.com'] };
