
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center font-medium transition-all duration-200 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-muted text-muted-foreground",
        primary:
          "bg-primary/10 text-primary dark:bg-primary/20",
        secondary:
          "bg-secondary text-secondary-foreground",
        success:
          "bg-green-600/10 text-green-600 dark:bg-green-500/20 dark:text-green-400",
        warning:
          "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
        destructive:
          "bg-destructive/10 text-destructive dark:bg-destructive/20",
        outline:
          "border border-border bg-transparent text-foreground",
      },
      size: {
        sm: "h-5 px-2 text-[0.65rem] rounded-md gap-1",
        md: "h-6 px-2.5 text-xs rounded-lg gap-1.5",
        lg: "h-7 px-3 text-sm rounded-lg gap-1.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

function Badge({
  className,
  variant,
  size,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
