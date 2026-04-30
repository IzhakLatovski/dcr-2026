
import { forwardRef } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground select-none overflow-hidden",
  {
    variants: {
      size: {
        xs: "size-6 text-[0.6rem]",
        sm: "size-8 text-xs",
        md: "size-10 text-sm",
        lg: "size-12 text-base",
        xl: "size-16 text-lg",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const statusDotVariants = cva(
  "absolute block rounded-full border-2 border-background",
  {
    variants: {
      status: {
        online: "bg-green-500",
        offline: "bg-muted-foreground/40",
        busy: "bg-destructive",
        away: "bg-amber-500",
      },
      size: {
        xs: "size-2 right-0 bottom-0",
        sm: "size-2.5 right-0 bottom-0",
        md: "size-3 right-0 bottom-0",
        lg: "size-3.5 right-0.5 bottom-0.5",
        xl: "size-4 right-0.5 bottom-0.5",
      },
    },
    defaultVariants: {
      status: "online",
      size: "md",
    },
  }
)

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

interface AvatarProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof avatarVariants> {
  src?: string | null
  alt?: string
  name?: string
  status?: "online" | "offline" | "busy" | "away"
}

const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  ({ className, size, src, alt, name, status, ...props }, ref) => {
    return (
      <span
        ref={ref}
        data-slot="avatar"
        className={cn(avatarVariants({ size, className }))}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt || name || "Avatar"}
            className="size-full object-cover"
          />
        ) : (
          <span aria-hidden>{name ? getInitials(name) : "?"}</span>
        )}
        {status && (
          <span
            data-slot="avatar-status"
            className={cn(statusDotVariants({ status, size }))}
          />
        )}
      </span>
    )
  }
)

Avatar.displayName = "Avatar"

export { Avatar }
