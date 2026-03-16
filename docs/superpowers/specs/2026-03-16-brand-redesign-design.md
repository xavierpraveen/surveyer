# Surveyer Brand Redesign — Design Spec

**Date:** 2026-03-16
**Status:** Approved for implementation
**Scope:** Full visual identity update — token system, Tailwind config, globals.css, all components

---

## 1. Brand Direction

**Chosen:** Bold & Confident · Light + Bold Accent · Inter

### Brand Attributes
- **Precise** — data and numbers read cleanly at every scale
- **Confident** — strong brand color, not hedging with neutrals
- **Trustworthy** — slate neutrals convey stability; no trendy gradients on surfaces
- **Focused** — indigo accent used sparingly; earns attention when it appears

### Research Rationale
- Culture Amp / 15Five: warm approach suits consumer-leaning HR tools. Surveyer targets technically-minded admins — warmth would feel off.
- Lattice: cool teal is credible but indistinct. Indigo/violet gives stronger brand recall.
- Linear / Vercel: dark-first was ruled out because the employee survey-taking flow demands maximum readability at all environments.
- Stripe / Notion: light + bold accent pattern confirmed as highest-readability approach for data-heavy dashboards.

---

## 2. Color System

### Primitive Palette

| Name | Hex | Role |
|------|-----|------|
| indigo-500 | `#6366F1` | **Primary brand** |
| indigo-600 | `#4F46E5` | Brand hover |
| indigo-700 | `#4338CA` | Brand text on tinted bg |
| indigo-50  | `#EEF2FF` | Brand muted background |
| violet-500 | `#8B5CF6` | **Accent** |
| slate-900  | `#0F172A` | Foreground |
| slate-500  | `#64748B` | Muted text |
| slate-400  | `#94A3B8` | Subtle text |
| slate-200  | `#E2E8F0` | Border |
| slate-100  | `#F1F5F9` | Surface 2 |
| slate-50   | `#F8FAFC` | Background |
| —          | `#FFFFFF` | Surface (card) |
| emerald-500 | `#10B981` | Success |
| emerald-100 | `#DCFCE7` | Success muted |
| emerald-800 | `#065F46` | Success text (on muted) |
| amber-500  | `#F59E0B` | Warning |
| amber-100  | `#FEF3C7` | Warning muted |
| amber-800  | `#92400E` | Warning text (on muted) |
| red-500    | `#EF4444` | Error |
| red-100    | `#FEE2E2` | Error muted |
| red-800    | `#991B1B` | Error text (on muted) |

### Semantic CSS Custom Properties

```css
/* src/app/globals.css */
:root {
  /* Brand */
  --color-brand:          #6366F1;
  --color-brand-hover:    #4F46E5;
  --color-brand-muted:    #EEF2FF;
  --color-brand-text:     #4338CA;
  --color-accent:         #8B5CF6;

  /* Surfaces */
  --color-bg:             #F8FAFC;
  --color-surface:        #FFFFFF;
  --color-surface-2:      #F1F5F9;

  /* Text */
  --color-fg:             #0F172A;
  --color-fg-muted:       #64748B;
  --color-fg-subtle:      #94A3B8;

  /* Border */
  --color-border:         #E2E8F0;
  --color-border-focus:   #6366F1;

  /* Success */
  --color-success:        #10B981;
  --color-success-muted:  #DCFCE7;
  --color-success-text:   #065F46;

  /* Warning */
  --color-warning:        #F59E0B;
  --color-warning-muted:  #FEF3C7;
  --color-warning-text:   #92400E;

  /* Error */
  --color-error:          #EF4444;
  --color-error-muted:    #FEE2E2;
  --color-error-text:     #991B1B;
}
```

*Note: No separate `--color-info` token. Info states use brand color (`--color-brand` / `--color-brand-muted`).*

### Accessibility Contrast (WCAG AA minimum 4.5:1 for text)

| Combination | Ratio | Pass |
|---|---|---|
| `brand` (#6366F1) on white | 4.47:1 | ⚠️ borderline¹ |
| `brand-hover` (#4F46E5) on white | 5.9:1 | ✅ AA+ |
| `fg` (#0F172A) on white | 17.5:1 | ✅ AAA |
| `fg-muted` (#64748B) on white | 4.7:1 | ✅ AA |
| white text on `brand` (#6366F1) | 4.47:1 | ⚠️ borderline¹ |
| `brand-text` (#4338CA) on `brand-muted` (#EEF2FF) | 6.1:1 | ✅ AA+ |
| `success-text` (#065F46) on `success-muted` (#DCFCE7) | 7.2:1 | ✅ AAA |
| `warning-text` (#92400E) on `warning-muted` (#FEF3C7) | 5.1:1 | ✅ AA |
| `error-text` (#991B1B) on `error-muted` (#FEE2E2) | 5.9:1 | ✅ AA+ |

¹ **Brand color contrast note:** `#6366F1` achieves 4.47:1 on white — below the 4.5:1 AA threshold for normal text. **Rule:** never use `text-brand` for body copy or standalone labels. Acceptable uses: (a) primary button (white text on `bg-brand`, both sides 4.47:1 — acceptable as 14px semibold interactive element per WCAG 2.1 §1.4.3 exception for UI components); (b) decorative accents. For text links or standalone brand-coloured text, use `text-brand-text` (#4338CA, 6.1:1 on white) instead.

---

## 3. Tailwind Configuration

The full `tailwind.config.ts` `theme.extend.colors` mapping — every Tailwind class referenced in components must exist here:

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand:         'var(--color-brand)',
        'brand-hover': 'var(--color-brand-hover)',
        'brand-muted': 'var(--color-brand-muted)',
        'brand-text':  'var(--color-brand-text)',
        accent:        'var(--color-accent)',

        bg:            'var(--color-bg)',
        surface:       'var(--color-surface)',
        'surface-2':   'var(--color-surface-2)',

        fg:            'var(--color-fg)',
        'fg-muted':    'var(--color-fg-muted)',
        'fg-subtle':   'var(--color-fg-subtle)',

        border:        'var(--color-border)',
        'border-focus':'var(--color-border-focus)',

        success:       'var(--color-success)',
        'success-muted':'var(--color-success-muted)',
        'success-text':'var(--color-success-text)',

        warning:       'var(--color-warning)',
        'warning-muted':'var(--color-warning-muted)',
        'warning-text':'var(--color-warning-text)',

        error:         'var(--color-error)',
        'error-muted': 'var(--color-error-muted)',
        'error-text':  'var(--color-error-text)',
      },
      borderRadius: {
        // DEFAULT affects bare `rounded` class only.
        // rounded-md (6px) for interactive elements; rounded-lg (8px, Tailwind default) for cards — intentional.
        DEFAULT: '6px',
      },
      letterSpacing: {
        snug: '-0.03125em', // ~-0.5px at 16px; use on 20–24px headings
        tight: '-0.01875em', // ~-0.3px at 16px; use on 16px headings
      },
      boxShadow: {
        // These keys override Tailwind's built-in shadow-sm and shadow-md — intentional.
        sm: '0 1px 3px rgba(0,0,0,0.06)',
        md: '0 4px 12px rgba(0,0,0,0.08)',
      },
      // ringColor DEFAULT is used only by bare `ring` class — explicit ring-* classes are preferred.
      ringColor: {
        DEFAULT: 'var(--color-brand)',
      },
    },
  },
  plugins: [],
}

export default config
```

---

## 4. Typography

**Font:** Inter (Google Fonts via `next/font/google`)

```ts
// src/app/layout.tsx
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })
```

Apply `className={inter.variable}` on `<html>`. The Tailwind `fontFamily.sans` extension picks it up automatically.

### Type Scale

| Tailwind classes | Size | Weight | Tracking class | Usage |
|---|---|---|---|---|
| `text-2xl font-extrabold tracking-snug` | 24px | 800 | `tracking-snug` | Page hero headings |
| `text-xl font-bold tracking-snug` | 20px | 700 | `tracking-snug` | Page titles |
| `text-base font-bold tracking-tight` | 16px | 700 | `tracking-tight` | Card/section headings |
| `text-sm font-semibold` | 14px | 600 | default | Sub-headings, table headers |
| `text-sm` | 14px | 400 | default | Body copy |
| `text-xs` | 12px | 400 | default | Secondary text |
| `text-[10px] font-semibold uppercase tracking-[0.07em]` | 10px | 600 | custom | Category labels only (see note) |

*`tracking-snug` and `tracking-tight` are defined in `theme.extend.letterSpacing` (Section 3).*

**Note on 10px labels:** Acceptable *only* as non-informational decorative uppercase category labels directly adjacent to larger text (e.g., "OPEN SURVEY" above a heading). Never use 10px for standalone informational content or anything a user needs to read independently.

**Tabular numerals:** Add `font-variant-numeric: tabular-nums` via `tabular-nums` Tailwind class on all score/metric displays.

---

## 5. Spacing & Layout

- **Base unit:** 4px
- **Page padding:** `p-8` (32px) desktop, `p-4` mobile
- **Max content width:** `max-w-6xl` admin pages, `max-w-3xl` survey flow
- **Card padding:** `p-5` standard, `p-4` compact
- **Card gap:** `gap-4`
- **Section rhythm:** `mb-6` between major sections

---

## 6. Component Rules

### Top Navigation Bar

**New file:** `src/components/layout/TopNav.tsx`

Added to: `src/app/(admin)/layout.tsx` and `src/app/(employee)/layout.tsx` only.
*Not* added to: `src/app/(auth)/layout.tsx` (login/magic-link), `src/app/survey/public/` (anonymous flow), `src/app/results/` (already standalone), `src/app/(leadership)/`, `src/app/(manager)/` (legacy routes — left unchanged).

Structure:
```
bg-surface border-b border-border h-11 px-5
├── Logo: [indigo logomark 22px rounded-md gradient brand→accent] + "Surveyer" fg font-extrabold text-sm tracking-tight
├── Nav links: text-xs fg-muted font-medium | active: text-brand font-semibold
└── User avatar: 26px circle bg-brand-muted text-brand font-bold text-[10px] (initials)
```

### Buttons

| Variant | Class string |
|---|---|
| Primary | `bg-brand hover:bg-brand-hover text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed` |
| Secondary | `bg-surface-2 hover:bg-border border border-border text-fg-muted font-medium text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed` |
| Ghost | `bg-transparent hover:bg-brand-muted text-brand font-medium text-sm px-3.5 py-2 rounded-md transition-colors duration-150` |
| Danger | `bg-error hover:bg-error-text text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50` |

*Secondary hover: `bg-border` (slate-200 as background) gives a subtle "pressed" effect without changing text or adding new color.*

### Badges / Status Pills

All badges use: `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold`

| Status | bg class | text class |
|---|---|---|
| Open | `bg-success-muted` | `text-success-text` |
| Draft | `bg-surface-2` | `text-fg-muted` |
| Scheduled | `bg-warning-muted` | `text-warning-text` |
| Closed | `bg-surface-2` | `text-fg-subtle` |
| Planned | `bg-brand-muted` | `text-brand-text` |
| In Progress | `bg-warning-muted` | `text-warning-text` |
| Completed | `bg-success-muted` | `text-success-text` |
| High priority | `bg-error-muted` | `text-error-text` |
| Medium priority | `bg-warning-muted` | `text-warning-text` |
| Low priority | `bg-surface-2` | `text-fg-muted` |

### Cards
```
bg-surface border border-border rounded-lg shadow-sm
Interactive: hover:border-indigo-300 hover:shadow-md transition-all duration-150
```

*Note: `hover:border-brand/40` does not work because Tailwind cannot decompose hex CSS vars into RGB channels for opacity modifiers. Use concrete Tailwind palette classes (`indigo-*`, `red-*`, etc.) anywhere an opacity modifier is needed.*

### Form Inputs
```
border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg
placeholder:text-fg-subtle
focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus
error: border-error focus:ring-red-200
```

### Survey Likert Scale Buttons
```
Unselected: border border-border bg-surface text-fg-muted rounded-md py-2 text-sm
Selected:   border-2 border-brand bg-brand-muted text-brand font-bold rounded-md
Hover:      border-indigo-300 bg-brand-muted
```

### Progress Bar
```
Track: bg-brand-muted h-1.5 rounded-full
Fill:  bg-gradient-to-r from-brand to-accent h-1.5 rounded-full
```

### Survey Status Banner
```
sticky top-0 z-10 border-l-4 px-4 py-3 mb-4
draft:     border-fg-subtle   bg-surface-2
scheduled: border-warning     bg-warning-muted
open:      border-success     bg-success-muted
closed:    border-fg-muted    bg-surface-2
```

---

## 7. Affected Files

### Infrastructure (must do first)
1. `src/app/globals.css` — CSS custom properties + reduced-motion rule. **Do NOT add an `@import` for Inter here** — Inter is loaded exclusively via `next/font/google` in `layout.tsx` (step 3).
2. `tailwind.config.ts` — extended theme (Section 3)
3. `src/app/layout.tsx` — `next/font/google` Inter setup (already exists — add `Inter` import and apply `inter.variable` to `<html>` className)
4. `src/components/layout/TopNav.tsx` — **new file**; create `src/components/layout/` directory first
5. `src/app/(admin)/layout.tsx` — **create this file** (does not yet exist); wrap children with `<TopNav />` plus a `<main>` container
6. `src/app/(employee)/layout.tsx` — **create this file** (does not yet exist); same pattern as `(admin)/layout.tsx`

Minimal layout.tsx pattern (adapt for each route group):
```tsx
import TopNav from '@/components/layout/TopNav'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNav />
      <main className="min-h-screen bg-bg">{children}</main>
    </>
  )
}
```

### Admin components
- `src/components/admin/SurveyStatusBanner.tsx`
- `src/components/admin/SurveyList.tsx`
- `src/components/admin/SettingsTabs.tsx`
- `src/components/admin/ActionItemForm.tsx`
- `src/components/admin/ActionUpdateTimeline.tsx`
- `src/components/admin/CyclesTab.tsx`
- `src/components/admin/EmployeeImportTab.tsx`
- `src/components/admin/ParticipationMonitorTab.tsx`
- `src/components/admin/PrivacySettingsTab.tsx`
- `src/components/admin/PublishConfirmModal.tsx`
- `src/components/admin/PublishResultsButton.tsx`
- `src/components/admin/QuestionEditor.tsx`
- `src/components/admin/SectionSidebar.tsx`
- `src/components/admin/TaggingWorkspace.tsx`

### Survey components
- `src/components/survey/SurveyWizard.tsx`
- `src/components/survey/QuestionRenderer.tsx`
- `src/components/survey/SurveyProgressBar.tsx`
- `src/components/survey/ConditionalQuestion.tsx`

### Analytics components
- `src/components/analytics/KpiStrip.tsx`
- `src/components/analytics/DimensionBarChart.tsx`
- `src/components/analytics/DepartmentHeatmap.tsx`
- `src/components/analytics/FilterBar.tsx`
- `src/components/analytics/QualitativeThemePanel.tsx`
- `src/components/analytics/ThresholdPlaceholder.tsx`
- `src/components/analytics/TrendLineChart.tsx`
- `src/components/results/CycleSelector.tsx`

### Page files (actual paths verified)
- `src/app/(admin)/admin/page.tsx`
- `src/app/(admin)/admin/surveys/page.tsx`
- `src/app/(admin)/admin/surveys/[id]/page.tsx`
- `src/app/(admin)/admin/surveys/[id]/tags/page.tsx`
- `src/app/(admin)/admin/surveys/new/page.tsx`
- `src/app/(admin)/admin/actions/page.tsx`
- `src/app/(admin)/admin/actions/[id]/page.tsx`
- `src/app/(admin)/admin/settings/page.tsx`
- `src/app/(employee)/dashboard/page.tsx`
- `src/app/(employee)/surveys/[id]/page.tsx`
- `src/app/(employee)/surveys/[id]/confirmation/page.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/magic-link/page.tsx`
- `src/app/results/page.tsx`
- `src/app/survey/public/[id]/page.tsx`
- `src/app/survey/public/[id]/confirmation/page.tsx`

*Legacy routes left unchanged: `src/app/(leadership)/leadership/dashboard/page.tsx`, `src/app/(manager)/manager/dashboard/page.tsx`*

---

## 8. Accessibility

- All interactive elements: `focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none`
- No color-only information (badges always include text label)
- Minimum touch target 44×44px on mobile for all buttons
- Reduced motion: add to `globals.css`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; animation: none !important; }
  }
  ```
- All form inputs have associated `<label>` elements
- Error messages wrapped in `role="alert"`

---

## 9. Non-Goals (Deferred)

- Dark mode (semantic token layer makes this a future single-file change)
- Custom illustration or icon set
- Motion/animation system beyond `transition-colors duration-150`
- `src/app/(leadership)/` and `src/app/(manager)/` route restyling
