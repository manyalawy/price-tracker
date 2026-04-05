const { getSupabase } = require('../lib/supabase');
const { sendPushNotifications } = require('./expo-push');
const { sendPriceDropEmail } = require('./resend-email');

/**
 * Send price drop notifications (push + email) with dedup.
 * Checks the notifications table to avoid re-notifying for the same price.
 */
async function notifyPriceDrop(product, user) {
  const supabase = getSupabase();

  // Dedup: check if we already notified for this product at this price
  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('product_id', product.id)
    .eq('user_id', user.id)
    .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(1);

  if (existing && existing.length > 0) {
    return; // Already notified within 24h
  }

  const notifications = [];

  // Push notification
  if (user.expo_push_token) {
    try {
      await sendPushNotifications([{
        to: user.expo_push_token,
        title: 'Price Drop!',
        body: `${product.name} is now $${product.current_price.toFixed(2)} (target: $${product.target_price.toFixed(2)})`,
        data: { productId: product.id, url: product.url },
        sound: 'default',
      }]);

      notifications.push({
        product_id: product.id,
        user_id: user.id,
        type: 'push',
        sent_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[notify] Push error:', err.message);
    }
  }

  // Email notification
  if (user.email_notifications !== false && user.email) {
    try {
      await sendPriceDropEmail({
        to: user.email,
        productName: product.name,
        currentPrice: product.current_price,
        targetPrice: product.target_price,
        currency: product.currency || 'USD',
        productUrl: product.url,
      });

      notifications.push({
        product_id: product.id,
        user_id: user.id,
        type: 'email',
        sent_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[notify] Email error:', err.message);
    }
  }

  // Log notifications
  if (notifications.length > 0) {
    await supabase.from('notifications').insert(notifications);
  }
}

module.exports = { notifyPriceDrop };
