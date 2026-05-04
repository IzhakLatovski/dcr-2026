
import { forwardRef } from "react"
import { Plus, Check, X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const addToggleButtonVariants = cva(
  "group/add-btn relative inline-flex shrink-0 items-center justify-center rounded-full border border-transparent outline-none select-none cursor-pointer transition-all duration-200 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:transition-all [&_svg]:duration-200",
  {
    variants: {
      size: {
        sm: "size-7 [&_svg]:size-3.5",
        md: "size-9 [&_svg]:size-4",
        lg: "size-11 [&_svg]:size-5",
      },
    },
    defaultVariants: { size: "md" },
  }
)

interface AddToggleButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick">,
    VariantProps<typeof addToggleButtonVariants> {
  /** Whether the item is currently in the user's plan */
  added: boolean
  /** Called when the user toggles the state */
  onToggle: () => void
  /** Accessible label — defaults adapt to the current state */
  label?: string
}

const AddToggleButton = forwardRef<HTMLButtonElement, AddToggleButtonProps>(
  ({ added, onToggle, label, size, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={added}
        aria-label={label ?? (added ? "Remove from plan" : "Add to plan")}
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className={cn(
          addToggleButtonVariants({ size }),
          added
            ? "bg-green-600/15 text-green-600 hover:bg-destructive/15 hover:text-destructive dark:bg-green-500/20 dark:text-green-400 dark:hover:bg-destructive/20 dark:hover:text-destructive"
            : "bg-primary/30 text-primary border-primary/30 hover:bg-primary/40 hover:scale-110",
          className
        )}
        {...props}
      >
        {added ? (
          <>
            {/* Check is shown by default, fades out on hover */}
            <Check className="absolute group-hover/add-btn:opacity-0 group-hover/add-btn:-rotate-90 group-hover/add-btn:scale-50" />
            {/* X fades in on hover, signalling "click to remove" */}
            <X className="absolute opacity-0 rotate-90 scale-50 group-hover/add-btn:opacity-100 group-hover/add-btn:rotate-0 group-hover/add-btn:scale-100" />
          </>
        ) : (
          <Plus className="group-hover/add-btn:rotate-90" />
        )}
      </button>
    )
  }
)

AddToggleButton.displayName = "AddToggleButton"

export { AddToggleButton, addToggleButtonVariants }
