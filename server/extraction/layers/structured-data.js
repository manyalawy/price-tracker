const { parsePrice, detectCurrency } = require('../utils/price')

/**
 * Extract product data from structured data in HTML:
 * 1. JSON-LD (@type: Product)
 * 2. Open Graph (og:price:amount)
 * 3. Meta itemprop (itemprop="price")
 */
function extract($, _url) {
  // 1. JSON-LD
  const result = tryJsonLd($)
  if (result) return result

  // 2. Open Graph
  const ogResult = tryOpenGraph($)
  if (ogResult) return ogResult

  // 3. Meta itemprop
  const metaResult = tryMetaItemprop($)
  if (metaResult) return metaResult

  return null
}

function tryJsonLd($) {
  const scripts = $('script[type="application/ld+json"]')
  for (let i = 0; i < scripts.length; i++) {
    try {
      let data = JSON.parse($(scripts[i]).html())

      // Handle @graph arrays
      if (data['@graph']) {
        data = data['@graph']
      }

      const items = Array.isArray(data) ? data : [data]
      for (const item of items) {
        if (
          item['@type'] === 'Product' ||
          (Array.isArray(item['@type']) && item['@type'].includes('Product'))
        ) {
          const offers = item.offers
          const offer = Array.isArray(offers) ? offers[0] : offers
          if (!offer) continue

          const price = parsePrice(offer.price || offer.lowPrice)
          if (price === null) continue

          return {
            name: item.name || null,
            price,
            currency: offer.priceCurrency || detectCurrency(String(offer.price)),
            image_url: Array.isArray(item.image) ? item.image[0] : item.image || null,
            method: 'json_ld',
            selector: 'json-ld',
          }
        }
      }
    } catch (e) {
      /* skip invalid JSON */
    }
  }
  return null
}

function tryOpenGraph($) {
  const ogPrice =
    $('meta[property="og:price:amount"]').attr('content') ||
    $('meta[property="product:price:amount"]').attr('content')

  if (!ogPrice) return null

  const price = parsePrice(ogPrice)
  if (price === null) return null

  const currency =
    $('meta[property="og:price:currency"]').attr('content') ||
    $('meta[property="product:price:currency"]').attr('content') ||
    'USD'

  const name = $('meta[property="og:title"]').attr('content') || null
  const imageUrl = $('meta[property="og:image"]').attr('content') || null

  return {
    name,
    price,
    currency,
    image_url: imageUrl,
    method: 'meta',
    selector: 'og:price:amount',
  }
}

function tryMetaItemprop($) {
  const priceEl = $('[itemprop="price"]').first()
  const priceText = priceEl.attr('content') || priceEl.text().trim()

  if (!priceText) return null

  const price = parsePrice(priceText)
  if (price === null) return null

  const currency = $('[itemprop="priceCurrency"]').attr('content') || detectCurrency(priceText)
  const name =
    $('[itemprop="name"]').first().text().trim() ||
    $('meta[itemprop="name"]').attr('content') ||
    null
  const imageUrl =
    $('[itemprop="image"]').first().attr('src') ||
    $('meta[itemprop="image"]').attr('content') ||
    null

  return {
    name,
    price,
    currency,
    image_url: imageUrl,
    method: 'meta',
    selector: 'itemprop-price',
  }
}

module.exports = { extract }
