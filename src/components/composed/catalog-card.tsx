
import { forwardRef, type ReactNode } from "react"
import { Card } from "@/components/ui/card"
import { PointsDisplay } from "@/components/ui/points-display"
import { AddToggleButton } from "@/components/ui/add-toggle-button"
import { QuantityStepper } from "@/components/ui/quantity-stepper"
import { cn } from "@/lib/utils"

interface CatalogCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  /** Certification / item title */
  title: string
  /** Provider or subtitle (e.g. "AWS", "HashiCorp") */
  provider?: string
  /** Image URL for the logo/badge */
  image?: string
  /** Fallback rendered when no image URL is provided */
  imageFallback?: ReactNode
  /** Points value */
  points: number
  /** Bonus points — when set, `points` is struck through and `bonus` is highlighted */
  bonus?: number
  /** Slot for overlay badges in top-right (e.g. "PROMOTED", "HOT") */
  badgeSlot?: ReactNode
  /** Slot for status badges in top-left (e.g. "NEW", "EXPIRED") */
  statusSlot?: ReactNode
  /** Whether the item is already added to the user's plan (binary mode) */
  added?: boolean
  /** Callback when the add/remove button is clicked (binary mode) */
  onToggleAdd?: () => void
  /** Current quantity (repeatable mode). When defined, the card renders a QuantityStepper instead of the AddToggleButton. */
  quantity?: number
  /** Callback with the new quantity (repeatable mode) */
  onQuantityChange?: (value: number) => void
  /** Optional maximum quantity (repeatable mode) */
  maxQuantity?: number
  /** Callback when the card body is clicked */
  onSelect?: () => void
}

const CatalogCard = forwardRef<HTMLDivElement, CatalogCardProps>(
  (
    {
      className,
      title,
      provider,
      image,
      imageFallback,
      points,
      bonus,
      badgeSlot,
      statusSlot,
      added = false,
      onToggleAdd,
      quantity,
      onQuantityChange,
      maxQuantity,
      onSelect,
      ...props
    },
    ref
  ) => {
    const isInteractive = typeof onSelect === "function"
    const isRepeatable = quantity !== undefined

    return (
      <Card
        ref={ref}
        className={cn(
          "group/catalog-card flex flex-col overflow-hidden transition-all duration-200",
          "hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30",
          isInteractive && "cursor-pointer",
          className
        )}
        {...(isInteractive
          ? {
              role: "button",
              tabIndex: 0,
              onClick: onSelect,
              onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onSelect?.()
                }
              },
            }
          : {})}
        {...props}
      >
        {/* Image area */}
        <div className="relative flex h-32 items-center justify-center py-1.5 bg-gradient-to-br from-muted/60 to-muted/20 border-b border-border">
          {image ? (
            <img
              src={image}
              alt={title}
              className="h-full max-w-full object-contain transition-transform duration-300 group-hover/catalog-card:scale-105"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover/catalog-card:scale-105 [&_svg]:size-8">
              {imageFallback}
            </div>
          )}

          {statusSlot && (
            <div className="pointer-events-none absolute left-3 top-3 z-10 flex max-w-[calc(50%-1rem)] flex-wrap justify-start gap-1">
              {statusSlot}
            </div>
          )}

          {badgeSlot && (
            <div className="pointer-events-none absolute right-3 top-3 z-10 flex max-w-[calc(50%-1rem)] flex-wrap justify-end gap-1">
              {badgeSlot}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-1 px-4 pt-4 pb-3">
          <h3
            className="text-sm font-semibold leading-snug tracking-tight text-foreground line-clamp-2"
            title={title}
          >
            {title}
          </h3>
          {provider && (
            <p className="text-xs text-muted-foreground">{provider}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
          <PointsDisplay value={points} bonus={bonus} size="md" />
          {isRepeatable ? (
            <QuantityStepper
              value={quantity!}
              onChange={(v) => onQuantityChange?.(v)}
              max={maxQuantity}
              size="md"
              label={`${title} quantity`}
            />
          ) : (
            <AddToggleButton
              added={added}
              onToggle={() => onToggleAdd?.()}
              label={added ? `Remove ${title} from plan` : `Add ${title} to plan`}
              size="md"
            />
          )}
        </div>
      </Card>
    )
  }
)

CatalogCard.displayName = "CatalogCard"

export { CatalogCard }
