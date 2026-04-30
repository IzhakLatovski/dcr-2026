
import { forwardRef } from "react"
import { cn } from "@/lib/utils"

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, className, ...props }, ref) => {
    if (label) {
      return (
        <div className="relative">
          <textarea
            ref={ref}
            required
            autoComplete="off"
            className={cn(
              "peer w-full resize-y rounded-2xl border-[1.5px] border-border bg-transparent px-4 pt-5 pb-3 text-base text-foreground outline-none min-h-[100px]",
              "transition-[border-color] duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]",
              "focus:border-primary valid:border-primary",
              className
            )}
            {...props}
          />
          <label
            className={cn(
              "pointer-events-none absolute left-[15px] top-0 text-muted-foreground",
              "translate-y-4 transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]",
              "peer-focus:-translate-y-1/2 peer-focus:scale-[0.8] peer-focus:bg-background peer-focus:px-[0.2em] peer-focus:text-primary",
              "peer-valid:-translate-y-1/2 peer-valid:scale-[0.8] peer-valid:bg-background peer-valid:px-[0.2em] peer-valid:text-primary"
            )}
          >
            {label}
          </label>
        </div>
      )
    }

    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full resize-y rounded-2xl border-[1.5px] border-border bg-transparent px-4 py-3 text-base text-foreground outline-none min-h-[100px]",
          "transition-[border-color] duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]",
          "placeholder:text-muted-foreground focus:border-primary",
          className
        )}
        {...props}
      />
    )
  }
)

Textarea.displayName = "Textarea"

export { Textarea }
