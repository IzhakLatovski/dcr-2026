import { type ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface FormCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Leading icon (rendered in tinted tile) */
  icon?: ReactNode;
  /** Tint for the icon tile */
  iconTint?: "primary" | "success" | "warning" | "destructive" | "muted" | "violet";
  /** Title */
  title: string;
  /** Description / instructions */
  description?: string;
  /** Optional badge (e.g. "Coming Soon") */
  badge?: ReactNode;
  /** Body slot — typically form fields */
  children?: ReactNode;
  /** Footer slot — typically the submit/action button */
  footer?: ReactNode;
}

const iconTintStyles = {
  primary: "bg-primary/10 text-primary",
  success: "bg-green-600/10 text-green-600 dark:bg-green-500/15 dark:text-green-400",
  warning: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
  violet: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
};

const FormCard = forwardRef<HTMLDivElement, FormCardProps>(
  (
    {
      icon,
      iconTint = "primary",
      title,
      description,
      badge,
      children,
      footer,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        data-slot="form-card"
        className={cn(
          "flex flex-col rounded-2xl border border-border bg-card text-card-foreground shadow-sm",
          className,
        )}
        {...props}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-5 pb-4">
          {icon && (
            <span
              className={cn(
                "inline-flex size-10 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5",
                iconTintStyles[iconTint],
              )}
            >
              {icon}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                {title}
              </h3>
              {badge && <div className="shrink-0">{badge}</div>}
            </div>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        {/* Body */}
        {children && (
          <div className="flex-1 px-5 pb-4 flex flex-col gap-3">{children}</div>
        )}

        {/* Footer */}
        {footer && (
          <div className="border-t border-border bg-muted/20 px-5 py-3 flex items-center justify-end rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    );
  },
);

FormCard.displayName = "FormCard";

export { FormCard };
