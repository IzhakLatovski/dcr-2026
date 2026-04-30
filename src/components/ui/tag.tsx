
import { forwardRef } from "react"
import { X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const tagVariants = cva(
  "inline-flex items-center gap-1.5 rounded-lg px-2.5 h-7 text-xs font-medium transition-all duration-200 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-muted text-muted-foreground",
        primary:
          "bg-primary/10 text-primary dark:bg-primary/20",
        success:
          "bg-green-600/10 text-green-600 dark:bg-green-500/20 dark:text-green-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface TagProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof tagVariants> {
  onRemove?: () => void
}

const Tag = forwardRef<HTMLSpanElement, TagProps>(
  ({ className, variant, children, onRemove, ...props }, ref) => {
    return (
      <span
        ref={ref}
        data-slot="tag"
        className={cn(tagVariants({ variant, className }))}
        {...props}
      >
        <span className="truncate">{children}</span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center justify-center rounded-sm size-3.5 opacity-60 hover:opacity-100 transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Remove"
          >
            <X className="size-3" />
          </button>
        )}
      </span>
    )
  }
)

Tag.displayName = "Tag"

export { Tag, tagVariants }
