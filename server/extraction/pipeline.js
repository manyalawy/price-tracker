const cheerio = require('cheerio')
const { URL } = require('url')
const { fetchPage } = require('./utils/html')
const logger = require('../lib/logger')
const { getAdapter, shopifyAdapter } = require('./adapters')
const structuredData = require('./layers/structured-data')
const cssHeuristics = require('./layers/css-heuristics')
const aiExtraction = require('./layers/ai-extraction')

/**
 * Extract product data from a URL using a 4-layer pipeline:
 * 1. Domain adapter (site-specific)
 * 2. Structured data (JSON-LD, Open Graph, meta itemprop)
 * 3. CSS heuristics (common price patterns)
 * 4. AI extraction (Claude API fallback)
 *
 * @param {string} url
 * @param {{ cachedSelector?: string, cachedMethod?: string }} [options]
 * @returns {Promise<object>}
 */
async function extractProduct(url, { cachedSelector, cachedMethod } = {}) {
  const { hostname } = new URL(url)
  const domain = hostname.replace(/^www\./, '')

  const html = await fetchPage(url)
  const $ = cheerio.load(html) // parse once, reuse across all layers

  if (cachedMethod && cachedSelector) {
    const cached = tryExtractWithCache($, html, url, cachedMethod, cachedSelector, domain)
    if (cached) return { ...cached, domain }
  }

  // Layer 1: Domain adapter
  const adapter = getAdapter(domain)
  if (adapter) {
    try {
      const result = adapter.isAsync
        ? await adapter.extract($, url, html)
        : adapter.extract($, url, html)
      if (result) return { ...result, domain }
    } catch (err) {
      logger.error({ domain, err }, `[pipeline] Adapter error for ${domain}`)
    }
  }

  // Shopify probe for unknown domains
  if (!adapter) {
    try {
      const shopifyResult = await shopifyAdapter.extract($, url, html)
      if (shopifyResult) return { ...shopifyResult, domain }
    } catch (_err) {
      // Not a Shopify store, continue
    }
  }

  // Layer 2: Structured data
  try {
    const result = structuredData.extract($, url)
    if (result) return { ...result, domain }
  } catch (err) {
    logger.error({ err }, '[pipeline] Structured data error')
  }

  // Layer 3: CSS heuristics
  try {
    const result = cssHeuristics.extract($, url, cachedSelector)
    if (result) return { ...result, domain }
  } catch (err) {
    logger.error({ err }, '[pipeline] CSS heuristics error')
  }

  // Layer 4: AI extraction (needs raw HTML string)
  try {
    const result = await aiExtraction.extract(html, url)
    if (result) return { ...result, domain }
  } catch (err) {
    logger.error({ err }, '[pipeline] AI extraction error')
  }

  throw new Error(`Failed to extract product data from ${url}`)
}

function tryExtractWithCache($, html, url, method, selector, domain) {
  try {
    switch (method) {
      case 'adapter': {
        const adapter = getAdapter(domain)
        if (adapter && !adapter.isAsync) return adapter.extract($, url, html)
        return null
      }
      case 'json_ld':
      case 'meta':
        return structuredData.extract($, url)
      case 'css':
        return cssHeuristics.extract($, url, selector)
      default:
        return null
    }
  } catch (_e) {
    return null
  }
}

module.exports = { extractProduct }
