
import {
  forwardRef,
  useEffect,
  type ReactNode,
} from "react"
import { X } from "lucide-react"
import { FocusTrap } from "focus-trap-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/* ── Overlay ──────────────────────────────────────────────── */

function DialogOverlay({
  className,
  onClick,
}: {
  className?: string
  onClick?: () => void
}) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
        "animate-in fade-in-0 duration-200",
        className
      )}
      aria-hidden
      onClick={onClick}
    />
  )
}

/* ── Content panel ────────────────────────────────────────── */

const dialogContentVariants = cva(
  "fixed z-50 flex flex-col bg-card text-card-foreground shadow-xl border border-border animate-in fade-in-0 zoom-in-95 duration-200",
  {
    variants: {
      size: {
        sm: "w-[90vw] max-w-sm rounded-2xl",
        md: "w-[90vw] max-w-lg rounded-2xl",
        lg: "w-[90vw] max-w-2xl rounded-2xl",
        xl: "w-[90vw] max-w-4xl rounded-2xl",
        full: "w-screen h-screen rounded-none",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

interface DialogContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dialogContentVariants> {}

const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, size, children, ...props }, ref) => (
    <div
      ref={ref}
      role="dialog"
      aria-modal
      data-slot="dialog-content"
      className={cn(
        dialogContentVariants({ size }),
        size !== "full" &&
          "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-h-[85vh]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
DialogContent.displayName = "DialogContent"

/* ── Header / Footer / Body ───────────────────────────────── */

const DialogHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1 px-6 pt-6 pb-2", className)}
      {...props}
    />
  )
)
DialogHeader.displayName = "DialogHeader"

const DialogTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      data-slot="dialog-title"
      className={cn("text-lg font-semibold leading-tight text-foreground", className)}
      {...props}
    />
  )
)
DialogTitle.displayName = "DialogTitle"

const DialogDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
)
DialogDescription.displayName = "DialogDescription"

const DialogBody = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="dialog-body"
      className={cn("flex-1 overflow-y-auto px-6 py-4", className)}
      {...props}
    />
  )
)
DialogBody.displayName = "DialogBody"

const DialogFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="dialog-footer"
      className={cn("flex items-center justify-end gap-2 px-6 pb-6 pt-2", className)}
      {...props}
    />
  )
)
DialogFooter.displayName = "DialogFooter"

/* ── Close button ─────────────────────────────────────────── */

function DialogClose({
  className,
  onClose,
}: {
  className?: string
  onClose: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClose}
      className={cn(
        "absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:text-foreground transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
      aria-label="Close"
    >
      <X className="size-4" />
    </button>
  )
}

/* ── Root dialog ──────────────────────────────────────────── */

interface DialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  size?: VariantProps<typeof dialogContentVariants>["size"]
  className?: string
}

function Dialog({ open, onClose, children, size, className }: DialogProps) {
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKey)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <FocusTrap
      focusTrapOptions={{
        escapeDeactivates: false,
        clickOutsideDeactivates: true,
        allowOutsideClick: true,
        returnFocusOnDeactivate: true,
        fallbackFocus: '[data-slot="dialog-content"]',
      }}
    >
      <div>
        <DialogOverlay onClick={onClose} />
        <DialogContent size={size} className={className}>
          <DialogClose onClose={onClose} />
          {children}
        </DialogContent>
      </div>
    </FocusTrap>
  )
}

export {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogClose,
}
