import { type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

type PillarTint = "primary" | "success" | "warning" | "destructive" | "muted" | "violet" | "pink";

const tintStyles: Record<PillarTint, { iconBg: string; bar: "primary" | "success" | "warning" | "default" }> = {
  primary: { iconBg: "bg-primary/10 text-primary", bar: "primary" },
  success: { iconBg: "bg-green-600/10 text-green-600 dark:bg-green-500/15 dark:text-green-400", bar: "success" },
  warning: { iconBg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400", bar: "warning" },
  destructive: { iconBg: "bg-destructive/10 text-destructive", bar: "default" },
  muted: { iconBg: "bg-muted text-muted-foreground", bar: "default" },
  violet: { iconBg: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400", bar: "primary" },
  pink: { iconBg: "bg-pink-500/10 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400", bar: "primary" },
};

interface PillarProgressCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Leading icon */
  icon: ReactNode;
  /** Pillar name */
  label: string;
  /** Current value */
  value: number;
  /** Required value */
  required: number;
  /** Unit suffix (e.g. "pts" or "items") */
  unit?: string;
  /** Color tint for the icon and bar */
  tint?: PillarTint;
  /** Optional second value (e.g. "completed" overlay on top of "planned") */
  completed?: number;
}

/**
 * Compact horizontal pillar tile: icon + label + value/required + bar + check
 * if met. Optionally renders a "completed of planned" two-tone bar.
 */
function PillarProgressCard({
  icon,
  label,
  value,
  required,
  unit = "pts",
  tint = "primary",
  completed,
  className,
  ...props
}: PillarProgressCardProps) {
  const styles = tintStyles[tint];
  const met = completed != null ? completed >= required : value >= required;

  return (
    <div
      data-slot="pillar-progress-card"
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-border bg-card p-4",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-xl [&_svg]:size-4",
            styles.iconBg,
          )}
        >
          {icon}
        </span>
        <span className="flex-1 min-w-0 text-sm font-semibold text-foreground truncate">
          {label}
        </span>
        <span className="shrink-0 text-xs tabular-nums">
          <span className={cn("font-semibold", met ? "text-green-600 dark:text-green-400" : "text-foreground")}>
            {(completed ?? value).toLocaleString()}
          </span>
          <span className="text-muted-foreground"> / {required.toLocaleString()} {unit}</span>
        </span>
        {met && (
          <CheckCircle2 className="size-4 text-green-600 dark:text-green-400 shrink-0" />
        )}
      </div>
      {/* Completion mode renders a single track with two stacked fills at
          different heights — no overlap means no flicker. The thicker green
          fill (completed) sits inside a thinner muted fill (planned). */}
      {completed != null ? (
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary/50 transition-all duration-500"
            style={{ width: `${Math.min(100, (value / Math.max(required, value, 1)) * 100)}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-green-600 dark:bg-green-500 transition-all duration-500"
            style={{ width: `${Math.min(100, (completed / Math.max(required, value, 1)) * 100)}%` }}
          />
        </div>
      ) : (
        <ProgressBar
          value={value}
          max={Math.max(required, value, 1)}
          size="sm"
          variant={met ? "success" : styles.bar}
        />
      )}
    </div>
  );
}

export { PillarProgressCard };
