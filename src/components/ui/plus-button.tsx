
import { forwardRef } from "react"
import { Plus } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const plusButtonVariants = cva(
  "group/plus-btn inline-flex shrink-0 items-center justify-center rounded-full border border-transparent outline-none select-none cursor-pointer transition-all duration-200 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:transition-transform [&_svg]:duration-200 hover:scale-110 hover:shadow-md hover:[&_svg]:rotate-90",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        success:
          "bg-green-600 text-white shadow-sm hover:bg-green-600/90 dark:bg-green-500 dark:hover:bg-green-500/90",
        outline:
          "bg-card border-border text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground",
        ghost:
          "bg-transparent text-foreground hover:bg-muted dark:hover:bg-muted/50",
      },
      size: {
        sm: "size-7 [&_svg]:size-3.5",
        md: "size-9 [&_svg]:size-4",
        lg: "size-11 [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

interface PlusButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof plusButtonVariants> {
  /** Accessible label announced by screen readers. Defaults to "Add". */
  label?: string
}

const PlusButton = forwardRef<HTMLButtonElement, PlusButtonProps>(
  ({ className, variant, size, label = "Add", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        className={cn(plusButtonVariants({ variant, size }), className)}
        {...props}
      >
        <Plus />
      </button>
    )
  }
)

PlusButton.displayName = "PlusButton"

export { PlusButton, plusButtonVariants }
