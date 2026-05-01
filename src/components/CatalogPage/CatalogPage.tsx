import { useState, useMemo, useEffect, useCallback } from 'react';
import { Award, ListChecks, GitBranch, ArrowRight, ExternalLink, Plus, ShieldCheck, RefreshCw } from 'lucide-react';
import type { CatalogItem, CertificationItem, RoadmapItem, RoadmapCert } from '../../data/types';
import type { AuthUser } from '../../hooks/useAuth';
import { SKILL_TAGS, PROVIDER_TAGS, type CatalogTag } from '../../data/catalog/tags';
import { CatalogToolbar } from '@/components/composed/catalog-toolbar';
import { CatalogCard } from '@/components/composed/catalog-card';
import { ItemDetail, type ItemDetailDetailSpec } from '@/components/composed/item-detail';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import ItemComments from './ItemComments';

type SortOption = 'category' | 'points-desc' | 'points-asc';
type ViewMode = 'grid' | 'list';

const SORT_OPTIONS = [
  { value: 'category', label: 'Category Order' },
  { value: 'points-desc', label: 'Points: High to Low' },
  { value: 'points-asc', label: 'Points: Low to High' },
];

const ALL_TAGS_BY_ID = new Map<string, CatalogTag>(
  [...SKILL_TAGS, ...PROVIDER_TAGS].map((t) => [t.id, t]),
);

interface CatalogPageProps {
  items: CatalogItem[];
  onToggleItem: (item: CatalogItem) => void;
  isInCart: (itemId: string) => boolean;
  getQuantity?: (itemId: string) => number;
  onAddItem?: (item: CatalogItem) => void;
  onRemoveItem?: (itemId: string) => void;
  isAchieved?: (itemId: string) => boolean;
  getPlanItemStatus?: (itemId: string) => 'pending' | 'approved' | undefined;
  onAddAllRequired?: () => void;
  hasRequired?: boolean;
  openItemId?: string | null;
  onOpenItemConsumed?: () => void;
  onNavigateToCert?: (certId: string, roadmapId: string, roadmapName: string) => void;
  modalBackNav?: { label: string; onClick: () => void };
  authUser?: AuthUser | null;
}

export default function CatalogPage({
  items,
  onToggleItem,
  isInCart,
  getQuantity,
  onAddItem,
  onRemoveItem,
  isAchieved,
  getPlanItemStatus,
  onAddAllRequired,
  hasRequired,
  openItemId,
  onOpenItemConsumed,
  onNavigateToCert,
  modalBackNav,
  authUser,
}: CatalogPageProps) {
  const [sort, setSort] = useState<SortOption>('category');
  const [view, setView] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [hideAchieved, setHideAchieved] = useState(false);

  const toggleTag = useCallback((id: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const closeModal = useCallback(() => {
    setSelectedItem(null);
    modalBackNav?.onClick();
  }, [modalBackNav]);

  useEffect(() => {
    if (!openItemId) return;
    const item = items.find((i) => i.id === openItemId);
    if (item) setSelectedItem(item);
    onOpenItemConsumed?.();
  }, [openItemId, items, onOpenItemConsumed]);

  const hasTags = useMemo(() => items.some((item) => item.tags && item.tags.length > 0), [items]);

  const achievedCount = useMemo(
    () => items.filter((item) => isAchieved?.(item.id)).length,
    [items, isAchieved],
  );

  const filtered = useMemo(() => {
    let result = items;
    if (hideAchieved) {
      result = result.filter((item) => !isAchieved?.(item.id));
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(lower) ||
          item.subcategory?.toLowerCase().includes(lower),
      );
    }
    if (selectedTags.size > 0) {
      result = result.filter((item) => item.tags?.some((t) => selectedTags.has(t)));
    }
    return result;
  }, [items, search, selectedTags, hideAchieved, isAchieved]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    switch (sort) {
      case 'points-desc':
        return copy.sort((a, b) => (b.promotedPoints ?? b.points) - (a.promotedPoints ?? a.points));
      case 'points-asc':
        return copy.sort((a, b) => (a.promotedPoints ?? a.points) - (b.promotedPoints ?? b.points));
      default:
        return copy;
    }
  }, [filtered, sort]);

  const allRequiredInCart =
    hasRequired && items.filter((i) => i.required).every((i) => isInCart(i.id));

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 h-full overflow-y-auto">
      <CatalogToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search items..."
        sortValue={sort}
        onSortChange={(v) => setSort(v as SortOption)}
        sortOptions={SORT_OPTIONS}
        view={view}
        onViewChange={setView}
        sticky
      />

      {/* Achieved + Add Required row */}
      {(achievedCount > 0 || (hasRequired && onAddAllRequired && !allRequiredInCart)) && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {achievedCount > 0 ? (
            <button
              type="button"
              onClick={() => setHideAchieved((v) => !v)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border h-7 px-3 text-xs font-medium transition-all duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                hideAchieved
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {hideAchieved ? `${achievedCount} hidden` : `${achievedCount} achieved`}
            </button>
          ) : <span />}

          {hasRequired && onAddAllRequired && !allRequiredInCart && (
            <Button variant="default" size="sm" onClick={onAddAllRequired}>
              <Plus className="size-3.5" /> Add Required
            </Button>
          )}
        </div>
      )}

      {/* Filter pill groups */}
      {hasTags && (
        <div className="flex flex-col gap-2">
          <FilterPillGroup
            label="Topic"
            tags={SKILL_TAGS}
            activeIds={selectedTags}
            onToggle={toggleTag}
          />
          <FilterPillGroup
            label="Provider"
            tags={PROVIDER_TAGS}
            activeIds={selectedTags}
            onToggle={toggleTag}
          />
          {selectedTags.size > 0 && (
            <button
              type="button"
              onClick={() => setSelectedTags(new Set())}
              className="self-start inline-flex items-center gap-1 rounded-lg px-2 h-7 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {sorted.length === 0 ? (
        <EmptyState
          title={search ? `No items match "${search}"` : 'No items'}
          description={search ? undefined : 'Try clearing filters or selecting another category.'}
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sorted.map((item) => (
            <CatalogCardForItem
              key={item.id}
              item={item}
              inCart={isInCart(item.id)}
              achieved={isAchieved?.(item.id) ?? false}
              planStatus={getPlanItemStatus?.(item.id)}
              quantity={getQuantity?.(item.id) ?? 0}
              onToggleItem={onToggleItem}
              onAddItem={onAddItem}
              onRemoveItem={onRemoveItem}
              onSelect={setSelectedItem}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {sorted.map((item) => (
            <CatalogListRow
              key={item.id}
              item={item}
              inCart={isInCart(item.id)}
              achieved={isAchieved?.(item.id) ?? false}
              planStatus={getPlanItemStatus?.(item.id)}
              quantity={getQuantity?.(item.id) ?? 0}
              onToggleItem={onToggleItem}
              onAddItem={onAddItem}
              onRemoveItem={onRemoveItem}
              onSelect={setSelectedItem}
            />
          ))}
        </div>
      )}

      {/* Detail dialog */}
      {selectedItem && (
        <ItemDetailDialog
          item={selectedItem}
          onClose={closeModal}
          isInCart={isInCart}
          getQuantity={getQuantity}
          getPlanItemStatus={getPlanItemStatus}
          isAchieved={isAchieved}
          onToggleItem={onToggleItem}
          onAddItem={onAddItem}
          onRemoveItem={onRemoveItem}
          onNavigateToCert={onNavigateToCert}
          modalBackNav={modalBackNav}
          authUser={authUser}
        />
      )}
    </div>
  );
}

/* ── Filter pill group ───────────────────────────────────────── */

function FilterPillGroup({
  label,
  tags,
  activeIds,
  onToggle,
}: {
  label: string;
  tags: CatalogTag[];
  activeIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="hidden sm:inline-block shrink-0 w-16 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div
        role="group"
        aria-label={`${label} filters`}
        className="flex-1 flex items-center gap-1.5 overflow-x-auto -mx-1 px-1 py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tags.map((tag) => {
          const active = activeIds.has(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(tag.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border h-7 px-3 text-xs font-medium transition-all duration-200 outline-none cursor-pointer',
                'focus-visible:ring-3 focus-visible:ring-ring/50',
                active
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                  : 'border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <i className={cn(tag.icon, 'text-[0.875rem]', !active && 'opacity-80')} />
              {tag.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Per-item card wrapper ───────────────────────────────────── */

interface ItemRowProps {
  item: CatalogItem;
  inCart: boolean;
  achieved: boolean;
  planStatus?: 'pending' | 'approved';
  quantity: number;
  onToggleItem: (item: CatalogItem) => void;
  onAddItem?: (item: CatalogItem) => void;
  onRemoveItem?: (itemId: string) => void;
  onSelect: (item: CatalogItem) => void;
}

function CatalogCardForItem({
  item,
  inCart,
  achieved,
  planStatus,
  quantity,
  onToggleItem,
  onAddItem,
  onRemoveItem,
  onSelect,
}: ItemRowProps) {
  const isLocked = planStatus === 'pending' || planStatus === 'approved' || achieved;
  const repeatable = !!item.repeatable;
  const cert = item.category === 'tech' ? (item as CertificationItem) : null;

  // For locked items, show as "added" but block toggle.
  // For repeatable items in locked state, switch to binary mode (no stepper) so the user can't change quantity.
  const showAsAdded = isLocked ? true : inCart;
  const showQuantity = repeatable && !isLocked;

  const handleToggleAdd = () => {
    if (isLocked) return;
    onToggleItem(item);
  };

  const handleQuantityChange = (newQty: number) => {
    if (isLocked) return;
    if (!onAddItem || !onRemoveItem) return;
    if (newQty > quantity) onAddItem(item);
    else if (newQty < quantity) onRemoveItem(item.id);
  };

  return (
    <CatalogCard
      title={item.name}
      provider={cert?.provider ?? item.subcategory}
      image={item.image}
      imageFallback={<Award />}
      points={item.points}
      bonus={item.promoted ? item.promotedPoints : undefined}
      added={showAsAdded}
      onToggleAdd={handleToggleAdd}
      quantity={showQuantity ? quantity : undefined}
      onQuantityChange={showQuantity ? handleQuantityChange : undefined}
      onSelect={() => onSelect(item)}
      statusSlot={
        <>
          {achieved && (
            <Badge variant="success" size="sm">
              Achieved
            </Badge>
          )}
          {!achieved && planStatus === 'pending' && (
            <Badge variant="warning" size="sm">
              TL Approval
            </Badge>
          )}
          {!achieved && planStatus === 'approved' && (
            <Badge variant="primary" size="sm">
              This Q
            </Badge>
          )}
          {!achieved && !planStatus && inCart && (
            <Badge variant="default" size="sm">
              In plan
            </Badge>
          )}
        </>
      }
      badgeSlot={
        !achieved ? (
          <>
            {item.required && (
              <Badge variant="destructive" size="sm">
                Required
              </Badge>
            )}
            {item.promoted && !item.required && (
              <Badge variant="primary" size="sm">
                Promoted
              </Badge>
            )}
          </>
        ) : null
      }
    />
  );
}

/* ── List view row ──────────────────────────────────────────── */

function CatalogListRow({
  item,
  inCart,
  achieved,
  planStatus,
  quantity,
  onToggleItem,
  onAddItem,
  onRemoveItem,
  onSelect,
}: ItemRowProps) {
  const isPendingPlan = planStatus === 'pending';
  const isApprovedPlan = planStatus === 'approved';
  const isLocked = isPendingPlan || isApprovedPlan;
  const repeatable = !!item.repeatable;
  const unitPoints = item.promotedPoints ?? item.points;

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={cn(
        'group/list-row flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 text-left transition-all duration-200',
        'hover:border-primary/30 hover:shadow-sm hover:bg-card',
        'outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        achieved && 'border-green-600/30 bg-green-600/5',
        isPendingPlan && 'border-amber-500/30 bg-amber-500/5',
        isApprovedPlan && 'border-primary/30 bg-primary/5',
        !isLocked && !achieved && inCart && 'border-primary/20 bg-primary/5',
      )}
    >
      {/* Trailing action lives on the LEFT for visual scanability with name */}
      <div onClick={(e) => e.stopPropagation()} className="shrink-0">
        {achieved ? (
          <span
            className="inline-flex size-9 items-center justify-center rounded-full bg-green-600/15 text-green-600"
            title="Already achieved"
          >
            <i className="ri-checkbox-circle-fill" />
          </span>
        ) : isPendingPlan ? (
          <span
            className="inline-flex size-9 items-center justify-center rounded-full bg-amber-500/15 text-amber-600"
            title="Waiting for team leader approval"
          >
            <i className="ri-user-line" />
          </span>
        ) : isApprovedPlan ? (
          <span
            className="inline-flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary"
            title="Locked in approved plan"
          >
            <i className="ri-time-line" />
          </span>
        ) : repeatable && onAddItem && onRemoveItem ? (
          quantity > 0 ? (
            <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-1.5 py-1">
              <button
                type="button"
                className="inline-flex size-6 items-center justify-center rounded-full hover:bg-primary/15"
                onClick={() => onRemoveItem(item.id)}
                title="Remove one"
              >
                <i className="ri-subtract-line" />
              </button>
              <span className="min-w-5 text-center text-xs font-semibold tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                className="inline-flex size-6 items-center justify-center rounded-full hover:bg-primary/15"
                onClick={() => onAddItem(item)}
                title="Add one more"
              >
                <i className="ri-add-line" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => onAddItem(item)}
              title="Add to plan"
            >
              <i className="ri-add-line" />
            </button>
          )
        ) : (
          <button
            type="button"
            className={cn(
              'inline-flex size-9 items-center justify-center rounded-full transition-colors',
              inCart
                ? 'bg-green-600/15 text-green-600 hover:bg-destructive/15 hover:text-destructive'
                : 'bg-primary text-primary-foreground hover:bg-primary/90',
            )}
            onClick={() => onToggleItem(item)}
            title={inCart ? 'Remove from plan' : 'Add to plan'}
          >
            <i className={inCart ? 'ri-check-line' : 'ri-add-line'} />
          </button>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground truncate">
          {item.name}
        </span>
        {item.subcategory && (
          <span className="text-xs text-muted-foreground truncate">
            {item.subcategory}
          </span>
        )}
      </div>

      <div className="hidden sm:flex items-center gap-1.5 shrink-0">
        {achieved && (
          <Badge variant="success" size="sm">
            Achieved
          </Badge>
        )}
        {!achieved && item.required && (
          <Badge variant="destructive" size="sm">
            Required
          </Badge>
        )}
        {!achieved && item.promoted && !item.required && (
          <Badge variant="primary" size="sm">
            Promoted
          </Badge>
        )}
      </div>

      <div className="shrink-0 flex items-baseline gap-1 tabular-nums">
        {item.promoted && item.promotedPoints ? (
          <>
            <span className="text-xs text-muted-foreground line-through">
              {item.points}
            </span>
            <span className="text-sm font-semibold text-primary">
              {item.promotedPoints}
            </span>
          </>
        ) : (
          <span className="text-sm font-semibold text-foreground">
            {unitPoints}
          </span>
        )}
        <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
          pts
        </span>
      </div>
    </button>
  );
}

/* ── Detail dialog ──────────────────────────────────────────── */

interface ItemDetailDialogProps {
  item: CatalogItem;
  onClose: () => void;
  isInCart: (itemId: string) => boolean;
  getQuantity?: (itemId: string) => number;
  getPlanItemStatus?: (itemId: string) => 'pending' | 'approved' | undefined;
  isAchieved?: (itemId: string) => boolean;
  onToggleItem: (item: CatalogItem) => void;
  onAddItem?: (item: CatalogItem) => void;
  onRemoveItem?: (itemId: string) => void;
  onNavigateToCert?: (certId: string, roadmapId: string, roadmapName: string) => void;
  modalBackNav?: { label: string; onClick: () => void };
  authUser?: AuthUser | null;
}

function ItemDetailDialog({
  item,
  onClose,
  isInCart,
  getQuantity,
  getPlanItemStatus,
  isAchieved,
  onToggleItem,
  onAddItem,
  onRemoveItem,
  onNavigateToCert,
  modalBackNav,
  authUser,
}: ItemDetailDialogProps) {
  const cert = item.category === 'tech' ? (item as CertificationItem) : null;
  const roadmap = item.category === 'roadmaps' ? (item as RoadmapItem) : null;
  const inCart = isInCart(item.id);
  const achieved = isAchieved?.(item.id) ?? false;
  const planStatus = getPlanItemStatus?.(item.id);
  const isLocked = planStatus === 'pending' || planStatus === 'approved' || achieved;
  const repeatable = !!item.repeatable;
  const quantity = getQuantity?.(item.id) ?? 0;

  // Resolve tags for ItemDetail
  const tags = (item.tags ?? [])
    .map((id) => ALL_TAGS_BY_ID.get(id))
    .filter((t): t is CatalogTag => !!t)
    .map((t) => ({
      id: t.id,
      label: t.label,
      icon: <i className={t.icon} />,
    }));

  // Resolve status badges (top-right of image)
  const badges: { label: string; variant: 'success' | 'warning' | 'primary' | 'destructive' | 'default' }[] = [];
  if (achieved) badges.push({ label: 'Achieved', variant: 'success' });
  else if (planStatus === 'pending') badges.push({ label: 'TL Approval', variant: 'warning' });
  else if (planStatus === 'approved') badges.push({ label: 'This Q', variant: 'primary' });
  else if (inCart) badges.push({ label: 'In plan', variant: 'default' });
  if (!achieved && item.required) badges.push({ label: 'Required', variant: 'destructive' });
  if (!achieved && item.promoted && !item.required) badges.push({ label: 'Promoted', variant: 'primary' });

  // Cert exam details → ItemDetail.details
  const details: ItemDetailDetailSpec[] = [];
  if (cert) {
    if (cert.examCode) details.push({ label: 'Exam Code', value: <span className="font-mono">{cert.examCode}</span> });
    if (cert.price !== undefined) details.push({ label: 'Price', value: cert.price === 0 ? 'Free' : `$${cert.price} USD` });
    if (cert.duration) details.push({ label: 'Duration', value: cert.duration });
    if (cert.questions) details.push({ label: 'Questions', value: cert.questions });
    if (cert.passingScore) details.push({ label: 'Passing Score', value: cert.passingScore });
    if (cert.validity) details.push({ label: 'Validity', value: cert.validity });
    if (cert.proctored !== undefined) details.push({ label: 'Proctored', value: cert.proctored ? 'Yes' : 'No' });
    if (cert.questionType) details.push({ label: 'Question Type', value: cert.questionType, full: true });
    if (cert.prerequisites)
      details.push({
        label: 'Prerequisites',
        value: cert.prerequisites,
        icon: <ShieldCheck />,
        full: true,
      });
    if (cert.retakePolicy)
      details.push({
        label: 'Retake Policy',
        value: cert.retakePolicy,
        icon: <RefreshCw />,
        full: true,
      });
  }

  const handleToggleAdd = () => {
    if (isLocked) return;
    onToggleItem(item);
  };

  const handleQuantityChange = (newQty: number) => {
    if (isLocked) return;
    if (!onAddItem || !onRemoveItem) return;
    if (newQty > quantity) onAddItem(item);
    else if (newQty < quantity) onRemoveItem(item.id);
  };

  const showAsAdded = isLocked ? true : inCart;
  const showQuantity = repeatable && !isLocked;

  return (
    <Dialog
      open={true}
      onClose={onClose}
      size="lg"
      className="!max-w-4xl overflow-y-auto"
    >
      <ItemDetail
        title={item.name}
        provider={cert?.provider ?? item.subcategory}
        image={item.image}
        imageFallback={<Award />}
        points={item.points}
        bonus={item.promoted ? item.promotedPoints : undefined}
        description={item.description}
        tags={tags}
        badges={badges}
        details={details}
        added={showAsAdded}
        onToggleAdd={handleToggleAdd}
        quantity={showQuantity ? quantity : undefined}
        onQuantityChange={showQuantity ? handleQuantityChange : undefined}
        backLabel={modalBackNav?.label}
        onBack={modalBackNav ? () => { onClose(); } : undefined}
      />

      {/* Roadmap required certifications */}
      {roadmap?.requiredCerts && roadmap.requiredCerts.length > 0 && (
        <RoadmapCertsSection
          roadmap={roadmap}
          onNavigateToCert={(certId) => {
            onClose();
            onNavigateToCert?.(certId, item.id, item.name);
          }}
        />
      )}

      {/* External links */}
      {item.links && item.links.length > 0 && (
        <section className="mx-auto w-full max-w-5xl px-4 sm:px-6 pb-6 sm:pb-8 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Links
          </h2>
          <div className="flex flex-wrap gap-2">
            {item.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 h-10 text-sm font-medium text-foreground hover:border-primary/30 hover:bg-accent transition-all duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <ExternalLink className="size-4" />
                {link.label}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Cert exam page link */}
      {cert?.examUrl && (
        <section className="mx-auto w-full max-w-5xl px-4 sm:px-6 pb-6 sm:pb-8">
          <a
            href={cert.examUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 h-10 text-sm font-semibold hover:bg-primary/90 transition-all duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            View Official Exam Page
            <ArrowRight className="size-4" />
          </a>
        </section>
      )}

      {/* Item comments (tech only) */}
      {item.category === 'tech' && (
        <section className="mx-auto w-full max-w-5xl px-4 sm:px-6 pb-8">
          <ItemComments itemId={item.id} authUser={authUser ?? null} />
        </section>
      )}
    </Dialog>
  );
}

/* ── Roadmap certs section (with choice-group support) ───────── */

function RoadmapCertsSection({
  roadmap,
  onNavigateToCert,
}: {
  roadmap: RoadmapItem;
  onNavigateToCert: (certId: string) => void;
}) {
  type CertSlot =
    | { type: 'single'; cert: RoadmapCert }
    | { type: 'choice'; group: string; certs: RoadmapCert[] };

  const certSlots: CertSlot[] = [];
  const seenGroups = new Set<string>();
  for (const rc of roadmap.requiredCerts ?? []) {
    if (rc.choiceGroup) {
      if (!seenGroups.has(rc.choiceGroup)) {
        seenGroups.add(rc.choiceGroup);
        certSlots.push({
          type: 'choice',
          group: rc.choiceGroup,
          certs: roadmap.requiredCerts!.filter((c) => c.choiceGroup === rc.choiceGroup),
        });
      }
    } else {
      certSlots.push({ type: 'single', cert: rc });
    }
  }

  const hasChoices = certSlots.some((s) => s.type === 'choice');
  const minPoints = certSlots.reduce(
    (sum, slot) =>
      sum +
      (slot.type === 'single' ? slot.cert.points : Math.min(...slot.certs.map((c) => c.points))),
    0,
  );
  const maxPoints = certSlots.reduce(
    (sum, slot) =>
      sum +
      (slot.type === 'single' ? slot.cert.points : Math.max(...slot.certs.map((c) => c.points))),
    0,
  );

  const renderCertRow = (rc: RoadmapCert) => (
    <button
      key={rc.id}
      type="button"
      onClick={() => onNavigateToCert(rc.id)}
      className="group/cert-row flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 text-left transition-all duration-200 hover:border-primary/30 hover:bg-accent outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {rc.image ? (
        <img
          src={rc.image}
          alt={rc.name}
          className="size-10 rounded-lg object-contain bg-muted/30 p-1"
        />
      ) : (
        <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-5">
          <Award />
        </span>
      )}
      <span className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">
        {rc.name}
      </span>
      <span className="shrink-0 text-sm font-semibold text-foreground tabular-nums">
        {rc.points} pts
      </span>
      <ArrowRight className="size-4 text-muted-foreground transition-transform duration-150 group-hover/cert-row:translate-x-0.5" />
    </button>
  );

  return (
    <section className="mx-auto w-full max-w-5xl px-4 sm:px-6 pb-6 sm:pb-8 space-y-3">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <ListChecks className="size-3.5" />
        Required Certifications ({certSlots.length})
      </h2>
      <div className="flex flex-col gap-2">
        {certSlots.map((slot) => {
          if (slot.type === 'single') return renderCertRow(slot.cert);
          return (
            <div
              key={slot.group}
              className="rounded-2xl border border-dashed border-border p-3 space-y-2 bg-muted/30"
            >
              <div className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                <GitBranch className="size-3.5" />
                Pick one
              </div>
              {slot.certs.map((c, i) => (
                <div key={c.id} className="space-y-2">
                  {i > 0 && (
                    <div className="flex items-center gap-2 my-1">
                      <span className="flex-1 h-px bg-border" />
                      <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                        OR
                      </span>
                      <span className="flex-1 h-px bg-border" />
                    </div>
                  )}
                  {renderCertRow(c)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div className="flex items-baseline justify-between rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
        <strong className="text-sm font-semibold text-foreground">Total Points</strong>
        <span className="text-sm tabular-nums text-foreground">
          {hasChoices && minPoints !== maxPoints
            ? `(${minPoints}–${maxPoints})`
            : maxPoints}{' '}
          + <span className="font-semibold text-primary">{roadmap.points}</span> roadmap badge
        </span>
      </div>
    </section>
  );
}
