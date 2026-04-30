
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  siblings?: number
}

function getRange(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

function getPages(page: number, totalPages: number, siblings: number) {
  const totalNumbers = siblings * 2 + 3 // siblings + boundaries + current
  const totalBlocks = totalNumbers + 2 // + 2 dots

  if (totalPages <= totalBlocks) return getRange(1, totalPages)

  const leftSibling = Math.max(page - siblings, 2)
  const rightSibling = Math.min(page + siblings, totalPages - 1)

  const showLeftDots = leftSibling > 2
  const showRightDots = rightSibling < totalPages - 1

  if (!showLeftDots && showRightDots) {
    const leftRange = getRange(1, 3 + siblings * 2)
    return [...leftRange, "dots", totalPages]
  }

  if (showLeftDots && !showRightDots) {
    const rightRange = getRange(totalPages - (2 + siblings * 2), totalPages)
    return [1, "dots", ...rightRange]
  }

  return [1, "dots", ...getRange(leftSibling, rightSibling), "dots", totalPages]
}

function Pagination({
  page,
  totalPages,
  onPageChange,
  siblings = 1,
  className,
  ...props
}: PaginationProps) {
  const pages = getPages(page, totalPages, siblings)

  return (
    <nav
      aria-label="Pagination"
      data-slot="pagination"
      className={cn("flex items-center gap-1", className)}
      {...props}
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className={cn(
          "inline-flex items-center justify-center size-8 rounded-lg text-sm transition-colors duration-200",
          "hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:opacity-50"
        )}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </button>

      {pages.map((p, i) =>
        p === "dots" ? (
          <span
            key={`dots-${i}`}
            className="inline-flex items-center justify-center size-8 text-xs text-muted-foreground select-none"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p as number)}
            className={cn(
              "inline-flex items-center justify-center size-8 rounded-lg text-sm font-medium transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              p === page
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className={cn(
          "inline-flex items-center justify-center size-8 rounded-lg text-sm transition-colors duration-200",
          "hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:opacity-50"
        )}
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  )
}

export { Pagination }
