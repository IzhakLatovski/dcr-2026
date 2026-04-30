
import { forwardRef, type ReactNode } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const listItemVariants = cva(
  "flex items-center gap-3 rounded-xl transition-all duration-200",
  {
    variants: {
      size: {
        sm: "px-3 py-2",
        md: "px-4 py-3",
        lg: "px-5 py-4",
      },
      interactive: {
        true: "cursor-pointer hover:bg-muted/60 active:bg-muted",
        false: "",
      },
    },
    defaultVariants: {
      size: "md",
      interactive: false,
    },
  }
)

interface ListItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof listItemVariants> {
  avatar?: ReactNode
  title: string
  description?: string
  meta?: string
  badge?: ReactNode
  action?: ReactNode
}

const ListItem = forwardRef<HTMLDivElement, ListItemProps>(
  ({ className, size, interactive, avatar, title, description, meta, badge, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="list-item"
        className={cn(listItemVariants({ size, interactive, className }))}
        {...props}
      >
        {avatar && <span className="shrink-0">{avatar}</span>}
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">{title}</span>
            {badge && <span className="shrink-0">{badge}</span>}
          </span>
          {description && (
            <span className="block text-xs text-muted-foreground truncate mt-0.5">
              {description}
            </span>
          )}
        </span>
        {meta && (
          <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">{meta}</span>
        )}
        {action && <span className="shrink-0">{action}</span>}
      </div>
    )
  }
)

ListItem.displayName = "ListItem"

export { ListItem }
