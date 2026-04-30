
import { forwardRef, type ReactNode } from "react"
import { X, Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default:
          "border-border bg-muted/50 text-foreground [&_[data-slot=alert-icon]]:text-muted-foreground",
        info:
          "border-blue-600/20 bg-blue-600/5 text-foreground [&_[data-slot=alert-icon]]:text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10",
        success:
          "border-green-600/20 bg-green-600/5 text-foreground [&_[data-slot=alert-icon]]:text-green-600 dark:border-green-500/20 dark:bg-green-500/10 dark:[&_[data-slot=alert-icon]]:text-green-400",
        warning:
          "border-amber-500/20 bg-amber-500/5 text-foreground [&_[data-slot=alert-icon]]:text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:[&_[data-slot=alert-icon]]:text-amber-400",
        destructive:
          "border-destructive/20 bg-destructive/5 text-foreground [&_[data-slot=alert-icon]]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const defaultIcons: Record<string, ReactNode> = {
  default: <Info className="size-4" />,
  info: <Info className="size-4" />,
  success: <CheckCircle className="size-4" />,
  warning: <AlertTriangle className="size-4" />,
  destructive: <XCircle className="size-4" />,
}

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  icon?: ReactNode
  title?: string
  onDismiss?: () => void
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", icon, title, children, onDismiss, ...props }, ref) => {
    const resolvedIcon = icon ?? defaultIcons[variant ?? "default"]

    return (
      <div
        ref={ref}
        role="alert"
        data-slot="alert"
        className={cn(alertVariants({ variant, className }))}
        {...props}
      >
        <span data-slot="alert-icon" className="mt-0.5 shrink-0">
          {resolvedIcon}
        </span>
        <div className="flex-1 min-w-0">
          {title && (
            <div className="font-medium leading-tight">{title}</div>
          )}
          {children && (
            <div className={cn("text-muted-foreground", title && "mt-0.5")}>
              {children}
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-lg p-0.5 text-muted-foreground hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Dismiss"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    )
  }
)

Alert.displayName = "Alert"

export { Alert, alertVariants }
