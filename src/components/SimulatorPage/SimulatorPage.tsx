import { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  XCircle,
  ShieldCheck,
  Award,
  ArrowLeft,
  Send,
  Trash2,
  X,
  Paperclip,
  CheckCircle2,
  Circle,
  Lock,
  ArrowUpRight,
  ShoppingCart,
  Briefcase,
  Code2,
  Lightbulb,
  Users,
  Star,
  Plus,
  Coins,
  Medal,
} from 'lucide-react';
import type { CatalogItem, PlanStatus, CompletionStatus, ProofEntry } from '../../data/types';
import { levels } from '../../data/levels';
import { professionalism } from '../../data/catalog/professionalism';
import { ProofPanel } from '../ProofPanel/ProofPanel';
import { LevelSelector } from '@/components/composed/level-selector';
import { LevelProgressCard } from '@/components/composed/level-progress-card';
import { PillarProgressCard } from '@/components/composed/pillar-progress-card';
import { PlanItemRow } from '@/components/composed/plan-item-row';
import { MissingPanel, type MissingPanelItem } from '@/components/composed/missing-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

interface SimulatorPageProps {
  items: CatalogItem[];
  totalPoints: number;
  totalItems: number;
  onRemoveItem: (itemId: string) => void;
  onClearAll: () => void;
  onAddMissingItems?: (items: CatalogItem[]) => void;
  onOpenItem?: (item: CatalogItem) => void;
  selectedLevelId?: number;
  onSetSelectedLevel?: (levelId: number) => void;
  currentLevel?: number | null;
  planStatus?: PlanStatus;
  planSubmittedAt?: string;
  planRejectionReason?: string;
  onSubmitPlan?: () => Promise<void>;
  onWithdrawPlan?: () => Promise<void>;
  onWithdrawApproval?: () => Promise<void>;
  proofEntries?: Record<string, ProofEntry[]>;
  onAddProof?: (itemId: string, proof: ProofEntry) => Promise<void>;
  onDeleteProof?: (itemId: string, proofId: string) => Promise<void>;
  onUploadFileProof?: (itemId: string, file: File) => Promise<void>;
  uploadingItemIds?: Set<string>;
  completedItemKeys?: string[];
  completionStatus?: CompletionStatus;
  completionSubmittedAt?: string;
  completionRejectionReason?: string;
  completionRequirementsMet?: boolean;
  completionShortfalls?: string[];
  onToggleItemComplete?: (itemKey: string) => Promise<void>;
  onSubmitCompletedPlan?: () => Promise<void>;
  onWithdrawCompletedPlan?: () => Promise<void>;
  carryOverPoints?: number;
  carryOverLabel?: string;
  carriedItems?: CatalogItem[];
  carriedFromQuarter?: string;
}

const PILLAR_DEFS = [
  { key: 'professionalism', label: 'Professionalism', Icon: Briefcase, tint: 'success' as const },
  { key: 'tech', label: 'Tech', Icon: Code2, tint: 'primary' as const },
  { key: 'knowledge-unlock', label: 'Knowledge Unlock', Icon: Lightbulb, tint: 'violet' as const },
  { key: 'collaboration', label: 'Collaboration', Icon: Users, tint: 'pink' as const },
  { key: 'extra', label: 'Extra', Icon: Star, tint: 'muted' as const },
];

export default function SimulatorPage({
  items,
  totalPoints,
  totalItems,
  onRemoveItem,
  onClearAll,
  onAddMissingItems,
  onOpenItem,
  selectedLevelId: externalSelectedLevelId,
  onSetSelectedLevel,
  currentLevel,
  planStatus,
  planSubmittedAt,
  planRejectionReason,
  onSubmitPlan,
  onWithdrawPlan,
  onWithdrawApproval,
  proofEntries,
  onAddProof,
  onDeleteProof,
  onUploadFileProof,
  uploadingItemIds,
  completedItemKeys = [],
  completionStatus,
  completionSubmittedAt,
  completionRejectionReason,
  completionRequirementsMet: _completionRequirementsMet = false,
  completionShortfalls: _completionShortfalls = [],
  onToggleItemComplete,
  onSubmitCompletedPlan,
  onWithdrawCompletedPlan,
  carryOverPoints = 0,
  carryOverLabel,
  carriedItems,
  carriedFromQuarter,
}: SimulatorPageProps) {
  const isRealPlan = !!onSetSelectedLevel;
  const carriedPoints = useMemo(
    () => (carriedItems ?? []).reduce((sum, i) => sum + (i.promotedPoints ?? i.points), 0),
    [carriedItems],
  );
  const effectiveTotalPoints = totalPoints + carryOverPoints + carriedPoints;
  const isPending = planStatus === 'pending';
  const isApproved = planStatus === 'approved';
  const isRejected = planStatus === 'rejected';
  const hasProofSupport = !!onAddProof && isApproved;
  const hasCompletionSupport = isApproved && !!onToggleItemComplete;
  const isCompletionLocked =
    completionStatus === 'pending_review' ||
    completionStatus === 'admin_pending' ||
    completionStatus === 'level_up_approved';
  const isCompletionPending = completionStatus === 'pending_review';
  const isAdminPending = completionStatus === 'admin_pending';
  const isLevelUpApproved = completionStatus === 'level_up_approved';
  const isLevelUpRejected = completionStatus === 'level_up_rejected';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openProofItemKey, setOpenProofItemKey] = useState<string | null>(null);

  const [internalSelectedLevelId, setInternalSelectedLevelId] = useState<number>(() => {
    const saved = localStorage.getItem('dcr-selected-level');
    return saved ? parseInt(saved, 10) : 0;
  });

  const selectedLevelId = isRealPlan
    ? currentLevel != null && currentLevel < 10
      ? currentLevel + 1
      : 0
    : externalSelectedLevelId !== undefined
      ? externalSelectedLevelId
      : internalSelectedLevelId;

  const handleSetSelectedLevel = (levelId: number) => {
    if (onSetSelectedLevel) {
      onSetSelectedLevel(levelId);
    } else {
      setInternalSelectedLevelId(levelId);
    }
  };

  useEffect(() => {
    if (externalSelectedLevelId === undefined && !isRealPlan) {
      localStorage.setItem('dcr-selected-level', String(internalSelectedLevelId));
    }
  }, [internalSelectedLevelId, externalSelectedLevelId, isRealPlan]);

  // ── Requirements (heavy memo) ─────────────────────────────────────────────
  const requirementsStatus = useMemo(() => {
    if (selectedLevelId === 0) return null;

    const level = levels.find((l) => l.id === selectedLevelId);
    if (!level) return null;

    const itemIds = new Set([
      ...items.map((item) => item.id),
      ...(carriedItems ?? []).map((i) => i.id),
    ]);
    const missingMandatoryItems = level.mandatoryItems.filter((id) => !itemIds.has(id));
    const missingMandatoryNames = missingMandatoryItems
      .map((id) => professionalism.find((item) => item.id === id)?.name)
      .filter(Boolean) as string[];
    const hasAllMandatory = missingMandatoryItems.length === 0;

    const pillarStats = {
      professionalism: { items: 0, points: 0 },
      tech: { items: 0, points: 0 },
      'knowledge-unlock': { items: 0, points: 0 },
      collaboration: { items: 0, points: 0 },
    };

    items.forEach((item) => {
      const category = (item.category === 'roadmaps' ? 'tech' : item.category) as keyof typeof pillarStats;
      if (pillarStats[category]) {
        pillarStats[category].items++;
        pillarStats[category].points += item.promotedPoints ?? item.points;
      }
    });
    (carriedItems ?? []).forEach((item) => {
      const category = (item.category === 'roadmaps' ? 'tech' : item.category) as keyof typeof pillarStats;
      if (pillarStats[category]) {
        pillarStats[category].points += item.promotedPoints ?? item.points;
      }
    });

    const pillarStatus = {
      professionalism: {
        ...pillarStats.professionalism,
        required: level.mandatoryItems.length,
        met: hasAllMandatory,
        needed: missingMandatoryItems.length,
      },
      tech: {
        ...pillarStats.tech,
        required: level.pillarRequirements.tech,
        met: pillarStats.tech.points >= level.pillarRequirements.tech,
        needed: Math.max(0, level.pillarRequirements.tech - pillarStats.tech.points),
      },
      'knowledge-unlock': {
        ...pillarStats['knowledge-unlock'],
        required: level.pillarRequirements['knowledge-unlock'],
        met: pillarStats['knowledge-unlock'].points >= level.pillarRequirements['knowledge-unlock'],
        needed: Math.max(0, level.pillarRequirements['knowledge-unlock'] - pillarStats['knowledge-unlock'].points),
      },
      collaboration: {
        ...pillarStats.collaboration,
        required: level.pillarRequirements.collaboration,
        met: pillarStats.collaboration.points >= level.pillarRequirements.collaboration,
        needed: Math.max(0, level.pillarRequirements.collaboration - pillarStats.collaboration.points),
      },
    };

    const allPillarsMet = Object.values(pillarStatus).every((p) => p.met);
    const pointsNeeded = Math.max(0, level.points - effectiveTotalPoints);
    const hasEnoughPoints = effectiveTotalPoints >= level.points;
    const isComplete = hasEnoughPoints && hasAllMandatory && allPillarsMet;

    return {
      level,
      isComplete,
      hasEnoughPoints,
      hasAllMandatory,
      allPillarsMet,
      pointsNeeded,
      missingMandatoryItems,
      missingMandatoryNames,
      pillarStatus,
    };
  }, [selectedLevelId, items, effectiveTotalPoints, carriedItems]);

  // ── Completion stats (heavy memo) ─────────────────────────────────────────
  const completionStats = useMemo(() => {
    if (!hasCompletionSupport || !requirementsStatus) return null;
    const { level } = requirementsStatus;

    const completedItems = items.filter((item, idx) => {
      const key = item.planItemKey ?? `${item.id}-${idx}`;
      return completedItemKeys.includes(key);
    });
    const completedPts =
      completedItems.reduce((sum, i) => sum + (i.promotedPoints ?? i.points), 0) + carryOverPoints;

    const pillarPts: Record<string, number> = {
      professionalism: 0,
      tech: 0,
      'knowledge-unlock': 0,
      collaboration: 0,
    };
    completedItems.forEach((item) => {
      const cat = item.category === 'roadmaps' ? 'tech' : item.category;
      if (cat in pillarPts) pillarPts[cat] += item.promotedPoints ?? item.points;
    });

    const completedIds = completedItems.map((i) => i.id);
    const missingMandatory = level.mandatoryItems.filter((id) => !completedIds.includes(id));

    const shortfalls: string[] = [];
    if (completedPts < level.points)
      shortfalls.push(`Need ${level.points - completedPts} more pts (${completedPts}/${level.points})`);
    if (missingMandatory.length > 0)
      shortfalls.push(
        `${missingMandatory.length} mandatory item${missingMandatory.length > 1 ? 's' : ''} not marked complete`,
      );
    for (const [pillar, min] of Object.entries(level.pillarRequirements)) {
      const actual = pillarPts[pillar] ?? 0;
      if (actual < min) shortfalls.push(`${pillar}: ${actual}/${min} pts completed`);
    }

    const completedMandatoryCount = level.mandatoryItems.filter((id) =>
      completedItems.some((i) => i.id === id),
    ).length;

    return {
      completedPts,
      pillarPts,
      completedItemCount: completedItems.length,
      completedMandatoryCount,
      met: shortfalls.length === 0,
      shortfalls,
    };
  }, [hasCompletionSupport, requirementsStatus, items, completedItemKeys, carryOverPoints]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAddMissingItems = () => {
    if (!requirementsStatus || !onAddMissingItems) return;
    const missingItems = requirementsStatus.missingMandatoryItems
      .map((id) => professionalism.find((item) => item.id === id))
      .filter(Boolean) as CatalogItem[];
    if (missingItems.length > 0) onAddMissingItems(missingItems);
  };

  const handleSubmitPlan = async () => {
    if (!onSubmitPlan) return;
    if (requirementsStatus && !requirementsStatus.isComplete) {
      const shortfalls: string[] = [];
      if (!requirementsStatus.hasEnoughPoints)
        shortfalls.push(
          `• Need ${requirementsStatus.pointsNeeded} more total points (${effectiveTotalPoints}/${requirementsStatus.level.points})`,
        );
      if (!requirementsStatus.hasAllMandatory)
        shortfalls.push(`• Missing mandatory items: ${requirementsStatus.missingMandatoryNames.join(', ')}`);
      if (!requirementsStatus.pillarStatus.tech.met)
        shortfalls.push(`• Tech: need ${requirementsStatus.pillarStatus.tech.needed} more points`);
      if (!requirementsStatus.pillarStatus['knowledge-unlock'].met)
        shortfalls.push(
          `• Knowledge Unlock: need ${requirementsStatus.pillarStatus['knowledge-unlock'].needed} more points`,
        );
      if (!requirementsStatus.pillarStatus.collaboration.met)
        shortfalls.push(
          `• Collaboration: need ${requirementsStatus.pillarStatus.collaboration.needed} more points`,
        );

      const confirmed = window.confirm(
        `Your plan does not yet meet the requirements for ${requirementsStatus.level.label}:\n\n` +
          shortfalls.join('\n') +
          '\n\nYou can still submit, but your team leader will see that the plan is insufficient for a level-up.\n\n' +
          'Do you want to submit anyway?',
      );
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitPlan();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdrawPlan = async () => {
    if (!onWithdrawPlan) return;
    setIsSubmitting(true);
    try {
      await onWithdrawPlan();
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  // ── Build MissingPanel items ──────────────────────────────────────────────
  const missingItems: MissingPanelItem[] = [];
  if (requirementsStatus) {
    if (completionStats) {
      // Completion mode
      if (!completionStats.met) {
        completionStats.shortfalls.forEach((s) => {
          missingItems.push({ icon: <Circle />, label: s });
        });
      }
    } else {
      // Plan mode
      if (!requirementsStatus.hasEnoughPoints) {
        missingItems.push({
          icon: <Coins />,
          label: `Need ${requirementsStatus.pointsNeeded} more pts`,
          sub: `${effectiveTotalPoints} / ${requirementsStatus.level.points} total`,
        });
      }
      if (!requirementsStatus.hasAllMandatory) {
        missingItems.push({
          icon: <Briefcase />,
          label: 'Missing mandatory items',
          sub: requirementsStatus.missingMandatoryNames.join(', '),
        });
      }
      if (!requirementsStatus.pillarStatus.tech.met) {
        missingItems.push({
          icon: <Code2 />,
          label: `Tech: need ${requirementsStatus.pillarStatus.tech.needed} more pts`,
          sub: `${requirementsStatus.pillarStatus.tech.points} / ${requirementsStatus.pillarStatus.tech.required} pts`,
        });
      }
      if (!requirementsStatus.pillarStatus['knowledge-unlock'].met) {
        missingItems.push({
          icon: <Lightbulb />,
          label: `Knowledge: need ${requirementsStatus.pillarStatus['knowledge-unlock'].needed} more pts`,
          sub: `${requirementsStatus.pillarStatus['knowledge-unlock'].points} / ${requirementsStatus.pillarStatus['knowledge-unlock'].required} pts`,
        });
      }
      if (!requirementsStatus.pillarStatus.collaboration.met) {
        missingItems.push({
          icon: <Users />,
          label: `Collaboration: need ${requirementsStatus.pillarStatus.collaboration.needed} more pts`,
          sub: `${requirementsStatus.pillarStatus.collaboration.points} / ${requirementsStatus.pillarStatus.collaboration.required} pts`,
        });
      }
    }
  }

  // Status chip for the hero card
  const statusBadge =
    isRealPlan && isApproved && !isLevelUpApproved ? (
      <Badge variant="success" size="md">
        <CheckCircle2 className="size-3" /> Plan Approved
      </Badge>
    ) : isRealPlan && isLevelUpApproved ? (
      <Badge variant="primary" size="md">
        <Medal className="size-3" /> Level-Up Approved
      </Badge>
    ) : isRealPlan && (!planStatus || planStatus === 'draft') ? (
      <Badge variant="default" size="md">
        Draft
      </Badge>
    ) : null;

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 h-full overflow-y-auto">
      {/* ── Status banners ── */}
      {isRealPlan && isPending && (
        <StatusBanner
          tone="warning"
          icon={<Clock />}
          title="Awaiting Team Leader Approval"
          meta={planSubmittedAt && `Submitted ${formatDate(planSubmittedAt)}`}
          action={
            <Button variant="outline" size="sm" onClick={handleWithdrawPlan} disabled={isSubmitting}>
              <ArrowLeft className="size-3.5" /> {isSubmitting ? 'Withdrawing…' : 'Withdraw'}
            </Button>
          }
        />
      )}
      {isRealPlan && isRejected && (
        <StatusBanner
          tone="destructive"
          icon={<XCircle />}
          title="Plan Rejected"
          meta={planRejectionReason}
        />
      )}
      {isRealPlan && isCompletionPending && (
        <StatusBanner
          tone="warning"
          icon={<Clock />}
          title="Awaiting Level-Up Review"
          meta={completionSubmittedAt && `Sent for review ${formatDate(completionSubmittedAt)}`}
          action={
            <Button
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={async () => {
                if (!onWithdrawCompletedPlan) return;
                if (
                  !confirm(
                    'Withdraw your level-up submission?\n\nYour completed items will be kept, but your team leader will no longer see this review request. You can resubmit when ready.',
                  )
                )
                  return;
                setIsSubmitting(true);
                try {
                  await onWithdrawCompletedPlan();
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <ArrowLeft className="size-3.5" /> {isSubmitting ? 'Withdrawing…' : 'Withdraw'}
            </Button>
          }
        />
      )}
      {isRealPlan && isAdminPending && (
        <StatusBanner
          tone="primary"
          icon={<ShieldCheck />}
          title="Awaiting Admin Final Approval"
          meta="Your team leader recommended your level-up. An admin will finalize it shortly."
        />
      )}
      {isRealPlan && isLevelUpApproved && (
        <StatusBanner
          tone="success"
          icon={<Medal />}
          title="Level-Up Approved!"
          meta="Your level-up has been confirmed by an admin."
        />
      )}
      {isRealPlan && isLevelUpRejected && (
        <StatusBanner
          tone="destructive"
          icon={<XCircle />}
          title="Level-Up Review: Revision Needed"
          meta={completionRejectionReason}
        />
      )}

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-4">
        {/* ── Main column ── */}
        <div className="flex flex-col gap-4 min-w-0">
          {/* Hero level progress card */}
          <LevelProgressCard
            title="Your Learning Path"
            subtitle={
              isRealPlan && currentLevel != null
                ? `Track your progress toward Level ${currentLevel + 1}`
                : requirementsStatus
                  ? `Building toward ${requirementsStatus.level.label}`
                  : 'Add items from the catalog to build your plan'
            }
            statusBadge={statusBadge}
            currentLevel={isRealPlan ? currentLevel : undefined}
            targetLevel={requirementsStatus?.level}
            pointsBanked={effectiveTotalPoints}
            targetSelector={
              !isRealPlan ? (
                <LevelSelector
                  value={selectedLevelId}
                  onChange={handleSetSelectedLevel}
                  levels={levels.map((l) => ({ id: l.id, label: l.label, points: l.points }))}
                />
              ) : undefined
            }
            extras={
              (carryOverPoints > 0 || (isRealPlan && carriedPoints > 0)) && (
                <div className="flex flex-wrap gap-2">
                  {carryOverPoints > 0 && (
                    <Badge variant="primary" size="md">
                      +{carryOverPoints} prev. level
                    </Badge>
                  )}
                  {isRealPlan && carriedPoints > 0 && (
                    <Badge variant="warning" size="md">
                      +{carriedPoints} carried
                    </Badge>
                  )}
                </div>
              )
            }
          />

          {/* Pillar progress grid */}
          {requirementsStatus && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <PillarProgressCard
                icon={<Briefcase />}
                label="Professionalism"
                value={requirementsStatus.pillarStatus.professionalism.items}
                required={requirementsStatus.pillarStatus.professionalism.required}
                unit="items"
                tint="success"
                completed={completionStats?.completedMandatoryCount}
              />
              <PillarProgressCard
                icon={<Code2 />}
                label="Tech"
                value={requirementsStatus.pillarStatus.tech.points}
                required={requirementsStatus.pillarStatus.tech.required}
                unit="pts"
                tint="primary"
                completed={completionStats?.pillarPts.tech}
              />
              <PillarProgressCard
                icon={<Lightbulb />}
                label="Knowledge Unlock"
                value={requirementsStatus.pillarStatus['knowledge-unlock'].points}
                required={requirementsStatus.pillarStatus['knowledge-unlock'].required}
                unit="pts"
                tint="violet"
                completed={completionStats?.pillarPts['knowledge-unlock']}
              />
              <PillarProgressCard
                icon={<Users />}
                label="Collaboration"
                value={requirementsStatus.pillarStatus.collaboration.points}
                required={requirementsStatus.pillarStatus.collaboration.required}
                unit="pts"
                tint="pink"
                completed={completionStats?.pillarPts.collaboration}
              />
            </div>
          )}

          {/* Items list */}
          {totalItems === 0 && (carriedItems?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<ShoppingCart />}
              title="No items yet"
              description="Browse the catalog and add items to your learning path."
            />
          ) : (
            <div className="flex flex-col gap-4">
              {/* Carried items section */}
              {isRealPlan && (carriedItems?.length ?? 0) > 0 && (
                <PillarSection
                  Icon={Lock}
                  label={`Carried from ${carriedFromQuarter ?? 'previous quarter'}`}
                  pts={carriedPoints}
                >
                  {carriedItems!.map((item) => (
                    <PlanItemRow
                      key={item.id}
                      image={item.image}
                      imageFallback={<Award />}
                      title={item.name}
                      subtitle={`${item.promotedPoints ?? item.points} points`}
                      completed
                      actions={
                        <Badge variant="success" size="sm">
                          <CheckCircle2 className="size-3" /> Done
                        </Badge>
                      }
                    />
                  ))}
                </PillarSection>
              )}

              {/* Carryover points section */}
              {isRealPlan && carryOverPoints > 0 && (
                <PillarSection
                  Icon={ArrowUpRight}
                  label={carryOverLabel ?? 'Previous Level Points'}
                  pts={carryOverPoints}
                >
                  <PlanItemRow
                    imageFallback={<ArrowUpRight />}
                    title={carryOverLabel ?? 'Previous Level Points'}
                    subtitle={`${carryOverPoints.toLocaleString()} points`}
                    completed
                    actions={
                      <Badge variant="success" size="sm">
                        <CheckCircle2 className="size-3" /> Auto-completed
                      </Badge>
                    }
                  />
                </PillarSection>
              )}

              {/* Pillar groups */}
              {(() => {
                const indexedItems = items.map((item, globalIdx) => ({ item, globalIdx }));
                return PILLAR_DEFS.map(({ key, label, Icon }) => {
                  const pillarIndexedItems = indexedItems.filter(
                    ({ item }) => item.category === key || (key === 'tech' && item.category === 'roadmaps'),
                  );
                  if (pillarIndexedItems.length === 0) return null;
                  const pillarPoints = pillarIndexedItems.reduce(
                    (sum, { item }) => sum + (item.promotedPoints ?? item.points),
                    0,
                  );
                  return (
                    <PillarSection key={key} Icon={Icon} label={label} pts={pillarPoints}>
                      {pillarIndexedItems.map(({ item, globalIdx }) => {
                        const itemKey = item.planItemKey ?? `${item.id}-${globalIdx}`;
                        const isProofOpen = openProofItemKey === itemKey;
                        const itemProofCount = (proofEntries?.[itemKey] ?? []).length;
                        const isCompleted = completedItemKeys.includes(itemKey);

                        const actions: React.ReactNode[] = [];
                        if (hasProofSupport) {
                          actions.push(
                            <button
                              key="proof"
                              type="button"
                              onClick={() => setOpenProofItemKey(isProofOpen ? null : itemKey)}
                              title={isProofOpen ? 'Close attachments' : 'Add / view attachments'}
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-lg px-2 h-8 text-xs font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                isProofOpen
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground',
                              )}
                            >
                              <Paperclip className="size-3.5" />
                              {itemProofCount > 0 && (
                                <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-primary/20 text-[0.6rem] font-semibold tabular-nums">
                                  {itemProofCount}
                                </span>
                              )}
                            </button>,
                          );
                        }
                        if (hasCompletionSupport) {
                          actions.push(
                            <button
                              key="complete"
                              type="button"
                              onClick={() => {
                                if (!isCompletionLocked) onToggleItemComplete?.(itemKey);
                              }}
                              disabled={isCompletionLocked}
                              title={
                                isCompletionLocked
                                  ? 'Locked while under review'
                                  : isCompleted
                                    ? 'Mark as not completed'
                                    : 'Mark as completed'
                              }
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-lg px-2 h-8 text-xs font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none',
                                isCompleted
                                  ? 'bg-green-600/15 text-green-600 hover:bg-green-600/20 dark:bg-green-500/20 dark:text-green-400'
                                  : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground',
                              )}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="size-3.5" />
                              ) : (
                                <Circle className="size-3.5" />
                              )}
                              {isCompleted ? 'Done' : 'Complete'}
                            </button>,
                          );
                        }
                        if (!isPending && !isApproved) {
                          actions.push(
                            <button
                              key="remove"
                              type="button"
                              onClick={() => onRemoveItem(item.id)}
                              title="Remove item"
                              className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <X className="size-3.5" />
                            </button>,
                          );
                        }

                        return (
                          <div key={itemKey} className="flex flex-col gap-2">
                            <PlanItemRow
                              image={item.image}
                              imageFallback={<Award />}
                              title={item.name}
                              subtitle={`${item.promotedPoints ?? item.points} points`}
                              completed={isCompleted}
                              onSelect={onOpenItem ? () => onOpenItem(item) : undefined}
                              actions={actions}
                            />
                            {hasProofSupport && isProofOpen && (
                              <ProofPanel
                                itemId={itemKey}
                                itemName={item.name}
                                proofs={proofEntries?.[itemKey] ?? []}
                                isReadOnly={isPending || isCompletionPending}
                                isUploading={uploadingItemIds?.has(itemKey) ?? false}
                                onAddUrl={async (url) => {
                                  await onAddProof?.(itemKey, {
                                    id: crypto.randomUUID(),
                                    type: 'url',
                                    url,
                                    createdAt: new Date().toISOString(),
                                  });
                                }}
                                onAddNote={async (note) => {
                                  await onAddProof?.(itemKey, {
                                    id: crypto.randomUUID(),
                                    type: 'note',
                                    note,
                                    createdAt: new Date().toISOString(),
                                  });
                                }}
                                onAddFile={async (file) => {
                                  await onUploadFileProof?.(itemKey, file);
                                }}
                                onDelete={async (proofId) => {
                                  await onDeleteProof?.(itemKey, proofId);
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </PillarSection>
                  );
                });
              })()}
            </div>
          )}

          {/* Submit / Withdraw plan buttons */}
          {isRealPlan && onSubmitPlan && !isPending && !isApproved && (
            <Button
              variant="default"
              size="lg"
              onClick={handleSubmitPlan}
              disabled={totalItems === 0 || isSubmitting}
            >
              <Send className="size-4" />
              {isSubmitting
                ? 'Submitting…'
                : isRejected
                  ? 'Resubmit for Approval'
                  : 'Submit Plan for Approval'}
            </Button>
          )}

          {isApproved && onWithdrawApproval && (
            <Button
              variant="outline"
              size="lg"
              onClick={async () => {
                if (
                  !window.confirm(
                    'Withdraw the team leader approval?\n\nYour plan will go back to draft and you can edit items again. ' +
                      'You will need to resubmit for approval before working toward a level-up.\n\nContinue?',
                  )
                )
                  return;
                setIsSubmitting(true);
                try {
                  await onWithdrawApproval();
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
            >
              <ArrowLeft className="size-4" /> Withdraw Approval
            </Button>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="flex flex-col gap-4">
          {/* Action buttons */}
          {totalItems > 0 && !isPending && !isApproved && (
            <Button variant="outline" size="default" onClick={onClearAll}>
              <Trash2 className="size-3.5" /> Clear All
            </Button>
          )}

          {isRealPlan &&
            isApproved &&
            onSubmitCompletedPlan &&
            !isCompletionPending &&
            !isLevelUpApproved && (
              <Button
                variant="default"
                size="default"
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    await onSubmitCompletedPlan();
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={!completionStats?.met || isSubmitting}
                title={
                  !completionStats?.met
                    ? `Requirements not met: ${completionStats?.shortfalls[0] ?? 'Mark more items as completed'}`
                    : undefined
                }
              >
                <Send className="size-3.5" />
                {isSubmitting
                  ? 'Sending…'
                  : isLevelUpRejected
                    ? 'Resubmit Completed Plan'
                    : 'Send Completed Plan for Review'}
              </Button>
            )}

          {/* Missing / requirements panel */}
          {requirementsStatus && (
            <MissingPanel
              eyebrow={
                completionStats
                  ? completionStats.met
                    ? 'Ready to submit'
                    : 'Still needed to complete'
                  : requirementsStatus.isComplete
                    ? 'Ready for'
                    : 'Missing for'
              }
              title={requirementsStatus.level.label}
              items={missingItems}
              allMetMessage={
                completionStats
                  ? 'All items completed'
                  : 'All requirements met'
              }
              allMetSub={
                completionStats ? 'Ready to send for review' : 'Plan is ready to submit'
              }
              action={
                !completionStats &&
                !requirementsStatus.hasAllMandatory &&
                onAddMissingItems && (
                  <Button variant="outline" size="sm" onClick={handleAddMissingItems}>
                    <Plus className="size-3.5" /> Add Missing Mandatory
                  </Button>
                )
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Inline helpers ─────────────────────────────────────────── */

function StatusBanner({
  tone,
  icon,
  title,
  meta,
  action,
}: {
  tone: 'warning' | 'destructive' | 'primary' | 'success';
  icon: React.ReactNode;
  title: string;
  meta?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const toneStyles = {
    warning:
      'border-amber-500/30 bg-amber-500/5 [&_[data-icon]]:bg-amber-500/15 [&_[data-icon]]:text-amber-600 dark:[&_[data-icon]]:text-amber-400',
    destructive:
      'border-destructive/30 bg-destructive/5 [&_[data-icon]]:bg-destructive/15 [&_[data-icon]]:text-destructive',
    primary:
      'border-primary/30 bg-primary/5 [&_[data-icon]]:bg-primary/15 [&_[data-icon]]:text-primary',
    success:
      'border-green-600/30 bg-green-600/5 [&_[data-icon]]:bg-green-600/15 [&_[data-icon]]:text-green-600 dark:[&_[data-icon]]:text-green-400',
  };
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border px-4 py-3',
        toneStyles[tone],
      )}
    >
      <span
        data-icon
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl [&_svg]:size-4"
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0 flex flex-col">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        {meta && <span className="text-xs text-muted-foreground">{meta}</span>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function PillarSection({
  Icon,
  label,
  pts,
  children,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  pts: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-1">
        <Icon className="size-3.5 text-muted-foreground" />
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {pts.toLocaleString()} pts
        </span>
      </div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}
