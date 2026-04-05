const { URL } = require('url');
const { fetchPage } = require('./utils/html');
const { getAdapter, shopifyAdapter } = require('./adapters');
const structuredData = require('./layers/structured-data');
const cssHeuristics = require('./layers/css-heuristics');
const aiExtraction = require('./layers/ai-extraction');

/**
 * Extract product data from a URL using a 4-layer pipeline:
 * 1. Domain adapter (site-specific)
 * 2. Structured data (JSON-LD, Open Graph, meta itemprop)
 * 3. CSS heuristics (common price patterns)
 * 4. AI extraction (Claude API fallback)
 *
 * @param {string} url - Product URL
 * @param {object} [options]
 * @param {string} [options.cachedSelector] - Previously successful CSS selector
 * @param {string} [options.cachedMethod] - Previously successful method
 * @returns {Promise<object>} Extracted product data
 */
async function extractProduct(url, { cachedSelector, cachedMethod } = {}) {
  const parsedUrl = new URL(url);
  const domain = parsedUrl.hostname.replace(/^www\./, '');

  // Fetch the page HTML
  const html = await fetchPage(url);

  // If we have a cached method, try it first
  if (cachedMethod && cachedSelector) {
    const cached = tryCachedMethod(html, url, cachedMethod, cachedSelector, domain);
    if (cached) return { ...cached, domain };
  }

  // Layer 1: Domain adapter
  const adapter = getAdapter(domain);
  if (adapter) {
    try {
      const result = adapter.isAsync
        ? await adapter.extract(html, url)
        : adapter.extract(html, url);
      if (result) return { ...result, domain };
    } catch (err) {
      console.warn(`[pipeline] Adapter error for ${domain}:`, err.message);
    }
  }

  // Try Shopify adapter as a probe for unknown domains
  if (!adapter) {
    try {
      const shopifyResult = await shopifyAdapter.extract(html, url);
      if (shopifyResult) return { ...shopifyResult, domain };
    } catch (err) {
      // Not a Shopify store, continue
    }
  }

  // Layer 2: Structured data
  try {
    const result = structuredData.extract(html, url);
    if (result) return { ...result, domain };
  } catch (err) {
    console.warn('[pipeline] Structured data error:', err.message);
  }

  // Layer 3: CSS heuristics
  try {
    const result = cssHeuristics.extract(html, url, cachedSelector);
    if (result) return { ...result, domain };
  } catch (err) {
    console.warn('[pipeline] CSS heuristics error:', err.message);
  }

  // Layer 4: AI extraction (last resort)
  try {
    const result = await aiExtraction.extract(html, url);
    if (result) return { ...result, domain };
  } catch (err) {
    console.warn('[pipeline] AI extraction error:', err.message);
  }

  throw new Error(`Failed to extract product data from ${url}`);
}

function tryCachedMethod(html, url, method, selector, domain) {
  try {
    switch (method) {
      case 'adapter': {
        const adapter = getAdapter(domain);
        if (adapter) {
          return adapter.isAsync ? null : adapter.extract(html, url);
        }
        break;
      }
      case 'json_ld':
      case 'meta':
        return structuredData.extract(html, url);
      case 'css':
        return cssHeuristics.extract(html, url, selector);
      default:
        return null;
    }
  } catch (e) {
    return null;
  }
  return null;
}

module.exports = { extractProduct };
