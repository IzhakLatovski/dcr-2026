
import { forwardRef } from "react"
import { Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

type Size = "sm" | "md" | "lg"

const sizeStyles: Record<
  Size,
  { container: string; button: string; count: string }
> = {
  sm: {
    container: "h-7 text-xs [&_svg]:size-3.5",
    button: "size-7",
    count: "w-5",
  },
  md: {
    container: "h-9 text-sm [&_svg]:size-4",
    button: "size-9",
    count: "w-6",
  },
  lg: {
    container: "h-11 text-base [&_svg]:size-5",
    button: "size-11",
    count: "w-8",
  },
}

interface QuantityStepperProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Current value */
  value: number
  /** Called with the new value */
  onChange: (value: number) => void
  /** Minimum value — when `value` reaches `min`, the minus button and count collapse away and the stepper looks like a single add button (default 0). */
  min?: number
  /** Optional maximum value */
  max?: number
  size?: Size
  /** Accessible label for the group */
  label?: string
}

const QuantityStepper = forwardRef<HTMLDivElement, QuantityStepperProps>(
  (
    {
      value,
      onChange,
      min = 0,
      max,
      size = "md",
      label = "Quantity",
      className,
      ...props
    },
    ref
  ) => {
    const s = sizeStyles[size]
    const expanded = value > min
    const canIncrement = max == null || value < max

    const decrement = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (value > min) onChange(value - 1)
    }
    const increment = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (canIncrement) onChange(value + 1)
    }

    return (
      <div
        ref={ref}
        role="group"
        aria-label={label}
        className={cn(
          "inline-flex items-center rounded-full bg-primary text-primary-foreground shadow-sm transition-all duration-300 select-none",
          s.container,
          className
        )}
        {...props}
      >
        {/* Minus — collapses to size-0 when at min */}
        <button
          type="button"
          onClick={decrement}
          aria-label="Decrease quantity"
          aria-hidden={!expanded}
          tabIndex={expanded ? 0 : -1}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full transition-all duration-300 cursor-pointer outline-none hover:bg-white/20 active:translate-y-px focus-visible:bg-white/20",
            expanded ? s.button : "size-0 overflow-hidden pointer-events-none"
          )}
        >
          <Minus />
        </button>

        {/* Count — collapses to w-0 when at min */}
        <span
          aria-live="polite"
          aria-hidden={!expanded}
          className={cn(
            "tabular-nums font-bold text-center transition-all duration-300 overflow-hidden",
            expanded ? `${s.count} opacity-100` : "w-0 opacity-0"
          )}
        >
          {value}
        </span>

        {/* Plus — always visible; doubles as the "Add" button when collapsed */}
        <button
          type="button"
          onClick={increment}
          aria-label={expanded ? "Increase quantity" : "Add"}
          disabled={!canIncrement}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full outline-none cursor-pointer transition-all duration-200 active:translate-y-px focus-visible:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:transition-transform [&_svg]:duration-200",
            s.button,
            expanded
              ? "hover:bg-white/20"
              : "hover:scale-110 hover:shadow-md hover:[&_svg]:rotate-90"
          )}
        >
          <Plus />
        </button>
      </div>
    )
  }
)

QuantityStepper.displayName = "QuantityStepper"

export { QuantityStepper }
