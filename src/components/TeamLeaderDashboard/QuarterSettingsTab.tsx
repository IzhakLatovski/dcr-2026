import { useState } from 'react';
import { CalendarClock, Lock, Unlock, Calendar, Info } from 'lucide-react';
import { useQuarterConfig } from '../../contexts/QuarterContext';
import { computeCurrentCalendarQuarter } from '../../utils/quarterUtils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function QuarterSettingsTab() {
  const { currentQuarter, isFrozen, setActiveQuarter } = useQuarterConfig();
  const [saving, setSaving] = useState(false);

  const calendarQuarter = computeCurrentCalendarQuarter();

  async function handleLock() {
    setSaving(true);
    try {
      await setActiveQuarter(calendarQuarter);
    } finally {
      setSaving(false);
    }
  }

  async function handleRelease() {
    if (!confirm(`Release the lock? Everyone will immediately move to ${calendarQuarter}.`)) return;
    setSaving(true);
    try {
      await setActiveQuarter(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl border border-border bg-card text-card-foreground shadow-sm p-5 sm:p-6 max-w-2xl">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary [&_svg]:size-5">
          <CalendarClock />
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Quarter Control
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Lock the active quarter so users can submit Q1 plans without being auto-transitioned when April starts.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Effective quarter
          </p>
          <p className="mt-1 text-base font-semibold text-foreground tabular-nums">
            {currentQuarter}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Calendar quarter
          </p>
          <p className="mt-1 text-base font-semibold text-foreground tabular-nums">
            {calendarQuarter}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Status
          </p>
          <div className="mt-1">
            {isFrozen ? (
              <Badge variant="warning" size="md">
                <Lock className="size-3" /> Locked
              </Badge>
            ) : (
              <Badge variant="success" size="md">
                <Calendar className="size-3" /> Calendar-driven
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5">
        {isFrozen ? (
          <Button variant="outline" size="default" onClick={handleRelease} disabled={saving}>
            <Unlock className="size-4" />
            {saving ? 'Releasing…' : `Release lock → ${calendarQuarter}`}
          </Button>
        ) : (
          <Button variant="default" size="default" onClick={handleLock} disabled={saving}>
            <Lock className="size-4" />
            {saving ? 'Locking…' : `Lock to ${calendarQuarter}`}
          </Button>
        )}
      </div>

      {isFrozen && calendarQuarter !== currentQuarter && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-foreground">
          <Info className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p>
            Calendar has moved to <strong>{calendarQuarter}</strong> but everyone still sees{' '}
            <strong>{currentQuarter}</strong>. Release the lock when you're ready to start the new quarter.
          </p>
        </div>
      )}
    </div>
  );
}
