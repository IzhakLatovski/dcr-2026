import { type ReactNode, forwardRef } from "react";
import { Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanItemRowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Image URL — preferred when present */
  image?: string;
  /** Fallback icon when no image */
  imageFallback?: ReactNode;
  /** Item title */
  title: string;
  /** Sub-title (provider, category, etc.) */
  subtitle?: ReactNode;
  /** Trailing actions (proof button, complete toggle, remove button etc.) */
  actions?: ReactNode;
  /** Click on the row body */
  onSelect?: () => void;
  /** Visual state — completed shows a subtle green tint */
  completed?: boolean;
  /** Visual state — locked shows a subtle muted tint and disables the click */
  locked?: boolean;
}

const PlanItemRow = forwardRef<HTMLDivElement, PlanItemRowProps>(
  (
    {
      image,
      imageFallback,
      title,
      subtitle,
      actions,
      onSelect,
      completed,
      locked,
      className,
      ...props
    },
    ref,
  ) => {
    const isInteractive = typeof onSelect === "function" && !locked;
    return (
      <div
        ref={ref}
        data-slot="plan-item-row"
        className={cn(
          "flex items-center gap-3 rounded-xl border bg-card p-2.5 transition-all duration-150",
          completed && "border-green-600/30 bg-green-600/5",
          locked && "opacity-70",
          isInteractive &&
            "hover:border-primary/30 hover:shadow-sm cursor-pointer",
          !completed && !locked && "border-border",
          className,
        )}
        onClick={isInteractive ? onSelect : undefined}
        {...props}
      >
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted/40 overflow-hidden [&_svg]:size-5 [&_svg]:text-muted-foreground">
          {image ? (
            <img src={image} alt="" className="size-full object-contain p-1" />
          ) : (
            imageFallback ?? <Award />
          )}
        </span>

        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground truncate">
            {title}
          </span>
          {subtitle && (
            <span className="text-xs text-muted-foreground truncate">
              {subtitle}
            </span>
          )}
        </div>

        {actions && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 flex items-center gap-1.5"
          >
            {actions}
          </div>
        )}
      </div>
    );
  },
);

PlanItemRow.displayName = "PlanItemRow";

export { PlanItemRow };
