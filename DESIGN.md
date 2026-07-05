---
name: Roashetta
description: Calm, bilingual clinic management for Egyptian healthcare providers.
colors:
  primary-teal: "#2a9d90"
  primary-teal-deep: "#1c6a61"
  teal-wash: "#eaf5f4"
  accent-orange: "#f97415"
  ink: "#1d2930"
  secondary-ink: "#304550"
  muted-ink: "#67777e"
  canvas: "#f9fbfb"
  surface-white: "#ffffff"
  secondary-mist: "#e8eeee"
  muted-mist: "#eef1f1"
  border-mist: "#dce5e5"
  success-green: "#16a249"
  warning-amber: "#f59f0a"
  destructive-red: "#ef4343"
typography:
  display:
    fontFamily: "Cairo, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Cairo, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Cairo, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Cairo, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Cairo, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  md: "10px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary-teal}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.primary-teal-deep}"
    textColor: "{colors.surface-white}"
  button-outline:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.secondary-mist}"
    textColor: "{colors.secondary-ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "40px"
  card:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
  stat-card:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "24px"
  icon-tile:
    backgroundColor: "{colors.teal-wash}"
    textColor: "{colors.primary-teal}"
    rounded: "{rounded.lg}"
    size: "48px"
  badge-default:
    backgroundColor: "{colors.primary-teal}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
---

# Design System: Roashetta

## 1. Overview

**Creative North Star: "The Calm Clinic"**

Roashetta should feel like a well-run consulting room: ordered, unhurried, everything in its place, nothing shouting for attention. The teal that carries the system is the color of a freshly-prepared exam room — clean and clinical, but never icy. A doctor or assistant moves through patients, visits, and prescriptions all day; the interface earns trust by receding so the patient's data is always the loudest thing on screen.

The system is **warm, not cold**. It is a medical tool, but warmth is a deliberate design goal — carried by the soft teal, the rounded Cairo typeface, generous 24px card padding, and tonal tints instead of hard rules and grey boxes. Depth is gentle: surfaces rest on ink-tinted shadows and lift slightly on touch, never hovering behind glass or floating on harsh drop-shadows. Color is **restrained** — teal does almost all the work; the vivid orange is held in reserve for a single moment that genuinely needs it.

This system explicitly rejects two things, both named in PRODUCT.md: **sterile, cold clinical software** (icy greys, hairline-cramped forms, density that adds stress) and **cluttered analytics dashboards** (walls of equal-weight charts with no hierarchy). It also rejects the bilingual afterthought: Arabic (RTL) is a first-class layout, not the English layout flipped and hoped-for.

**Key Characteristics:**
- One family, many weights: Cairo carries Arabic and Latin with equal craft.
- Teal is the single action color; orange is a rare highlight, not décor.
- Tonal washes (10% tints) and soft, ink-tinted shadows convey depth — not borders-as-stripes, not glass.
- Generous rounding (12–16px) and 24px padding make a dense domain feel calm.
- Hierarchy over density everywhere, hardest in data: lead with the one number that matters.

## 2. Colors

A cool teal-and-ink core warmed by a single reserved orange, on near-white tinted surfaces — calm, clinical, and quietly Egyptian-medical.

### Primary
- **Clinic Teal** (`#2a9d90`, `hsl(173 58% 39%)`): The signature. Carries every primary action (buttons, links), the current selection, focus rings, the filled sidebar, and the icon tiles (as a 10% wash). If something is interactive or "the system's voice," it is teal.
- **Deep Teal** (`#1c6a61`): The pressed/hover end of the teal ramp and the second stop of the sidebar gradient. Use for hover and active states of teal surfaces so the lift reads as "deeper," not "lighter."
- **Teal Wash** (`#eaf5f4`, teal at ~10% over white): The fill behind icon tiles and teal-keyed highlights. The calmest way to say "teal" without spending the full saturation.

### Secondary
- **Signal Orange** (`#f97415`, `hsl(25 95% 53%)`): The one warm voice. Reserved — teal leads. Use orange for at most one attention moment per screen (a single high-emphasis CTA, an "needs attention" cue, or a data-viz highlight). It is deliberately the brand's exception, not its hover color.

### Neutral
- **Ink** (`#1d2930`, `hsl(200 25% 15%)`): Primary text, headings, and the hue that tints every shadow. The reading color.
- **Secondary Ink** (`#304550`): Text on the secondary mist surface; slightly lifted from full ink.
- **Muted Ink** (`#67777e`): Secondary labels and meta (stat titles, dates, helper text) — on **white** surfaces only. See the Reading-Contrast Rule.
- **Canvas** (`#f9fbfb`, `hsl(180 20% 98%)`): The app body background — a near-white with the faintest teal tint. The page, never a card.
- **Surface White** (`#ffffff`): Cards, panels, popovers, inputs-at-rest sit on pure white above the canvas.
- **Secondary Mist** (`#e8eeee`) / **Muted Mist** (`#eef1f1`): Quiet fills for secondary buttons, footers (`muted/50`), and inert chips.
- **Border Mist** (`#dce5e5`): Hairline dividers and input strokes. Full borders only — never a thick colored stripe.

### Semantic
- **Success Green** (`#16a249`): Positive trends, completed queue status, confirmations.
- **Warning Amber** (`#f59f0a`): Caution, abnormal-but-not-critical lab flags.
- **Destructive Red** (`#ef4343`): Deletes, errors, and **allergy alerts** — always as a 10% tinted block (`destructive/10`) with solid red text, never a bare red border.

### Dark Mode
A real second theme exists (`.dark`). Canvas drops to deep ink-teal (`#131c20`), cards to `#192429`, and teal brightens to `#30b5a6` to hold contrast. Maintain every rule below in dark mode; verify contrast against the darker surfaces independently.

### Named Rules
**The One Teal Rule.** Teal is the only color allowed to mean "action" or "selected." If two things on a screen are teal, they are both interactive or both the current thing — never decoration.

**The Reserved-Orange Rule.** Orange appears at most once per screen, and never as a default hover. It is the brand's exception; its rarity is what makes it read as "look here."

**The Reading-Contrast Rule.** Muted Ink (`#67777e`) clears 4.5:1 on white cards but only ~4.4:1 on the tinted canvas. Body copy that must be *read* uses Ink (`#1d2930`); Muted Ink is for secondary labels on white surfaces. Never light-grey body text for "elegance."

## 3. Typography

**Display / Body / Label Font:** Cairo (with `sans-serif` fallback), weights 400 / 500 / 600 / 700.

**Character:** One family, full bilingual range. Cairo is a humanist sans designed for Arabic and Latin together, so headings, labels, data, and Arabic body text share one voice with no jarring pairing. There is no display/body split — this is product UI, and a single well-tuned family is the point. Type contrast comes from weight and size, not from a second face.

### Hierarchy
- **Display** (Cairo 700, 1.875rem / 30px, line-height 1.1): The big stat numbers and dashboard hero figures — the one number a screen leads with.
- **Headline** (Cairo 700, 1.5rem / 24px, line-height 1.2): Page titles and primary card titles.
- **Title** (Cairo 600, 1.125rem / 18px, line-height 1.3): Section headers, patient names, list-item titles.
- **Body** (Cairo 400, 0.875rem / 14px, line-height 1.6): Content, descriptions, form values. Cap running prose at 65–75ch; tables and dense panels may run wider.
- **Label** (Cairo 600, 0.75rem / 12px, line-height 1.4): Field labels, badges, meta, status text.

### Named Rules
**The Fixed-Scale Rule.** Type sizes are a fixed rem scale, not fluid `clamp()`. Users sit at consistent DPI in a clinic; a heading that shrinks in a sidebar looks worse, not designed.

**The Weight-Not-Face Rule.** Need more emphasis? Go up in weight or size within Cairo. Never introduce a second font family for "hierarchy" — the bilingual unity is worth more than contrast.

## 4. Elevation

Depth is **soft and tonal**, not glassy or harsh. Two devices carry it: ink-tinted ambient shadows (every shadow is built on `hsl(200 25% 15%)`, never pure black) and flat tonal washes (`bg-primary/10`, `bg-destructive/10`, `bg-muted/50`) that layer surfaces by tint rather than by lifting them. Cards rest low and gain elevation only in response to interaction.

### Shadow Vocabulary
- **Rest** (`box-shadow: 0 1px 2px 0 hsl(200 25% 15% / 0.05)` — `shadow-sm`): Inputs and quiet containers at rest.
- **Card** (`box-shadow: 0 4px 6px -1px hsl(200 25% 15% / 0.1), 0 2px 4px -2px hsl(200 25% 15% / 0.1)` — `card-shadow` / `shadow-md`): The default for stat cards, patient cards, panels.
- **Lifted** (`shadow-lg` / `shadow-xl`): Hover state for interactive cards, and for popovers/dialogs that float above the page.

### Named Rules
**The Lift-on-Touch Rule.** Surfaces rest soft (`shadow-sm`/`card-shadow`). Elevation increases only as feedback — hover, drag, open. A card that already floats high at rest has nowhere to go on interaction.

**The Ink-Shadow Rule.** Shadows are tinted with the ink hue, never `rgba(0,0,0,…)`. Pure-black shadows on a teal-tinted canvas read muddy and cold.

## 5. Components

### Buttons
- **Shape:** Gently rounded (10px, `rounded-md`), 40px tall at default (`h-10`, `px-4`); `sm` 36px, `lg` 44px.
- **Primary:** Solid Clinic Teal, white text. Hover deepens toward Deep Teal. The default for "do the main thing."
- **Secondary:** Secondary Mist fill, Secondary Ink text — quiet alternative actions.
- **Outline / Ghost:** Transparent/white with a Border-Mist stroke (outline) or no chrome (ghost). **Hover must stay quiet** — a teal-wash or mist tint, not the vivid orange accent (see Don'ts).
- **Destructive:** Solid red, white text, for deletes and irreversible actions only.
- **Focus:** 2px teal ring with a 2px offset (`ring-ring ring-offset-2`) on every variant. Disabled drops to 50% opacity.

### Inputs / Fields
- **Style:** 40px tall, 10px radius, Border-Mist stroke on the Canvas fill, Ink text.
- **Placeholder:** Use Ink at reduced opacity, not Muted Ink — placeholders must clear 4.5:1.
- **Focus:** Same 2px teal ring + offset as buttons; the stroke yields to the ring.
- **Disabled:** `not-allowed` cursor, 50% opacity.

### Cards / Containers
- **Corner Style:** Shadcn base cards 12px (`rounded-lg`); signature custom cards (stat, patient) 16px (`rounded-2xl`).
- **Background:** Surface White on the Canvas page. Never card-on-card of the same white without a tint or divider between.
- **Shadow Strategy:** `card-shadow` at rest; `shadow-lg` on hover for interactive cards (see Elevation).
- **Border:** Optional hairline Border-Mist; most cards lean on shadow + white-on-canvas instead.
- **Internal Padding:** 24px (`p-6`). Footers use a Muted-Mist (`muted/50`) band with a top Border-Mist divider.

### Badges / Chips
- **Style:** Pill (`rounded-full`), 12px semibold label, `2px 10px` padding. Default teal-on-white; secondary mist; destructive red. Outline variant is text-only on transparent.
- **State:** Use semantic fills for status (success/warning/destructive); never invent a new hue for a one-off chip.

### Navigation (Sidebar)
- **Style:** A full-height **teal-filled** sidebar (the `gradient-primary` teal→deep-teal), 288px wide (`w-72`), with white text. The single most saturated surface in the app — it frames the calm white workspace.
- **Items:** 12px-rounded rows; active item gets a lighter teal fill (`sidebar-accent`), inactive items are white at 80% opacity, hover lifts to a translucent teal.
- **Mobile:** Collapses into a `Sheet` drawer triggered from a white top bar; opens from the `start` side and mirrors for RTL.

### Signature: Tonal Icon Tile
- A rounded square (12–16px) filled with a 10% tint of its meaning's color and the icon in the full color: `bg-primary/10 + text-primary` for neutral/brand, `bg-destructive/10 + text-destructive` for alerts. This is the system's primary way to give an icon weight without a border or a hard color block. Sizes: 48px (stat/compact) to 64px (patient header).

### Signature: Prescription Canvas
- The drawing/prescription surfaces emulate an Egyptian prescription pad: white A5 sheet, clinic header, patient block, hand-drawn or typed body, doctor footer. Print styles strip all chrome (`@page A5`) so the printed sheet is pure document. Treat these as paper, not UI — minimal Roashetta chrome bleeds into them.

## 6. Do's and Don'ts

### Do:
- **Do** keep teal as the single action/selection color, and let one screen have at most one orange moment (the Reserved-Orange Rule).
- **Do** convey depth with ink-tinted soft shadows and 10% tonal washes; lift surfaces only on interaction.
- **Do** use full tinted blocks for alerts (`bg-destructive/10` with solid red text) — the allergy banner is the model.
- **Do** lead every data surface with the single number that matters, then reveal detail; give analytics breathing room.
- **Do** set body text in Ink (`#1d2930`); reserve Muted Ink for secondary labels on white cards (the Reading-Contrast Rule).
- **Do** build Arabic (RTL) as a first-class layout — mirror direction, flip chevrons and the sidebar, verify Cairo renders cleanly at every weight.
- **Do** give interactive surfaces all states: default, hover, focus (2px teal ring + offset), active, disabled, loading.

### Don't:
- **Don't** ship anything that reads **sterile and cold** — no icy-grey forms, hairline-cramped density, or hard black shadows. Warmth (teal, Cairo, 24px padding, rounding) is a requirement, not a flourish.
- **Don't** build **cluttered analytics dashboards** — no walls of equal-weight charts and numbers with no hierarchy. (Both anti-references are from PRODUCT.md.)
- **Don't** let the vivid orange accent flash on outline/ghost button hovers. Shadcn's `hover:bg-accent` assumes a neutral accent; Roashetta's accent is loud orange. Hover those buttons to a teal-wash or mist tint instead.
- **Don't** use gradient text (`background-clip: text` over a gradient — the `.text-gradient` utility). Emphasis comes from weight and size. (Absolute ban.)
- **Don't** use glassmorphism as a default (`.glass-effect` blur cards). Rare and purposeful, or not at all.
- **Don't** use a thick colored `border-left`/`border-right` as a stripe on cards or alerts. Use a full tinted block or a leading icon tile.
- **Don't** introduce a second font family or fluid `clamp()` headings — one Cairo, fixed rem scale.
- **Don't** nest cards, or place white cards directly on white with no tint/divider between them.
