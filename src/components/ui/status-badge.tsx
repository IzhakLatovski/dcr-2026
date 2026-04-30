
import { cn } from "@/lib/utils"

const statusConfig = {
  pending: {
    dot: "bg-muted-foreground/50",
    text: "text-muted-foreground",
    label: "Pending",
  },
  "in-progress": {
    dot: "bg-primary animate-pulse",
    text: "text-primary",
    label: "In Progress",
  },
  completed: {
    dot: "bg-green-600 dark:bg-green-500",
    text: "text-green-600 dark:text-green-500",
    label: "Completed",
  },
  cancelled: {
    dot: "bg-muted-foreground/40",
    text: "text-muted-foreground",
    label: "Cancelled",
  },
  failed: {
    dot: "bg-destructive",
    text: "text-destructive",
    label: "Failed",
  },
}

type StatusBadgeStatus = keyof typeof statusConfig

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusBadgeStatus
  label?: string
}

function StatusBadge({ status, label, className, ...props }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      data-slot="status-badge"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium select-none",
        config.text,
        className
      )}
      {...props}
    >
      <span className={cn("size-2 rounded-full shrink-0", config.dot)} />
      {label ?? config.label}
    </span>
  )
}

export { StatusBadge }
export type { StatusBadgeStatus }
