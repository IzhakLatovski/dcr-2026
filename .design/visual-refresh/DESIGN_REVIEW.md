# Design Review: DCR Visual Refresh

Reviewed against: `.design/visual-refresh/DESIGN_BRIEF.md`
Philosophy: Modern tech, not generic corporate — violet `oklch` palette, Linear/Vercel/Raycast direction
Date: 2026-05-01

## Screenshots Captured

| Screenshot | Breakpoint | Description |
| --- | --- | --- |
| `screenshots/review-home-desktop-1280.png` | Desktop 1280×800 (light, full-page) | HomePage hero, 3 stat cards, news feed, featured items |
| `screenshots/review-home-desktop-1280-dark.png` | Desktop 1280×800 (dark, full-page) | Same as above, dark mode |
| `screenshots/review-home-tablet-768.png` | Tablet 768×1024 (light, full-page) | HomePage at tablet — mobile menu visible, 3-stat row stays, news cards 2-up |
| `screenshots/review-home-mobile-375.png` | Mobile 375×812 (light, full-page) | HomePage at mobile — single-column stack |
| `screenshots/review-catalog-desktop-1280.png` | Desktop 1280×800 (light, full-page) | CatalogPage Tech grid (4-col), toolbar + filter pills |
| `screenshots/review-catalog-mobile-375.png` | Mobile 375×812 (light, full-page) | CatalogPage at mobile — toolbar wraps, 1-col grid |
| `screenshots/review-catalog-dialog-desktop-1280.png` | Desktop 1280×800 (light) | ItemDetail Dialog open over Catalog — image + tags + points + about + cert details grid |
| `screenshots/review-simulator-desktop-1280.png` | Desktop 1280×800 (light, full-page) | SimulatorPage with Level 5 selected — LevelProgressCard, 4 PillarProgressCards, MissingPanel sidebar |
| `screenshots/review-faq-desktop-1280.png` | Desktop 1280×800 (light) | FaqPage with search + Q&A cards |

> All screenshots are in `.design/visual-refresh/screenshots/`. Many additional task-specific screenshots from build phases (`task6-*`, `task7-*`, `task15-*`, `task16-*`, `task17-*`, `task18-*`) are also there.

## Summary

The visual refresh is **substantially complete** and successfully delivers the brief's promise: a unified shadcn/oklch design system replaces the legacy glass-morphism prototype. Every redesigned page reads as part of the same product — same primitives, same spacing rhythm, same violet primary, polished both modes. Two TeamLeaderDashboard pieces (`PendingApprovalsTab`, `MemberDetailsModal`) intentionally stayed on legacy CSS for a follow-up pass; the rest is on the new system. The biggest remaining concern is a Dialog focus-trap gap — covered under "Should Fix."

## Must Fix

_None._ No broken functionality, no major brief deviations, no a11y regressions. The lint baseline actually dropped (28 → 20 pre-existing) as legacy CSS left the codebase.

## Should Fix

1. **Dialog doesn't trap focus.** The temp `Dialog` primitive handles ESC + body scroll lock + `role="dialog"` + `aria-modal`, but Tab can escape to the page below. See `src/components/ui/dialog.tsx`. _Fix: integrate `focus-trap-react` or rebuild Dialog atop `@base-ui/react/dialog` (already a dependency)._

2. **Two dashboard files still on legacy CSS.** `PendingApprovalsTab.tsx` (1215 lines) and `MemberDetailsModal.tsx` (565 lines) keep their original `.css` and were skipped this pass to fit context budget. Memory file `~/.claude/projects/.../project_visual_refresh_deferred.md` has the exact follow-up steps. _Fix: redesign in a dedicated session, delete `TeamLeaderDashboard.css` + `MemberDetailsModal.css`, drop the legacy variable section in `globals.css` + `data-theme` write in `useTheme.ts`._

3. **Header title truncates aggressively at 375px.** "Development Career Roadmap" → "Development Ca..." in HomePage hero on mobile. See `screenshots/review-home-mobile-375.png`. The `<h1 truncate>` cuts mid-word. _Fix: drop `truncate` on the hero title at small breakpoints (`sm:truncate` or remove); accept 2-line wrap on mobile._

4. **CatalogToolbar filter pills overflow on far right at 1280px+ (minor).** With the sidebar expanded, the rightmost provider pills (e.g. HashiCorp) clip to "Networ..." when the screen narrows; horizontal scroll works but the truncation is jarring. See `screenshots/review-catalog-desktop-1280.png`. _Fix: either wrap pills onto a second row at this width or reduce label length when space is tight._

## Could Improve

1. **HomePage Featured Quarter cards' images sit on a near-white tile in light mode** — the Google Cloud / AWS badges have white backgrounds that blend into the card surface. _Suggestion: keep the gradient `from-muted/60 to-muted/20` background but darken slightly, or apply a subtle inner ring._

2. **NewsCard "NEW" badge color is destructive (red).** This works visually but reads as urgent/error. _Suggestion: use `secondary` or a custom subtle "fresh" tint — red-on-amber feels like an alert chain._

3. **Dialog's `!max-w-4xl` override** is set inline at the call site in `CatalogPage.tsx`. _Suggestion: either add an `xl` size variant to the Dialog primitive, or accept the inline override as-is (low impact)._

4. **Sidebar's Sim/Real mode toggle uses only "Sim" / "Real" labels** when expanded. Original UX showed full "Simulator" / "Real Plan." _Suggestion: when sidebar is at full width, show full labels; current truncation feels overly compact._

5. **PillarProgressCard `completed` overlay (when in completion mode)** uses two stacked `<ProgressBar>` fills which flicker at the same width. _Suggestion: a single bar with a green-on-violet gradient or two distinct heights._

6. **Footer of the Profile gallery / Sidebar collapse arrow** appears at bottom but the icon is small. _Suggestion: increase to `size-9` for easier targeting._

7. **Featured cards horizontally overflow at 1280** (cut off at right edge of the layout — see `review-home-desktop-1280.png` last card). The content scrolls, but visually the partial card looks unintended. _Suggestion: add gradient mask on the right edge or pad the row to align with whole cards._

## What Works Well

1. **The aesthetic shift is dramatic and coherent.** Legacy glass-morphism → flat, intentional violet. The screenshots speak for themselves: nothing visually generic, everything reads as the same product.

2. **Typography is consistent** across every redesigned page. `text-foreground` for body, `text-muted-foreground` for secondary text, `tracking-tight` on headings. No font-size sprawl.

3. **Dark mode is polished, not inverted.** The `oklch` palette translates intentionally — surfaces shift from near-white to dark navy, the violet primary brightens, tints (green for success, amber for warning) maintain contrast. Both modes feel finished.

4. **One vocabulary, everywhere.** Card pattern: `rounded-2xl border border-border bg-card shadow-sm`. Pills: same shape (`rounded-full h-7 px-3 text-xs`) used in CatalogToolbar, FilterPillGroup, NewsCard badges. Action button (violet primary): same look on AddToggleButton, "Add Required", "Submit Plan". This is the brief's "one vocabulary" principle delivered.

5. **Composed-item hierarchy is right.** 16 composed items now exist (`CatalogCard`, `CatalogToolbar`, `MainMenu`, `ItemDetail`, `StatCard`, `HeroBanner`, `NewsCard`, `SectionHeader`, `LevelProgressCard`, `PillarProgressCard`, `LevelSelector`, `PlanItemRow`, `MissingPanel`, `ProfileHeader`, `AchievementCard`, `ActivityFeed`, `FormCard`). Each gets reused — `StatCard` shows up on Home (3×) AND Profile (6×) AND Dashboard (3-4×). Real reuse, not just abstraction for its own sake.

6. **Responsive behavior reorganizes, doesn't just shrink.** CatalogToolbar wraps cleanly at 375 (search row 1, sort+view row 2). SimulatorPage's two-column layout collapses to single-column. ItemDetail dialog adapts image/title from row to column. Sidebar becomes a drawer. Real responsive design.

7. **Bundle size stayed reasonable.** JS 1107 KB / 320 KB gzipped, CSS 139 KB / 22 KB gzipped — both manageable for a Firebase + Tailwind + base-ui app of this size. CSS bundle dropped 30% from peak (270 KB) once legacy `.css` files were removed.

8. **The "no functional changes" discipline held.** No hooks added or modified beyond `useTheme` (added `.dark` class toggle alongside `data-theme`) and `useToast` (deleted as dead code). Every page redesign preserved its props interface byte-for-byte; Layout's orchestration logic untouched.

9. **Lint count went DOWN.** 28 pre-existing baseline → 20 after redesign. Deleting CSS files removed selectors targeting unused legacy code, which let the ESLint rules clean up too. Build green throughout.

10. **The cascade-order bug in `globals.css`** (legacy `* { margin:0 }` overriding Tailwind utilities) was caught and fixed in Task 16. Without that fix, every margin/padding utility silently broken — could have been a hidden time bomb.
