import { type ReactNode, type HTMLAttributes } from "react";
import { ArrowLeft } from "lucide-react";
import { PointsDisplay } from "@/components/ui/points-display";
import { AddToggleButton } from "@/components/ui/add-toggle-button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ItemDetailBadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "destructive"
  | "outline";

export interface ItemDetailTag {
  id: string;
  label: string;
  icon?: ReactNode;
}

export interface ItemDetailBadgeSpec {
  label: string;
  variant?: ItemDetailBadgeVariant;
}

export interface ItemDetailDetailSpec {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  full?: boolean;
}

interface ItemDetailProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** Item title (required) */
  title: string;
  /** Provider / subtitle (e.g. "AWS", "HashiCorp") */
  provider?: string;
  /** Image URL for the logo/badge */
  image?: string;
  /** Fallback rendered when no image URL is provided */
  imageFallback?: ReactNode;
  /** Base points value */
  points: number;
  /** Bonus points — when set, `points` is struck through and `bonus` is highlighted */
  bonus?: number;
  /** Description (string or rich JSX) */
  description?: ReactNode;
  /** Tag pills shown under the title */
  tags?: ItemDetailTag[];
  /** Status badges shown top-right of the image */
  badges?: ItemDetailBadgeSpec[];
  /** Detail grid cells */
  details?: ItemDetailDetailSpec[];
  /** Whether the item is in the user's plan (binary mode) */
  added?: boolean;
  /** Callback when the add/remove button is clicked (binary mode) */
  onToggleAdd?: () => void;
  /** Current quantity (repeatable mode) — when defined, renders QuantityStepper */
  quantity?: number;
  /** Callback with the new quantity (repeatable mode) */
  onQuantityChange?: (value: number) => void;
  /** Optional maximum quantity (repeatable mode) */
  maxQuantity?: number;
  /** Optional back affordance — shown above the hero when `onBack` is provided */
  backLabel?: string;
  /** Click handler for the back affordance */
  onBack?: () => void;
}

/**
 * Body content for the catalog item detail view. Designed to render inside a
 * Dialog (or any host container) — does not own page chrome (header, theme
 * toggle). Plan state is driven by props so the host wires it to
 * `useUserPlan` / `useSimulatorCart` etc.
 */
function ItemDetail({
  className,
  title,
  provider,
  image,
  imageFallback,
  points,
  bonus,
  description,
  tags,
  badges,
  details,
  added = false,
  onToggleAdd,
  quantity,
  onQuantityChange,
  maxQuantity,
  backLabel = "Back",
  onBack,
  ...props
}: ItemDetailProps) {
  const isRepeatable = quantity !== undefined;
  const effectivePoints = bonus ?? points;

  const footerHint = isRepeatable
    ? quantity > 0
      ? `Earn ${effectivePoints} pts per completion · Total ${quantity * effectivePoints} pts`
      : `Earn ${effectivePoints} pts per completion`
    : added
      ? `+${effectivePoints} pts added to your plan`
      : `Earn ${effectivePoints} pts when you add this to your plan`;

  return (
    <div
      data-slot="item-detail"
      className={cn(
        "mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 sm:py-10 space-y-10 sm:space-y-12",
        className,
      )}
      {...props}
    >
      {/* Optional back affordance */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="group/back inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          <ArrowLeft className="size-4 transition-transform duration-150 group-hover/back:-translate-x-0.5" />
          {backLabel}
        </button>
      )}

      {/* Hero ───────────────────────────────────────────── */}
      <section className="flex flex-col sm:flex-row gap-6 sm:gap-8">
        {/* Image tile */}
        <div className="relative shrink-0">
          <div className="size-32 sm:size-40 lg:size-44 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-muted/60 to-muted/10 flex items-center justify-center p-3">
            {image ? (
              <img
                src={image}
                alt={title}
                className="size-full object-contain"
              />
            ) : (
              <div className="flex size-16 sm:size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary [&_svg]:size-8 sm:[&_svg]:size-10">
                {imageFallback}
              </div>
            )}
          </div>

          {/* Status badges (e.g. PROMOTED) */}
          {badges && badges.length > 0 && (
            <div className="absolute -top-2 -right-2 flex flex-wrap justify-end gap-1">
              {badges.map((b) => (
                <Badge key={b.label} variant={b.variant} size="sm">
                  {b.label}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="flex-1 min-w-0 flex flex-col gap-2 sm:gap-3">
          {provider && (
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {provider}
            </p>
          )}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] text-foreground">
            {title}
          </h1>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 h-7 text-xs font-medium text-foreground [&_svg]:size-3.5 [&_svg]:text-muted-foreground"
                >
                  {tag.icon}
                  {tag.label}
                </span>
              ))}
            </div>
          )}

          {/* Points + action */}
          <div className="mt-4 sm:mt-5 flex flex-col gap-3">
            <PointsDisplay value={points} bonus={bonus} size="lg" />
            <div className="flex items-center gap-3 flex-wrap">
              {isRepeatable ? (
                <QuantityStepper
                  value={quantity!}
                  onChange={(v) => onQuantityChange?.(v)}
                  max={maxQuantity}
                  size="lg"
                  label={`${title} quantity`}
                />
              ) : (
                <AddToggleButton
                  added={added}
                  onToggle={() => onToggleAdd?.()}
                  label={
                    added
                      ? `Remove ${title} from plan`
                      : `Add ${title} to plan`
                  }
                  size="lg"
                />
              )}
              <p className="text-sm text-muted-foreground">{footerHint}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Description ────────────────────────────────────── */}
      {description && (
        <section className="max-w-3xl space-y-3">
          <SectionLabel>About</SectionLabel>
          <div className="text-base leading-relaxed text-foreground/90 space-y-4 [&_p]:leading-relaxed">
            {typeof description === "string" ? (
              <p>{description}</p>
            ) : (
              description
            )}
          </div>
        </section>
      )}

      {/* Details grid ───────────────────────────────────── */}
      {details && details.length > 0 && (
        <section className="space-y-3">
          <SectionLabel>Details</SectionLabel>
          <DetailGrid>
            {details.map((d) => (
              <DetailItem
                key={d.label}
                label={d.label}
                value={d.value}
                icon={d.icon}
                full={d.full}
              />
            ))}
          </DetailGrid>
        </section>
      )}
    </div>
  );
}

/* ── Section label helper ──────────────────────────────────── */

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h2>
  );
}

/* ── Detail grid helpers ───────────────────────────────────── */

function DetailGrid({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="detail-grid"
      className={cn("grid grid-cols-2 sm:grid-cols-3 gap-3", className)}
      {...props}
    />
  );
}

interface DetailItemProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  full?: boolean;
}

function DetailItem({
  label,
  value,
  icon,
  full,
  className,
  ...props
}: DetailItemProps) {
  return (
    <div
      data-slot="detail-item"
      className={cn(
        "rounded-2xl border border-border bg-card px-4 py-3 transition-colors duration-200 hover:border-primary/30",
        full && "col-span-full",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground [&_svg]:size-3.5">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-base font-semibold text-foreground tabular-nums">
        {value}
      </div>
    </div>
  );
}

export { ItemDetail, DetailGrid, DetailItem };
