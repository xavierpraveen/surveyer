# Phase 5: Brand Redesign - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning
**Source:** PRD Express Path (docs/superpowers/specs/2026-03-16-brand-redesign-design.md)

<domain>
## Phase Boundary

This phase applies the new Bold & Confident visual identity to all user-facing pages across admin and employee surfaces. It does not add new functionality — it reskins what exists. Scope: design token system (CSS custom properties + Tailwind mapping), Inter typeface via next/font/google, a new TopNav component, and restyling of all buttons, badges, cards, form inputs, survey Likert scale, progress bar, and status banner across ~30 component and page files.

Legacy routes `(leadership)/` and `(manager)/` are explicitly out of scope.

</domain>

<decisions>
## Implementation Decisions

### Brand Direction
- **Chosen direction:** Bold & Confident — dark navy for emphasis, indigo/violet accent, strong contrast
- **Theme mode:** Light + Bold Accent — white/slate backgrounds, indigo accent for brand signal; NOT dark-first
- **Typeface:** Inter via `next/font/google`; `variable: '--font-inter'`; applied as `className={inter.variable}` on `<html>`; Tailwind `fontFamily.sans` extended to pick it up

### Design Token System
- **Approach:** CSS custom properties in `:root` in `globals.css` + Tailwind `theme.extend.colors` mapping each token to `var(--color-*)`. No opacity-modifier classes on CSS vars (Tailwind cannot decompose hex CSS vars for opacity — use concrete Tailwind palette classes like `indigo-200` instead).
- **21 semantic tokens defined** in spec Section 2 — brand, brand-hover, brand-muted, brand-text, accent, bg, surface, surface-2, fg, fg-muted, fg-subtle, border, border-focus, success/muted/text, warning/muted/text, error/muted/text
- **No `--color-info` token** — info states use `brand-muted` / `brand-text`
- **Letter-spacing:** Add `letterSpacing.snug` (`-0.03125em`) and `letterSpacing.tight` (`-0.01875em`) to Tailwind config — used on headings
- **Shadow overrides:** `boxShadow.sm` and `.md` in `theme.extend` intentionally override Tailwind defaults
- **rounded DEFAULT:** Set to `6px` (affects bare `rounded` class only); `rounded-md` = 6px for interactive elements; `rounded-lg` = 8px (Tailwind default) intentionally used for cards

### Top Navigation Bar
- **New file:** `src/components/layout/TopNav.tsx`; must also create `src/components/layout/` directory
- **Added to:** `(admin)` and `(employee)` route groups via new `layout.tsx` files in each (neither exists yet — both must be created)
- **Structure:** `bg-surface border-b border-border h-11 px-5` with logo (indigo logomark + "Surveyer" wordmark), nav links, user avatar (26px circle with initials)
- **Not added to:** `(auth)`, `survey/public/`, `results/`, `(leadership)/`, `(manager)/`

### Buttons (4 variants — exact class strings locked)
- **Primary:** `bg-brand hover:bg-brand-hover text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed`
- **Secondary:** `bg-surface-2 hover:bg-border border border-border text-fg-muted font-medium text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed`
- **Ghost:** `bg-transparent hover:bg-brand-muted text-brand font-medium text-sm px-3.5 py-2 rounded-md transition-colors duration-150`
- **Danger:** `bg-error hover:bg-error-text text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50`

### Badges / Status Pills (base + 10 variants — locked)
- **Base:** `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold`
- Open: `bg-success-muted text-success-text` | Draft: `bg-surface-2 text-fg-muted` | Scheduled: `bg-warning-muted text-warning-text`
- Closed: `bg-surface-2 text-fg-subtle` | Planned: `bg-brand-muted text-brand-text` | In Progress: `bg-warning-muted text-warning-text`
- Completed: `bg-success-muted text-success-text` | High priority: `bg-error-muted text-error-text`
- Medium priority: `bg-warning-muted text-warning-text` | Low priority: `bg-surface-2 text-fg-muted`

### Cards
- Standard: `bg-surface border border-border rounded-lg shadow-sm`
- Interactive hover: `hover:border-indigo-300 hover:shadow-md transition-all duration-150`

### Form Inputs
- `border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus`
- Error state: `border-error focus:ring-red-200`

### Survey Likert Scale Buttons
- Unselected: `border border-border bg-surface text-fg-muted rounded-md py-2 text-sm`
- Selected: `border-2 border-brand bg-brand-muted text-brand font-bold rounded-md`
- Hover: `border-indigo-300 bg-brand-muted`

### Progress Bar
- Track: `bg-brand-muted h-1.5 rounded-full`
- Fill: `bg-gradient-to-r from-brand to-accent h-1.5 rounded-full`

### Survey Status Banner
- `sticky top-0 z-10 border-l-4 px-4 py-3 mb-4`
- draft: `border-fg-subtle bg-surface-2` | scheduled: `border-warning bg-warning-muted`
- open: `border-success bg-success-muted` | closed: `border-fg-muted bg-surface-2`

### Accessibility Rules
- All interactive elements: `focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none`
- `@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }` in globals.css
- Never use `text-brand` for body copy (4.47:1 on white — borderline); use `text-brand-text` (#4338CA, 6.1:1) for text links
- Badges always include text labels (no color-only information)

### Typography Scale
- `text-2xl font-extrabold tracking-snug` — page hero headings
- `text-xl font-bold tracking-snug` — page titles
- `text-base font-bold tracking-tight` — card/section headings
- `text-sm font-semibold` — sub-headings, table headers
- `text-sm` — body copy
- `text-xs` — secondary text
- `text-[10px] font-semibold uppercase tracking-[0.07em]` — category labels only (decorative, adjacent to larger text)
- `tabular-nums` class on all score/metric displays

### Execution Order
Infrastructure first (globals.css → tailwind.config.ts → layout.tsx → TopNav.tsx → route group layouts), then components in dependency order.

### Claude's Discretion
- Whether to introduce a shared Button component or apply class strings per-component
- Whether to extract a Badge component or keep inline
- Exact RSC vs client component split for TopNav (needs auth data for user avatar — likely RSC wrapping client for active link detection)
- Order of component restyling within the admin and survey component buckets

</decisions>

<specifics>
## Specific Ideas

- The TopNav user avatar shows initials computed from the user's display name or email prefix
- The layout.tsx minimal pattern: `<><TopNav /><main className="min-h-screen bg-bg">{children}</main></>`
- The `tracking-snug` (-0.03125em) and `tracking-tight` (-0.01875em) Tailwind extensions resolve the letter-spacing spec values into usable utility classes without arbitrary value syntax
- The `boxShadow.sm` override (`0 1px 3px rgba(0,0,0,0.06)`) is lighter than Tailwind's default `shadow-sm` — intentional for a cleaner surface feel
- The `ringColor.DEFAULT` sets `var(--color-brand)` so bare `ring` class auto-brands, but all spec usages use explicit `ring-indigo-200` / `ring-red-200` for opacity-safe focus rings

</specifics>

<deferred>
## Deferred Ideas

- Dark mode — semantic token layer makes this a future single-file change to globals.css
- Custom illustration or icon set
- Motion/animation system beyond `transition-colors duration-150`
- `src/app/(leadership)/` and `src/app/(manager)/` route restyling
- Mobile-specific TopNav (hamburger/drawer) — desktop layout is v1
- Custom logo SVG — initials-based logomark placeholder is v1

</deferred>

---

*Phase: 05-brand-redesign*
*Context gathered: 2026-03-16 via PRD Express Path*
