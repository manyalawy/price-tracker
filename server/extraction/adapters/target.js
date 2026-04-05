const cheerio = require('cheerio');
const { fetchPage } = require('../utils/html');
const { parsePrice } = require('../utils/price');

async function extract(html, url) {
  const $ = cheerio.load(html);

  // Try to extract TCIN from URL
  const tcinMatch = url.match(/A-(\d+)/) || url.match(/\/(\d{8,})(?:\?|$|#)/);
  const tcin = tcinMatch ? tcinMatch[1] : null;

  // Try Redsky API if we have TCIN
  if (tcin) {
    try {
      const apiUrl = `https://redsky.target.com/redsky_aggregations/v1/web/pdp_client_v1?key=9f36aeafbe60771e321a7cc95a78140772ab3e96&tcin=${tcin}&pricing_store_id=3991`;
      const jsonStr = await fetchPage(apiUrl, { timeoutMs: 5000 });
      const data = JSON.parse(jsonStr);
      const product = data?.data?.product;
      if (product) {
        const priceData = product.price?.current_retail || product.price?.reg_retail;
        const price = parsePrice(priceData);
        if (price !== null) {
          return {
            name: product.item?.product_description?.title || 'Target Product',
            price,
            currency: 'USD',
            image_url: product.item?.enrichment?.images?.primary_image_url || null,
            method: 'adapter',
            selector: 'redsky-api',
          };
        }
      }
    } catch (e) { /* API unavailable, fall through */ }
  }

  // Fallback: parse HTML
  const priceText = $('[data-test="product-price"]').first().text().trim()
    || $('[data-test="product-price"] span').first().text().trim();
  const price = parsePrice(priceText);
  if (price === null) return null;

  const name = $('h1[data-test="product-title"]').first().text().trim()
    || $('h1').first().text().trim();

  const imageUrl = $('meta[property="og:image"]').first().attr('content');

  return {
    name: name || 'Target Product',
    price,
    currency: 'USD',
    image_url: imageUrl || null,
    method: 'adapter',
    selector: 'target-css',
  };
}

module.exports = { extract, domains: ['target.com'], isAsync: true };
