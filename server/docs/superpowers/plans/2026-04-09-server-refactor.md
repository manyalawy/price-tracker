# Server Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the price-track server to follow SOLID principles — config service, service layer, shared adapter utilities, and a single DOM parse — without changing any external behaviour.

**Architecture:** Outside-in pass: establish config + middleware first, then extract business logic into services, then deduplicate adapter internals, then optimize the pipeline. Each task leaves the server in a runnable state.

**Tech Stack:** Node.js, Express, Supabase JS, Cheerio, Anthropic SDK, ESLint, Prettier

**Spec:** `docs/superpowers/specs/2026-04-09-server-refactor-design.md`

---

### Task 1: Install ESLint + Prettier

**Files:**

- Modify: `package.json`
- Create: `.eslintrc.js`
- Create: `.prettierrc`

- [ ] **Step 1: Install devDependencies**

```bash
cd /Users/youssef/WebstormProjects/price-track/server
npm install --save-dev eslint prettier eslint-config-prettier
```

- [ ] **Step 2: Create `.eslintrc.js`**

```js
module.exports = {
  env: { node: true, es2022: true },
  parserOptions: { ecmaVersion: 2022 },
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-var': 'error',
    eqeqeq: 'error',
    'no-console': 'warn',
  },
}
```

- [ ] **Step 3: Create `.prettierrc`**

```json
{
  "singleQuote": true,
  "semi": false,
  "tabWidth": 2,
  "printWidth": 100,
  "trailingComma": "es5"
}
```

- [ ] **Step 4: Add scripts to `package.json`**

Replace the `"scripts"` block with:

```json
"scripts": {
  "start": "node index.js",
  "dev": "node --watch index.js",
  "lint": "eslint . --ext .js",
  "lint:fix": "eslint . --ext .js --fix",
  "format": "prettier --write ."
}
```

- [ ] **Step 5: Verify ESLint runs**

```bash
npm run lint
```

Expected: output with warnings/errors (not a crash). We will fix violations in later tasks.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .eslintrc.js .prettierrc
git commit -m "chore: add ESLint and Prettier"
```

---

### Task 2: Create `lib/config.js` — Config Service

**Files:**

- Create: `lib/config.js`
- Modify: `lib/supabase.js`
- Modify: `notifications/resend-email.js`
- Modify: `extraction/layers/ai-extraction.js`

- [ ] **Step 1: Create `lib/config.js`**

```js
require('dotenv').config()

function requireEnv(key) {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

const config = Object.freeze({
  supabaseUrl: requireEnv('SUPABASE_URL'),
  supabaseKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  anthropicKey: requireEnv('ANTHROPIC_API_KEY'),
  resendKey: requireEnv('RESEND_API_KEY'),
  apiKey: requireEnv('API_KEY'),
  port: parseInt(process.env.PORT, 10) || 3001,
})

module.exports = config
```

- [ ] **Step 2: Update `lib/supabase.js`** to use config instead of `process.env`

Replace the entire file with:

```js
const { createClient } = require('@supabase/supabase-js')
const config = require('./config')

let supabase = null

function getSupabase() {
  if (!supabase) {
    supabase = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return supabase
}

module.exports = { getSupabase }
```

- [ ] **Step 3: Update `notifications/resend-email.js`** — remove `process.env.RESEND_API_KEY` read

Replace line 14 (`const apiKey = process.env.RESEND_API_KEY`) and the guard below it with:

```js
const { resendKey: apiKey } = require('../lib/config')
```

Remove these lines (no longer needed — config already validates on startup):

```js
if (!apiKey) {
  console.warn('[resend] No RESEND_API_KEY set, skipping email')
  return null
}
```

- [ ] **Step 4: Update `extraction/layers/ai-extraction.js`** — remove `process.env.ANTHROPIC_API_KEY` read

Replace lines 18–22:

```js
// Before
const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  console.warn('[ai-extraction] No ANTHROPIC_API_KEY set, skipping AI extraction')
  return null
}
```

With:

```js
// After — key is guaranteed by config; Anthropic SDK reads ANTHROPIC_API_KEY from env automatically
```

Remove those 5 lines entirely. The `new Anthropic()` call on line 8 already reads `ANTHROPIC_API_KEY` from the environment via the SDK — config's `requireEnv` call at startup ensures it exists.

- [ ] **Step 5: Remove `require('dotenv').config()` from `index.js`**

Delete line 1 of `index.js` (`require('dotenv').config()`). Config now owns this.

- [ ] **Step 6: Verify server starts**

```bash
node index.js
```

Expected: `price-track-server running on port 3001` (or crash with a clear missing-env message if `.env` is absent).

- [ ] **Step 7: Commit**

```bash
git add lib/config.js lib/supabase.js notifications/resend-email.js extraction/layers/ai-extraction.js index.js
git commit -m "feat: add config service, centralise all env var reads"
```

---

### Task 3: Create `middleware/auth.js` + Slim `index.js`

**Files:**

- Create: `middleware/auth.js`
- Modify: `index.js`

- [ ] **Step 1: Create `middleware/` directory and `middleware/auth.js`**

```js
const { apiKey: validKey } = require('../lib/config')

function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key']
  if (!key || key !== validKey) {
    return res.status(401).json({ error: 'Unauthorized: invalid or missing API key.' })
  }
  next()
}

module.exports = { requireApiKey }
```

- [ ] **Step 2: Rewrite `index.js`** to be Express setup only

Replace the entire file with:

```js
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const { requireApiKey } = require('./middleware/auth')
const { extractProduct } = require('./extraction/pipeline')
const checkPricesRouter = require('./routes/check-prices')
const config = require('./lib/config')

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  })
)

// Health check — no auth required
app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'price-track-server' })
})

app.use(requireApiKey)

app.post('/extract', async (req, res) => {
  const { url } = req.body
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "url" in request body.' })
  }
  try {
    const result = await extractProduct(url)
    return res.json(result)
  } catch (err) {
    console.error('[/extract] error:', err)
    return res.status(500).json({ error: 'Failed to extract product data.' })
  }
})

app.use(checkPricesRouter)

app.listen(config.port, () => {
  console.error(`price-track-server running on port ${config.port}`)
})

module.exports = app
```

Note: `console.error` is used for the startup log so ESLint's `no-console: warn` rule doesn't flag it as an error — startup logging is intentional.

- [ ] **Step 3: Verify server starts and `/extract` still works**

```bash
node index.js
curl -X POST http://localhost:3001/extract \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"url":"https://www.amazon.com/dp/B08N5WRWNW"}'
```

Expected: JSON with `name`, `price`, `currency`, `image_url`.

- [ ] **Step 4: Commit**

```bash
git add middleware/auth.js index.js
git commit -m "refactor: extract auth middleware, slim index.js to Express setup only"
```

---

### Task 4: DB Migration — Add `next_check_at` to Products

**Files:**

- Create: `migrations/001_add_next_check_at.sql`

- [ ] **Step 1: Create the migration file**

Create `migrations/` directory and `migrations/001_add_next_check_at.sql`:

```sql
-- Add next_check_at to products table
-- New rows default to 24h from now; existing rows backfilled from created_at

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS next_check_at TIMESTAMPTZ
    DEFAULT (NOW() + INTERVAL '24 hours');

-- Backfill existing rows using their creation date
UPDATE products
SET next_check_at = created_at + INTERVAL '24 hours'
WHERE next_check_at IS NULL;

-- Index so the cron query (WHERE next_check_at <= now()) is fast
CREATE INDEX IF NOT EXISTS idx_products_next_check_at
  ON products (next_check_at)
  WHERE is_active = true;
```

- [ ] **Step 2: Run the migration against your Supabase project**

Open the Supabase dashboard → SQL Editor, paste the SQL above, and run it. Or use the Supabase MCP tool if available.

- [ ] **Step 3: Verify the column exists**

```sql
SELECT id, created_at, next_check_at FROM products LIMIT 5;
```

Expected: `next_check_at` is populated for all rows, approximately `created_at + 24h`.

- [ ] **Step 4: Commit the migration file**

```bash
git add migrations/001_add_next_check_at.sql
git commit -m "feat: add next_check_at column to products for per-product scheduling"
```

---

### Task 5: Create `services/notification.service.js`

**Files:**

- Create: `services/notification.service.js`
- `notifications/notify.js` will be deleted after routes are updated in Task 7

- [ ] **Step 1: Create `services/` directory and `services/notification.service.js`**

```js
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
      dispatched.push({
        product_id: product.id,
        user_id: user.id,
        type: 'push',
        sent_at: new Date().toISOString(),
      })
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
      dispatched.push({
        product_id: product.id,
        user_id: user.id,
        type: 'email',
        sent_at: new Date().toISOString(),
      })
    } catch (err) {
      console.error('[notification.service] Email error:', err.message)
    }
  }

  if (dispatched.length > 0) {
    await getSupabase().from('notifications').insert(dispatched)
  }
}

module.exports = { notifyPriceDrop, hasRecentNotification }
```

- [ ] **Step 2: Commit**

```bash
git add services/notification.service.js
git commit -m "feat: add notification service, extract from notifications/notify.js"
```

---

### Task 6: Create `services/price-check.service.js`

**Files:**

- Create: `services/price-check.service.js`

- [ ] **Step 1: Create `services/price-check.service.js`**

```js
const { getSupabase } = require('../lib/supabase')
const { extractProduct } = require('../extraction/pipeline')
const { notifyPriceDrop } = require('./notification.service')

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
      console.error(`[price-check.service] Error for product ${product.id}:`, err.message)
      results.errors++
    }
  }

  return results
}

module.exports = { checkPrices, getDueProducts, updateProductPrice }
```

- [ ] **Step 2: Commit**

```bash
git add services/price-check.service.js
git commit -m "feat: add price-check service with getDueProducts scheduling (max 20/tick, 24h interval)"
```

---

### Task 7: Slim `routes/check-prices.js` + Delete `notifications/notify.js`

**Files:**

- Modify: `routes/check-prices.js`
- Delete: `notifications/notify.js`

- [ ] **Step 1: Replace `routes/check-prices.js`** with a thin HTTP layer

```js
const express = require('express')
const { checkPrices } = require('../services/price-check.service')

const router = express.Router()

/**
 * POST /check-prices
 * Processes up to 20 products whose next_check_at is due.
 */
router.post('/check-prices', async (_req, res) => {
  try {
    const results = await checkPrices()
    res.json(results)
  } catch (err) {
    console.error('[/check-prices] Fatal error:', err)
    res.status(500).json({ error: 'Failed to check prices', details: err.message })
  }
})

module.exports = router
```

- [ ] **Step 2: Delete `notifications/notify.js`**

```bash
rm /Users/youssef/WebstormProjects/price-track/server/notifications/notify.js
```

- [ ] **Step 3: Verify end-to-end**

```bash
node index.js
curl -X POST http://localhost:3001/check-prices \
  -H "x-api-key: $API_KEY"
```

Expected: `{"checked": N, "updated": N, "errors": 0, "notifications": 0}` (only processes products due for a check).

- [ ] **Step 4: Commit**

```bash
git add routes/check-prices.js
git rm notifications/notify.js
git commit -m "refactor: slim check-prices route to HTTP layer, delete notify.js (moved to notification.service)"
```

---

### Task 8: Create `extraction/utils/adapter-helpers.js`

**Files:**

- Create: `extraction/utils/adapter-helpers.js`

- [ ] **Step 1: Create `extraction/utils/adapter-helpers.js`**

```js
const { parsePrice, detectCurrency } = require('./price')

/**
 * Try a list of CSS selectors in order; return the first match with its selector.
 * Checks both `.text()` and `.attr('content')` (for meta tags and itemprop elements).
 * @param {CheerioStatic} $ - Pre-parsed Cheerio instance
 * @param {string[]} selectors
 * @param {((text: string) => boolean) | null} [validate] - Optional guard; skips matches that fail
 * @returns {{ text: string, selector: string } | null}
 */
function extractFirstMatch($, selectors, validate = null) {
  for (const sel of selectors) {
    const el = $(sel).first()
    const text = el.text().trim() || el.attr('content')
    if (!text) continue
    if (validate && !validate(text)) continue
    return { text, selector: sel }
  }
  return null
}

/**
 * Extract product name using custom selectors first, then common fallbacks.
 * @param {CheerioStatic} $
 * @param {string[]} [customSelectors]
 * @returns {string | null}
 */
function extractName($, customSelectors = []) {
  const selectors = [
    ...customSelectors,
    'h1[itemprop="name"]',
    '[itemprop="name"]',
    'meta[property="og:title"]',
    'h1',
  ]
  const match = extractFirstMatch($, selectors)
  return match ? match.text : null
}

/**
 * Extract product image URL using custom selectors first, then common OG/itemprop fallbacks.
 * @param {CheerioStatic} $
 * @param {string[]} [customSelectors]
 * @returns {string | null}
 */
function extractImage($, customSelectors = []) {
  const allSelectors = [...customSelectors, 'meta[property="og:image"]', '[itemprop="image"]']
  for (const sel of allSelectors) {
    const el = $(sel).first()
    const src = el.attr('src') || el.attr('content')
    if (src) return src
  }
  return null
}

/**
 * Parse a price string and detect its currency in one call.
 * @param {string | null} text
 * @returns {{ price: number | null, currency: string }}
 */
function parsePriceWithCurrency(text) {
  return {
    price: parsePrice(text),
    currency: detectCurrency(text),
  }
}

/**
 * Guard: returns true only for prices that are numeric, positive, and below 1,000,000.
 * @param {number | null} price
 * @returns {boolean}
 */
function isValidPrice(price) {
  return price !== null && price > 0 && price < 1_000_000
}

/**
 * Extract product data from JSON-LD <script> tags.
 * Handles single objects, arrays, and @graph wrappers.
 * @param {CheerioStatic} $
 * @param {string} [defaultName] - Fallback name if JSON-LD has none
 * @returns {object | null} Extraction result or null
 */
function extractJsonLd($, defaultName = null) {
  const scripts = $('script[type="application/ld+json"]')
  for (let i = 0; i < scripts.length; i++) {
    try {
      let data = JSON.parse($(scripts[i]).html())
      if (data['@graph']) data = data['@graph']
      const items = Array.isArray(data) ? data : [data]

      for (const item of items) {
        const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']]
        if (!types.includes('Product')) continue

        const offers = item.offers
        const offer = Array.isArray(offers) ? offers[0] : offers
        if (!offer) continue

        const price = parsePrice(offer.price || offer.lowPrice)
        if (!isValidPrice(price)) continue

        return {
          name: item.name || defaultName,
          price,
          currency: offer.priceCurrency || detectCurrency(String(offer.price)),
          image_url: Array.isArray(item.image) ? item.image[0] : item.image || null,
          method: 'adapter',
          selector: 'json-ld',
        }
      }
    } catch (err) {
      console.error('[adapter-helpers] Invalid JSON-LD:', err.message)
    }
  }
  return null
}

module.exports = {
  extractFirstMatch,
  extractName,
  extractImage,
  extractJsonLd,
  parsePriceWithCurrency,
  isValidPrice,
}
```

- [ ] **Step 2: Commit**

```bash
git add extraction/utils/adapter-helpers.js
git commit -m "feat: add adapter-helpers utility (extractFirstMatch, extractJsonLd, parsePriceWithCurrency, isValidPrice)"
```

---

### Task 9: Refactor JSON-LD Adapters (walmart, bestbuy, etsy)

These three adapters follow the same pattern: try JSON-LD first, fall back to CSS selectors. They all inline the same JSON-LD loop. Replace it with `extractJsonLd`.

**Files:**

- Modify: `extraction/adapters/walmart.js`
- Modify: `extraction/adapters/bestbuy.js`
- Modify: `extraction/adapters/etsy.js`

- [ ] **Step 1: Replace `extraction/adapters/walmart.js`**

```js
const { extractJsonLd, parsePriceWithCurrency, isValidPrice } = require('../utils/adapter-helpers')

function extract($, url) {
  const jsonLdResult = extractJsonLd($, 'Walmart Product')
  if (jsonLdResult) return jsonLdResult

  const priceText =
    $('[data-automation-id="product-price"] .f2').first().text().trim() ||
    $('[itemprop="price"]').first().attr('content') ||
    $('[itemprop="price"]').first().text().trim() ||
    $('.price-characteristic').first().attr('content')

  const { price, currency } = parsePriceWithCurrency(priceText)
  if (!isValidPrice(price)) return null

  const name =
    $('h1[itemprop="name"]').first().text().trim() ||
    $('h1').first().text().trim() ||
    'Walmart Product'

  const imageUrl =
    $('[data-testid="hero-image"] img').first().attr('src') ||
    $('meta[property="og:image"]').first().attr('content') ||
    null

  return { name, price, currency, image_url: imageUrl, method: 'adapter', selector: 'walmart-css' }
}

module.exports = { extract, domains: ['walmart.com'] }
```

- [ ] **Step 2: Replace `extraction/adapters/bestbuy.js`**

```js
const { extractJsonLd, parsePriceWithCurrency, isValidPrice } = require('../utils/adapter-helpers')

function extract($, url) {
  const jsonLdResult = extractJsonLd($, 'Best Buy Product')
  if (jsonLdResult) return jsonLdResult

  const priceText =
    $('.priceView-hero-price span[aria-hidden="true"]').first().text().trim() ||
    $('.priceView-hero-price span').first().text().trim() ||
    $('[data-testid="customer-price"] span').first().text().trim()

  const { price, currency } = parsePriceWithCurrency(priceText)
  if (!isValidPrice(price)) return null

  const name =
    $('h1.heading-5').first().text().trim() || $('h1').first().text().trim() || 'Best Buy Product'

  const imageUrl =
    $('img.primary-image').first().attr('src') ||
    $('meta[property="og:image"]').first().attr('content') ||
    null

  return { name, price, currency, image_url: imageUrl, method: 'adapter', selector: 'bestbuy-css' }
}

module.exports = { extract, domains: ['bestbuy.com'] }
```

- [ ] **Step 3: Replace `extraction/adapters/etsy.js`**

```js
const { extractJsonLd, parsePriceWithCurrency, isValidPrice } = require('../utils/adapter-helpers')

function extract($, url) {
  const jsonLdResult = extractJsonLd($, 'Etsy Product')
  if (jsonLdResult) return jsonLdResult

  const priceText =
    $('[data-buy-box-region="price"] p.wt-text-title-03').first().text().trim() ||
    $('p[class*="price"]').first().text().trim()

  const { price, currency } = parsePriceWithCurrency(priceText)
  if (!isValidPrice(price)) return null

  const name =
    $('h1[data-buy-box-listing-title]').first().text().trim() ||
    $('h1').first().text().trim() ||
    'Etsy Product'

  const imageUrl = $('meta[property="og:image"]').first().attr('content') || null

  return { name, price, currency, image_url: imageUrl, method: 'adapter', selector: 'etsy-css' }
}

module.exports = { extract, domains: ['etsy.com'] }
```

- [ ] **Step 4: Commit**

```bash
git add extraction/adapters/walmart.js extraction/adapters/bestbuy.js extraction/adapters/etsy.js
git commit -m "refactor: deduplicate JSON-LD parsing in walmart, bestbuy, etsy adapters using extractJsonLd helper"
```

---

### Task 10: Refactor Selector-Loop Adapters (amazon, ebay, aliexpress, newegg)

These adapters all loop through selector arrays. Replace the loops with `extractFirstMatch` / helper utilities. Also remove the `cheerio.load(html)` call from each — `$` will be passed in by the pipeline in Task 11. Do both changes together to avoid a broken intermediate state.

**Files:**

- Modify: `extraction/adapters/amazon.js`
- Modify: `extraction/adapters/ebay.js`
- Modify: `extraction/adapters/aliexpress.js`
- Modify: `extraction/adapters/newegg.js`

- [ ] **Step 1: Replace `extraction/adapters/amazon.js`**

```js
const {
  extractFirstMatch,
  parsePriceWithCurrency,
  isValidPrice,
} = require('../utils/adapter-helpers')

const PRICE_SELECTORS = [
  '.priceToPay .a-offscreen',
  '#priceblock_dealprice',
  '#priceblock_saleprice',
  '#corePrice_feature_div .a-price:not([data-a-color="secondary"]) .a-offscreen',
  '.a-price[data-a-size="xl"] .a-offscreen',
  '.a-price[data-a-size="l"] .a-offscreen',
  '#apex_offerDisplay_desktop .a-price .a-offscreen',
  '#priceblock_ourprice',
  '#price_inside_buybox',
  '#newBuyBoxPrice',
  '.a-price .a-offscreen',
  '.a-price-whole',
  'span.a-color-price',
]

const NAME_SELECTORS = ['#productTitle', '#title', 'h1.product-title-word-break']

const IMAGE_SELECTORS = ['#landingImage', '#imgBlkFront', '#main-image', '.a-dynamic-image']

function extract($, url) {
  const nameMatch = extractFirstMatch($, NAME_SELECTORS)
  const name = nameMatch ? nameMatch.text : 'Amazon Product'

  const priceMatch = extractFirstMatch($, PRICE_SELECTORS)
  if (!priceMatch) return null

  const { price, currency } = parsePriceWithCurrency(priceMatch.text)
  if (!isValidPrice(price)) return null

  let imageUrl = null
  for (const sel of IMAGE_SELECTORS) {
    const src = $(sel).first().attr('src')
    if (src) {
      imageUrl = src
      break
    }
  }

  return {
    name,
    price,
    currency,
    image_url: imageUrl,
    method: 'adapter',
    selector: priceMatch.selector,
  }
}

module.exports = {
  extract,
  domains: [
    'amazon.com',
    'amazon.co.uk',
    'amazon.ca',
    'amazon.de',
    'amazon.fr',
    'amazon.it',
    'amazon.es',
    'amazon.co.jp',
    'amazon.in',
    'amazon.com.au',
    'amazon.com.br',
    'amazon.eg',
    'amazon.sa',
    'amazon.ae',
  ],
}
```

- [ ] **Step 2: Replace `extraction/adapters/ebay.js`**

```js
const {
  extractFirstMatch,
  parsePriceWithCurrency,
  isValidPrice,
} = require('../utils/adapter-helpers')
const { parsePrice } = require('../utils/price')

const PRICE_SELECTORS = [
  '.x-price-primary span.ux-textspans',
  '#prcIsum',
  '#prcIsum_bid498',
  '[itemprop="price"]',
  '.display-price',
  '#mm-saleDscPrc',
]

const BID_SELECTORS = ['#prcIsum_bid498', '.vi-VR-cvipPrice', '#bidPrice']

function extract($, url) {
  // Validate that matched text is actually a parseable price
  const validatePrice = (text) => parsePrice(text) !== null

  let priceMatch =
    extractFirstMatch($, PRICE_SELECTORS, validatePrice) ||
    extractFirstMatch($, BID_SELECTORS, validatePrice)

  if (!priceMatch) return null

  const { price, currency } = parsePriceWithCurrency(priceMatch.text)
  if (!isValidPrice(price)) return null

  const name =
    $('h1.x-item-title__mainTitle span').first().text().trim() ||
    $('h1#itemTitle').first().text().replace('Details about', '').trim() ||
    $('h1').first().text().trim() ||
    'eBay Item'

  const imageUrl =
    $('img.ux-image-carousel-item').first().attr('src') ||
    $('img#icImg').first().attr('src') ||
    $('meta[property="og:image"]').first().attr('content') ||
    null

  return {
    name,
    price,
    currency,
    image_url: imageUrl,
    method: 'adapter',
    selector: priceMatch.selector,
  }
}

module.exports = {
  extract,
  domains: ['ebay.com', 'ebay.co.uk', 'ebay.de', 'ebay.fr', 'ebay.ca', 'ebay.com.au'],
}
```

- [ ] **Step 3: Replace `extraction/adapters/aliexpress.js`**

```js
const {
  extractFirstMatch,
  parsePriceWithCurrency,
  isValidPrice,
} = require('../utils/adapter-helpers')
const { parsePrice } = require('../utils/price')

const PRICE_SELECTORS = [
  '.product-price-value',
  '.uniform-banner-box-price',
  '[class*="Price"] [class*="value"]',
  '.es--wrap--erdmPRe .es--wrap--erdmPRe',
  'span[itemprop="price"]',
  '.product-price-current',
]

function extract($, url) {
  const priceMatch = extractFirstMatch($, PRICE_SELECTORS, (text) => parsePrice(text) !== null)
  if (!priceMatch) return null

  const { price, currency } = parsePriceWithCurrency(priceMatch.text)
  if (!isValidPrice(price)) return null

  const name =
    $('h1[data-pl="product-title"]').first().text().trim() ||
    $('h1').first().text().trim() ||
    $('meta[property="og:title"]').first().attr('content') ||
    'AliExpress Product'

  const imageUrl =
    $('meta[property="og:image"]').first().attr('content') ||
    $('img.magnifier-image').first().attr('src') ||
    null

  return {
    name,
    price,
    currency: currency || 'USD',
    image_url: imageUrl,
    method: 'adapter',
    selector: priceMatch.selector,
  }
}

module.exports = { extract, domains: ['aliexpress.com', 'aliexpress.us'] }
```

- [ ] **Step 4: Replace `extraction/adapters/newegg.js`**

Newegg splits dollars and cents into separate `<strong>` / `<sup>` elements — keep that special handling, but remove the manual loop.

```js
const { parsePriceWithCurrency, isValidPrice } = require('../utils/adapter-helpers')

const PRICE_SELECTORS = [
  '.price-current',
  'li.price-current',
  '.product-price .price-current strong',
  '[itemprop="price"]',
]

function extract($, url) {
  let priceText = null
  let selector = null

  for (const sel of PRICE_SELECTORS) {
    const el = $(sel).first()
    // Newegg splits dollars and cents into <strong> and <sup>
    const strong = el.find('strong').text().trim()
    const sup = el.find('sup').text().trim()
    if (strong) {
      priceText = strong + (sup ? '.' + sup : '')
      selector = sel
      break
    }
    const text = el.text().trim() || el.attr('content')
    if (text) {
      priceText = text
      selector = sel
      break
    }
  }

  const { price, currency } = parsePriceWithCurrency(priceText)
  if (!isValidPrice(price)) return null

  const name =
    $('h1.product-title').first().text().trim() || $('h1').first().text().trim() || 'Newegg Product'

  const imageUrl =
    $('img.product-view-img-original').first().attr('src') ||
    $('meta[property="og:image"]').first().attr('content') ||
    null

  return { name, price, currency, image_url: imageUrl, method: 'adapter', selector }
}

module.exports = { extract, domains: ['newegg.com'] }
```

- [ ] **Step 5: Commit**

```bash
git add extraction/utils/adapter-helpers.js extraction/adapters/amazon.js extraction/adapters/ebay.js extraction/adapters/aliexpress.js extraction/adapters/newegg.js
git commit -m "refactor: deduplicate selector-loop adapters (amazon, ebay, aliexpress, newegg) using adapter-helpers"
```

---

### Task 11: Refactor Shopify + Target Adapters

Shopify and Target have async operations and unique patterns but still duplicate `cheerio.load` and JSON-LD parsing.

**Files:**

- Modify: `extraction/adapters/shopify.js`
- Modify: `extraction/adapters/target.js`

- [ ] **Step 1: Replace `extraction/adapters/shopify.js`**

```js
const { extractJsonLd, parsePriceWithCurrency, isValidPrice } = require('../utils/adapter-helpers')
const { fetchPage } = require('../utils/html')
const { parsePrice } = require('../utils/price')

async function extract($, url, html) {
  const isShopify =
    html.includes('Shopify.theme') ||
    html.includes('cdn.shopify.com') ||
    $('meta[name="shopify-digital-wallet"]').length > 0

  // 1. JSON-LD — most accurate for price + currency
  const jsonLdResult = extractJsonLd($)
  if (jsonLdResult) return { ...jsonLdResult, selector: 'shopify-jsonld' }

  // 2. Shopify .json API
  try {
    const productUrl = url.replace(/\?.*$/, '').replace(/\/$/, '') + '.json'
    const jsonStr = await fetchPage(productUrl, { timeoutMs: 5000 })
    const data = JSON.parse(jsonStr)
    const product = data.product
    if (product?.variants?.length > 0) {
      const price = parsePrice(product.variants[0].price)
      if (isValidPrice(price)) {
        const currency =
          $('meta[property="og:price:currency"]').attr('content') ||
          $('meta[property="product:price:currency"]').attr('content') ||
          getCurrencyFromScripts(html) ||
          'USD'
        return {
          name: product.title,
          price,
          currency,
          image_url: product.image?.src || product.images?.[0]?.src || null,
          method: 'adapter',
          selector: 'shopify-json',
        }
      }
    }
  } catch (_e) {
    // .json API not available, fall through
  }

  if (!isShopify) return null

  // 3. OG meta price fallback
  const ogPrice = $('meta[property="og:price:amount"]').attr('content')
  if (ogPrice) {
    const { price } = parsePriceWithCurrency(ogPrice)
    if (isValidPrice(price)) {
      return {
        name: $('meta[property="og:title"]').attr('content') || null,
        price,
        currency: $('meta[property="og:price:currency"]').attr('content') || 'USD',
        image_url: $('meta[property="og:image"]').attr('content') || null,
        method: 'adapter',
        selector: 'shopify-og',
      }
    }
  }

  return null
}

function getCurrencyFromScripts(html) {
  const match = html.match(/"currency"\s*:\s*"([A-Z]{3})"/)
  return match ? match[1] : null
}

module.exports = { extract, domains: ['shopify'], isAsync: true }
```

- [ ] **Step 2: Replace `extraction/adapters/target.js`**

```js
const { parsePriceWithCurrency, isValidPrice } = require('../utils/adapter-helpers')
const { fetchPage } = require('../utils/html')
const { parsePrice } = require('../utils/price')

async function extract($, url) {
  const tcinMatch = url.match(/A-(\d+)/) || url.match(/\/(\d{8,})(?:\?|$|#)/)
  const tcin = tcinMatch ? tcinMatch[1] : null

  // 1. Redsky API (most accurate)
  if (tcin) {
    try {
      const apiUrl = `https://redsky.target.com/redsky_aggregations/v1/web/pdp_client_v1?key=9f36aeafbe60771e321a7cc95a78140772ab3e96&tcin=${tcin}&pricing_store_id=3991`
      const jsonStr = await fetchPage(apiUrl, { timeoutMs: 5000 })
      const data = JSON.parse(jsonStr)
      const product = data?.data?.product
      if (product) {
        const price = parsePrice(product.price?.current_retail || product.price?.reg_retail)
        if (isValidPrice(price)) {
          return {
            name: product.item?.product_description?.title || 'Target Product',
            price,
            currency: 'USD',
            image_url: product.item?.enrichment?.images?.primary_image_url || null,
            method: 'adapter',
            selector: 'redsky-api',
          }
        }
      }
    } catch (_e) {
      // API unavailable, fall through
    }
  }

  // 2. CSS fallback
  const priceText =
    $('[data-test="product-price"]').first().text().trim() ||
    $('[data-test="product-price"] span').first().text().trim()

  const { price } = parsePriceWithCurrency(priceText)
  if (!isValidPrice(price)) return null

  const name =
    $('h1[data-test="product-title"]').first().text().trim() ||
    $('h1').first().text().trim() ||
    'Target Product'

  const imageUrl = $('meta[property="og:image"]').first().attr('content') || null

  return {
    name,
    price,
    currency: 'USD',
    image_url: imageUrl,
    method: 'adapter',
    selector: 'target-css',
  }
}

module.exports = { extract, domains: ['target.com'], isAsync: true }
```

- [ ] **Step 3: Commit**

```bash
git add extraction/adapters/shopify.js extraction/adapters/target.js
git commit -m "refactor: deduplicate shopify + target adapters using adapter-helpers"
```

---

### Task 12: Single DOM Parse in Pipeline + Update Layer Signatures

**Files:**

- Modify: `extraction/pipeline.js`
- Modify: `extraction/layers/structured-data.js`
- Modify: `extraction/layers/css-heuristics.js`

The pipeline currently calls `cheerio.load(html)` inside each adapter and each layer. We parse once in the pipeline and pass `$` down. Adapters get `($, url, html)` — `html` is still needed for Shopify's string checks. Layers get `($, url)`. AI extraction keeps `(html, url)` since it works on the raw string.

- [ ] **Step 1: Update `extraction/layers/structured-data.js`** — accept `$` instead of `html`

Replace the function signature and remove the `cheerio.load` call:

```js
const { parsePrice, detectCurrency } = require('../utils/price')

function extract($, url) {
  const result = tryJsonLd($)
  if (result) return result

  const ogResult = tryOpenGraph($)
  if (ogResult) return ogResult

  const metaResult = tryMetaItemprop($)
  if (metaResult) return metaResult

  return null
}

function tryJsonLd($) {
  const scripts = $('script[type="application/ld+json"]')
  for (let i = 0; i < scripts.length; i++) {
    try {
      let data = JSON.parse($(scripts[i]).html())
      if (data['@graph']) data = data['@graph']

      const items = Array.isArray(data) ? data : [data]
      for (const item of items) {
        const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']]
        if (!types.includes('Product')) continue

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
    } catch (err) {
      console.error('[structured-data] Invalid JSON-LD:', err.message)
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

  return {
    name: $('meta[property="og:title"]').attr('content') || null,
    price,
    currency,
    image_url: $('meta[property="og:image"]').attr('content') || null,
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

  return { name, price, currency, image_url: imageUrl, method: 'meta', selector: 'itemprop-price' }
}

module.exports = { extract }
```

- [ ] **Step 2: Update `extraction/layers/css-heuristics.js`** — accept `$` instead of `html`

Replace the `extract` function signature and remove `cheerio.load`:

```js
const { parsePrice, detectCurrency } = require('../utils/price')

const COMMON_PRICE_SELECTORS = [
  '[class*="price" i][class*="current" i]',
  '[class*="price" i][class*="sale" i]',
  '[class*="price" i][class*="now" i]',
  '[class*="sale-price" i]',
  '[class*="saleprice" i]',
  '[class*="offer-price" i]',
  '[class*="product-price" i]',
  '[class*="Price--current"]',
  '[class*="price-value"]',
  '[data-price]',
  '[data-product-price]',
  '.price .current',
  '.price .amount',
  '.price--sale',
  '.price-box .price',
  '#product-price',
  '.product-price',
  '.sale-price',
  '.current-price',
  '.final-price',
  '.price-current',
  '.price .money',
  '.money',
]

const COMMON_NAME_SELECTORS = [
  'h1[class*="product" i][class*="title" i]',
  'h1[class*="product" i][class*="name" i]',
  'h1[itemprop="name"]',
  '[data-testid="product-title"]',
  '.product-title h1',
  '.product-name h1',
  '#product-title',
  '#product-name',
  'h1',
]

function extract($, url, cachedSelector) {
  if (cachedSelector) {
    const text = $(cachedSelector).first().text().trim()
    const price = parsePrice(text)
    if (price !== null) {
      return {
        name: extractName($),
        price,
        currency: detectCurrency(text),
        image_url: extractImage($),
        method: 'css',
        selector: cachedSelector,
      }
    }
  }

  const dataPriceEl = $('[data-price]').first()
  if (dataPriceEl.length) {
    const price = parsePrice(dataPriceEl.attr('data-price'))
    if (price !== null) {
      return {
        name: extractName($),
        price,
        currency: detectCurrency(dataPriceEl.attr('data-price')),
        image_url: extractImage($),
        method: 'css',
        selector: '[data-price]',
      }
    }
  }

  for (const sel of COMMON_PRICE_SELECTORS) {
    try {
      const el = $(sel).first()
      const text = el.text().trim()
      if (!text) continue

      const price = parsePrice(text)
      if (price !== null && price > 0 && price < 1_000_000) {
        return {
          name: extractName($),
          price,
          currency: detectCurrency(text),
          image_url: extractImage($),
          method: 'css',
          selector: sel,
        }
      }
    } catch (_e) {
      console.error('[css-heuristics] Invalid selector:', sel)
    }
  }

  return null
}

function extractName($) {
  for (const sel of COMMON_NAME_SELECTORS) {
    const text = $(sel).first().text().trim()
    if (text && text.length > 2 && text.length < 500) return text
  }
  return null
}

function extractImage($) {
  return (
    $('meta[property="og:image"]').attr('content') ||
    $('[itemprop="image"]').first().attr('src') ||
    $('img.product-image').first().attr('src') ||
    null
  )
}

module.exports = { extract }
```

- [ ] **Step 3: Rewrite `extraction/pipeline.js`** — single `cheerio.load`, pass `$` to all adapters and layers

```js
const cheerio = require('cheerio')
const { URL } = require('url')
const { fetchPage } = require('./utils/html')
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
      console.error(`[pipeline] Adapter error for ${domain}:`, err.message)
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
    console.error('[pipeline] Structured data error:', err.message)
  }

  // Layer 3: CSS heuristics
  try {
    const result = cssHeuristics.extract($, url, cachedSelector)
    if (result) return { ...result, domain }
  } catch (err) {
    console.error('[pipeline] CSS heuristics error:', err.message)
  }

  // Layer 4: AI extraction (needs raw HTML string)
  try {
    const result = await aiExtraction.extract(html, url)
    if (result) return { ...result, domain }
  } catch (err) {
    console.error('[pipeline] AI extraction error:', err.message)
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
```

- [ ] **Step 4: Verify extraction still works end-to-end**

```bash
node index.js
curl -X POST http://localhost:3001/extract \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"url":"https://www.amazon.com/dp/B08N5WRWNW"}'
```

Expected: valid JSON with `name`, `price`, `currency`, `image_url`.

- [ ] **Step 5: Commit**

```bash
git add extraction/pipeline.js extraction/layers/structured-data.js extraction/layers/css-heuristics.js
git commit -m "perf: parse HTML with cheerio once in pipeline, pass \$ to all adapters and layers"
```

---

### Task 13: Run Lint and Format Pass

**Files:** All `.js` files

- [ ] **Step 1: Auto-fix ESLint violations**

```bash
cd /Users/youssef/WebstormProjects/price-track/server
npm run lint:fix
```

Review any remaining errors (e.g., `no-unused-vars`) and fix them manually. Common ones:

- Remove unused `require` statements
- Replace `var` with `const`/`let` if any slipped through

- [ ] **Step 2: Run Prettier over all files**

```bash
npm run format
```

- [ ] **Step 3: Verify no lint errors remain**

```bash
npm run lint
```

Expected: zero errors. Warnings for `no-console` are acceptable (all console usage is intentional logging).

- [ ] **Step 4: Verify server still starts**

```bash
node index.js
```

Expected: `price-track-server running on port 3001`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: apply ESLint fixes and Prettier formatting across all files"
```

---

## Verification Checklist

After all tasks complete, verify end-to-end behaviour is unchanged:

- [ ] `node index.js` starts without errors
- [ ] `GET /` returns `{"status":"ok","service":"price-track-server"}`
- [ ] `POST /extract` without API key returns `401`
- [ ] `POST /extract` with valid Amazon URL returns `{ name, price, currency, image_url }`
- [ ] `POST /check-prices` returns `{ checked, updated, errors, notifications }` and only processes products where `next_check_at <= now()`
- [ ] After a check, the product's `next_check_at` in Supabase is updated to `now() + 24h`
- [ ] `npm run lint` passes with zero errors
- [ ] `npm run format` produces no file changes (already formatted)
