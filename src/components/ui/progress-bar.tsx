
import { forwardRef } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const trackVariants = cva("w-full overflow-hidden rounded-full bg-muted", {
  variants: {
    size: {
      sm: "h-1.5",
      md: "h-2.5",
      lg: "h-4",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

const fillVariants = cva(
  "h-full rounded-full transition-all duration-500 ease-out",
  {
    variants: {
      variant: {
        default: "bg-foreground/70 dark:bg-foreground/60",
        primary: "bg-primary",
        success: "bg-green-600 dark:bg-green-500",
        warning: "bg-amber-500",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
)

interface ProgressBarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof trackVariants>,
    VariantProps<typeof fillVariants> {
  value?: number
  max?: number
  label?: string
  showPercentage?: boolean
}

const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, size, variant, value = 0, max = 100, label, showPercentage, ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100))

    return (
      <div ref={ref} data-slot="progress-bar" className={cn("w-full space-y-1.5", className)} {...props}>
        {(label || showPercentage) && (
          <div className="flex items-center justify-between text-xs">
            {label && <span className="font-medium text-foreground">{label}</span>}
            {showPercentage && (
              <span className="text-muted-foreground">{Math.round(percentage)}%</span>
            )}
          </div>
        )}
        <div className={cn(trackVariants({ size }))}>
          <div
            className={cn(fillVariants({ variant }))}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
          />
        </div>
      </div>
    )
  }
)

ProgressBar.displayName = "ProgressBar"

export { ProgressBar }
