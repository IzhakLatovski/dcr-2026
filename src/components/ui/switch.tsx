
import { forwardRef } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const switchVariants = cva(
  "peer relative inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-all duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-5 w-9",
        md: "h-6 w-11",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const thumbVariants = cva(
  "pointer-events-none block rounded-full bg-white shadow-sm transition-transform duration-200",
  {
    variants: {
      size: {
        sm: "size-3.5",
        md: "size-4.5",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size">,
    VariantProps<typeof switchVariants> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, size, checked = false, onCheckedChange, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        data-slot="switch"
        className={cn(
          switchVariants({ size, className }),
          checked ? "bg-primary" : "bg-muted"
        )}
        onClick={() => onCheckedChange?.(!checked)}
        {...props}
      >
        <span
          className={cn(
            thumbVariants({ size }),
            checked
              ? size === "sm"
                ? "translate-x-[18px]"
                : "translate-x-[22px]"
              : "translate-x-[2px]"
          )}
        />
      </button>
    )
  }
)

Switch.displayName = "Switch"

export { Switch }
