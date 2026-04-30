
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  label: string
  description?: string
}

interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: Step[]
  activeStep: number
  orientation?: "horizontal" | "vertical"
}

function Stepper({
  steps,
  activeStep,
  orientation = "horizontal",
  className,
  ...props
}: StepperProps) {
  return (
    <div
      data-slot="stepper"
      className={cn(
        "flex",
        orientation === "horizontal"
          ? "flex-row items-start gap-0"
          : "flex-col gap-0",
        className
      )}
      {...props}
    >
      {steps.map((step, i) => {
        const status =
          i < activeStep ? "completed" : i === activeStep ? "active" : "upcoming"

        return (
          <div
            key={i}
            className={cn(
              "flex",
              orientation === "horizontal"
                ? "flex-1 flex-col items-center"
                : "flex-row items-start"
            )}
          >
            <div
              className={cn(
                "flex items-center",
                orientation === "horizontal" ? "w-full" : "flex-col"
              )}
            >
              {/* Connector before */}
              {i > 0 && (
                <div
                  className={cn(
                    "transition-colors duration-200",
                    orientation === "horizontal"
                      ? "h-0.5 flex-1"
                      : "w-0.5 h-6",
                    i <= activeStep ? "bg-primary" : "bg-border"
                  )}
                />
              )}
              {i === 0 && orientation === "horizontal" && <div className="flex-1" />}

              {/* Step circle */}
              <span
                className={cn(
                  "inline-flex items-center justify-center shrink-0 rounded-full text-xs font-bold transition-all duration-200",
                  "size-8",
                  status === "completed" &&
                    "bg-primary text-primary-foreground",
                  status === "active" &&
                    "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  status === "upcoming" &&
                    "border-2 border-border bg-background text-muted-foreground"
                )}
              >
                {status === "completed" ? (
                  <Check className="size-4" strokeWidth={3} />
                ) : (
                  i + 1
                )}
              </span>

              {/* Connector after */}
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "transition-colors duration-200",
                    orientation === "horizontal"
                      ? "h-0.5 flex-1"
                      : "w-0.5 h-6",
                    i < activeStep ? "bg-primary" : "bg-border"
                  )}
                />
              )}
              {i === steps.length - 1 && orientation === "horizontal" && (
                <div className="flex-1" />
              )}
            </div>

            {/* Label */}
            <div
              className={cn(
                orientation === "horizontal"
                  ? "mt-2 text-center"
                  : "ml-3 pb-8",
                i === steps.length - 1 && orientation === "vertical" && "pb-0"
              )}
            >
              <p
                className={cn(
                  "text-xs font-medium transition-colors duration-200",
                  status === "upcoming"
                    ? "text-muted-foreground"
                    : "text-foreground"
                )}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="text-[0.65rem] text-muted-foreground mt-0.5">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { Stepper }
export type { Step }
