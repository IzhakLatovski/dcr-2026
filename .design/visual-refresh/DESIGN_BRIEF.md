# Design Brief: DCR Visual Refresh

## Problem

The DCR app today works, but visually it feels like a glass-morphism prototype that has accumulated. Surfaces blur, backgrounds shimmer, contrast is uneven across pages, and components have been built ad-hoc per page — every page reinvents its own card, its own toolbar, its own filter pills. There's no shared vocabulary, so the app reads as a stitched-together collection of screens rather than one product.

Employees use this daily to plan careers and track certifications. The current visuals add cognitive load instead of removing it: hierarchy is fuzzy, primary actions don't always look primary, and dark mode is closer to "inverted" than "intentional."

## Solution

Adopt the design system already drafted in `temp/` — a violet `oklch`-based Tailwind v4 + shadcn/base-ui system with a documented set of primitives and composed items — and apply it across every page of the existing app, replacing the per-component CSS files with a single shared vocabulary.

Functionality is untouched: routing, Firebase, hooks, plan logic, role/approval flow, and data shapes stay exactly as they are. This is a pure visual + component-system migration.

## Experience Principles

1. **One vocabulary, everywhere** — Every page draws from the same kit of primitives and composed items. If two pages need a card, they use the same `<Card>`. No more per-page reinvention.
2. **Polished both modes** — Light and dark are designed intentionally, not inverted. Both feel finished, both have considered surface hierarchy and considered accents.
3. **Quiet over decorative** — Glass blur, noise textures, animated gradient shimmers, and refractive edges go away. Hierarchy comes from typography, spacing, and a restrained accent — not from effects.

## Aesthetic Direction

- **Philosophy**: "Modern tech, not generic corporate." Inspired directly by `temp/CLAUDE.md`. Violet primary in `oklch` color space, neutral surfaces, generous radii (0.75rem base scaling up to 2xl/3xl/4xl), subtle shadows, no glass.
- **Tone**: Confident, calm, professional. Reads as a tool an engineer would respect — not a marketing site, not a corporate intranet.
- **Reference points**: Linear, Vercel dashboard, Raycast, modern shadcn/ui apps. Clean lines, intentional typography, restrained color.
- **Anti-references**: SharePoint, Workday, generic "career portal" templates. Also: the current DCR app's glass-morphism + lavender-tint aesthetic.

## Existing Patterns

### From `temp/` (the source of truth — port these as-is)

- **Tokens**: `temp/src/app/globals.css` — full `oklch`-based palette for light + dark, radii scale (`--radius` base 0.75rem with `sm`/`md`/`lg`/`xl`/`2xl`/`3xl`/`4xl` derivations), sidebar-specific tokens, chart palette
- **Typography**: Geist Sans / Geist Mono in temp; this project keeps **Inter** (UI) + **JetBrains Mono** (mono) since they're already loaded via CDN — equally clean, no migration needed
- **Primitives** (`temp/src/components/ui/`, ~35 files): Button, InputField, Card, Badge, Switch, Checkbox, SearchBar, Select, Avatar, ProgressBar, StatusBadge, NotificationBadge, Skeleton, ListItem, MenuItem, Separator, Dialog, Table, Alert, EmptyState, Breadcrumb, Pagination, Accordion, Stepper, DatePicker, CommandPalette, DropdownMenu, PointsDisplay, AddToggleButton, QuantityStepper, PlusButton, ToggleGroup-equivalents
- **Composed items** (`temp/src/components/items/`, 4 files): `CatalogCard`, `CatalogToolbar`, `MainMenu`, `ItemDetail`

### From the current Vite app (preserve)

- **Routing**: state-based via `Layout.tsx`'s `activeId` — keep
- **Hooks**: `useAuth`, `useUserProfile`, `useUserPlan`, `useSimulatorCart`, `useTeamLeaders`, `useTeamMembers`, `useAchievements`, `useAllUsers`, `useTheme`, `useToast` — all preserved untouched
- **Domain types**: `src/data/types.ts` and the catalog data files — untouched
- **Firebase config + Firestore collections**: untouched
- **Inter + JetBrains Mono fonts**: keep, already loaded via Google Fonts CDN
- **Remix Icons**: keep available during migration; new components use `lucide-react`. Old Remix Icon usages migrate organically as their pages get redesigned.

### Bridge layer (transition only)

- **Theme attribute switch**: `useTheme` flips from setting `[data-theme="dark"]` on `<html>` to toggling the `.dark` class on `<html>`. Legacy CSS variables (`--text-primary`, `--accent-color`, `--glass-bg`, etc.) get aliased inside the new `globals.css` so still-unmigrated pages keep rendering during the transition.
- **Coexistence period**: per-component `.css` files keep working alongside Tailwind classes until each page is migrated. Once a page lands, its old `.css` files get deleted.

## Component Inventory

### Primitives (port from `temp/src/components/ui/` — all "New" to this project)

| Component         | Status | Notes                                                 |
| ----------------- | ------ | ----------------------------------------------------- |
| Button            | New    | `temp/`'s CVA-based, includes `ActionButton` variant  |
| InputField        | New    |                                                       |
| Card + subparts   | New    | Header/Title/Description/Content/Footer               |
| Badge             | New    |                                                       |
| StatusBadge       | New    | Used for plan status, achievement status              |
| NotificationBadge | New    |                                                       |
| Switch            | New    |                                                       |
| Checkbox          | New    |                                                       |
| SearchBar         | New    |                                                       |
| Select            | New    | base-ui based                                         |
| Avatar            | New    |                                                       |
| ProgressBar       | New    |                                                       |
| Skeleton          | New    |                                                       |
| ListItem          | New    |                                                       |
| MenuItem          | New    | sidebar item primitive                                |
| Separator         | New    |                                                       |
| Dialog            | New    | base-ui based                                         |
| Table             | New    |                                                       |
| Alert             | New    |                                                       |
| EmptyState        | New    |                                                       |
| Breadcrumb        | New    |                                                       |
| Pagination        | New    |                                                       |
| Accordion         | New    | for FaqPage + GuidelinesPage                          |
| Stepper           | New    |                                                       |
| DatePicker        | New    |                                                       |
| CommandPalette    | New    | replaces existing one (different behavior)            |
| DropdownMenu      | New    |                                                       |
| PointsDisplay     | New    | core to catalog/cart UI                               |
| AddToggleButton   | New    | binary add/remove on items                            |
| QuantityStepper   | New    | repeatable items (billable hours, reports)            |
| PlusButton        | New    |                                                       |
| ToggleGroup       | New    | segmented control — needed for filter modes, group sizes |

### Composed items (port from `temp/src/components/items/` — all "New" to this project)

| Component       | Status | Notes                                  |
| --------------- | ------ | -------------------------------------- |
| CatalogCard     | New    | replaces `CatalogPage/CatalogCard.tsx` |
| CatalogToolbar  | New    | replaces inline toolbar in CatalogPage |
| MainMenu        | New    | replaces existing Sidebar              |
| ItemDetail      | New    | replaces inline modal item view        |

### Composed items (need to be designed — no `temp/` blueprint)

These get sketched per-page when their owning page comes up in the migration order. We confirm structure before building each one.

| Component             | Status | Notes                                                          |
| --------------------- | ------ | -------------------------------------------------------------- |
| StatCard              | New    | HomePage / Profile stats                                       |
| HeroBanner            | New    | HomePage hero                                                  |
| LevelProgressCard     | New    | current → next level + points bar                              |
| PillarProgressCard    | New    | per-pillar tile (4 pillars)                                    |
| LevelSelector         | New    | stylized Select for levels 1–10                                |
| PlanItemRow           | New    | compact plan-item row in SimulatorPage                         |
| MissingPanel          | New    | "you still need X" callout                                     |
| AchievementCard       | New    | past completion display on Profile                             |
| ProfileHeader         | New    | avatar + name + level badge + total points                     |
| ActivityFeed + Item   | New    | timeline on Profile                                            |
| NewsCard              | New    | program updates on Home                                        |
| MiniItemCard          | New    | compact catalog card for FeaturedList / RoadmapDetail          |
| RequirementGroup      | New    | "REQUIRED (N)" / "PICK ONE" wrapper for roadmap items          |
| RoadmapCard           | New    | catalog card variant for badges                                |
| FormCard              | New    | wrapper for ExtraPage forms                                    |
| SectionHeader         | New    | icon + title + optional action; used everywhere                |
| ProofPanel (redesign) | Modify | restyle existing 333-line component using new primitives       |
| WelcomeModal          | Modify | restyle using new Dialog + Select                              |
| ProfileSetupModal     | Modify | restyle 544-line component using new primitives                |
| PendingApprovalPage   | Modify | restyle 220-line page using new primitives                     |
| Toast                 | Replace| swap custom `Toast.tsx` for `sonner`                           |
| TeamLeaderDashboard tabs | Modify | restyle 5 tab files using new primitives                    |
| HomePage              | Modify | redesign 813-line page using StatCards / HeroBanner / NewsCard |
| ProfilePage           | Modify | redesign 578-line page using ProfileHeader / ActivityFeed      |
| SimulatorPage         | Modify | redesign 933-line page using LevelProgressCard / PlanItemRow / MissingPanel |

## Key Interactions

The redesign preserves all interactions byte-for-byte. What changes is the visual feedback at each step:

- **Adding an item to the plan**: `AddToggleButton` flips state with a smooth icon swap (no glass shimmer, no flash). For repeatable items, `QuantityStepper` shows the count inline.
- **Hover on a card**: subtle lift (`-translate-y-0.5`) + soft shadow + border tint to `primary/30`. Replaces the current heavy glass blur transitions.
- **Status changes (plan submit / approve / reject)**: `StatusBadge` color changes; banners use new `Alert` component. Currently this is bespoke per page.
- **Theme toggle**: animates the switch, both modes look intentional. No "inverted glass" effect.
- **Sidebar collapse**: existing collapse state preserved; visuals come from new `MainMenu` (collapse animates width 60→16, items become icon-only with tooltip on hover).
- **Modal entrances**: `Dialog` (base-ui) handles focus trap + animation. Replaces ad-hoc modal CSS in `WelcomeModal`, `ProfileSetupModal`, `MemberDetailsModal`, `ProofPanel`, item detail.
- **Toast**: `sonner` replaces the custom Toast — same call sites (`useToast`'s `showToast`), implementation switches.

## Responsive Behavior

- **Desktop (≥1024px)**: Sidebar visible (collapsed or expanded), main content centered with comfortable max-width (`max-w-5xl` or `max-w-6xl` per page). CatalogCard grid is 3–4 columns.
- **Tablet (640–1023px)**: Sidebar collapses to icon rail by default. Catalog grid 2 columns. Toolbar stays single-row but compresses.
- **Mobile (<640px)**: Sidebar becomes a Sheet/Drawer triggered from a topbar hamburger (Sheet primitive needs porting from temp's TOMORROW.md backlog — fits into Block A primitives). Main content full-width with safe padding. Catalog grid 1 column. Toolbar wraps to two rows (search full-width on row 1, sort + view toggle on row 2). Filter pills horizontal-scroll.
- **All pages**: must work and feel polished at 375px (iPhone SE width), 768px (iPad portrait), 1280px (laptop), 1440px (desktop).

## Accessibility Requirements

- **Contrast**: all text meets WCAG AA (4.5:1 for body, 3:1 for large text + UI components). The temp `oklch` palette is designed to clear this; verify on first audit.
- **Focus rings**: visible on every interactive element via `focus-visible:ring-3 focus-visible:ring-ring/50` (already in temp's primitives). No `outline: none` without a replacement ring.
- **Keyboard navigation**: every interactive element reachable + operable via keyboard. Cards with `onSelect` handle Enter/Space (already in temp's CatalogCard).
- **Screen reader labels**: aria-label on icon-only buttons, aria-pressed on toggles, aria-current on active nav items, role + aria-label on the toolbar's view toggle group (already in temp's CatalogToolbar).
- **Modal focus management**: handled by base-ui Dialog (focus trap, restore-on-close, ESC-to-close).

## Constraints

- **No functional changes** (default policy "B" from grill-me): pure restyle + obvious in-place bug fixes (typos, dead handlers). Anything bigger gets surfaced and confirmed before doing.
- **No router introduction**: state-based navigation in `Layout.tsx` stays. No `react-router` or similar.
- **No data shape changes**: Firestore documents, types in `src/data/types.ts`, hook signatures all stay identical.
- **Bundle**: prefer adding small dependencies (lucide-react, base-ui, CVA family, sonner) over building primitives from scratch. Defer `framer-motion` until a component actually needs it.
- **Build must stay green** (`npm run build` and `npm run lint`) at the end of every migration step. Half-migrated state is acceptable mid-step but never on a commit.

## Out of Scope

- Adding new product features (career planner v2 ideas in `temp/TOMORROW.md` like quarter timeline, peer activity rail, pillar radar chart, smart empty states — all NOT in scope for this refresh)
- Changing the navigation structure (the items + order in `src/data/navigation.ts` stay)
- Changing role logic, approval flow, or permission rules
- Migrating `firestore.rules` from the open dev rules to production rules
- Performance optimization (lazy loading, code splitting) beyond what falls out naturally
- Internationalization / RTL
- E2E or unit tests (none currently exist; not adding any in this pass)
- Replacing Firebase or Vite or any infrastructure piece
- Mobile native apps
- Replacing Inter/JetBrains Mono with Geist

## Migration order (locked from grill-me)

1. **Infrastructure**: install Tailwind v4 + PostCSS + base-ui + CVA family + lucide + sonner + tw-animate-css; port `globals.css` tokens; set up `cn` + `lib/utils`; update `useTheme` to toggle `.dark` class with legacy variable aliasing
2. **Primitives port**: copy temp's 35 primitives into `src/components/ui/`, removing `"use client"` and Next-specific imports
3. **CatalogPage** (validates the system; temp has matching composed items)
4. **HomePage** (sets the visual tone)
5. **SimulatorPage / Plan**
6. **ProfilePage**
7. **FormsPage / ExtraPage / FaqPage / GuidelinesPage** (small)
8. **TeamLeaderDashboard tabs** (PendingApprovals, MyTeam, LevelUps, MemberDetailsModal, QuarterSettings)
9. **Modals + smaller pieces**: WelcomeModal, ProfileSetupModal, PendingApprovalPage, ProofPanel, CommandPalette
10. **Layout shell + Sidebar** (depends on everything above being consistent)
11. **Cleanup**: remove dead `.css` files, remove legacy variable aliases, remove `body::before` / `body::after` decorative effects

## File organization (locked from grill-me)

- `src/components/ui/*` — shared primitives (Button, Card, Badge, etc.)
- `src/components/composed/*` — reusable composed items (CatalogCard, MainMenu, StatCard, etc.) — renamed from temp's `items/` to avoid overload with the domain term "catalog item"
- `src/components/<Page>/*` — page-specific stuff stays colocated
- `src/lib/utils.ts` — `cn()` helper
- `src/styles/globals.css` — single source of tokens (replacing the current file's contents)
