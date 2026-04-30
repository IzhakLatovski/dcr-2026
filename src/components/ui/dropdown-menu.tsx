
import {
  forwardRef,
  useState,
  useRef,
  useEffect,
  createContext,
  useContext,
  cloneElement,
  isValidElement,
  type ReactNode,
  type ReactElement,
  type MouseEvent as ReactMouseEvent,
} from "react"
import { cn } from "@/lib/utils"

/* ── Context ──────────────────────────────────────────────── */

interface DropdownContextValue {
  open: boolean
  setOpen: (v: boolean) => void
}

const DropdownContext = createContext<DropdownContextValue | null>(null)

function useDropdown() {
  const ctx = useContext(DropdownContext)
  if (!ctx) throw new Error("Dropdown components must be inside <DropdownMenu>")
  return ctx
}

/* ── Root ─────────────────────────────────────────────────── */

function DropdownMenu({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [open])

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className={cn("relative inline-flex", className)} data-slot="dropdown-menu">
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

/* ── Trigger ──────────────────────────────────────────────── */

interface DropdownTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const DropdownTrigger = forwardRef<HTMLButtonElement, DropdownTriggerProps>(
  ({ className, children, asChild, onClick, ...props }, ref) => {
    const { open, setOpen } = useDropdown()

    const handleClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      setOpen(!open)
    }

    if (asChild && isValidElement(children)) {
      const child = children as ReactElement<{
        onClick?: (e: ReactMouseEvent<HTMLButtonElement>) => void
      }>
      return cloneElement(child, {
        ...props,
        // @ts-expect-error — forwarding ref/aria to arbitrary child element
        ref,
        "aria-expanded": open,
        "aria-haspopup": "menu",
        "data-slot": "dropdown-trigger",
        onClick: (e: ReactMouseEvent<HTMLButtonElement>) => {
          child.props.onClick?.(e)
          setOpen(!open)
        },
      })
    }

    return (
      <button
        ref={ref}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        data-slot="dropdown-trigger"
        className={cn("outline-none", className)}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    )
  }
)
DropdownTrigger.displayName = "DropdownTrigger"

/* ── Content ──────────────────────────────────────────────── */

type DropdownAlign = "start" | "center" | "end"

interface DropdownContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: DropdownAlign
}

const alignStyles: Record<DropdownAlign, string> = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0",
}

const DropdownContent = forwardRef<HTMLDivElement, DropdownContentProps>(
  ({ className, align = "start", children, ...props }, ref) => {
    const { open } = useDropdown()
    if (!open) return null

    return (
      <div
        ref={ref}
        role="menu"
        data-slot="dropdown-content"
        className={cn(
          "absolute z-50 mt-1 top-full min-w-[8rem] rounded-xl border border-border bg-popover p-1 shadow-lg",
          "animate-in fade-in-0 zoom-in-95 duration-150",
          alignStyles[align],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
DropdownContent.displayName = "DropdownContent"

/* ── Item ─────────────────────────────────────────────────── */

interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode
  destructive?: boolean
}

const DropdownItem = forwardRef<HTMLButtonElement, DropdownItemProps>(
  ({ className, icon, destructive, children, onClick, ...props }, ref) => {
    const { setOpen } = useDropdown()

    return (
      <button
        ref={ref}
        type="button"
        role="menuitem"
        data-slot="dropdown-item"
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm outline-none transition-colors duration-150 cursor-pointer select-none",
          destructive
            ? "text-destructive hover:bg-destructive/10 active:bg-destructive/20 focus-visible:bg-destructive/10"
            : "text-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent/80 focus-visible:bg-accent",
          className
        )}
        onClick={(e) => {
          onClick?.(e)
          setOpen(false)
        }}
        {...props}
      >
        {icon && <span className="shrink-0 [&_svg]:size-4">{icon}</span>}
        {children}
      </button>
    )
  }
)
DropdownItem.displayName = "DropdownItem"

/* ── Separator ────────────────────────────────────────────── */

function DropdownSeparator({ className }: { className?: string }) {
  return <div className={cn("my-1 h-px bg-border", className)} role="separator" />
}

/* ── Label ────────────────────────────────────────────────── */

function DropdownLabel({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn("px-2.5 py-1.5 text-xs font-medium text-muted-foreground", className)}>
      {children}
    </div>
  )
}

export {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
}
