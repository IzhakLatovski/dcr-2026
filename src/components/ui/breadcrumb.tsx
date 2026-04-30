
import { forwardRef, type ReactNode } from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/* ── List ─────────────────────────────────────────────────── */

const BreadcrumbList = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <nav ref={ref} aria-label="Breadcrumb" data-slot="breadcrumb">
      <ol
        className={cn(
          "flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground",
          className
        )}
        {...props}
      />
    </nav>
  )
)
BreadcrumbList.displayName = "BreadcrumbList"

/* ── Item ─────────────────────────────────────────────────── */

interface BreadcrumbItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  active?: boolean
  href?: string
}

const BreadcrumbItem = forwardRef<HTMLLIElement, BreadcrumbItemProps>(
  ({ className, active, href, children, ...props }, ref) => (
    <li
      ref={ref}
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      aria-current={active ? "page" : undefined}
      {...props}
    >
      {href && !active ? (
        <a
          href={href}
          className="transition-colors duration-200 hover:text-foreground"
        >
          {children}
        </a>
      ) : (
        <span className={cn(active && "font-medium text-foreground")}>
          {children}
        </span>
      )}
    </li>
  )
)
BreadcrumbItem.displayName = "BreadcrumbItem"

/* ── Separator ────────────────────────────────────────────── */

function BreadcrumbSeparator({
  className,
  children,
}: {
  className?: string
  children?: ReactNode
}) {
  return (
    <li
      role="presentation"
      aria-hidden
      className={cn("text-muted-foreground/50 [&_svg]:size-3.5", className)}
    >
      {children ?? <ChevronRight className="size-3.5" />}
    </li>
  )
}

export { BreadcrumbList, BreadcrumbItem, BreadcrumbSeparator }
