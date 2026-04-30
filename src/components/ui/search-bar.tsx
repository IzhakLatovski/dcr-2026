
import { forwardRef } from "react"
import { Search, X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const searchBarVariants = cva(
  "flex items-center gap-2 rounded-xl border border-border bg-transparent text-foreground transition-all duration-200 focus-within:border-primary focus-within:ring-3 focus-within:ring-ring/50",
  {
    variants: {
      size: {
        sm: "h-8 px-2.5 text-xs",
        md: "h-9 px-3 text-sm",
        lg: "h-10 px-3.5 text-base",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

interface SearchBarProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof searchBarVariants> {
  onClear?: () => void
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, size, value, onClear, ...props }, ref) => {
    const hasValue = value !== undefined && value !== ""

    return (
      <div data-slot="search-bar" className={cn(searchBarVariants({ size, className }))}>
        <Search className={cn("shrink-0 text-muted-foreground", size === "sm" ? "size-3.5" : "size-4")} />
        <input
          ref={ref}
          type="text"
          value={value}
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-0"
          {...props}
        />
        {hasValue && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-sm text-muted-foreground hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Clear search"
          >
            <X className={size === "sm" ? "size-3.5" : "size-4"} />
          </button>
        )}
      </div>
    )
  }
)

SearchBar.displayName = "SearchBar"

export { SearchBar }
