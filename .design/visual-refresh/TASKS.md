# Build Tasks: DCR Visual Refresh

Generated from: .design/visual-refresh/DESIGN_BRIEF.md
Date: 2026-04-30

> Aesthetic philosophy (locked from brief): violet `oklch` modern-tech, "polished both modes," "quiet over decorative." Established by task 2 — every later task must respect it.

> Discipline: no functional changes (policy "B" — pure restyle + obvious in-place bug fixes; flag bigger refactors before doing them). Every task must end with `npm run build` green and `npm run lint` clean.

---

## Foundation

- [x] **1. Install dependencies + wire Tailwind v4 into Vite**: install `tailwindcss@4`, `@tailwindcss/postcss`, `@tailwindcss/vite`, `@base-ui/react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`, `lucide-react`, `sonner`. Add the Tailwind Vite plugin to `vite.config.ts`. Verify `npm run dev` starts and a throwaway `<div className="bg-blue-500 p-4">` renders the styles. _New deps; no new components._ ✅ Done — used `@tailwindcss/vite` only (skipped `@tailwindcss/postcss` since the Vite plugin is the recommended path for Vite). Verified arbitrary + named utilities compile.

- [x] **2. Port tokens + cn helper + path alias + theme switch**: replace `src/styles/globals.css` with temp's `oklch` token block (light + dark, radii scale, sidebar tokens, chart palette) and add a legacy-alias section so `--text-primary`, `--accent-color`, `--glass-bg`, etc. still resolve for unmigrated `.css` files; create `src/lib/utils.ts` exporting `cn()` from `clsx + tailwind-merge`; add `@/*` path alias in both `tsconfig.app.json` and `vite.config.ts`; flip `src/hooks/useTheme.ts` to toggle the `.dark` class on `<html>` instead of `data-theme`. Verify the existing app still renders correctly in both modes. _Modifies: globals.css, useTheme. New: src/lib/utils.ts._ ✅ Done — `useTheme` sets BOTH `data-theme` and `.dark` during transition (so legacy `.css` selectors AND Tailwind `dark:` variants both work). Legacy CSS variables and body decorations preserved verbatim and scoped under `.dark, [data-theme="dark"]` for dark mode. Cleanup happens in task 17.

- [x] **3. Port temp primitives**: copy all 35 components from `temp/src/components/ui/` into `src/components/ui/`. For each: strip `"use client"`, swap any `next/link` for a regular anchor (or keep as a click handler since this app uses state-based nav), remove `next/image` ESLint comments. Verify `npm run build` passes. _New: 35 primitives in src/components/ui/._ ✅ Done — copied 35 primitives (skipped `toast.tsx` for sonner replacement in task 5; skipped `theme-toggle.tsx` to avoid racing with `useTheme`). No `next/*` imports found. Three TS strictness fixes (verbatimModuleSyntax / noUnusedLocals): made `InputHTMLAttributes` type-only in input-field; dropped unused `ReactNode` from accordion + tabs. Added eslint override for `src/components/ui/**` + `src/components/composed/**` to allow the shadcn/temp conventions: `react-refresh/only-export-components`, `react-hooks/refs`, `react-hooks/set-state-in-effect`.

- [x] **4. Port temp composed items**: copy `MainMenu`, `CatalogCard`, `CatalogToolbar`, `ItemDetail` from `temp/src/components/items/` into `src/components/composed/`. Adapt the data-binding spots (e.g. `ItemDetail` currently calls `useCatalogPlan` directly — rewrite as props-driven so the hosting page wires it to `useUserPlan` / `useSimulatorCart`). Verify build. _New: 4 composed items in src/components/composed/._ ✅ Done — `MainMenu`, `CatalogCard`, `CatalogToolbar` copied verbatim (catalog-card lost its `@next/next/no-img-element` eslint comment). `ItemDetail` rewritten as a props-driven body component (no page chrome, no `next/link`, no `ThemeToggle`, no `useCatalogPlan` — exposes `added`, `onToggleAdd`, `quantity`, `onQuantityChange`, `tags`, `badges`, `details`, `description`, `onBack`, `backLabel` as props). Designed to render inside a Dialog or any host container.

- [x] **5. Replace custom Toast with sonner**: mount `<Toaster />` inside `Layout.tsx`, refactor `useToast` to wrap `sonner.toast(...)` while keeping its existing `showToast(message, type)` signature. Delete `src/components/Toast/Toast.tsx` and `Toast.css`. Smoke-test from 2-3 existing call sites (e.g. plan submit, error banners). _Replaces: Toast component. Modifies: useToast hook + Layout.tsx mount point._ ✅ Done — `useToast.ts` was dead code (never imported); Layout.tsx had its own inline toast state. Replaced inline state with `sonner` calls preserving the `(text, "added"|"removed")` API: `added` → green Check icon, `removed` → muted X icon. `<Toast>` swapped for `<Toaster position="bottom-right" />`. Deleted `src/components/Toast/` dir and `src/hooks/useToast.ts`.

---

## Core UI — Page Migrations

- [ ] **6. Redesign CatalogPage**: gut `src/components/CatalogPage/CatalogPage.tsx` (634 lines) and `CatalogCard.tsx` (147 lines) and their `.css` files. Compose from `composed/CatalogToolbar` + `composed/CatalogCard` + `composed/ItemDetail` (opened inside a `Dialog`). Restyle `ItemComments.tsx` using new primitives. Preserve every prop and behavior: filtering, sorting, view mode toggle, achievement state, plan status, modal-back-nav, comments, openItemId hand-off. _Reuses: composed/CatalogToolbar, composed/CatalogCard, composed/ItemDetail, ui/Dialog. Modifies: CatalogPage.tsx, ItemComments.tsx. Deletes: CatalogCard.tsx + .css, CatalogPage.css._

- [ ] **7. Design + build Home composed items, redesign HomePage**: sketch `StatCard`, `HeroBanner`, `NewsCard`, `SectionHeader` structures (props, slots, variants) — confirm with me before building. Then build them in `src/components/composed/` and redesign `HomePage.tsx` (813 lines) using them + `Card`, `Badge`, `ProgressBar`, `Avatar`. Preserve level computation, news feed, all data flows. _New: StatCard, HeroBanner, NewsCard, SectionHeader. Modifies: HomePage.tsx + delete HomePage.css._

- [ ] **8. Design + build Plan composed items, redesign SimulatorPage**: sketch `LevelProgressCard`, `PillarProgressCard`, `LevelSelector`, `PlanItemRow`, `MissingPanel` — confirm. Build, then redesign `SimulatorPage.tsx` (933 lines). Preserve simulator/real cart toggle, plan status banners, optimistic updates, submit/withdraw actions, "add all required" flow. _New: 5 composed items. Modifies: SimulatorPage.tsx + delete .css._

- [ ] **9. Design + build Profile composed items, redesign ProfilePage**: sketch `ProfileHeader`, `AchievementCard`, `ActivityFeed` (+ internal `TimelineItem`) — confirm. Build, redesign `ProfilePage.tsx` (578 lines). _New: 4 composed items. Modifies: ProfilePage.tsx + delete .css._

- [ ] **10. Redesign small pages**: `FormsPage` (68 lines), `ExtraPage` (207), `FaqPage` (102), `GuidelinesPage` (86). Use existing primitives (Accordion, Button, InputField, Card, Select). Build a `FormCard` composed item along the way for ExtraPage's form-style cards. _New: FormCard. Modifies: 4 page files + delete their .css._

- [ ] **11. Redesign TeamLeaderDashboard**: ~2,400 lines across 6 files (TeamLeaderDashboard chrome, PendingApprovalsTab, MyTeamTab, LevelUpsTab, QuarterSettingsTab, MemberDetailsModal). Sketch the dashboard chrome (header + tab strip) + each tab's structure first — confirm. Use Table / StatusBadge / Dialog / Avatar / Button / DropdownMenu / Stepper / Tabs primitive. _Modifies: 6 files in TeamLeaderDashboard/._

---

## Modals + Edge Components

- [ ] **12. Redesign auth/onboarding modals**: `WelcomeModal` (217 lines, team leader picker), `ProfileSetupModal` (544 lines, multi-step level + historical achievements — wrap in `Stepper`), `PendingApprovalPage` (220 lines). Use new Dialog + Select + Stepper + form primitives + EmptyState. _Modifies: 3 files + delete .css._

- [ ] **13. Redesign ProofPanel**: 333 lines for achievement proof submission. Use Dialog + InputField + Button + Alert. _Modifies: ProofPanel.tsx + delete .css._

- [ ] **14. Replace CommandPalette**: swap existing 247-line custom palette for the ported temp version. Rewire open/close from `Layout.tsx`'s keyboard shortcut and command list data. _Modifies: CommandPalette.tsx (delete or thin to a wrapper), Layout.tsx wiring._

---

## Layout (last — depends on everything above)

- [ ] **15. Redesign Sidebar**: replace 191-line `Sidebar.tsx` (and Sidebar.css) with the new `MainMenu` composed item. Preserve collapse state from localStorage `dcr-sidebar-collapsed`, nav structure from `data/navigation.ts`, role filtering, badge counts (notifications, pending approvals). _Modifies: Sidebar.tsx → thin wrapper or delete if Layout calls MainMenu directly._

- [ ] **16. Redesign Layout shell**: 1,078 lines, mostly orchestration logic that stays untouched. Restyle the chrome only: `HeaderUser`, simulator/real mode toggle, quarter banner, app frame, top-level modal mount points. Use new primitives (Avatar, DropdownMenu, Switch, Badge, Card). Preserve every hook call and orchestration branch byte-for-byte. _Modifies: Layout.tsx + delete Layout.css at end of task._

---

## Cleanup

- [ ] **17. Strip legacy CSS**: search for unimported `.css` files and delete them. Remove the legacy CSS variable aliases from `globals.css`. Remove `body::before`, `body::after`, the noise SVG, and the gradient-shimmer keyframes. Grep for any remaining `backdrop-filter`, `--glass-*`, `--blur-*`, `[data-theme]` references and remove. _Cleanup._

---

## Responsive & A11y Sweep

- [ ] **18. Responsive sweep**: walk every page at 375px, 768px, 1280px, 1440px. Fix any layout breaks. Most should already work because of Tailwind responsive prefixes baked into temp's components, but composed items we built in tasks 7–11 need verification. _Breakpoints: 375 / 768 / 1280 / 1440._

- [ ] **19. Accessibility pass**: verify focus rings on every interactive element, contrast ratios pass WCAG AA (run a browser audit), keyboard nav works on cards + toolbars + dialogs, screen reader labels on all icon-only buttons, modal focus trap + ESC-to-close. _Specific checks from brief: WCAG AA contrast, visible focus rings, modal focus management, aria-pressed on toggles, aria-current on active nav._

---

## Review

- [ ] **20. Design review**: run `/design-review` against the brief. Captures screenshots at all breakpoints + light/dark + critique against the three principles. Use playwright MCP to check all functions and modes.
