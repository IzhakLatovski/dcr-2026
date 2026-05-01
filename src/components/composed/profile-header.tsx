import { type ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ProfileHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Avatar element — image, initials, etc. */
  avatar?: ReactNode;
  /** Person name */
  name: string;
  /** Email or other identifier shown under the name */
  email?: string;
  /** Role badge / tags row (use Badge primitives) */
  badges?: ReactNode;
  /** Extra meta line (e.g. team leader, location) */
  meta?: ReactNode;
  /** Trailing slot — typically a level circle / stat */
  trailing?: ReactNode;
}

const ProfileHeader = forwardRef<HTMLDivElement, ProfileHeaderProps>(
  ({ avatar, name, email, badges, meta, trailing, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="profile-header"
        className={cn(
          "flex flex-col sm:flex-row gap-4 sm:gap-6 items-stretch sm:items-center justify-between",
          "rounded-3xl border border-border bg-card text-card-foreground shadow-sm p-5 sm:p-6",
          className,
        )}
        {...props}
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {avatar && <div className="shrink-0">{avatar}</div>}
          <div className="min-w-0 flex flex-col gap-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
              {name}
            </h2>
            {email && (
              <p className="text-sm text-muted-foreground truncate">{email}</p>
            )}
            {badges && <div className="mt-1 flex flex-wrap gap-1.5">{badges}</div>}
            {meta && <div className="mt-1 text-sm text-muted-foreground">{meta}</div>}
          </div>
        </div>
        {trailing && <div className="shrink-0">{trailing}</div>}
      </div>
    );
  },
);

ProfileHeader.displayName = "ProfileHeader";

export { ProfileHeader };
