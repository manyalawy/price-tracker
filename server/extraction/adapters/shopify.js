const cheerio = require('cheerio');
const { parsePrice, detectCurrency } = require('../utils/price');
const { fetchPage } = require('../utils/html');

async function extract(html, url) {
  const $ = cheerio.load(html);

  // Detect Shopify: look for Shopify.theme or shopify meta
  const isShopify = html.includes('Shopify.theme') ||
    html.includes('cdn.shopify.com') ||
    $('meta[name="shopify-digital-wallet"]').length > 0;

  // Try JSON-LD first — it has accurate localized price + currency
  const jsonLdResult = tryJsonLd($);
  if (jsonLdResult) return jsonLdResult;

  // Try .json product API (no currency info, so also check OG/meta for currency)
  try {
    const productUrl = url.replace(/\?.*$/, '').replace(/\/$/, '') + '.json';
    const jsonStr = await fetchPage(productUrl, { timeoutMs: 5000 });
    const data = JSON.parse(jsonStr);
    const product = data.product;
    if (product && product.variants && product.variants.length > 0) {
      const variant = product.variants[0];
      const price = parsePrice(variant.price);
      if (price !== null) {
        // Try to get currency from HTML meta tags since .json API doesn't include it
        const currency = $('meta[property="og:price:currency"]').attr('content')
          || $('meta[property="product:price:currency"]').attr('content')
          || getCurrencyFromScripts(html)
          || 'USD';

        return {
          name: product.title,
          price,
          currency,
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

  // Fallback: OG meta price
  const ogPrice = $('meta[property="og:price:amount"]').attr('content');
  if (ogPrice) {
    const price = parsePrice(ogPrice);
    if (price !== null) {
      return {
        name: $('meta[property="og:title"]').attr('content') || null,
        price,
        currency: $('meta[property="og:price:currency"]').attr('content') || 'USD',
        image_url: $('meta[property="og:image"]').attr('content') || null,
        method: 'adapter',
        selector: 'shopify-og',
      };
    }
  }

  return null;
}

function tryJsonLd($) {
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    try {
      const data = JSON.parse($(scripts[i]).html());
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

function getCurrencyFromScripts(html) {
  const match = html.match(/"currency"\s*:\s*"([A-Z]{3})"/);
  return match ? match[1] : null;
}

module.exports = { extract, domains: ['shopify'], isAsync: true };
