
import {
  createContext,
  forwardRef,
  useContext,
  useState,
} from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Context ──────────────────────────────────────────────── */

interface AccordionContextValue {
  openItems: Set<string>
  toggle: (value: string) => void
}

const AccordionContext = createContext<AccordionContextValue | null>(null)

function useAccordion() {
  const ctx = useContext(AccordionContext)
  if (!ctx) throw new Error("Accordion components must be inside <Accordion>")
  return ctx
}

/* ── Root ─────────────────────────────────────────────────── */

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple"
  defaultValue?: string[]
}

function Accordion({
  type = "single",
  defaultValue = [],
  className,
  children,
  ...props
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(defaultValue))

  const toggle = (value: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(value)) {
        next.delete(value)
      } else {
        if (type === "single") next.clear()
        next.add(value)
      }
      return next
    })
  }

  return (
    <AccordionContext.Provider value={{ openItems, toggle }}>
      <div data-slot="accordion" className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  )
}

/* ── Item ─────────────────────────────────────────────────── */

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const AccordionItemContext = createContext<string>("")

const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, className, children, ...props }, ref) => (
    <AccordionItemContext.Provider value={value}>
      <div
        ref={ref}
        data-slot="accordion-item"
        className={cn("border-b border-border", className)}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  )
)
AccordionItem.displayName = "AccordionItem"

/* ── Trigger ──────────────────────────────────────────────── */

const AccordionTrigger = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    const { openItems, toggle } = useAccordion()
    const value = useContext(AccordionItemContext)
    const isOpen = openItems.has(value)

    return (
      <button
        ref={ref}
        type="button"
        aria-expanded={isOpen}
        data-slot="accordion-trigger"
        className={cn(
          "flex w-full items-center justify-between py-4 text-sm font-medium text-foreground transition-all duration-200 outline-none",
          "hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 rounded-lg",
          className
        )}
        onClick={() => toggle(value)}
        {...props}
      >
        {children}
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
    )
  }
)
AccordionTrigger.displayName = "AccordionTrigger"

/* ── Content ──────────────────────────────────────────────── */

const AccordionContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { openItems } = useAccordion()
    const value = useContext(AccordionItemContext)
    const isOpen = openItems.has(value)

    return (
      <div
        ref={ref}
        data-slot="accordion-content"
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
        {...props}
      >
        <div className={cn("pb-4 text-sm text-muted-foreground", className)}>
          {children}
        </div>
      </div>
    )
  }
)
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
