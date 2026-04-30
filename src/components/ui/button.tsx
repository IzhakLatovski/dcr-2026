
import React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:shadow-md hover:bg-primary/90 [a]:hover:bg-primary/80",
        outline:
          "border-border bg-card shadow-sm hover:shadow-md hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent aria-expanded:text-accent-foreground dark:border-input dark:bg-card dark:hover:bg-accent/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:shadow-md hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive shadow-sm hover:shadow-md hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 rounded-lg px-2 text-xs in-data-[slot=button-group]:rounded-xl has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-xl px-3 text-[0.8rem] in-data-[slot=button-group]:rounded-xl has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-9",
        "icon-xs":
          "size-6 rounded-lg in-data-[slot=button-group]:rounded-xl [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-xl in-data-[slot=button-group]:rounded-xl",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconSave() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  )
}

function IconInfo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconWarning() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function IconX() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={13} height={13} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z" />
    </svg>
  )
}

// ─── ActionButton ─────────────────────────────────────────────────────────────

const actionButtonConfig = {
  primary: {
    base: "bg-primary text-white",
    iconBorder: "border-white/25",
    defaultIcon: <IconSave />,
  },
  info: {
    base: "bg-blue-600 text-white",
    iconBorder: "border-white/30",
    defaultIcon: <IconInfo />,
  },
  success: {
    base: "bg-green-600 text-white",
    iconBorder: "border-white/30",
    defaultIcon: <IconCheck />,
  },
  warning: {
    base: "bg-amber-500 text-white",
    iconBorder: "border-white/30",
    defaultIcon: <IconWarning />,
  },
  destructive: {
    base: "bg-destructive text-white",
    iconBorder: "border-white/30",
    defaultIcon: <IconX />,
  },
  // kept for internal/shadcn use
  secondary: {
    base: "bg-secondary text-secondary-foreground",
    iconBorder: "border-secondary-foreground/20",
    defaultIcon: <IconSave />,
  },
  outline: {
    base: "bg-transparent border border-border text-foreground",
    iconBorder: "border-border",
    defaultIcon: <IconSave />,
  },
}

type ActionButtonVariant = keyof typeof actionButtonConfig

function ActionButton({
  className,
  children,
  icon,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode
  icon?: React.ReactNode
  variant?: ActionButtonVariant
}) {
  const config = actionButtonConfig[variant]
  const resolvedIcon = icon ?? config.defaultIcon

  return (
    <button
      className={cn(
        "group relative inline-flex items-center h-[46px] pl-5 pr-[52px] rounded-lg overflow-hidden",
        "cursor-pointer border-none shadow-sm",
        "outline-none select-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        "transition-[filter] duration-200 hover:brightness-110",
        config.base,
        className
      )}
      {...props}
    >
      <span className="font-semibold text-sm whitespace-nowrap transition-opacity duration-200 group-hover:opacity-0">
        {children}
      </span>

      <span
        className={cn(
          "absolute right-0 top-0 bottom-0 w-[44px]",
          "flex items-center justify-center",
          "border-l transition-all duration-200",
          "group-hover:w-full group-hover:border-l-0",
          "group-active:[&_svg]:scale-75",
          config.iconBorder
        )}
      >
        <span className="transition-transform duration-200">
          {resolvedIcon}
        </span>
      </span>
    </button>
  )
}

// Keep DeleteButton as a typed alias for convenience
function DeleteButton(props: Omit<React.ComponentProps<typeof ActionButton>, "variant" | "icon">) {
  return <ActionButton variant="destructive" {...props}>{props.children ?? "Delete"}</ActionButton>
}

export { Button, buttonVariants, ActionButton, DeleteButton }
