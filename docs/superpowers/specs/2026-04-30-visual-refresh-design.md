# DCR Visual Refresh — Design Spec

**Date:** 2026-04-30
**Author:** brainstormed with Claude (Opus 4.7)
**Status:** Draft, pending user review

## Goal

Redesign the DCR 2.0 frontend toward a premium, modern, professional look in the Apple / visionOS lane ("glassy depth done correctly — subtle, layered, content-first"). Polish both light and dark themes. Support all viewports from 360px to 2560px+. Eliminate cross-page inconsistency by introducing a formal token system and shared layout primitives.

This is a visual + structural refresh. No new features. No data-model or routing changes.

## Why now / Problem statement

- ~2,900 lines of CSS across just 6 component files; `globals.css` is only ~141 lines of tokens. Most styling is component-local with duplicated literal values (raw hex, raw px, ad-hoc shadows). This is the root cause of inconsistency, not visual choices.
- Pages were built incrementally; each has its own header/empty-state/spacing pattern.
- Glass-morphism is applied unevenly — some pages use it heavily, others barely. Material levels are not formalized.
- Mobile responsiveness is partial: the desktop sidebar is the only navigation pattern, modals are not full-sheet on small screens.
- Dark mode tokens diverge from light mode tokens in non-systematic ways.

## Non-goals

- Firebase / Firestore / authentication logic
- React Router / page-routing changes (the app uses state-based navigation in `Layout.tsx`)
- Mock-user dev tooling
- New features, fields, or flows
- Test framework introduction (none exists today; verification is `npm run build` + `npm run lint`)
- Content rewrites (page copy stays as-is unless directly tied to a UI primitive change like empty states)

## Visual direction

Apple / visionOS — premium glassy depth done **correctly**. Layered materials, very subtle saturation, content-first. Quiet aurora-style backgrounds. A single indigo→violet accent reserved for primary CTAs and active states. Typography does the heavy lifting; effects are accents, not the main event.

## Architecture overview

The redesign is delivered in three phases. Each phase is independently buildable and verifiable.

```
Phase 1 — Foundation                Phase 2 — Chrome                  Phase 3 — Pages
  tokens.css                          Layout                            HomePage
  primitives/                         Sidebar (+ mobile bottom-nav)     CatalogPage
    PageShell                         CommandPalette                    SimulatorPage
    Card                              Toast                             TeamLeaderDashboard
    Section                           Modals (Welcome, ProfileSetup)    ProfilePage
    Button / IconButton                                                 FaqPage / FormsPage / GuidelinesPage
    Stack / Cluster                                                     PendingApprovalPage
    EmptyState
    Sheet / Dialog
```

Phase 1 ships invisibly (tokens + primitives, no page changes yet). Phase 2 swaps the app chrome to use them. Phase 3 migrates pages one at a time, each one deleting its duplicate CSS in the process.

## Foundation — Design Tokens

All tokens live in a new `src/styles/tokens.css`. `globals.css` stops defining raw values and consumes tokens. Each token has a light-mode value and a `[data-theme="dark"]` override.

### Type scale (6 steps)

| Token | Size / line-height | Weight | Usage |
|---|---|---|---|
| `--type-display` | 40 / 44 | 700 | Hero titles |
| `--type-title` | 28 / 34 | 650 | Page titles |
| `--type-headline` | 20 / 26 | 600 | Section headings |
| `--type-body` | 15 / 22 | 450 | Default text |
| `--type-callout` | 13 / 18 | 500 | Labels, secondary |
| `--type-caption` | 11 / 14 | 500 | Micro-labels, badges |

Inter for UI, JetBrains Mono for monospace (kept). Letter-spacing tokens at display/title only (slight tighten, -0.01em).

### Spacing — 8pt grid

`--space-1` through `--space-11`: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80. No raw px in component CSS.

### Materials (5 levels)

| Token | blur | bg opacity | Usage |
|---|---|---|---|
| `--material-base` | none | full surface | Solid content panels |
| `--material-thin` | 8px | low | Inline chips, subtle layers |
| `--material-regular` | 16px | mid | Default cards |
| `--material-thick` | 24px | high | Modals, popovers |
| `--material-chrome` | 32px | high + saturate | Sidebar, sticky headers |

Each material is a composite (background + backdrop-filter + border) and is applied via a single CSS class or CSS variable bundle.

### Elevation (5 levels)

`--elev-0` (flat) through `--elev-4` (dramatic). Each defines a `box-shadow` for both themes. Components reference elevation tokens, never raw shadow values.

### Radius

`--radius-xs 6`, `--radius-sm 10`, `--radius-md 14`, `--radius-lg 20`, `--radius-xl 28`, `--radius-pill 999`.

### Color

- **Accent ramp:** `--accent-50` through `--accent-900` (indigo with violet tilt). The primary gradient is `linear-gradient(135deg, --accent-500, --accent-700)`, used sparingly.
- **Semantic:** `--success`, `--warning`, `--error`, `--info` each with `-bg`, `-fg`, `-border` variants.
- **Surface ramp:** `--surface-1` (page background) through `--surface-4` (raised popover). Per-theme.
- **Text ramp:** `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-on-accent`. Per-theme.
- **Outline:** `--outline-subtle`, `--outline-strong` for borders/dividers.

Constraint: zero raw hex in component CSS after Phase 3. ESLint / a manual grep can verify.

### Motion

- `--duration-fast 150ms`, `--duration-normal 220ms`, `--duration-slow 320ms`
- `--ease-out cubic-bezier(0.16, 1, 0.3, 1)` (default)
- `--ease-spring cubic-bezier(0.34, 1.56, 0.64, 1)` (entrances, achievement state changes)

Motion respects `prefers-reduced-motion: reduce` — duration falls to 0ms, springs become linear.

### Focus ring

Single distinctive `--focus-ring` token: 2px solid accent + 4px halo (`box-shadow: 0 0 0 4px rgba(accent, 0.2)`). Used by every interactive primitive. Accessible (AA contrast against any surface).

## Page Shell Primitive

A new `<PageShell>` component every page uses. This is the largest single source of inconsistency reduction.

```tsx
<PageShell
  title="Catalog"
  breadcrumb={...optional}
  actions={...right-side toolbar}
  subnav={...optional tabs}
>
  <PageShell.Section>...</PageShell.Section>
</PageShell>
```

Responsibilities:
- Sticky header strip with `material-chrome`, slot for title + breadcrumb left and actions right
- Consistent content padding, scaled by viewport (24 / 32 / 40)
- Optional sub-nav tabs strip
- Standardized empty state via `<EmptyState illustration title body cta />`

Every page in Phase 3 swaps its bespoke chrome for this component.

## Other primitives

- **`<Card>`** — material-regular by default, elevation-1 at rest, elevation-2 on hover, configurable padding.
- **`<Section>`** — vertical rhythm container; uses spacing tokens for gap between children.
- **`<Button>` / `<IconButton>`** — variants: primary (gradient), secondary (material-thin), ghost, destructive. Sizes: sm / md / lg. Built-in focus ring, loading state, disabled state.
- **`<Stack>` / `<Cluster>`** — flex-direction column / row primitives that take a `gap` token. Replaces ad-hoc `display:flex; gap:Xpx` everywhere.
- **`<Sheet>` / `<Dialog>`** — modal primitives. `Sheet` is full-height slide-up on mobile, centered card on desktop. `Dialog` is centered both. Both use `material-thick`.
- **`<EmptyState>`** — illustration + title + body + cta, used by every empty state across the app.

## Responsive strategy

Breakpoints (in tokens too):
- `--bp-sm 640`
- `--bp-md 768`
- `--bp-lg 1024`
- `--bp-xl 1280`
- `--bp-2xl 1536`

| Element | Mobile (<md) | Tablet (md–lg) | Desktop (≥lg) |
|---|---|---|---|
| Sidebar | Hidden; replaced by bottom nav (5 main items) + slide-up sheet for overflow | Collapsed (72px) by default; overlay on toggle | Expanded (240px) or collapsed (72px), user toggle |
| Page padding | `--space-4` (16) | `--space-6` (24) | `--space-8` (32)–`--space-9` (40) |
| Modals | Full-sheet (slide-up) | Centered card | Centered card |
| Card grids | `minmax(280px, 1fr)` auto-fit | same | same |
| Type scale | one notch smaller for display/title | normal | normal |

Verification target: clean rendering at 360px, 768px, 1024px, 1440px, 1920px, 2560px. No horizontal scroll at any width.

## Identity touches (the "bold" part)

- **Aurora background** — two slow, low-opacity radial gradients on `body::before`, animating over 60s. Theme-aware. Reduced-motion: static.
- **Accent gradient** — indigo→violet, used only on primary CTAs and active nav indicators. Never on body text, never on more than one element per screen.
- **Distinctive focus ring** — 2px accent + 4px halo, uniform across the app.
- **Spring micro-interactions** — used on plan-status changes (badge pop), add-to-cart, sidebar collapse/expand, modal entry. Not on hover; hover stays calm.
- **Standardized iconography** — Remix Icon kept; sizes locked to 16 / 20 / 24.

## Phased rollout — detail

### Phase 1 — Foundation (no visible change)

Deliverables:
- `src/styles/tokens.css` — all tokens above, both themes
- `src/styles/globals.css` — refactored to consume tokens, body styles only
- `src/components/primitives/` — `PageShell`, `Card`, `Section`, `Button`, `IconButton`, `Stack`, `Cluster`, `Sheet`, `Dialog`, `EmptyState`
- A standalone primitives showcase component (unwired into the app, used only for manual visual verification, deleted at end of Phase 1)

Verification: `npm run build` + `npm run lint` clean. No existing page broken (primitives are additive).

### Phase 2 — Chrome

Deliverables:
- `Layout.tsx` / `Layout.css` migrate to use `PageShell` and primitives; introduce `bottomNav` slot for mobile
- `Sidebar.tsx` / `Sidebar.css` — `material-chrome`, refined hover/active states, level-indicator polish, mobile bottom-nav variant
- `CommandPalette` — visionOS-style centered floating popover, `material-thick`, spring entry
- `Toast` — slide-up from bottom, `material-thick`, stack on multiple
- `WelcomeModal`, `ProfileSetupModal` — migrated to `Sheet` (mobile) / `Dialog` (desktop) primitive

Verification: full app navigable on desktop + mobile widths. Theme toggle works in both modes for chrome.

### Phase 3 — Pages

Order (chosen for impact + risk):
1. **HomePage** — sets the visual tone; lowest risk
2. **CatalogPage** — highest CSS volume (1,079 + 458 lines); biggest cleanup win
3. **SimulatorPage** — second largest; cart grid + status banners + submit/withdraw flow
4. **TeamLeaderDashboard** — table/data treatment, level selector, approve/reject
5. **ProfilePage** — historical + current achievements
6. **FaqPage / FormsPage / GuidelinesPage** — content-heavy, primitives apply directly
7. **PendingApprovalPage** — empty-state focus

Each page migration:
- Replace bespoke header with `<PageShell>`
- Replace ad-hoc cards with `<Card>`
- Replace inline flex containers with `<Stack>` / `<Cluster>`
- Delete duplicate CSS; what remains is page-specific data-grid logic only
- Verify build + lint + manual visual at all breakpoints in both themes

## Success criteria

- Both light and dark themes feel polished and unified across every page
- AA contrast minimum for body text and interactive elements in both themes
- No horizontal scroll, no broken layouts at 360 / 768 / 1024 / 1440 / 1920 / 2560
- Total component CSS reduced by ≥30% via primitives
- Zero raw hex colors in component CSS (verifiable via grep)
- Zero raw px values for spacing in component CSS (verifiable via grep)
- `npm run build` and `npm run lint` pass at the end of every phase
- Visual: every page reads as the same product

## Risks and mitigations

- **Phase 3 visual regressions.** Migrating each page touches a lot of CSS. Mitigation: page-by-page verification at all six breakpoints in both themes; manual smoke-test each user role's primary flow before moving on.
- **Backdrop-filter performance on lower-end devices.** Heavy chrome material on the sidebar may chug. Mitigation: provide a `prefers-reduced-transparency` fallback that swaps blur for solid surface.
- **Token churn.** Tokens may need tuning during Phase 2/3 once seen in context. Mitigation: token file is the only place to change values; all references resolve automatically.
- **CommandPalette behavior.** It currently has its own positioning/animation. Mitigation: rebuild it from `Dialog` primitive in Phase 2.
- **Time/scope drift.** "Improve everything" can expand. Mitigation: anything not on this spec is out of scope; new ideas become a follow-up spec.

## Verification plan

After every phase:
1. `npm run build` — type check + production build, must pass
2. `npm run lint` — ESLint, must pass
3. Manual: open app at 360 / 768 / 1024 / 1440 in both themes, walk through each page that exists at that phase
4. Manual: tab through every page — focus rings visible, focus order sane
5. Manual: trigger each user role's primary flow (employee plan submit, team-leader approval, admin overview) on at least one breakpoint

End-to-end:
- Grep for `#[0-9a-f]` in component CSS files → expected zero matches outside `/styles/tokens.css`
- Grep for `px` outside of `tokens.css` and explicit `1px` border declarations → expected near-zero

## Out of scope (re-stated)

Firebase logic, routing, mock-user dev tooling, new features, content rewrites, test framework introduction, animation library introduction (CSS-only motion).

## Open questions

None at spec time — all resolved during brainstorm. Any new questions raised during implementation will be captured in the implementation plan.
