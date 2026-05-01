import { type ReactNode } from "react";
import { ArrowRight, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

interface LevelProgressCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Title (e.g. "Your Learning Path") */
  title: string;
  /** Subtitle below title */
  subtitle?: string;
  /** Optional status pill in the header */
  statusBadge?: ReactNode;
  /** Current level number (omit for new users / simulator) */
  currentLevel?: number | null;
  /** Target level (id, label, points) */
  targetLevel?: { id: number; label: string; points: number };
  /** Current points banked toward the target */
  pointsBanked: number;
  /** Optional "remaining pts" / hint */
  hint?: ReactNode;
  /** Render a custom level selector / target picker (when not in real plan mode) */
  targetSelector?: ReactNode;
  /** Extra content below the progress bar (e.g. stat chips for carryover) */
  extras?: ReactNode;
}

/**
 * Hero-style card showing current → next level transition with a points
 * progress bar. Used at the top of the plan/simulator page.
 */
function LevelProgressCard({
  title,
  subtitle,
  statusBadge,
  currentLevel,
  targetLevel,
  pointsBanked,
  hint,
  targetSelector,
  extras,
  className,
  ...props
}: LevelProgressCardProps) {
  const hasTarget = !!targetLevel;
  const remaining = hasTarget ? Math.max(0, targetLevel.points - pointsBanked) : 0;
  const isMet = hasTarget && pointsBanked >= targetLevel.points;

  return (
    <div
      data-slot="level-progress-card"
      className={cn(
        "flex flex-col gap-4 rounded-3xl border border-border bg-card text-card-foreground shadow-sm p-5 sm:p-6",
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {statusBadge && <div className="shrink-0">{statusBadge}</div>}
      </div>

      {/* Level transition */}
      {currentLevel != null && targetLevel ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="default" size="md">
            Level {currentLevel}
          </Badge>
          <ArrowRight className="size-4 text-muted-foreground" />
          <Badge variant="primary" size="md">
            <Target className="size-3" />
            {targetLevel.label}
          </Badge>
        </div>
      ) : targetSelector ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Target Level
          </span>
          {targetSelector}
        </div>
      ) : null}

      {/* Points progress */}
      {hasTarget && (
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
              {pointsBanked.toLocaleString()}
              <span className="text-sm font-medium text-muted-foreground"> / {targetLevel.points.toLocaleString()} pts</span>
            </span>
            {!isMet && remaining > 0 && (
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {remaining} pts to go
              </span>
            )}
            {isMet && (
              <Badge variant="success" size="sm">
                Met
              </Badge>
            )}
          </div>
          <ProgressBar
            value={pointsBanked}
            max={targetLevel.points}
            size="md"
            variant={isMet ? "success" : "primary"}
          />
        </div>
      )}

      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}

      {extras}
    </div>
  );
}

export { LevelProgressCard };
