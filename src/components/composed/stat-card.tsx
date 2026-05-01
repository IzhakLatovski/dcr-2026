import { type ReactNode, forwardRef } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type IconTint = "primary" | "success" | "warning" | "destructive" | "muted";

const iconTintStyles: Record<IconTint, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-green-600/10 text-green-600 dark:bg-green-500/15 dark:text-green-400",
  warning: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

interface StatCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Leading icon */
  icon: ReactNode;
  /** Tint for the icon's background tile */
  iconTint?: IconTint;
  /** Big value (string or number) */
  value: ReactNode;
  /** Small uppercase label */
  label: string;
  /** Optional helper line below the label */
  sub?: ReactNode;
  /** Progress bar (0-100); omit to hide */
  progress?: number;
  /** Click handler — makes the card interactive (chevron + hover lift) */
  onClick?: () => void;
}

const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  (
    { icon, iconTint = "primary", value, label, sub, progress, onClick, className, ...props },
    ref,
  ) => {
    const isInteractive = typeof onClick === "function";

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
        data-slot="stat-card"
        className={cn(
          "group/stat-card relative flex w-full items-start gap-3 rounded-2xl border border-border bg-card text-card-foreground p-4 text-left shadow-sm transition-all duration-200",
          isInteractive &&
            "cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          className,
        )}
        {...props}
      >
        <span
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5",
            iconTintStyles[iconTint],
          )}
        >
          {icon}
        </span>

        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span className="text-2xl font-bold tracking-tight leading-tight text-foreground tabular-nums">
            {value}
          </span>
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          {sub && (
            <span className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {sub}
            </span>
          )}
          {progress != null && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          )}
        </div>

        {isInteractive && (
          <ChevronRight className="absolute right-3 top-3 size-4 text-muted-foreground opacity-60 transition-all duration-200 group-hover/stat-card:opacity-100 group-hover/stat-card:translate-x-0.5" />
        )}
      </div>
    );
  },
);

StatCard.displayName = "StatCard";

export { StatCard, type StatCardProps, type IconTint };
