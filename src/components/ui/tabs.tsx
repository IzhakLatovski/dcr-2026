
import {
  createContext,
  forwardRef,
  useContext,
  useState,
} from "react"
import { cn } from "@/lib/utils"

/* ── Context ──────────────────────────────────────────────── */

interface TabsContextValue {
  activeTab: string
  setActiveTab: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error("Tabs components must be wrapped in <Tabs>")
  return ctx
}

/* ── Root ─────────────────────────────────────────────────── */

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string
  value?: string
  onValueChange?: (value: string) => void
}

function Tabs({
  defaultValue,
  value,
  onValueChange,
  className,
  children,
  ...props
}: TabsProps) {
  const [internal, setInternal] = useState(defaultValue)
  const activeTab = value ?? internal

  const setActiveTab = (v: string) => {
    setInternal(v)
    onValueChange?.(v)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div data-slot="tabs" className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

/* ── Tab List ─────────────────────────────────────────────── */

const TabList = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      data-slot="tab-list"
      className={cn(
        "inline-flex items-center gap-1 rounded-xl bg-muted p-1",
        className
      )}
      {...props}
    />
  )
)
TabList.displayName = "TabList"

/* ── Tab trigger ──────────────────────────────────────────── */

interface TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

const Tab = forwardRef<HTMLButtonElement, TabProps>(
  ({ value, className, children, ...props }, ref) => {
    const { activeTab, setActiveTab } = useTabsContext()
    const isActive = activeTab === value

    return (
      <button
        ref={ref}
        role="tab"
        type="button"
        aria-selected={isActive}
        data-slot="tab"
        className={cn(
          "inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 outline-none select-none",
          "focus-visible:ring-3 focus-visible:ring-ring/50",
          isActive
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
          className
        )}
        onClick={() => setActiveTab(value)}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Tab.displayName = "Tab"

/* ── Tab Panel ────────────────────────────────────────────── */

interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(
  ({ value, className, children, ...props }, ref) => {
    const { activeTab } = useTabsContext()
    if (activeTab !== value) return null

    return (
      <div
        ref={ref}
        role="tabpanel"
        data-slot="tab-panel"
        className={cn("mt-3 outline-none", className)}
        tabIndex={0}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TabPanel.displayName = "TabPanel"

export { Tabs, TabList, Tab, TabPanel }
