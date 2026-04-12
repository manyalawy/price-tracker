const { getSupabase } = require('../lib/supabase')
const { extractProduct } = require('../extraction/pipeline')
const { notifyPriceDrop } = require('./notification.service')
const logger = require('../lib/logger')

const CHECK_LIMIT = 20 // max products processed per cron tick
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Fetch products whose next_check_at is due, up to CHECK_LIMIT.
 * @returns {Promise<Array>}
 */
async function getDueProducts() {
  const { data, error } = await getSupabase()
    .from('products')
    .select('*, profiles!products_user_id_fkey(id, expo_push_token, email_notifications)')
    .eq('is_active', true)
    .lte('next_check_at', new Date().toISOString())
    .order('next_check_at', { ascending: true })
    .limit(CHECK_LIMIT)

  if (error) throw error
  return data || []
}

/**
 * Persist a new price check result and advance next_check_at by 24h.
 * @param {object} product - The product row
 * @param {object} extracted - Result from extractProduct()
 */
async function updateProductPrice(product, extracted) {
  const supabase = getSupabase()
  const now = new Date().toISOString()
  const newPrice = extracted.price
  const nextCheckAt = new Date(Date.now() + CHECK_INTERVAL_MS).toISOString()

  await supabase.from('price_history').insert({
    product_id: product.id,
    price: newPrice,
    checked_at: now,
  })

  const updates = {
    current_price: newPrice,
    last_checked_at: now,
    next_check_at: nextCheckAt,
    extraction_method: extracted.method,
    extraction_selector: extracted.selector,
    updated_at: now,
  }

  if (product.highest_price === null || newPrice > product.highest_price) {
    updates.highest_price = newPrice
  }
  if (product.lowest_price === null || newPrice < product.lowest_price) {
    updates.lowest_price = newPrice
  }

  await supabase.from('products').update(updates).eq('id', product.id)

  return newPrice
}

/**
 * Main entry point: fetch due products, extract prices, update DB, notify.
 * @returns {Promise<{checked: number, updated: number, errors: number, notifications: number}>}
 */
async function checkPrices() {
  const results = { checked: 0, updated: 0, errors: 0, notifications: 0 }

  const products = await getDueProducts()
  if (products.length === 0) return results

  // Fetch user emails for notification (only for unique user IDs in this batch)
  const userIds = [...new Set(products.map((p) => p.user_id))]
  const userEmails = {}
  for (const uid of userIds) {
    const { data } = await getSupabase().auth.admin.getUserById(uid)
    if (data?.user?.email) userEmails[uid] = data.user.email
  }

  for (const product of products) {
    results.checked++
    try {
      const extracted = await extractProduct(product.url, {
        cachedMethod: product.extraction_method,
        cachedSelector: product.extraction_selector,
      })

      const newPrice = await updateProductPrice(product, extracted)
      results.updated++

      if (newPrice <= product.target_price && product.profiles) {
        const user = {
          id: product.user_id,
          expo_push_token: product.profiles.expo_push_token,
          email_notifications: product.profiles.email_notifications,
          email: userEmails[product.user_id] || null,
        }
        await notifyPriceDrop({ ...product, current_price: newPrice }, user)
        results.notifications++
      }
    } catch (err) {
      logger.error({ productId: product.id, err }, '[price-check.service] Error processing product')
      results.errors++
    }
  }

  return results
}

module.exports = { checkPrices, getDueProducts, updateProductPrice }
