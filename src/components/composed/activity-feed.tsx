import { type ReactNode, Fragment } from "react";
import { cn } from "@/lib/utils";

type TimelineTone = "primary" | "success" | "muted" | "warning";

const toneStyles: Record<TimelineTone, string> = {
  primary: "bg-primary text-primary-foreground",
  success: "bg-green-600 text-white dark:bg-green-500",
  muted: "bg-muted text-muted-foreground border border-border",
  warning: "bg-amber-500 text-white",
};

export interface TimelineItemProps {
  /** Marker content (icon, number, etc.) — falls back to a small dot if omitted */
  marker?: ReactNode;
  /** Tone for the marker background */
  tone?: TimelineTone;
  /** Title (event name) */
  title: ReactNode;
  /** Subtitle line below the title */
  subtitle?: ReactNode;
  /** Date / when */
  date?: ReactNode;
}

function TimelineItem({
  marker,
  tone = "primary",
  title,
  subtitle,
  date,
  isLast,
}: TimelineItemProps & { isLast?: boolean }) {
  return (
    <div data-slot="timeline-item" className="flex gap-3">
      <div className="flex flex-col items-center shrink-0">
        <span
          className={cn(
            "inline-flex size-8 items-center justify-center rounded-full text-xs font-semibold [&_svg]:size-3.5",
            toneStyles[tone],
          )}
        >
          {marker ?? <span className="size-1.5 rounded-full bg-current" />}
        </span>
        {!isLast && <span className="flex-1 w-px bg-border mt-1" />}
      </div>
      <div className={cn("flex-1 min-w-0 pb-5", isLast && "pb-0")}>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {date && (
            <span className="text-xs text-muted-foreground">{date}</span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

interface ActivityFeedProps extends React.HTMLAttributes<HTMLDivElement> {
  items: TimelineItemProps[];
}

function ActivityFeed({ items, className, ...props }: ActivityFeedProps) {
  return (
    <div
      data-slot="activity-feed"
      className={cn("flex flex-col", className)}
      {...props}
    >
      {items.map((item, i) => (
        <Fragment key={i}>
          <TimelineItem {...item} isLast={i === items.length - 1} />
        </Fragment>
      ))}
    </div>
  );
}

export { ActivityFeed, TimelineItem };
