# CLAUDE.md — Dipp

This file gives Claude Code full context on the project architecture, patterns, and rules. Read it before touching any code.

---

## 1. Project Overview

Dipp is a React Native/Expo price tracking app. Users paste product URLs → an external extraction API scrapes name/image/price → data is stored in Supabase → push notifications are sent when the price drops below the user's target.

- **Stack**: React Native 0.81 + Expo 54, Expo Router (file-based routing), Supabase (auth + database), Railway-hosted extraction API
- **Testing**: Expo Go on a physical device (`npx expo start`, scan QR code)
- **Platform**: iOS and Android via Expo Go

---

## 2. File Structure & Navigation

```
app/
  _layout.js          # Root layout — Stack nav, wraps AuthProvider + ProductsProvider, auth guard
  (auth)/             # Unauthenticated screens: login, signup, forgot-password, update-password
  (tabs)/
    _layout.js        # Tab bar config (Home, Add, Settings)
    index.js          # Home — lists tracked products, search, stats, pull-to-refresh
    add.js            # Add product — URL input → extract → preview → set target → save
    settings.js       # Settings — account info, notification toggles, sign out
  product/[id].js     # Product detail — price chart, history, edit target price

components/
  ui/                 # Reusable primitives: Button, Input, EmptyState, etc.
  ProductCard.js      # Product list item — used on home screen
  PriceChart.js       # Price history chart — used on product detail
  EditTargetModal.js  # Modal to edit target price — used on product detail

contexts/
  AuthContext.js      # Global auth state — exposes useAuth() → { user, session, loading }
  ProductsContext.js  # Global products state — exposes useProducts() → { products, loading, error, dispatch }

lib/
  supabase.js         # Supabase client — single instance, do NOT re-initialize elsewhere
  api.js              # extractProduct(url) — calls extraction API, returns product data
  secureStore.js      # Custom Supabase auth storage adapter (chunks large JWTs)
  notifications.js    # Push notification registration + deep link routing to /product/[id]
  errorHandler.js     # parseError(error) — normalizes all errors to user-friendly strings
  haptics.js          # Haptic feedback helpers — use for button presses and confirmations
  priceHistory.js     # Price history utilities

constants/
  theme.js            # Single source of truth for all visual tokens (colors, spacing, typography)
  config.js           # Environment variables: Supabase URL/key, extraction API URL/key
```

**Navigation flow:**
- Unauthenticated → `/(auth)/login` (redirected in `_layout.js`)
- Authenticated → `/(tabs)/` with Stack on top for `/product/[id]`
- Notification tap → deep link to `/product/[id]`

---

## 3. Architecture Patterns

**State management**
- All global state lives in `AuthContext` and `ProductsContext`. Never replicate auth or products state locally in a screen.
- `ProductsContext` uses `useReducer` with explicit actions: `SET_LOADING`, `SET_PRODUCTS`, `SET_ERROR`, `ADD_PRODUCT`, `REMOVE_PRODUCT`, `UPDATE_PRODUCT`.
- Consume via `useAuth()` and `useProducts()` hooks only.

**Component architecture**
- Always check `components/ui/` before creating a new component. Reuse or extend what exists.
- If no similar component exists, create one — reusable primitives go in `components/ui/`, screen-specific components go in `components/`.
- Screens are compositions of components. Extract any repeated or self-contained UI into its own component file.

**Styling**
- Always use `StyleSheet.create()`. No inline style objects.
- All visual values come from `constants/theme.js`. Never hardcode colors, spacing, or font sizes.

**Error handling**
- Every `catch` block must call `parseError(error)` from `lib/errorHandler.js` to get a user-friendly string.
- Use `Alert.alert()` for user-facing confirmations and errors. No custom error modals.

**Supabase**
- One client instance in `lib/supabase.js`. Import it; never create a new instance.

---

## 4. Strict Rules

1. **Never hardcode colors, spacing, or font sizes.** Use `constants/theme.js` — `colors`, `spacing`, `typography`, `borderRadius`.
2. **Reuse existing components first.** Check `components/ui/` before writing any new UI. Only create a new component if nothing similar exists.
3. **Component-based architecture always.** Screens must be composed of components. Extract repeated or self-contained UI.
4. **Use `parseError()` for all errors.** Import from `lib/errorHandler.js`. Never surface raw `.message` strings to the user.
5. **Never bypass context providers.** Auth state = `useAuth()`. Products state = `useProducts()`. No local duplicates of global state.
6. **Never re-initialize Supabase.** Use the client exported from `lib/supabase.js` only.
7. **`StyleSheet.create()` always.** No inline style objects anywhere.
8. **Keep code clean.** No dead code, commented-out blocks, or unused imports.
9. **Keep this file up to date.** When you add new reusable components, utilities, patterns, or architectural decisions, update CLAUDE.md to reflect them. This is a living document.

---

## 5. Theme Reference

Always import from `constants/theme.js`. Never use raw values.

```js
import { colors, spacing, typography, borderRadius } from '../constants/theme';

// Colors
colors.background    // '#0e0e10'  main background
colors.card          // '#141414'  card surface
colors.cardHover     // '#1a1a1a'  pressed/hovered card
colors.cardAlt       // '#1f1f22'  alternate card surface
colors.groupBg       // '#131315'  grouped section background
colors.iconBg        // '#262528'  icon container background
colors.accent        // '#3fff8b'  neon green — primary action color
colors.accentDark    // '#2ecc71'  darker accent variant
colors.accentGradientEnd // '#13ea79'  LinearGradient end color
colors.accentText    // '#005d2c'  dark green text on accent/gradient backgrounds
colors.accentThumb   // '#004f24'  dark green thumb for Switch on accent track
colors.danger        // '#f87171'  error/destructive
colors.dangerDark    // '#ef4444'  darker danger variant
colors.dangerAlt     // '#ff716c'  alternate danger
colors.text          // '#ffffff'  primary text
colors.textWarm      // '#f9f5f8'  warm white text
colors.textSecondary // '#9ca3af'  secondary/muted text
colors.textMuted     // '#6b7280'  heavily muted text
colors.textLabel     // '#adaaad'  label text
colors.border        // '#374151'  dividers, input borders
colors.inputBg       // '#1a1a1a'  input field background

// Spacing
spacing.xs   // 4
spacing.sm   // 8
spacing.md   // 16
spacing.lg   // 24
spacing.xl   // 32

// Typography sizes
typography.sizes.xs    // 12
typography.sizes.sm    // 14
typography.sizes.md    // 16
typography.sizes.lg    // 18
typography.sizes.xl    // 20
typography.sizes.xxl   // 24
typography.sizes.xxxl  // 32
typography.sizes.display // 36  large price/heading display

// Typography weights
typography.weights.regular   // '400'
typography.weights.medium    // '500'
typography.weights.semibold  // '600'
typography.weights.bold      // '700'

// Border radius
borderRadius.sm    // 8
borderRadius.md    // 12
borderRadius.lg    // 16
borderRadius.xl    // 32
borderRadius.full  // 9999
```

**Opacity variants:** append a 2-digit hex opacity suffix to a color string.
```js
colors.accent + '20'   // accent at ~12% opacity
colors.accent + '33'   // accent at ~20% opacity
colors.border + '80'   // border at 50% opacity
```

---

## 6. Key Utilities

| Utility | Import | Use when |
|---|---|---|
| `extractProduct(url)` | `lib/api.js` | User submits a product URL — returns `{ name, image_url, current_price, domain, currency }` |
| `parseError(error)` | `lib/errorHandler.js` | Every catch block — normalizes Supabase, network, and API errors to a readable string |
| `lib/haptics.js` | `lib/haptics.js` | Button presses, confirmations, success/error feedback — check existing usage for which type fits |
| `lib/notifications.js` | `lib/notifications.js` | Push token registration and deep link routing — do not write push logic elsewhere |
| `lib/secureStore.js` | (used internally by supabase.js) | Supabase auth adapter only — not a general-purpose store |
| `constants/config.js` | `constants/config.js` | All env vars (Supabase URL/key, API URL/key) — never hardcode these values elsewhere |

---

## 7. Dev Workflow

```bash
# Install dependencies
npm install

# Start dev server
npx expo start
# Scan the QR code with Expo Go on your physical device (iOS or Android)
```

**Environment setup:** Copy `.env.example` to `.env` and fill in:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_EXTRACTION_API_URL`
- `EXPO_PUBLIC_EXTRACTION_API_KEY`
