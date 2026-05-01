# Visual Refresh — Follow-up Work

**Status: ✅ All items resolved (2026-05-01).**

The visual refresh is now fully complete. Every item originally tracked here was addressed. Notes preserved below for traceability.

---

## 1. Deferred dashboard files — ✅ Done

`PendingApprovalsTab.tsx` (1,216 → 870 lines) and `MemberDetailsModal.tsx` (565 → 530 lines) rewritten on the new primitives (Avatar / Badge / Button / Dialog / Tabs / Alert / EmptyState / ProgressBar / StatCard). Local helpers extracted: `PillarGroupedItems`, `RequirementsWarning`, `ApprovalActions`, `MemberCardHeader`, `LevelArrowBadge`, `RequirementRow`. All Firebase business logic preserved byte-for-byte.

Cleanup completed in the same pass:
- Deleted `TeamLeaderDashboard.css` (1,596 lines) and `MemberDetailsModal.css` (1,154 lines).
- Removed entire **Legacy tokens** block from both `:root` and `.dark` in `globals.css` (~80 vars).
- Dropped the `[data-theme="dark"]` selector — only `.dark` remains.
- Removed `root.dataset.theme = theme;` from `useTheme.ts`.
- TASKS.md Tasks 11 + 17 flipped from ⚠️ → ✅.

CSS bundle dropped 119 KB → 100.71 KB (-15%). Lint stayed at the 20 baseline.

## 2. Dialog focus trap — ✅ Done

Picked option (a) — installed `focus-trap-react` and wrapped `Dialog` so Tab can no longer escape the modal. Configured `escapeDeactivates: false` so the existing custom ESC handler keeps closing the dialog. Configured `clickOutsideDeactivates: true` + `allowOutsideClick: true` so clicking the overlay still closes it. Verified: focus initially lands on the close button, ESC still closes, no Dialog consumers needed changes.

## 3. Quick visual polish — ✅ Done

- **3a** `hero-banner.tsx:38`: `truncate` → `sm:truncate`. Title now wraps to 2 lines on mobile, truncates on tablet+.
- **3b** `CatalogPage.tsx` `FilterPillGroup`: `flex items-center gap-1.5 overflow-x-auto …` → `flex flex-wrap items-center gap-1.5 …`. Provider pills wrap to a 2nd row instead of clipping at narrow widths.

## 4. Polish items — ✅ Done

- **4a** HomePage Featured tile bg: `from-muted/60 to-muted/20` → `from-muted to-muted/40` + `ring-1 ring-inset ring-border/40`. White cert badges no longer blend in light mode.
- **4b** `news-card.tsx`: `<Badge variant="destructive">NEW</Badge>` → `variant="primary"`. NEW reads as "fresh" not "alert."
- **4c** `dialog.tsx`: added `xl: "w-[90vw] max-w-4xl rounded-2xl"` size variant. Inline `!max-w-4xl` overrides removed from `CatalogPage.tsx` and `MemberDetailsModal.tsx`.
- **4d** `Sidebar.tsx`: Sim/Real toggle now shows full "Simulator" / "Real Plan" labels when sidebar is expanded. Added `role="tablist"` + `role="tab"` + `aria-selected` for a11y.
- **4e** `pillar-progress-card.tsx`: completed-overlay no longer stacks two ProgressBar fills. In completion mode, renders a single track with two distinct fills (muted-violet "planned" base + green "completed" on top) — no flicker.
- **4f** `Sidebar.tsx`: collapse-arrow button bumped from `h-8` / `size-4` chevron to `size-9` / `size-5` chevron, plus added `aria-label`.
- **4g** `HomePage.tsx`: Featured row scroll wrapper now has `[mask-image:linear-gradient(to_right,black_calc(100%-3rem),transparent)]` — clean fade hint instead of an abrupt cutoff.

---

## Verification

- `npm run build` green throughout.
- `npm run lint` stayed at the 20 baseline (16 errors + 4 warnings — all pre-existing on main).
- `npm run dev` smoke-tested at 375px and 1280px in light mode — hero wraps, pills wrap, Featured tile darker + ring + fade mask visible, NEW badges violet, dialog opens at `xl` size with focus-trap + ESC still closing.
- Zero new console errors.
