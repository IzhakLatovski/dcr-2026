
import { forwardRef, type ReactNode } from "react"
import { Star } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const pointsDisplayVariants = cva(
  "inline-flex items-center font-semibold text-foreground",
  {
    variants: {
      size: {
        sm: "gap-1 [&>[data-slot=points-icon]_svg]:size-3.5",
        md: "gap-1.5 [&>[data-slot=points-icon]_svg]:size-4",
        lg: "gap-2 [&>[data-slot=points-icon]_svg]:size-5",
      },
    },
    defaultVariants: { size: "md" },
  }
)

const valueVariants = cva("font-bold tabular-nums leading-none", {
  variants: {
    size: {
      sm: "text-sm",
      md: "text-lg",
      lg: "text-2xl",
    },
  },
  defaultVariants: { size: "md" },
})

const labelVariants = cva(
  "font-semibold uppercase tracking-wider text-muted-foreground",
  {
    variants: {
      size: {
        sm: "text-[0.55rem]",
        md: "text-[0.65rem]",
        lg: "text-xs",
      },
    },
    defaultVariants: { size: "md" },
  }
)

interface PointsDisplayProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children">,
    VariantProps<typeof pointsDisplayVariants> {
  value: number
  /** Optional bonus value — when set, renders base value struck-through followed by the bonus value. */
  bonus?: number
  /** Label appended after the number. Pass null to hide. Default: "PTS". */
  label?: string | null
  /** Icon override. Pass null to hide. Defaults to a filled star in primary color. */
  icon?: ReactNode | null
}

const PointsDisplay = forwardRef<HTMLSpanElement, PointsDisplayProps>(
  (
    { className, size, value, bonus, label = "PTS", icon, ...props },
    ref
  ) => {
    const renderedIcon =
      icon === null ? null : (
        <span data-slot="points-icon" className="inline-flex text-primary">
          {icon ?? <Star fill="currentColor" />}
        </span>
      )

    return (
      <span
        ref={ref}
        data-slot="points-display"
        className={cn(pointsDisplayVariants({ size, className }))}
        {...props}
      >
        {renderedIcon}
        {bonus != null ? (
          <>
            <span
              className={cn(
                valueVariants({ size }),
                "text-muted-foreground line-through decoration-2 font-semibold"
              )}
            >
              {value}
            </span>
            <span className={cn(valueVariants({ size }), "text-primary")}>
              {bonus}
            </span>
          </>
        ) : (
          <span className={valueVariants({ size })}>{value}</span>
        )}
        {label && <span className={labelVariants({ size })}>{label}</span>}
      </span>
    )
  }
)

PointsDisplay.displayName = "PointsDisplay"

export { PointsDisplay }
