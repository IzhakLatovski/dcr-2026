import { type ReactNode, forwardRef } from "react";
import { Award, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AchievementStatus = "approved" | "submitted" | "rejected" | "historical" | "planned";

const STATUS_VARIANT: Record<AchievementStatus, "success" | "warning" | "destructive" | "default" | "primary"> = {
  approved: "success",
  submitted: "warning",
  rejected: "destructive",
  historical: "default",
  planned: "primary",
};

interface AchievementCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Image URL — preferred when present */
  image?: string;
  /** Fallback icon */
  icon?: ReactNode;
  /** Item / achievement title */
  title: string;
  /** Subtitle line (provider, category) */
  subtitle?: string;
  /** Quarter label (e.g. "Q1-2026") */
  quarter?: string | null;
  /** Date (formatted) */
  date?: string;
  /** Points earned */
  points?: number;
  /** Status drives the badge variant */
  status?: AchievementStatus;
  /** Hide the status badge (e.g. when status is implied) */
  hideStatus?: boolean;
  /** Optional href to a proof / doc link */
  href?: string;
  /** Click handler (e.g. open detail) */
  onClick?: () => void;
}

const AchievementCard = forwardRef<HTMLDivElement, AchievementCardProps>(
  (
    {
      image,
      icon,
      title,
      subtitle,
      quarter,
      date,
      points,
      status,
      hideStatus,
      href,
      onClick,
      className,
      ...props
    },
    ref,
  ) => {
    const isInteractive = typeof onClick === "function" || !!href;

    const Inner = (
      <>
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted/40 overflow-hidden [&_svg]:size-5 [&_svg]:text-muted-foreground">
          {image ? (
            <img src={image} alt="" className="size-full object-contain p-1" />
          ) : (
            icon ?? <Award />
          )}
        </span>

        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-foreground truncate">
            {title}
          </span>
          {subtitle && (
            <span className="text-xs text-muted-foreground truncate">
              {subtitle}
            </span>
          )}
          {(quarter || date) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              {quarter && <span>{quarter}</span>}
              {date && <span>{date}</span>}
            </div>
          )}
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {points != null && points > 0 && (
            <span className="text-sm font-semibold text-foreground tabular-nums">
              +{points.toLocaleString()}
            </span>
          )}
          {status && !hideStatus && (
            <Badge variant={STATUS_VARIANT[status]} size="sm">
              {status}
            </Badge>
          )}
          {href && <ExternalLink className="size-4 text-muted-foreground" />}
        </div>
      </>
    );

    const baseClass = cn(
      "flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-all duration-200",
      isInteractive &&
        "hover:border-primary/30 hover:shadow-sm cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
      className,
    );

    if (href) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement> as never}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClick}
          data-slot="achievement-card"
          className={baseClass}
        >
          {Inner}
        </a>
      );
    }

    return (
      <div
        ref={ref}
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onClick={onClick}
        onKeyDown={
          isInteractive
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick?.();
                }
              }
            : undefined
        }
        data-slot="achievement-card"
        className={baseClass}
        {...props}
      >
        {Inner}
      </div>
    );
  },
);

AchievementCard.displayName = "AchievementCard";

export { AchievementCard };
