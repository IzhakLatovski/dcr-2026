import { Select } from "@/components/ui/select";

export interface LevelOption {
  id: number;
  label: string;
  points: number;
}

interface LevelSelectorProps {
  /** Currently selected level id (0 = none) */
  value: number;
  /** Called with the new level id */
  onChange: (id: number) => void;
  /** Levels available */
  levels: LevelOption[];
  /** Placeholder shown when value is 0 / no level */
  placeholder?: string;
  /** Label for the "none" option (id=0) */
  noneLabel?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Stylized Select for picking a target level. Shows "Level N · X pts" labels.
 */
function LevelSelector({
  value,
  onChange,
  levels,
  placeholder = "Pick a level",
  noneLabel = "No level selected",
  disabled,
  className,
}: LevelSelectorProps) {
  const options = [
    { value: "0", label: noneLabel },
    ...levels.map((l) => ({
      value: String(l.id),
      label: `${l.label} · ${l.points.toLocaleString()} pts`,
    })),
  ];
  return (
    <Select
      options={options}
      value={String(value)}
      onValueChange={(v) => onChange(parseInt(v, 10))}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
}

export { LevelSelector };
