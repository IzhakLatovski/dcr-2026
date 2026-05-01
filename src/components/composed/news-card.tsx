import { type ReactNode, forwardRef } from "react";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type NewsType = "promotion" | "deadline" | "reminder" | "announcement";

const TYPE_LABEL: Record<NewsType, string> = {
  promotion: "Promotion",
  deadline: "Deadline",
  reminder: "Reminder",
  announcement: "What's New",
};

const TYPE_BADGE_VARIANT: Record<
  NewsType,
  "warning" | "destructive" | "primary" | "secondary"
> = {
  promotion: "warning",
  deadline: "destructive",
  reminder: "primary",
  announcement: "secondary",
};

const TYPE_ICON_TINT: Record<NewsType, string> = {
  promotion: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  deadline: "bg-destructive/10 text-destructive",
  reminder: "bg-primary/10 text-primary",
  announcement: "bg-secondary text-secondary-foreground",
};

interface NewsCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Leading icon */
  icon: ReactNode;
  /** Card title */
  title: string;
  /** Body copy */
  body: string;
  /** Drives the type badge label + tint */
  type: NewsType;
  /** Show a "NEW" badge in the top-right */
  isNew?: boolean;
  /** Optional CTA link label */
  linkLabel?: string;
  /** Click handler for the CTA link */
  onLinkClick?: () => void;
}

const NewsCard = forwardRef<HTMLDivElement, NewsCardProps>(
  ({ icon, title, body, type, isNew, linkLabel, onLinkClick, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="news-card"
        className={cn(
          "flex flex-col gap-3 rounded-2xl border border-border bg-card text-card-foreground shadow-sm p-4",
          "transition-all duration-200 hover:border-primary/30 hover:shadow-md",
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-3">
          <span
            className={cn(
              "inline-flex size-10 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5",
              TYPE_ICON_TINT[type],
            )}
          >
            {icon}
          </span>
          <div className="flex flex-wrap justify-end gap-1.5">
            <Badge variant={TYPE_BADGE_VARIANT[type]} size="sm">
              {TYPE_LABEL[type]}
            </Badge>
            {isNew && (
              <Badge variant="destructive" size="sm">
                NEW
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground leading-snug tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
        </div>

        {linkLabel && onLinkClick && (
          <button
            type="button"
            onClick={onLinkClick}
            className="self-start inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline outline-none focus-visible:ring-2 focus-visible:ring-ring rounded mt-auto"
          >
            {linkLabel}
            <ArrowRight className="size-3.5" />
          </button>
        )}
      </div>
    );
  },
);

NewsCard.displayName = "NewsCard";

export { NewsCard };
