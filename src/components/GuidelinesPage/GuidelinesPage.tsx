import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { guidelines } from '../../data/guidelines';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GuidelinesPageProps {
  focusId?: number | null;
  onFocusConsumed?: () => void;
}

export default function GuidelinesPage({ focusId, onFocusConsumed }: GuidelinesPageProps) {
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (focusId != null) {
      setOpenIds((prev) => new Set([...prev, focusId]));
      onFocusConsumed?.();
      requestAnimationFrame(() => {
        cardRefs.current[focusId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);

  const toggle = (id: number) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setOpenIds(new Set(guidelines.map((g) => g.id)));
  const collapseAll = () => setOpenIds(new Set());

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 h-full overflow-y-auto">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={expandAll}>
          Expand all
        </Button>
        <Button variant="outline" size="sm" onClick={collapseAll}>
          Collapse all
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {guidelines.map((section, idx) => {
          const isOpen = openIds.has(section.id);
          return (
            <div
              key={section.id}
              ref={(el) => {
                cardRefs.current[section.id] = el;
              }}
              className={cn(
                'rounded-2xl border bg-card overflow-hidden transition-all duration-200',
                isOpen ? 'border-primary/30 shadow-sm' : 'border-border',
              )}
            >
              <button
                type="button"
                onClick={() => toggle(section.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center gap-3 p-4 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
              >
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold tabular-nums">
                  {idx + 1}
                </span>
                <i className={cn(section.icon, 'text-base text-muted-foreground')} />
                <h3 className="flex-1 min-w-0 text-sm font-semibold text-foreground">
                  {section.title}
                </h3>
                <ChevronDown
                  className={cn(
                    'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                    isOpen && 'rotate-180',
                  )}
                />
              </button>
              {isOpen && (
                <div className="border-t border-border px-4 py-4 bg-muted/20">
                  <ul className="flex flex-col gap-2 text-sm text-foreground/90 leading-relaxed list-disc pl-5 marker:text-muted-foreground">
                    {section.points.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
