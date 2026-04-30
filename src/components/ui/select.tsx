
import { forwardRef, useState, useRef, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectOption {
  label: string
  value: string
}

interface SelectProps {
  options: SelectOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

const Select = forwardRef<HTMLButtonElement, SelectProps>(
  ({ options, value, onValueChange, placeholder = "Select…", className, disabled }, ref) => {
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const selectedOption = options.find((o) => o.value === value)

    useEffect(() => {
      function handleClickOutside(e: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false)
        }
      }
      if (open) {
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
      }
    }, [open])

    return (
      <div ref={containerRef} className="relative" data-slot="select">
        <button
          ref={ref}
          type="button"
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-xl border border-border bg-transparent px-3 text-sm transition-all duration-200",
            "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "disabled:pointer-events-none disabled:opacity-50",
            open && "border-primary ring-3 ring-ring/50",
            className
          )}
          onClick={() => setOpen(!open)}
        >
          <span className={cn(!selectedOption && "text-muted-foreground")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>

        {open && (
          <div
            role="listbox"
            className={cn(
              "absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover p-1 shadow-lg",
              "animate-in fade-in-0 zoom-in-95 duration-150"
            )}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors duration-150 outline-none",
                  "hover:bg-accent hover:text-accent-foreground",
                  option.value === value && "text-primary font-medium"
                )}
                onClick={() => {
                  onValueChange?.(option.value)
                  setOpen(false)
                }}
              >
                <span className="size-4 shrink-0 flex items-center justify-center">
                  {option.value === value && <Check className="size-3.5" />}
                </span>
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }
)

Select.displayName = "Select"

export { Select }
export type { SelectOption }
