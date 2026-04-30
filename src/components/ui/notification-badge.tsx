
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const notificationBadgeVariants = cva(
  "absolute flex items-center justify-center rounded-full text-white font-bold leading-none select-none pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-primary",
        destructive: "bg-destructive",
      },
    },
    defaultVariants: {
      variant: "destructive",
    },
  }
)

interface NotificationBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof notificationBadgeVariants> {
  count: number
  max?: number
}

function NotificationBadge({
  children,
  count,
  max = 99,
  variant,
  className,
  ...props
}: NotificationBadgeProps) {
  const display = count > max ? `${max}+` : String(count)
  const show = count > 0

  return (
    <span className="relative inline-flex" {...props}>
      {children}
      {show && (
        <span
          data-slot="notification-badge"
          className={cn(
            notificationBadgeVariants({ variant }),
            "min-w-[18px] h-[18px] px-1 text-[10px] -top-1.5 -right-1.5",
            className
          )}
        >
          {display}
        </span>
      )}
    </span>
  )
}

export { NotificationBadge }
