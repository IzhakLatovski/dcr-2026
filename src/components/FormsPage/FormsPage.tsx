import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { forms } from '../../data/forms';
import type { FormItem } from '../../data/forms';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function FormsPage() {
  const [selectedForm, setSelectedForm] = useState<FormItem | null>(null);

  if (selectedForm) {
    return (
      <div className="flex flex-col gap-4 p-4 sm:p-6 h-full overflow-y-auto">
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => setSelectedForm(null)}
        >
          <ArrowLeft className="size-3.5" /> Back to Forms
        </Button>

        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 sm:p-6 text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary text-2xl">
            {selectedForm.icon}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {selectedForm.title}
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            {selectedForm.description}
          </p>
        </div>

        <div className="flex-1 min-h-[40rem] rounded-2xl border border-border overflow-hidden">
          <iframe
            src={selectedForm.googleFormUrl}
            className="size-full"
            title={selectedForm.title}
          >
            Loading Google Form...
          </iframe>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 h-full overflow-y-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {forms.map((form) => {
          const comingSoon = form.status === 'coming_soon';
          return (
            <button
              key={form.id}
              type="button"
              onClick={() => !comingSoon && setSelectedForm(form)}
              disabled={comingSoon}
              className={cn(
                'group/form relative flex flex-col gap-3 rounded-2xl border border-border bg-card text-left p-5 shadow-sm transition-all duration-200',
                'outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                comingSoon
                  ? 'opacity-60 cursor-not-allowed'
                  : 'hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30 cursor-pointer',
              )}
            >
              {comingSoon && (
                <Badge variant="secondary" size="sm" className="absolute top-3 right-3">
                  Coming Soon
                </Badge>
              )}
              <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary text-2xl">
                {form.icon}
              </span>
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                {form.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {form.description}
              </p>
              {comingSoon ? (
                <p className="mt-auto text-xs text-muted-foreground italic">
                  This form will be available soon
                </p>
              ) : (
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Open Form
                  <ArrowRight className="size-3.5 transition-transform duration-150 group-hover/form:translate-x-0.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
