
import { forwardRef } from "react"
import { Check } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const checkboxVariants = cva(
  "peer inline-flex shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "size-4 rounded-[5px]",
        md: "size-5 rounded-md",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

interface CheckboxProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size">,
    VariantProps<typeof checkboxVariants> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  label?: string
  description?: string
}

const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, size, checked = false, onCheckedChange, label, description, ...props }, ref) => {
    const checkbox = (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={checked}
        data-slot="checkbox"
        className={cn(
          checkboxVariants({ size, className: label ? undefined : className }),
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-transparent"
        )}
        onClick={() => onCheckedChange?.(!checked)}
        {...props}
      >
        {checked && (
          <Check className={size === "sm" ? "size-3" : "size-3.5"} strokeWidth={3} />
        )}
      </button>
    )

    if (!label) return checkbox

    return (
      <label className={cn("flex items-start gap-2.5 cursor-pointer select-none", className)}>
        <span className="mt-0.5">{checkbox}</span>
        <span className="flex flex-col">
          <span className="text-sm font-medium text-foreground leading-tight">{label}</span>
          {description && (
            <span className="text-xs text-muted-foreground mt-0.5">{description}</span>
          )}
        </span>
      </label>
    )
  }
)

Checkbox.displayName = "Checkbox"

export { Checkbox }
