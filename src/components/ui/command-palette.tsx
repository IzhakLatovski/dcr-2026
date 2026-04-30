
import { useState, useEffect, useRef, type ReactNode } from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CommandItem {
  id: string
  label: string
  icon?: ReactNode
  description?: string
  group?: string
  onSelect: () => void
}

interface CommandPaletteProps {
  items: CommandItem[]
  open: boolean
  onClose: () => void
  placeholder?: string
}

function CommandPalette({
  items,
  open,
  onClose,
  placeholder = "Type a command or search…",
}: CommandPaletteProps) {
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = items.filter(
    (item) =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.description?.toLowerCase().includes(query.toLowerCase())
  )

  // Group items
  const groups = new Map<string, CommandItem[]>()
  for (const item of filtered) {
    const group = item.group ?? ""
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group)!.push(item)
  }

  useEffect(() => {
    if (open) {
      setQuery("")
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose()
        return
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % Math.max(filtered.length, 1))
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIndex((i) => (i - 1 + filtered.length) % Math.max(filtered.length, 1))
      }
      if (e.key === "Enter" && filtered[activeIndex]) {
        filtered[activeIndex].onSelect()
        onClose()
      }
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open, filtered, activeIndex, onClose])

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`)
    el?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])

  if (!open) return null

  let flatIndex = -1

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        data-slot="command-palette"
        className={cn(
          "fixed left-1/2 top-[20%] z-50 w-[90vw] max-w-lg -translate-x-1/2",
          "rounded-2xl border border-border bg-popover shadow-2xl overflow-hidden",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
        )}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-[0.6rem] font-mono text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[300px] overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          ) : (
            Array.from(groups.entries()).map(([group, groupItems]) => (
              <div key={group}>
                {group && (
                  <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    {group}
                  </div>
                )}
                {groupItems.map((item) => {
                  flatIndex++
                  const idx = flatIndex
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-index={idx}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none transition-colors duration-100",
                        idx === activeIndex
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground"
                      )}
                      onClick={() => {
                        item.onSelect()
                        onClose()
                      }}
                      onMouseEnter={() => setActiveIndex(idx)}
                    >
                      {item.icon && (
                        <span className="shrink-0 text-muted-foreground [&_svg]:size-4">
                          {item.icon}
                        </span>
                      )}
                      <span className="flex-1 text-left">
                        <span className="block">{item.label}</span>
                        {item.description && (
                          <span className="block text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

export { CommandPalette }
