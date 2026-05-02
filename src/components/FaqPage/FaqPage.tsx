import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Plus, Minus } from 'lucide-react';
import { faq } from '../../data/faq';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

interface FaqPageProps {
  focusId?: number | null;
  onFocusConsumed?: () => void;
}

export default function FaqPage({ focusId, onFocusConsumed }: FaqPageProps) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (focusId != null) {
      setSearch('');
      setOpenId(focusId);
      onFocusConsumed?.();
      requestAnimationFrame(() => {
        cardRefs.current[focusId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return faq;
    const q = search.toLowerCase();
    return faq.filter(
      (item) =>
        item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q),
    );
  }, [search]);

  const toggle = (id: number) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 h-full overflow-y-auto">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">FAQ</h1>
      <p className="text-sm text-muted-foreground">
        Find answers to common questions about the DCR program, requirements, and processes.
      </p>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions..."
          className="w-full h-10 rounded-xl border border-border bg-card pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all duration-200 focus:border-primary focus:ring-3 focus:ring-ring/30"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Search />}
          title="No questions match your search"
          description="Try different keywords."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                ref={(el) => {
                  cardRefs.current[item.id] = el;
                }}
                className={cn(
                  'rounded-2xl border bg-card overflow-hidden transition-all duration-200',
                  isOpen ? 'border-primary/30 shadow-sm' : 'border-border',
                )}
              >
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-start gap-3 p-4 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
                >
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                    Q
                  </span>
                  <h3 className="flex-1 min-w-0 text-sm font-semibold text-foreground leading-snug">
                    {item.question}
                  </h3>
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground [&_svg]:size-4">
                    {isOpen ? <Minus /> : <Plus />}
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-border px-4 py-4 flex items-start gap-3 bg-muted/20">
                    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-green-600/10 text-green-600 dark:text-green-400 text-xs font-bold">
                      A
                    </span>
                    <p className="flex-1 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
