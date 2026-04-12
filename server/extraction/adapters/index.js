const amazon = require('./amazon')
const walmart = require('./walmart')
const bestbuy = require('./bestbuy')
const shopify = require('./shopify')
const ebay = require('./ebay')
const target = require('./target')
const aliexpress = require('./aliexpress')
const etsy = require('./etsy')
const newegg = require('./newegg')

const adapters = [amazon, walmart, bestbuy, shopify, ebay, target, aliexpress, etsy, newegg]

// Build domain → adapter lookup map
const registry = new Map()
for (const adapter of adapters) {
  for (const domain of adapter.domains) {
    registry.set(domain, adapter)
  }
}

/**
 * Find an adapter for a given domain.
 * Checks exact match first, then tries to match subdomains.
 * Shopify adapter is returned as a fallback probe candidate.
 */
function getAdapter(domain) {
  // Exact match
  if (registry.has(domain)) {
    return registry.get(domain)
  }

  // Try matching base domain (e.g. "www.amazon.com" → "amazon.com")
  const parts = domain.split('.')
  for (let i = 1; i < parts.length; i++) {
    const sub = parts.slice(i).join('.')
    if (registry.has(sub)) {
      return registry.get(sub)
    }
  }

  return null
}

module.exports = { getAdapter, shopifyAdapter: shopify }
