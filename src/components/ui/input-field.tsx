import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          ref={ref}
          required
          autoComplete="off"
          className={cn(
            "peer w-full rounded-2xl border-[1.5px] border-border bg-transparent px-4 py-4 text-base text-foreground outline-none",
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
    );
  }
);

InputField.displayName = "InputField";

export default InputField;
