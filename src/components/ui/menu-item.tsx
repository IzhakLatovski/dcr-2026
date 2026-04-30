
import { forwardRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface MenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode
  label: string
  badge?: number
  active?: boolean
  collapsed?: boolean
}

const MenuItem = forwardRef<HTMLButtonElement, MenuItemProps>(
  ({ className, icon, label, badge, active = false, collapsed = false, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        data-slot="menu-item"
        className={cn(
          "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 outline-none w-full",
          "focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:opacity-50",
          collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
          active
            ? "bg-primary/10 text-primary dark:bg-primary/20"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          className
        )}
        aria-current={active ? "page" : undefined}
        {...props}
      >
        {icon && (
          <span className="shrink-0 [&_svg]:size-5">{icon}</span>
        )}
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-left">{label}</span>
            {badge !== undefined && badge > 0 && (
              <span
                className={cn(
                  "ml-auto flex items-center justify-center rounded-full min-w-[20px] h-5 px-1.5 text-[10px] font-bold leading-none",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </>
        )}
      </button>
    )
  }
)

MenuItem.displayName = "MenuItem"

export { MenuItem }
