const cheerio = require('cheerio');
const { parsePrice, detectCurrency } = require('../utils/price');

function extract(html, url) {
  const $ = cheerio.load(html);

  // Try JSON-LD
  const jsonLdScripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < jsonLdScripts.length; i++) {
    try {
      const data = JSON.parse($(jsonLdScripts[i]).html());
      const product = data['@type'] === 'Product' ? data : null;
      if (product) {
        const offers = product.offers;
        const offer = Array.isArray(offers) ? offers[0] : offers;
        const price = parsePrice(offer?.price || offer?.lowPrice);
        if (price !== null) {
          return {
            name: product.name,
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
  const priceText = $('[data-buy-box-region="price"] p.wt-text-title-03').first().text().trim()
    || $('p[class*="price"]').first().text().trim();

  const price = parsePrice(priceText);
  if (price === null) return null;

  const name = $('h1[data-buy-box-listing-title]').first().text().trim()
    || $('h1').first().text().trim();

  const imageUrl = $('meta[property="og:image"]').first().attr('content');

  return {
    name: name || 'Etsy Product',
    price,
    currency: detectCurrency(priceText),
    image_url: imageUrl || null,
    method: 'adapter',
    selector: 'etsy-css',
  };
}

module.exports = { extract, domains: ['etsy.com'] };
