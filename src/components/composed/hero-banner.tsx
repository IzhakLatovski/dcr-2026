import { type ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface HeroBannerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Small line above the title (e.g. greeting, label, eyebrow) */
  eyebrow?: ReactNode;
  /** Hero title */
  title: ReactNode;
  /** Optional subtitle below the title */
  subtitle?: ReactNode;
  /** Slot before the identity column (typically an avatar) */
  avatar?: ReactNode;
  /** Pills/tags shown beneath the title */
  tags?: ReactNode;
  /** Trailing block on the right (typically meta info) */
  trailing?: ReactNode;
}

const HeroBanner = forwardRef<HTMLDivElement, HeroBannerProps>(
  ({ eyebrow, title, subtitle, avatar, tags, trailing, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="hero-banner"
        className={cn(
          "rounded-3xl border border-border bg-card text-card-foreground shadow-sm p-5 sm:p-6",
          "flex flex-col sm:flex-row gap-5 sm:gap-6 items-stretch sm:items-center justify-between",
          className,
        )}
        {...props}
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {avatar && <div className="shrink-0">{avatar}</div>}
          <div className="min-w-0 flex flex-col gap-1">
            {eyebrow && (
              <p className="text-xs font-medium text-muted-foreground">{eyebrow}</p>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight text-foreground sm:truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
            {tags && <div className="mt-2 flex flex-wrap gap-1.5">{tags}</div>}
          </div>
        </div>
        {trailing && (
          <div className="shrink-0 flex flex-col gap-2 items-stretch sm:items-end">
            {trailing}
          </div>
        )}
      </div>
    );
  },
);

HeroBanner.displayName = "HeroBanner";

export { HeroBanner };
