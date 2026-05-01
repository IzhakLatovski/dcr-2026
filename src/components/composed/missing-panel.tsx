import { type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MissingPanelItem {
  /** Optional leading icon */
  icon?: ReactNode;
  /** Label / requirement text */
  label: string;
  /** Optional secondary value (e.g. "10 / 50 pts") */
  sub?: ReactNode;
}

interface MissingPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Small uppercase eyebrow above the title */
  eyebrow: string;
  /** Title (typically the level name) */
  title: string;
  /** List of missing items — when empty, shows the "all met" state */
  items: MissingPanelItem[];
  /** Message shown when items is empty */
  allMetMessage?: string;
  /** Sub-message under the all-met message */
  allMetSub?: string;
  /** Optional CTA at the bottom (e.g. "Add Missing Items") */
  action?: ReactNode;
}

/**
 * Sidebar callout listing what's still needed for a goal (typically the next
 * level). Falls back to a "ready" state when items is empty.
 */
function MissingPanel({
  eyebrow,
  title,
  items,
  allMetMessage = "All requirements met",
  allMetSub,
  action,
  className,
  ...props
}: MissingPanelProps) {
  const allMet = items.length === 0;
  return (
    <div
      data-slot="missing-panel"
      className={cn(
        "flex flex-col gap-3 rounded-3xl border border-border bg-card text-card-foreground shadow-sm p-5",
        className,
      )}
      {...props}
    >
      <div className="space-y-0.5">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </p>
        <p className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </p>
      </div>

      {allMet ? (
        <div className="flex items-start gap-3 rounded-xl bg-green-600/5 border border-green-600/20 p-3">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-green-600/15 text-green-600 dark:text-green-400 [&_svg]:size-4">
            <CheckCircle2 />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              {allMetMessage}
            </span>
            {allMetSub && (
              <span className="text-xs text-muted-foreground">{allMetSub}</span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((it, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl bg-muted/30 p-3"
            >
              {it.icon && (
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground [&_svg]:size-4">
                  {it.icon}
                </span>
              )}
              <div className="min-w-0 flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {it.label}
                </span>
                {it.sub && (
                  <span className="text-xs text-muted-foreground">
                    {it.sub}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {action && <div>{action}</div>}
    </div>
  );
}

export { MissingPanel };
