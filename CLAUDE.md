# CLAUDE.md — price-track (Frontend)

This file gives you complete context on the React Native mobile app. Read it in full before modifying any code. Also read the root `../CLAUDE.md` for monorepo-wide rules.

---

## Project Purpose

`price-track` is the mobile app for DIPP — a price-tracking tool for iOS and Android. Built with React Native 0.81 + Expo 54 and Expo Router (file-based routing). Users authenticate via Supabase Auth, paste product URLs to track, set target prices, and receive push notifications when prices drop.

**Key integrations:**
- **Supabase** — authentication + PostgreSQL database (anon key, RLS enforced)
- **Railway-hosted backend** (`price-tracker-backend`) — product URL extraction via `POST /extract`
- **Expo Push Notifications** — deep-links user to `/product/[id]` on tap

---

## File Structure

```
app/
  _layout.js              # Root layout — Stack navigator, wraps AuthProvider + ProductsProvider, auth guard
  (auth)/
    login.js              # Login screen
    signup.js             # Sign-up screen
    forgot-password.js    # Password reset request
    update-password.js    # Password reset confirmation (deep link)
  (tabs)/
    _layout.js            # Tab bar: Home, Add, Settings
    index.js              # Home — product list, search, pull-to-refresh
    add.js                # Add product — URL → extract → preview → set target → save
    settings.js           # Account info, notification toggles, sign out
  product/
    [id].js               # Product detail — price chart, price history, edit target

components/
  ui/                     # Reusable primitives (Button, Input, EmptyState, etc.) — check here first
  ProductCard.js          # Product list item — used on home screen
  PriceChart.js           # Price history chart — used on product detail
  EditTargetModal.js      # Modal to edit target price — used on product detail

contexts/
  AuthContext.js          # Global auth state — exposes useAuth()
  ProductsContext.js      # Global products state — exposes useProducts()

lib/
  supabase.js             # Supabase client singleton — import this, never re-create
  api.js                  # extractProduct(url) — calls backend extraction API
  secureStore.js          # Custom auth storage adapter for Supabase (chunks large JWTs)
  notifications.js        # Push token registration + deep-link routing
  errorHandler.js         # parseError(error) — normalizes all errors to user-friendly strings
  haptics.js              # Haptic feedback helpers
  priceHistory.js         # Price history formatting utilities

constants/
  theme.js                # Single source of truth for all visual tokens
  config.js               # Environment variables (Supabase URL/key, API URL/key)
```

---

## Architecture: State Management

Global state is managed with React Context + `useReducer`. There are exactly two context providers, and they cover everything.

### AuthContext

```js
import { useAuth } from '../contexts/AuthContext'

const { user, session, loading } = useAuth()
// user — Supabase User object (null if not authenticated)
// session — Supabase Session object
// loading — true while auth state is resolving on app start
```

### ProductsContext

```js
import { useProducts } from '../contexts/ProductsContext'

const { products, loading, error, fetchProducts, addProduct, deleteProduct } = useProducts()
```

**Reducer actions** (dispatch these directly when needed — e.g. optimistic updates):

| Action type | Payload | What it does |
|---|---|---|
| `SET_LOADING` | — | Sets `loading: true`, clears `error` |
| `SET_PRODUCTS` | `Product[]` | Replaces product list, sets `loading: false` |
| `SET_ERROR` | `string` | Sets error message, sets `loading: false` |
| `ADD_PRODUCT` | `Product` | Prepends product to list |
| `REMOVE_PRODUCT` | `string` (id) | Removes product by id |
| `UPDATE_PRODUCT` | `Partial<Product>` with `id` | Merges changes into matching product |

**Example — optimistic update after editing target price:**

```js
const { dispatch } = useProducts()

// After a successful Supabase update:
dispatch({ type: 'UPDATE_PRODUCT', payload: { id: product.id, target_price: newTarget } })
```

**Rules:**
- Never replicate `products` or `user` state inside a screen component.
- Never call `supabase.from('products')` in a screen — use context methods or dispatch.
- Both contexts are initialized in `app/_layout.js` and available to all routes.

---

## Architecture: Component Hierarchy

```
Screen (app/**/*.js)
  └── Screen-specific components (components/*.js)
        └── UI primitives (components/ui/*.js)
```

**Before creating any new component:**
1. Check `components/ui/` — reuse or extend what exists.
2. If a component is used on more than one screen, it belongs in `components/`.
3. If it's only used once and is purely presentational, keep it in the screen file.

**Example — correct Button usage:**

```js
import { Button } from '../components/ui/Button'

// Good — uses the existing primitive
<Button title="Track Product" onPress={handleTrack} />

// Bad — rolling a custom TouchableOpacity inline for something a Button could handle
<TouchableOpacity style={styles.btn} onPress={handleTrack}>
  <Text style={styles.btnText}>Track Product</Text>
</TouchableOpacity>
```

---

## Architecture: Navigation

Navigation is file-based via Expo Router. The file path = the route path.

```
app/_layout.js          → root Stack, auth guard
app/(tabs)/_layout.js   → tab bar (Home, Add, Settings)
app/product/[id].js     → /product/:id (pushed on top of tabs)
```

**Auth guard** — `app/_layout.js` redirects unauthenticated users to `/(auth)/login` using `useAuth().user`. Never implement auth guards inside individual screens.

**Navigation from code:**

```js
import { router } from 'expo-router'

router.push(`/product/${product.id}`)   // navigate to detail
router.replace('/(tabs)/')              // replace after login
router.back()                           // go back
```

**Push notification deep link** — a notification tap triggers a deep link to `/product/[id]`. This is handled in `lib/notifications.js`. Do not write notification routing logic anywhere else.

---

## Styling Rules

### Always use StyleSheet.create()

```js
// CORRECT
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: spacing.md,
  },
})

// WRONG — inline style objects are not allowed
<View style={{ backgroundColor: '#0e0e10', padding: 16 }} />
```

### Always use theme tokens — never hardcode values

All colors, spacing, font sizes, and border radii come from `constants/theme.js`.

```js
import { colors, spacing, typography, borderRadius } from '../constants/theme'
```

### Full Theme Reference

**Colors:**

```js
// Backgrounds
colors.background         // '#0e0e10'  main app background
colors.card               // '#141414'  card surface
colors.cardHover          // '#1a1a1a'  pressed / active card state
colors.cardAlt            // '#1f1f22'  alternate card surface
colors.groupBg            // '#131315'  grouped section background
colors.iconBg             // '#262528'  icon container background

// Accent (neon green — primary action color)
colors.accent             // '#3fff8b'
colors.accentDark         // '#2ecc71'  darker accent variant
colors.accentGradientEnd  // '#13ea79'  LinearGradient end stop
colors.accentText         // '#005d2c'  dark text on accent/gradient backgrounds
colors.accentThumb        // '#004f24'  Switch thumb on accent track

// Danger
colors.danger             // '#f87171'  error / destructive
colors.dangerDark         // '#ef4444'  darker danger
colors.dangerAlt          // '#ff716c'  alternate danger

// Text
colors.text               // '#ffffff'  primary text
colors.textWarm           // '#f9f5f8'  warm white
colors.textSecondary      // '#9ca3af'  secondary / muted
colors.textMuted          // '#6b7280'  heavily muted
colors.textLabel          // '#adaaad'  label text

// UI
colors.border             // '#374151'  dividers, input borders
colors.inputBg            // '#1a1a1a'  input field background
```

**Spacing:**

```js
spacing.xs   // 4
spacing.sm   // 8
spacing.md   // 16
spacing.lg   // 24
spacing.xl   // 32
```

**Typography sizes:**

```js
typography.sizes.xs       // 12
typography.sizes.sm       // 14
typography.sizes.md       // 16
typography.sizes.lg       // 18
typography.sizes.xl       // 20
typography.sizes.xxl      // 24
typography.sizes.xxxl     // 32
typography.sizes.display  // 36  — large price / hero heading
```

**Typography weights:**

```js
typography.weights.regular   // '400'
typography.weights.medium    // '500'
typography.weights.semibold  // '600'
typography.weights.bold      // '700'
```

**Border radii:**

```js
borderRadius.sm    // 8
borderRadius.md    // 12
borderRadius.lg    // 16
borderRadius.xl    // 32
borderRadius.full  // 9999  — pill / circle
```

**Opacity variants** — append a 2-digit hex opacity suffix to any color string:

```js
colors.accent + '20'   // accent at ~12% opacity — subtle background tint
colors.accent + '33'   // accent at ~20% opacity
colors.border + '80'   // border at 50% opacity
colors.danger + '20'   // danger tint background
```

---

## Supabase

The frontend uses the **anon key** with **Row Level Security** enforced. Users can only access their own data — `user_id` filters are applied automatically by RLS policies.

**Always import the existing client — never create a new one:**

```js
import { supabase } from '../lib/supabase'

// CORRECT — query returns only the current user's data (RLS handles filtering)
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true)
  .order('created_at', { ascending: false })

// WRONG — do not create a new Supabase client anywhere
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(...)  // ❌
```

**Auth operations:**

```js
// Sign in
const { error } = await supabase.auth.signInWithPassword({ email, password })

// Sign out
await supabase.auth.signOut()

// Get current session (prefer useAuth() hook in components)
const { data: { session } } = await supabase.auth.getSession()
```

---

## Error Handling

Every `catch` block must normalize the error through `parseError()` before showing it to the user.

```js
import { parseError } from '../lib/errorHandler'

// CORRECT
try {
  await addProduct(productData)
} catch (err) {
  const message = parseError(err)
  Alert.alert('Error', message)
}

// WRONG — never surface raw error objects or .message directly
} catch (err) {
  Alert.alert('Error', err.message)  // ❌ — Supabase errors have different shapes
}
```

**User-facing error display:** use `Alert.alert()` only. No custom error modals or toast components.

**Haptic feedback on errors:**

```js
import { triggerError } from '../lib/haptics'

try {
  ...
} catch (err) {
  triggerError()
  Alert.alert('Error', parseError(err))
}
```

---

## Key Utilities Reference

| Utility | Import | When to use |
|---|---|---|
| `extractProduct(url)` | `lib/api.js` | User submits a product URL — returns `{ name, image_url, price, domain, currency, method, selector }` |
| `parseError(error)` | `lib/errorHandler.js` | Every `catch` block — normalizes Supabase, network, and API errors to a readable string |
| `lib/haptics.js` | `lib/haptics.js` | Button presses, confirmations, success/error feedback — check existing usage to match the pattern |
| `lib/notifications.js` | `lib/notifications.js` | Push token registration on login, deep-link routing on notification tap — do not write push logic elsewhere |
| `lib/secureStore.js` | (internal to `lib/supabase.js`) | Not a general-purpose store — only used as the Supabase auth storage adapter |
| `constants/config.js` | `constants/config.js` | All env vars — never hardcode API URLs or keys |

---

## Strict Rules

1. **Never hardcode colors, spacing, or font sizes.** Use `constants/theme.js`. No raw hex strings, no magic numbers for padding/margin/font sizes anywhere.

2. **Always check `components/ui/` before creating a new component.** Reuse or extend what exists. Only create a new file if nothing similar exists.

3. **Screens are compositions of components.** Extract any repeated or self-contained UI into its own component. Screens should be thin orchestrators.

4. **`parseError()` in every catch block.** Import from `lib/errorHandler.js`. Never surface `err.message` raw.

5. **`Alert.alert()` for all user-facing errors and confirmations.** No custom error modals.

6. **Never bypass context providers.** Auth state → `useAuth()`. Products state → `useProducts()`. Never duplicate global state in local `useState`.

7. **Never re-initialize Supabase.** Import the client from `lib/supabase.js` only.

8. **`StyleSheet.create()` always.** No inline style object literals.

9. **All env vars come from `constants/config.js`.** Never hardcode Supabase URLs, API keys, or endpoint URLs.

10. **No dead code.** No commented-out blocks, unused imports, or debug `console.log` statements.

11. **Keep this file up to date.** When you add new reusable components, utilities, or architectural patterns, add them here.

---

## Environment Variables

All env vars for the frontend must be prefixed with `EXPO_PUBLIC_` — this is how Expo bundles them into the JavaScript bundle. Without the prefix, the variable will be `undefined` at runtime.

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_EXTRACTION_API_URL=http://localhost:3001
EXPO_PUBLIC_EXTRACTION_API_KEY=your-shared-api-key
```

Accessed via `constants/config.js` — never read `process.env` directly in components or screens.

---

## Dev Commands

```bash
npm install              # install dependencies
npx expo start           # start dev server — scan QR code with Expo Go on device
npx expo run:ios         # run on iOS simulator
npx expo run:android     # run on Android emulator
```

**Testing:** There is no test framework. Test manually using Expo Go on a physical device.
