# PriceTrack — Design Spec

## Overview

A mobile app where users paste any product URL, set a target price, and get notified (push + email) when the price drops. Built with React Native (Expo) + Supabase.

**Target platforms:** iOS + Android
**Auth:** Email + password (Supabase Auth)
**Notifications:** Push (Expo) + Email (Resend)
**Price checks:** Once daily via pg_cron
**UI:** Dark theme, spacious, card-based layout

---

## Data Model

### `profiles`
Extends Supabase `auth.users`.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK, FK auth.users) | |
| expo_push_token | text | For push notifications |
| email_notifications | boolean (default true) | Toggle email alerts |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `products`
One row per tracked product per user.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK profiles) | |
| url | text | Original product URL |
| name | text | Extracted product name |
| image_url | text (nullable) | Product image |
| domain | text | e.g. "amazon.com" |
| current_price | numeric | Latest known price |
| target_price | numeric | User's desired price |
| currency | text (default 'USD') | |
| highest_price | numeric | All-time high |
| lowest_price | numeric | All-time low |
| last_checked_at | timestamptz | |
| is_active | boolean (default true) | |
| extraction_method | text | 'adapter', 'json_ld', 'meta', 'css', 'ai' |
| extraction_selector | text (nullable) | Cached selector for re-checks |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `price_history`
One row per price check.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| product_id | uuid (FK products) | |
| price | numeric | |
| checked_at | timestamptz | |

### `notifications`
Log of sent notifications (for dedup).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| product_id | uuid (FK products) | |
| user_id | uuid (FK profiles) | |
| type | text | 'push' or 'email' |
| sent_at | timestamptz | |

**RLS:** All tables have row-level security. Users can only read/write their own rows.

---

## Price Extraction Pipeline

Runs as a Supabase Edge Function (Deno). Four layers, tried in order:

### Layer 1: Domain Adapters (highest priority)
A registry of known extraction strategies for popular sites:

| Domain | Strategy |
|--------|----------|
| amazon.com / amazon.* | CSS selectors for price display |
| ebay.com | CSS selectors (bid/buy-now) |
| walmart.com | JSON-LD structured data |
| bestbuy.com | JSON-LD + CSS selectors |
| target.com | Internal API endpoint |
| Shopify stores | `<url>.json` product API (auto-detected) |
| aliexpress.com | CSS selectors |
| etsy.com | JSON-LD |
| newegg.com | CSS selectors |

Shopify detection: check for `Shopify.theme` in HTML or try appending `.json` to the product URL.

The adapter registry is a simple config map — easy to add new domains.

### Layer 2: Structured Data
For sites without an adapter:
- JSON-LD (`@type: Product` → `offers.price`)
- Open Graph (`og:price:amount`)
- Meta itemprop (`<meta itemprop="price">`)

### Layer 3: CSS Selector Heuristics
- If a cached `extraction_selector` exists from prior success, try that first
- Otherwise, try generic price selectors (common patterns across e-commerce sites)

### Layer 4: AI Extraction (fallback)
- Send cleaned/truncated HTML to Claude API
- Prompt: extract product name, price, currency
- Cache the working approach for future checks

### Caching
When any layer succeeds, store `extraction_method` and `extraction_selector` on the product row. Future checks try the cached method first, falling through the pipeline if it fails (site redesign, etc.).

---

## Notification System

### Push Notifications
- User's Expo push token stored in `profiles.expo_push_token`
- Registered on login/app launch
- Edge Function sends via Expo Push API when price <= target
- Deep links to product detail screen

### Email Notifications
- Sent via Resend (free tier: 100/day)
- Clean template: product name, new price, target price, "View in App" button
- Toggle per-user in settings

### Dedup
- Log every sent notification in `notifications` table
- Don't re-notify for the same product until price changes again

---

## App Structure

### Navigation
**Tab Navigator (3 tabs):**
1. Home — tracked products list
2. Add — paste URL, set target
3. Settings — profile, notification prefs

**Stack Screens:**
- Product Detail (from Home → tap)
- Edit Target Price
- Auth: Login, Sign Up, Forgot Password

### Screens

**Auth (Login / Sign Up)**
- Email + password fields
- Clean, minimal design
- Supabase Auth integration

**Home**
- Greeting + summary stats (tracking count, price drops)
- Scrollable product cards showing: domain, name, current price, target, % change
- Pull-to-refresh reloads data from Supabase (does not trigger a new scrape)
- Swipe-to-delete
- Search/filter bar
- Empty state when no products

**Add Product**
- URL input field (paste from clipboard)
- Auto-detect: fetches URL, extracts product info
- Shows preview: name, domain, current price
- Target price input
- "Start Tracking" button

**Product Detail**
- Product name, domain, current price
- Price history line chart (30-day default)
- High / Low / Target stat cards
- Edit Target button
- Stop Tracking button

**Settings**
- Profile info
- Email notification toggle
- Push notification toggle
- About / version

### UX Details
- Skeleton loading states
- Haptic feedback on key actions
- Smooth animations between screens
- Dark theme throughout (#0a0a0a background, #141414 cards)
- Green accent (#4ade80) for positive price changes
- Red accent (#f87171) for destructive actions
- Generous padding and spacing

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 52 (managed workflow) |
| Language | JavaScript |
| Navigation | Expo Router (file-based) |
| State | React Context + useReducer |
| UI | Custom components |
| Charts | react-native-chart-kit or Victory Native |
| Backend | Supabase (Auth, DB, Edge Functions, Realtime) |
| Push | Expo Notifications |
| Email | Resend |
| AI Fallback | Claude API |
| Scheduling | pg_cron (Supabase extension) |

---

## Daily Price Check Flow

1. `pg_cron` triggers Edge Function once per day
2. Edge Function queries all active products
3. For each product:
   a. Try cached extraction method first
   b. If fails, run full pipeline (adapter → structured → CSS → AI)
   c. Insert row into `price_history`
   d. Update `current_price`, `highest_price`, `lowest_price`, `last_checked_at` on product
   e. If `current_price <= target_price` and no recent notification → send push + email
4. Edge Function processes products in batches to stay within timeout limits

---

## Verification Plan

1. **Auth flow:** Sign up, login, logout, forgot password all work
2. **Add product:** Paste URLs from Amazon, Walmart, a Shopify store, and an unknown site — verify extraction works for each
3. **Product list:** Products appear on home screen with correct data
4. **Price history:** Chart renders with mock historical data
5. **Notifications:** Trigger a test notification (push + email) by setting target above current price
6. **Daily check:** Manually invoke the Edge Function and verify price_history rows are created
7. **Edge cases:** Invalid URLs, sites that block scraping, products that go out of stock