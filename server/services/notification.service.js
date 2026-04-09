const { getSupabase } = require('../lib/supabase')
const { sendPushNotifications } = require('../notifications/expo-push')
const { sendPriceDropEmail } = require('../notifications/resend-email')

const DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Check if the user was already notified for this product within the dedup window.
 * @param {string} productId
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function hasRecentNotification(productId, userId) {
  const since = new Date(Date.now() - DEDUP_WINDOW_MS).toISOString()
  const { data } = await getSupabase()
    .from('notifications')
    .select('id')
    .eq('product_id', productId)
    .eq('user_id', userId)
    .gte('sent_at', since)
    .limit(1)
  return Boolean(data && data.length > 0)
}

/**
 * Send push + email notifications for a price drop, with 24h deduplication.
 * @param {object} product - Product row (must have id, name, current_price, target_price, url, currency)
 * @param {object} user - User info (id, expo_push_token, email_notifications, email)
 */
async function notifyPriceDrop(product, user) {
  const alreadyNotified = await hasRecentNotification(product.id, user.id)
  if (alreadyNotified) return

  const dispatched = []

  if (user.expo_push_token) {
    try {
      await sendPushNotifications([
        {
          to: user.expo_push_token,
          title: 'Price Drop!',
          body: `${product.name} is now $${product.current_price.toFixed(2)} (target: $${product.target_price.toFixed(2)})`,
          data: { productId: product.id, url: product.url },
          sound: 'default',
        },
      ])
      dispatched.push({ product_id: product.id, user_id: user.id, type: 'push', sent_at: new Date().toISOString() })
    } catch (err) {
      console.error('[notification.service] Push error:', err.message)
    }
  }

  if (user.email_notifications !== false && user.email) {
    try {
      await sendPriceDropEmail({
        to: user.email,
        productName: product.name,
        currentPrice: product.current_price,
        targetPrice: product.target_price,
        currency: product.currency || 'USD',
        productUrl: product.url,
      })
      dispatched.push({ product_id: product.id, user_id: user.id, type: 'email', sent_at: new Date().toISOString() })
    } catch (err) {
      console.error('[notification.service] Email error:', err.message)
    }
  }

  if (dispatched.length > 0) {
    await getSupabase().from('notifications').insert(dispatched)
  }
}

module.exports = { notifyPriceDrop, hasRecentNotification }
