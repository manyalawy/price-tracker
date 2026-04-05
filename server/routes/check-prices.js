const express = require('express');
const { getSupabase } = require('../lib/supabase');
const { extractProduct } = require('../extraction/pipeline');
const { notifyPriceDrop } = require('../notifications/notify');

const router = express.Router();

/**
 * POST /check-prices
 * Batch check all active products, update prices, trigger notifications.
 */
router.post('/check-prices', async (req, res) => {
  const supabase = getSupabase();
  const results = { checked: 0, updated: 0, errors: 0, notifications: 0 };

  try {
    // Fetch all active products with user info
    const { data: products, error } = await supabase
      .from('products')
      .select('*, profiles!products_user_id_fkey(id, expo_push_token, email_notifications)')
      .eq('is_active', true);

    if (error) throw error;
    if (!products || products.length === 0) {
      return res.json({ ...results, message: 'No active products to check.' });
    }

    // Fetch user emails from auth
    const userIds = [...new Set(products.map(p => p.user_id))];
    const userEmails = {};
    for (const uid of userIds) {
      const { data } = await supabase.auth.admin.getUserById(uid);
      if (data?.user?.email) userEmails[uid] = data.user.email;
    }

    // Process products sequentially to avoid overwhelming target sites
    for (const product of products) {
      results.checked++;
      try {
        const extracted = await extractProduct(product.url, {
          cachedMethod: product.extraction_method,
          cachedSelector: product.extraction_selector,
        });

        const newPrice = extracted.price;
        const now = new Date().toISOString();

        // Insert price history
        await supabase.from('price_history').insert({
          product_id: product.id,
          price: newPrice,
          checked_at: now,
        });

        // Update product
        const updates = {
          current_price: newPrice,
          last_checked_at: now,
          extraction_method: extracted.method,
          extraction_selector: extracted.selector,
          updated_at: now,
        };

        if (product.highest_price === null || newPrice > product.highest_price) {
          updates.highest_price = newPrice;
        }
        if (product.lowest_price === null || newPrice < product.lowest_price) {
          updates.lowest_price = newPrice;
        }

        await supabase.from('products').update(updates).eq('id', product.id);
        results.updated++;

        // Check if price hit target
        if (newPrice <= product.target_price) {
          const profile = product.profiles;
          if (profile) {
            const user = {
              id: product.user_id,
              expo_push_token: profile.expo_push_token,
              email_notifications: profile.email_notifications,
              email: userEmails[product.user_id] || null,
            };

            await notifyPriceDrop(
              { ...product, current_price: newPrice },
              user
            );
            results.notifications++;
          }
        }
      } catch (err) {
        console.error(`[check-prices] Error for product ${product.id}:`, err.message);
        results.errors++;
      }
    }

    res.json(results);
  } catch (err) {
    console.error('[check-prices] Fatal error:', err);
    res.status(500).json({ error: 'Failed to check prices', details: err.message });
  }
});

module.exports = router;
