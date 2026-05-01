# Visual Refresh — Follow-up Work

Open items from the visual-refresh migration. Pick any subset and run.

Build green / lint at 20 baseline / dev server boots / all redesigned pages render correctly. These are polish + the 2 deferred big files.

---

## 1. Deferred dashboard files (biggest remaining work)

Two files were intentionally skipped in Task 11 due to size. Memory file `~/.claude/projects/-Users-izhak-Desktop-dcr-2026-dcr-2026/memory/project_visual_refresh_deferred.md` has the same notes plus full step-by-step.

### `src/components/TeamLeaderDashboard/PendingApprovalsTab.tsx` (1215 lines, 205 className refs)

Currently imports `./TeamLeaderDashboard.css` directly to keep its legacy styling alive while the chrome around it (TeamLeaderDashboard.tsx, MyTeamTab, LevelUpsTab, QuarterSettingsTab) was rewritten.

Notable structures to map:
- pending member rows with approve/reject + level selector 1-10
- pending plan reviews with completed-items list
- completion review approval flow
- level-up nomination flow

Use new primitives: `Badge` (status), `Button`, `Dialog`, `Avatar`, `Select`, `EmptyState`, plus `AchievementCard` and `PlanItemRow` from composed.

### `src/components/TeamLeaderDashboard/MemberDetailsModal.tsx` (565 lines, has its own `.css`)

Has 21 KB of CSS. Rewrite using:
- new `Dialog` primitive (replaces the custom modal)
- `ProfileHeader` for the member identity block
- `StatCard` for stats
- `AchievementCard` for past completions
- `ActivityFeed` for level history (if shown)

### Cleanup after both are redesigned

1. Delete `TeamLeaderDashboard.css` and `MemberDetailsModal.css`.
2. Remove the `import './TeamLeaderDashboard.css'` line at the top of `PendingApprovalsTab.tsx`.
3. In `src/styles/globals.css`: remove the entire **Legacy tokens** sections in both `:root` and `.dark, [data-theme="dark"]` (the `--glass-*`, `--blur-*`, `--text-primary`, `--accent-color`, `--primary-gradient`, surface hierarchy, shadows). Drop the `[data-theme="dark"]` selector — keep only `.dark`.
4. In `src/hooks/useTheme.ts`: remove the `root.dataset.theme = theme;` line; keep only `root.classList.toggle('dark', theme === 'dark');`.
5. Update `.design/visual-refresh/TASKS.md` Task 11 from `⚠️ Partially done` → `✅ Done` and Task 17 from `⚠️ Partial` → `✅ Done`.

---

## 2. Dialog focus trap (Should Fix #1 from design review)

`src/components/ui/dialog.tsx` handles ESC + body scroll lock + `role="dialog"` + `aria-modal`, but Tab can escape to the page underneath.

**Fix options:**
- (a) Integrate `focus-trap-react` — small dep, quick to add.
- (b) Rebuild Dialog atop `@base-ui/react/dialog` — already a project dependency, no extra weight; gives proper trap + portal + better animations. Slightly more invasive (touches every Dialog consumer if the API changes shape).

Either is fine. Option (b) is cleaner long term.

---

## 3. Quick visual polish (Should Fix #3, #4 from design review)

### 3a. HomePage hero title truncates mid-word at 375px

`src/components/HomePage/HomePage.tsx` — the `<h1>` inside `HeroBanner.tsx` has `truncate` class. At 375 the title "Development Career Roadmap" cuts to "Development Ca..."

**Fix**: in `src/components/composed/hero-banner.tsx`, change the title `<h1>` from `truncate` to no truncation, or `sm:truncate` so it only truncates on tablet+. Accept 2-line wrap on mobile.

### 3b. CatalogToolbar provider pills clip on narrow viewports

`src/components/CatalogPage/CatalogPage.tsx` — `FilterPillGroup` for "Provider" overflows the right edge with truncated last pill ("Networ..." instead of "Networking").

**Fix options:**
- Add a fade-out gradient on the right edge to indicate scroll affordance: append `[mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)]` to the scroll container.
- OR wrap pills to a second row at this width: change `flex items-center gap-1.5 overflow-x-auto` to `flex flex-wrap items-center gap-1.5` (loses horizontal scroll but reads cleanly).

---

## 4. Polish items (Could Improve #1-7 from design review)

Each is a small isolated tweak. Pick what matters.

### 4a. Featured card image backgrounds blend in light mode

`src/components/HomePage/HomePage.tsx` — the Featured Quarter cards' image tile `bg-gradient-to-br from-muted/60 to-muted/20` is too light against the white card surface; AWS/GCP badges with white backgrounds blend in.

**Fix**: deepen the gradient to `from-muted to-muted/40` or add an inner ring `inset-ring-1 ring-border/40`.

### 4b. NewsCard "NEW" badge color is destructive (red)

`src/components/composed/news-card.tsx` — `<Badge variant="destructive" size="sm">NEW</Badge>`

**Fix**: swap to `variant="primary"` or a custom subtle "fresh" treatment. Red reads as alert/error.

### 4c. Dialog xl-size variant

`src/components/CatalogPage/CatalogPage.tsx` uses `<Dialog size="lg" className="!max-w-4xl ...">` — inline override of the variant.

**Fix**: add an `xl` (or `2xl`) entry to `dialogContentVariants` in `src/components/ui/dialog.tsx` so the override is no longer needed.

### 4d. Sidebar Sim/Real toggle uses truncated labels

`src/components/Sidebar/Sidebar.tsx` shows "Sim" / "Real" buttons. Original UX showed "Simulator" / "Real Plan."

**Fix**: when sidebar is at full width (not collapsed), show full labels. When collapsed (icon-only mode), the toggle is already hidden.

### 4e. PillarProgressCard completed overlay flicker

`src/components/composed/pillar-progress-card.tsx` — when `completed` is set, two `<ProgressBar>`-style fills stack at the same width, causing a slight visual flicker.

**Fix**: use a single bar with a green-on-violet gradient, OR render the two fills at different heights so they stack cleanly.

### 4f. Sidebar collapse arrow target size is small

`src/components/Sidebar/Sidebar.tsx` — collapse button is `h-8` with a `size-4` chevron.

**Fix**: bump to `size-9` for easier targeting on touch / quick mouse hits.

### 4g. Featured cards row overflows right edge at 1280px

`src/components/HomePage/HomePage.tsx` — Featured Quarter horizontal scroll cuts off the last partially-visible card without a visual hint that there's more.

**Fix**: add `[mask-image:linear-gradient(to_right,black_calc(100%-3rem),transparent)]` on the scroll wrapper for a fade-out edge.

---

## Suggested batching

- **Half-day session**: items 3a, 3b, 4b, 4d, 4f (all small, all visible improvements). Plus item 2 if you choose option (a) `focus-trap-react`.
- **Full-day session**: tackle item 1 (deferred dashboard) — biggest remaining work, finishes Task 11 + Task 17.
- **Anytime**: 4a, 4c, 4e, 4g — pure polish, low risk.
