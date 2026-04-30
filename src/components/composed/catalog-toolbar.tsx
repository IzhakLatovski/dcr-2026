
import { forwardRef, type ReactNode } from "react"
import { LayoutGrid, List, SlidersHorizontal, X } from "lucide-react"
import { SearchBar } from "@/components/ui/search-bar"
import { Select, type SelectOption } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface CatalogFilter {
  /** Stable id used as the filter key */
  id: string
  /** Display label */
  label: string
  /** Optional leading icon */
  icon?: ReactNode
  /** Optional match count shown as a subtle badge */
  count?: number
}

export type CatalogView = "grid" | "list"

interface CatalogToolbarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Current search query */
  searchQuery: string
  /** Called when the search query changes */
  onSearchChange: (query: string) => void
  /** Placeholder shown inside the search input */
  searchPlaceholder?: string

  /** Current sort value */
  sortValue: string
  /** Called when the sort selection changes */
  onSortChange: (value: string) => void
  /** Options rendered in the sort dropdown */
  sortOptions: SelectOption[]

  /** Active view mode */
  view: CatalogView
  /** Called when the view mode is toggled */
  onViewChange: (view: CatalogView) => void

  /** Filter definitions rendered as togglable pills */
  filters?: CatalogFilter[]
  /** Ids of currently active filters */
  activeFilterIds?: string[]
  /** Called when a filter pill is toggled */
  onFilterToggle?: (id: string) => void
  /** Called when the "Clear" button is pressed (only shown when any filter is active) */
  onClearFilters?: () => void

  /** When true, the toolbar uses sticky positioning */
  sticky?: boolean
  /** Tailwind class used for sticky offset, e.g. "top-0" or "top-16". Defaults to "top-0". */
  stickyOffsetClass?: string
}

const CatalogToolbar = forwardRef<HTMLDivElement, CatalogToolbarProps>(
  (
    {
      className,
      searchQuery,
      onSearchChange,
      searchPlaceholder = "Search catalog…",
      sortValue,
      onSortChange,
      sortOptions,
      view,
      onViewChange,
      filters,
      activeFilterIds = [],
      onFilterToggle,
      onClearFilters,
      sticky = false,
      stickyOffsetClass = "top-0",
      ...props
    },
    ref
  ) => {
    const hasFilters = !!filters && filters.length > 0
    const activeCount = activeFilterIds.length

    return (
      <div
        ref={ref}
        data-slot="catalog-toolbar"
        className={cn(
          "flex flex-col gap-3 rounded-2xl border border-border bg-background/85 backdrop-blur-md p-3 sm:p-4 shadow-sm",
          sticky && ["sticky z-30", stickyOffsetClass],
          className
        )}
        {...props}
      >
        {/* Row 1: Search + Sort + View ─────────────────────── */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Search — full-width on mobile, flex-1 on sm+ */}
          <div className="basis-full sm:flex-1 sm:basis-auto min-w-0 order-1">
            <SearchBar
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onClear={() => onSearchChange("")}
              placeholder={searchPlaceholder}
            />
          </div>

          {/* Sort */}
          <div className="flex-1 sm:flex-none sm:w-44 min-w-0 order-2">
            <Select
              options={sortOptions}
              value={sortValue}
              onValueChange={onSortChange}
              placeholder="Sort by"
            />
          </div>

          {/* Grid / list view toggle */}
          <div
            role="radiogroup"
            aria-label="View mode"
            className="inline-flex shrink-0 items-center rounded-xl border border-border bg-card p-0.5 shadow-sm order-3"
          >
            <ViewToggleButton
              active={view === "grid"}
              onClick={() => onViewChange("grid")}
              label="Grid view"
            >
              <LayoutGrid />
            </ViewToggleButton>
            <ViewToggleButton
              active={view === "list"}
              onClick={() => onViewChange("list")}
              label="List view"
            >
              <List />
            </ViewToggleButton>
          </div>
        </div>

        {/* Row 2: Filter pills ─────────────────────────────── */}
        {hasFilters && (
          <div className="flex items-center gap-2">
            <div className="hidden sm:inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground pr-1">
              <SlidersHorizontal className="size-3.5" />
              Filters
            </div>

            <div
              role="group"
              aria-label="Category filters"
              className="flex-1 flex items-center gap-1.5 overflow-x-auto -mx-1 px-1 py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {filters!.map((filter) => {
                const isActive = activeFilterIds.includes(filter.id)
                return (
                  <button
                    key={filter.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => onFilterToggle?.(filter.id)}
                    className={cn(
                      "group/filter-pill inline-flex shrink-0 items-center gap-1.5 rounded-full border h-7 px-3 text-xs font-medium transition-all duration-200 outline-none select-none cursor-pointer",
                      "focus-visible:ring-3 focus-visible:ring-ring/50",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                        : "border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {filter.icon && (
                      <span className="inline-flex [&_svg]:size-3.5">
                        {filter.icon}
                      </span>
                    )}
                    {filter.label}
                    {filter.count !== undefined && (
                      <span
                        className={cn(
                          "inline-flex items-center justify-center rounded-full tabular-nums text-[0.65rem] font-semibold px-1.5 min-w-[1.125rem] h-[1.125rem]",
                          isActive
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {filter.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {activeCount > 0 && onClearFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="shrink-0 inline-flex items-center gap-1 rounded-lg px-2 h-7 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3.5" />
                Clear
              </button>
            )}
          </div>
        )}
      </div>
    )
  }
)

CatalogToolbar.displayName = "CatalogToolbar"

/* ── Internal: view toggle button ──────────────────────────── */

interface ViewToggleButtonProps {
  active: boolean
  onClick: () => void
  label: string
  children: ReactNode
}

function ViewToggleButton({ active, onClick, label, children }: ViewToggleButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center size-7 sm:size-8 rounded-lg transition-all duration-200 outline-none cursor-pointer",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        "[&_svg]:size-4",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  )
}

export { CatalogToolbar }
