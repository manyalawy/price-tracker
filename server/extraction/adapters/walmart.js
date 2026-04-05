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
        const offers = product.offers || (product.offers && product.offers[0]);
        const offer = Array.isArray(offers) ? offers[0] : offers;
        const price = parsePrice(offer?.price || offer?.lowPrice);
        if (price !== null) {
          return {
            name: product.name || 'Walmart Product',
            price,
            currency: offer?.priceCurrency || detectCurrency(String(offer?.price)),
            image_url: Array.isArray(product.image) ? product.image[0] : product.image || null,
            method: 'adapter',
            selector: 'json-ld',
          };
        }
      }
    } catch (e) { /* skip invalid JSON-LD */ }
  }

  // Fallback CSS selectors
  const priceEl = $('[data-automation-id="product-price"] .f2').first().text().trim()
    || $('[itemprop="price"]').first().attr('content')
    || $('[itemprop="price"]').first().text().trim()
    || $('.price-characteristic').first().attr('content');

  const price = parsePrice(priceEl);
  if (price === null) return null;

  const name = $('h1[itemprop="name"]').first().text().trim()
    || $('h1').first().text().trim();

  const imageUrl = $('[data-testid="hero-image"] img').first().attr('src')
    || $('meta[property="og:image"]').first().attr('content');

  return {
    name: name || 'Walmart Product',
    price,
    currency: detectCurrency(priceEl),
    image_url: imageUrl || null,
    method: 'adapter',
    selector: 'walmart-css',
  };
}

module.exports = { extract, domains: ['walmart.com'] };
