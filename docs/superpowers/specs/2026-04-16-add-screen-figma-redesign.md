# Add Screen Figma Redesign

**Date:** 2026-04-16
**Figma reference:** https://www.figma.com/design/zz4SRUrRrnYgfArYHPqlJ2/Untitled?node-id=1-187

## Context

The Add Product screen (`app/(tabs)/add.js`) needs to be updated to exactly match the Figma design at node 1-187. The current implementation uses generic component defaults (flat backgrounds, small borderRadius, emoji icons) that diverge significantly from the Figma. This redesign also introduces a `gradient` variant to `Button.js` since gradient pill buttons appear as the primary action style across the app's Figma designs.

---

## Files Changed

| File | Nature of change |
|---|---|
| `constants/theme.js` | Add `colors.cyan: '#7ae6ff'` |
| `components/ui/Button.js` | Add `gradient` variant |
| `components/ProductPreview.js` | Complete redesign |
| `app/(tabs)/add.js` | Complete layout + style redesign |

---

## 1. `constants/theme.js`

Add one new token to the `colors` object:

```js
cyan: '#7ae6ff',  // domain tag on product preview card
```

---

## 2. `components/ui/Button.js` — gradient variant

Add a `gradient` variant that wraps a `Pressable` inside `LinearGradient` from `expo-linear-gradient`.

- Gradient: `[colors.accent, colors.accentGradientEnd]`, direction left→right (`start: {x:0,y:0.5}`, `end: {x:1,y:0.5}`)
- `borderRadius`: `borderRadius.full` (9999)
- Label: `colors.accentText` (#005d2c), `typography.sizes.md`, `typography.weights.semibold`
- Height and shadow are passed via the `style` prop from the caller
- Disabled state: `opacity: 0.5` on the outer wrapper
- Loading state: `ActivityIndicator` with `colors.accentText`

The existing `primary`, `danger`, and `ghost` variants are unchanged.

---

## 3. `components/ProductPreview.js` — complete redesign

Remove the `Card` wrapper. New structure:

```
<View> (outer: bg cardAlt, borderRadius 32, overflow hidden, shadow)
  <Image />                          ← 192px height, resizeMode cover, full width
  <View> (content: padding 24)
    <View> (row: space-between)
      <Text> DOMAIN              ← cyan, 11px, uppercase, tracking 1.1
      <View> (badge pill)        ← bg accent+1A, px 12, py 4, borderRadius full
        <Text> METHOD            ← accent, 10px, uppercase, tracking 1
    <Text> Product Name          ← textWarm, 20px, regular, 2 lines max
    <View> (row: paddingTop 16, alignItems baseline)
      <Text> $299.00             ← textWarm, 30px, tracking -0.75
      <Text> CURRENT             ← textLabel, 11px, uppercase, tracking 1.1
```

If `image_url` is absent the image area is omitted (same as current behavior).

---

## 4. `app/(tabs)/add.js` — layout redesign

### Heading section
- **Title** "Add Product": `typography.sizes.display` (36px), `colors.textWarm`, `typography.weights.regular`, `letterSpacing: -0.9`
- **Subtitle** "Paste a product link to start tracking": `typography.sizes.lg` (18px), `colors.textLabel`
- Gap between heading and URL section: 48px

### URL input
- Height: 64px, `borderRadius: borderRadius.full`, `backgroundColor: colors.iconBg`
- Left icon: `<Ionicons name="link" size={20} color={colors.textMuted} />` at absolute position `left: 20`
- `TextInput`: `paddingLeft: 56`, `paddingRight: 24`, `fontSize: typography.sizes.lg` (18px), `color: colors.text`, placeholder `colors.textMuted`
- No border

### Fetch Product button
- Variant: `gradient`, height: 56px
- Shadow: `shadowColor: colors.accent, shadowOffset: {width:0, height:0}, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8`
- Label: "Fetch Product", 18px

### Error row (shown when `error` state is set)
- `flexDirection: row`, `alignItems: center`, `gap: 8`, `paddingHorizontal: 8`
- Icon: `<Ionicons name="alert-circle" size={15} color={colors.dangerAlt} />`
- Text: `colors.dangerAlt`, `typography.sizes.sm` (14px)

### Fetched state section
- `borderTopWidth: 1`, `borderTopColor: 'rgba(72,71,74,0.1)'`, `paddingTop: 17`, `gap: 32` between children

### Target price block
Structure uses a relative container of height 112.5 to overlap the floating label and input:

```
<View> (relative, height 112.5)
  <Text> "SET YOUR TARGET PRICE"   ← absolute, top 8 (offset -50%), textLabel, 11px, uppercase, tracking 1.1
  <View> (absolute, left 0, right 0, top 32.5)    ← input wrapper
    <View> (input bg: groupBg, height 80, borderRadius full, border rgba(72,71,74,0.2), overflow hidden)
      <TextInput>                  ← absolute, left 48, right 39, top 17, display (36px), tracking -0.9
      <View> ($ prefix, absolute left 24)
        <Text> "$"                 ← accent, 24px
      <View> (USD suffix, absolute right 24)
        <Text> "USD"               ← accent+'66', 14px, uppercase, tracking 1.4
```

### Start Tracking button
- Variant: `gradient`, height: 64px
- Shadow: `shadowColor: colors.accent, shadowOffset: {width:0, height:10}, shadowOpacity: 0.15, shadowRadius: 40, elevation: 10`
- Label: "Start Tracking", 20px (`typography.sizes.xl`)

---

## Verification

1. Run `npx expo start` and open the Add tab in Expo Go
2. Verify heading "Add Product" is 36px, warm white, with correct tracking
3. Verify URL input is a pill (fully rounded), dark gray bg, with link icon on left
4. Tap "Fetch Product" with an invalid/empty URL — confirm error row shows warning icon + red text
5. Enter a valid product URL, extract — verify product card shows hero image, cyan domain, method badge, name, price + CURRENT label
6. Verify target price input shows "$" prefix in green, "USD" suffix in faded green, 36px text
7. Tap "Start Tracking" — confirm gradient buttons have green glow shadow
8. Confirm no other screens are broken (home, settings, product detail)