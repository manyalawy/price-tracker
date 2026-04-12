# Server Refactoring Design

**Date:** 2026-04-09
**Approach:** Outside-In (entry points → services → utilities → adapters)
**Language:** Plain JavaScript (no TypeScript migration)
**Tests:** Not in scope

---

## Context

The server currently mixes concerns across every layer: routes contain business logic, adapters duplicate extraction utilities, env vars are scattered throughout, and there is no consistent error handling strategy. This refactoring applies SOLID principles and design patterns to make the codebase readable, maintainable, and easier to extend — without changing any external behaviour.

---

## Architecture

The server owns all orchestration: extraction, price-check scheduling, DB updates via Supabase, and notification dispatch. Supabase is used only as a database and auth service.

### Folder Structure

```
server/
├── index.js                        # Express setup only — middleware, route mounting, server start
├── middleware/
│   └── auth.js                     # NEW — API key validation extracted from index.js
├── lib/
│   ├── config.js                   # NEW — single source of truth for all env vars
│   └── supabase.js                 # unchanged
├── services/
│   ├── price-check.service.js      # NEW — batch price check logic from routes/check-prices.js
│   └── notification.service.js     # NEW — notification orchestration from notifications/notify.js
├── routes/
│   └── check-prices.js             # thinned to HTTP layer only (validate → call service → respond)
├── extraction/
│   ├── pipeline.js                 # cleaned up (single DOM parse, rename tryCachedMethod)
│   ├── adapters/
│   │   ├── index.js                # unchanged
│   │   ├── amazon.js               # deduplicated using adapter-helpers
│   │   ├── walmart.js
│   │   ├── bestbuy.js
│   │   ├── shopify.js
│   │   ├── target.js
│   │   ├── ebay.js
│   │   ├── aliexpress.js
│   │   ├── etsy.js
│   │   └── newegg.js
│   ├── layers/
│   │   ├── structured-data.js
│   │   ├── css-heuristics.js
│   │   └── ai-extraction.js        # reads from config.js instead of process.env
│   └── utils/
│       ├── html.js
│       ├── price.js
│       └── adapter-helpers.js      # NEW — shared adapter utilities
└── notifications/
    ├── expo-push.js                # reads from config.js instead of process.env
    └── resend-email.js             # reads from config.js instead of process.env
```

---

## Component Designs

### 1. `lib/config.js` — Config Service

Single module that reads and validates all env vars on startup. Every other module imports from here instead of reading `process.env` directly.

```js
function requireEnv(key) {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required env var: ${key}`)
  return value
}

const config = Object.freeze({
  supabaseUrl: requireEnv('SUPABASE_URL'),
  supabaseKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  anthropicKey: requireEnv('ANTHROPIC_API_KEY'),
  resendKey: requireEnv('RESEND_API_KEY'),
  apiKey: requireEnv('API_KEY'),
  port: process.env.PORT || 3000,
})

module.exports = config
```

**Why:** Eliminates scattered `process.env` reads. Fails fast on startup with a clear error instead of failing silently mid-request.

---

### 2. `middleware/auth.js` — API Key Middleware

Extracted from inline code in `index.js`.

```js
const { apiKey } = require('../lib/config')

function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key']
  if (!key || key !== apiKey) return res.status(401).json({ error: 'Unauthorized' })
  next()
}

module.exports = { requireApiKey }
```

---

### 3. `services/price-check.service.js` — Price Check Service

Extracted from `routes/check-prices.js`. Owns all business logic for the batch price-check operation.

**Responsibilities:**

- `getDueProducts(limit = 20)` — query Supabase for products where `next_check_at <= now()`, ordered by `next_check_at ASC`, capped at `limit`
- `updateProductPrice(productId, extracted)` — write new price to `price_history`, update `products.current_price` and set `next_check_at = now() + 24h`
- `checkPrices()` — orchestrate the loop: get due products → extract → update → notify

**Does not:** handle HTTP concerns (req/res), import Express types.

**Scheduling strategy:** Each product has a `next_check_at` timestamp (set to `created_at + 24h` on insert). A cron fires every 5 minutes and calls `checkPrices()`, which processes at most 20 due products per tick. This spreads load evenly across the day — no spike, no concurrent flood. After each check, `next_check_at` advances by 24h.

**DB migration required:** Add `next_check_at TIMESTAMPTZ` column to `products` table, defaulting to `NOW() + INTERVAL '24 hours'` for new rows. Backfill existing rows: `UPDATE products SET next_check_at = created_at + INTERVAL '24 hours' WHERE next_check_at IS NULL`.

---

### 4. `services/notification.service.js` — Notification Service

Extracted from `notifications/notify.js`. Owns notification orchestration.

**Responsibilities:**

- `notifyPriceDrop(product, oldPrice, newPrice)` — decide who gets notified and via which channels
- `hasRecentNotification(productId, userId)` — 24h deduplication check against Supabase

**Does not:** implement push or email mechanics (those stay in `notifications/expo-push.js` and `notifications/resend-email.js`).

---

### 5. `routes/check-prices.js` — Thin HTTP Layer

After extraction to the service, this file only:

1. Parses and validates the incoming request
2. Calls `priceCheckService.checkPrices()`
3. Returns the HTTP response

No Supabase queries, no extraction logic, no notification calls.

---

### 6. `extraction/utils/adapter-helpers.js` — Shared Adapter Utilities

Eliminates ~40 lines of duplicated code repeated across 8 adapters.

```js
// Try a list of CSS selectors, return text of first match
function extractFirstMatch($, selectors) { ... }

// Common name selectors: h1, [itemprop="name"], og:title, title tag
function extractName($) { ... }

// Common image selectors: og:image, [itemprop="image"], main product img
function extractImage($) { ... }

// detectCurrency() + parsePrice() composed into one call
function parsePriceWithCurrency(text) { ... }

// null check + range guard (price > 0 && price < 1_000_000)
function isValidPrice(price) { ... }
```

Each adapter is refactored to use these helpers. The adapter retains only its site-specific selectors and knowledge.

---

### 7. `extraction/pipeline.js` — Pipeline Cleanup

Two targeted fixes:

- **Single DOM parse:** Parse the Cheerio `$` object once from the fetched HTML and pass it into every layer. Currently each layer re-parses the same HTML string independently.
- **Rename:** `tryCachedMethod()` → `tryExtractWithCache()` for clarity.

---

### 8. Error Handling Strategy

Replace silent `catch (e) {}` blocks across the codebase with a consistent pattern:

```js
// Before
catch (e) { /* skip */ }

// After
catch (e) {
  console.error('[context] reason:', e.message)
  return null
}
```

Callers already handle `null` return values — this makes failures visible in logs without changing control flow.

---

### 9. Tooling — ESLint + Prettier

**`.eslintrc.js`:**

```js
module.exports = {
  env: { node: true, es2022: true },
  rules: {
    'no-unused-vars': 'error',
    'no-var': 'error',
    eqeqeq: 'error',
    'no-console': 'warn',
  },
}
```

**`.prettierrc`:**

```json
{
  "singleQuote": true,
  "semi": false,
  "tabWidth": 2,
  "printWidth": 100
}
```

**`package.json` scripts:**

```json
"lint": "eslint .",
"format": "prettier --write ."
```

---

## Implementation Order (Outside-In)

1. `lib/config.js` — config service
2. `middleware/auth.js` — extract API key check from `index.js`
3. `index.js` — strip to Express setup only
4. DB migration — add `next_check_at` column to `products`, backfill existing rows
5. `services/price-check.service.js` — extract from `routes/check-prices.js`, use `getDueProducts(limit=20)`
6. `services/notification.service.js` — extract from `notifications/notify.js`
7. `routes/check-prices.js` — thin to HTTP layer
8. `extraction/utils/adapter-helpers.js` — create shared utilities
9. All 9 adapters — deduplicate using helpers
10. `extraction/pipeline.js` — single DOM parse + rename
11. All modules — replace `process.env` with `config` imports
12. All modules — replace silent catches with logged returns
13. ESLint + Prettier — install, configure, run over all files

---

## Verification

- `node index.js` starts without errors (config validation passes)
- `POST /extract` with a valid Amazon/Walmart/etc URL returns `{ name, price, currency, image_url }`
- `POST /check-prices` processes only products where `next_check_at <= now()`, max 20 per call
- After a check, the product's `next_check_at` is updated to `now() + 24h` in the DB
- A product created now is not checked until 24h later
- `npm run lint` passes with no errors
- `npm run format` produces no diffs (already formatted)
