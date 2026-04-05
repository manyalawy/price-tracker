const cheerio = require('cheerio');
const { parsePrice, detectCurrency } = require('../utils/price');
const { fetchPage } = require('../utils/html');

async function extract(html, url) {
  const $ = cheerio.load(html);

  // Detect Shopify: look for Shopify.theme or shopify meta
  const isShopify = html.includes('Shopify.theme') ||
    html.includes('cdn.shopify.com') ||
    $('meta[name="shopify-digital-wallet"]').length > 0;

  // Try .json product API
  try {
    const productUrl = url.replace(/\?.*$/, '').replace(/\/$/, '') + '.json';
    const jsonStr = await fetchPage(productUrl, { timeoutMs: 5000 });
    const data = JSON.parse(jsonStr);
    const product = data.product;
    if (product && product.variants && product.variants.length > 0) {
      const variant = product.variants[0];
      const price = parsePrice(variant.price);
      if (price !== null) {
        return {
          name: product.title,
          price,
          currency: 'USD',
          image_url: product.image?.src || (product.images && product.images[0]?.src) || null,
          method: 'adapter',
          selector: 'shopify-json',
        };
      }
    }
  } catch (e) {
    // .json API not available, fall through
  }

  if (!isShopify) return null;

  // Fallback: parse JSON-LD or product schema from HTML
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
            selector: 'shopify-jsonld',
          };
        }
      }
    } catch (e) { /* skip */ }
  }

  return null;
}

module.exports = { extract, domains: ['shopify'], isAsync: true };
