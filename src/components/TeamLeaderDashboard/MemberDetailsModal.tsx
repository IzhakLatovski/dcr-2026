import { useState, type ReactNode } from 'react';
import {
  Activity,
  Award,
  ArrowRight,
  ArrowUpCircle,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Heart,
  History,
  Info,
  ListChecks,
  MonitorSmartphone,
  Newspaper,
  Pencil,
  Route,
  Shield,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react';
import { useAchievements } from '../../hooks/useAchievements';
import { usePlanHistory } from '../../hooks/usePlanHistory';
import { levels, MANDATORY_ITEM_IDS } from '../../data/levels';
import type { UserDocument, Achievement, PlanHistoryEntry, AchievedItem } from '../../data/types';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Dialog, DialogBody, DialogHeader } from '@/components/ui/dialog';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { StatCard, type IconTint } from '@/components/composed/stat-card';
import { cn } from '@/lib/utils';

type MemberWithUid = UserDocument & { uid: string };

interface MemberDetailsModalProps {
  member: MemberWithUid;
  onClose: () => void;
}

const PILLAR_ICON: Record<string, ReactNode> = {
  tech: <MonitorSmartphone className="size-3.5" />,
  professionalism: <Shield className="size-3.5" />,
  'knowledge-unlock': <Pencil className="size-3.5" />,
  collaboration: <Heart className="size-3.5" />,
  roadmaps: <Route className="size-3.5" />,
};

const PILLAR_LABEL: Record<string, string> = {
  tech: 'Tech',
  professionalism: 'Professionalism',
  'knowledge-unlock': 'Knowledge',
  collaboration: 'Collaboration',
  roadmaps: 'Roadmaps',
};

const PILLAR_ORDER = ['tech', 'knowledge-unlock', 'collaboration', 'professionalism', 'roadmaps'];

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function MemberDetailsModal({ member, onClose }: MemberDetailsModalProps) {
  const [showCertList, setShowCertList] = useState(false);
  const [expandedHistoryQuarter, setExpandedHistoryQuarter] = useState<string | null>(null);
  const { achievements, isLoading } = useAchievements(member.uid);
  const { planHistory, isLoading: histLoading } = usePlanHistory(member.uid);

  const planItems = member.plan?.items || [];
  const planStatus = member.plan?.planStatus;
  const targetLevel =
    member.plan?.selectedLevelId || (member.currentLevel != null ? member.currentLevel + 1 : null);
  const carryOverPoints = member.plan?.carryOverPoints ?? 0;
  const totalPoints =
    planItems.reduce((sum, item) => sum + (item.promotedPoints ?? item.points), 0) + carryOverPoints;

  const pillarPoints = { tech: 0, 'knowledge-unlock': 0, collaboration: 0 };
  for (const item of planItems) {
    const pts = item.promotedPoints ?? item.points;
    if (item.category === 'tech') pillarPoints.tech += pts;
    else if (item.category === 'knowledge-unlock') pillarPoints['knowledge-unlock'] += pts;
    else if (item.category === 'collaboration') pillarPoints.collaboration += pts;
  }

  const planItemIds = new Set(planItems.map((i) => i.id));
  const mandatoryStatus = MANDATORY_ITEM_IDS.map((id) => ({
    id,
    present: planItemIds.has(id),
    label: id
      .replace('prof-', '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()),
  }));

  const targetLevelData = targetLevel ? levels.find((l) => l.id === targetLevel) : null;

  const levelHistory = member.levelHistory ?? [];
  const lastLevelEntry = levelHistory.length > 0 ? levelHistory[levelHistory.length - 1] : null;

  const year2026Approved = achievements.filter(
    (a: Achievement) =>
      a.status === 'approved' &&
      a.quarter &&
      parseInt(a.quarter.split('-')[1]) >= 2026,
  );
  const historicalTechCerts: AchievedItem[] = (member.achieved?.items ?? []).filter(
    (a) => a.status === 'approved' && a.item.category === 'tech',
  );
  const quarterlyTechCerts = achievements.filter(
    (a: Achievement) => a.status === 'approved' && a.item.category === 'tech',
  );
  const approvedTechCerts: { key: string; item: Achievement['item']; quarter: string | null }[] = [
    ...quarterlyTechCerts.map((a: Achievement) => ({ key: a.id, item: a.item, quarter: a.quarter })),
    ...historicalTechCerts.map((a: AchievedItem, i: number) => ({ key: `hist-${a.itemId}-${i}`, item: a.item, quarter: null })),
  ];
  const yearStats = {
    points: year2026Approved.reduce(
      (s: number, a: Achievement) => s + (a.item.promotedPoints ?? a.item.points),
      0,
    ),
    certs: approvedTechCerts.length,
    magazineArticles: year2026Approved.filter((a: Achievement) => a.item.id === 'ku-article-magazine').length,
    externalArticles: year2026Approved.filter((a: Achievement) => a.item.id === 'ku-article-external').length,
    reviewer: year2026Approved.filter((a: Achievement) => a.item.id === 'col-peer-reviewer').length,
    reviewee: year2026Approved.filter((a: Achievement) => a.item.id === 'col-peer-reviewee').length,
  };

  const summaryStatItems: { icon: ReactNode; iconTint: IconTint; value: string; label: string; clickable?: boolean }[] = [
    { icon: <Trophy />, iconTint: 'primary', value: yearStats.points.toLocaleString(), label: 'Points earned' },
    { icon: <Award />, iconTint: 'success', value: String(yearStats.certs), label: 'Certifications', clickable: true },
    { icon: <Newspaper />, iconTint: 'warning', value: String(yearStats.magazineArticles), label: 'Magazine articles' },
    { icon: <FileText />, iconTint: 'muted', value: String(yearStats.externalArticles), label: 'External articles' },
    { icon: <Eye />, iconTint: 'primary', value: String(yearStats.reviewer), label: 'Code reviews done' },
    { icon: <Users />, iconTint: 'muted', value: String(yearStats.reviewee), label: 'Reviews received' },
  ];

  const planStatusBadge = (() => {
    if (planStatus === 'draft') return <Badge variant="default" size="md"><Pencil className="size-3" /> Draft</Badge>;
    if (planStatus === 'pending') return <Badge variant="warning" size="md"><Clock className="size-3" /> Pending approval</Badge>;
    if (planStatus === 'approved') return <Badge variant="success" size="md"><CheckCircle2 className="size-3" /> Approved</Badge>;
    if (planStatus === 'rejected') return <Badge variant="destructive" size="md"><XCircle className="size-3" /> Rejected</Badge>;
    return null;
  })();

  return (
    <Dialog open onClose={onClose} size="xl">
      <DialogHeader className="pr-12">
        <div className="flex items-center gap-4">
          <Avatar src={member.photoURL} name={member.displayName} size="lg" />
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground truncate">
              {member.displayName}
            </h2>
            <p className="text-sm text-muted-foreground truncate">{member.email}</p>
            {lastLevelEntry && (
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowUpCircle className="size-3.5" />
                At Level {lastLevelEntry.level} since{' '}
                {lastLevelEntry.quarter ??
                  new Date(lastLevelEntry.date).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
              </p>
            )}
          </div>
          <div className="shrink-0 flex flex-col items-center justify-center size-16 rounded-2xl bg-primary/10 text-primary">
            <span className="text-2xl font-bold tabular-nums leading-none">{member.currentLevel ?? '?'}</span>
            <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-primary/80 mt-0.5">Level</span>
          </div>
        </div>
      </DialogHeader>

      <DialogBody className="px-6 pb-6">
        <Tabs defaultValue="plan">
          <TabList className="w-full grid grid-cols-3 sm:inline-flex sm:w-auto">
            <Tab value="plan">
              <ListChecks className="size-4 mr-1.5" />
              Current Plan
              {planStatus === 'pending' && (
                <span className="ml-1.5 inline-block size-2 rounded-full bg-amber-500" />
              )}
            </Tab>
            <Tab value="plans">
              <History className="size-4 mr-1.5" />
              Plans History
              {planHistory.length > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">({planHistory.length})</span>
              )}
            </Tab>
            <Tab value="summary">
              <BarChart3 className="size-4 mr-1.5" />
              Summary
            </Tab>
          </TabList>

          <TabPanel value="plan" className="flex flex-col gap-4">
            {/* Level progression */}
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-muted/20 p-4">
              <div className="flex flex-col gap-1">
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">Current</span>
                <Badge variant="default" size="lg">Level {member.currentLevel ?? '?'}</Badge>
              </div>
              <ArrowRight className="size-4 text-muted-foreground" />
              <div className="flex flex-col gap-1">
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">Target</span>
                {targetLevel ? (
                  <Badge variant="primary" size="lg">Level {targetLevel}</Badge>
                ) : (
                  <Badge variant="outline" size="lg">—</Badge>
                )}
              </div>
              <div className="ml-auto flex items-center gap-2 flex-wrap">
                {planStatusBadge}
                {member.plan?.planSubmittedAt && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="size-3.5" />
                    {formatDate(member.plan.planSubmittedAt)}
                  </span>
                )}
              </div>
            </div>

            {/* Requirements panel */}
            {targetLevelData && planItems.length > 0 && (
              <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Activity className="size-4 text-muted-foreground" />
                  Level {targetLevelData.id} Requirements
                </h3>

                <RequirementRow
                  label="Total Points"
                  actual={totalPoints}
                  required={targetLevelData.points}
                />
                {carryOverPoints > 0 && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <ArrowUpCircle className="size-3.5" />
                    <span>Prev. level carry-over</span>
                    <span className="ml-auto tabular-nums font-semibold text-green-600 dark:text-green-400">
                      +{carryOverPoints}
                    </span>
                  </div>
                )}
                <RequirementRow
                  label="Tech"
                  icon={<MonitorSmartphone className="size-3.5" />}
                  actual={pillarPoints.tech}
                  required={targetLevelData.pillarRequirements.tech}
                />
                <RequirementRow
                  label="Knowledge"
                  icon={<Pencil className="size-3.5" />}
                  actual={pillarPoints['knowledge-unlock']}
                  required={targetLevelData.pillarRequirements['knowledge-unlock']}
                />
                <RequirementRow
                  label="Collaboration"
                  icon={<Heart className="size-3.5" />}
                  actual={pillarPoints.collaboration}
                  required={targetLevelData.pillarRequirements.collaboration}
                />

                <div className="mt-2 flex flex-col gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Shield className="size-3.5" />
                    Mandatory items
                  </span>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {mandatoryStatus.map(({ id, present, label }) => (
                      <li
                        key={id}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs',
                          present
                            ? 'bg-green-600/10 text-green-700 dark:text-green-400'
                            : 'bg-destructive/10 text-destructive',
                        )}
                      >
                        {present ? (
                          <CheckCircle2 className="size-3.5 shrink-0" />
                        ) : (
                          <XCircle className="size-3.5 shrink-0" />
                        )}
                        <span className="truncate">{label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Rejection reason */}
            {member.plan?.planRejectionReason && (
              <Alert variant="destructive" icon={<Info className="size-4" />} title="Rejection reason">
                {member.plan.planRejectionReason}
              </Alert>
            )}

            {/* Plan items list */}
            {planItems.length > 0 ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <ListChecks className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">Plan items</h3>
                  <Badge variant="secondary" size="sm">{planItems.length}</Badge>
                </div>
                {PILLAR_ORDER.filter((p) => planItems.some((i) => i.category === p)).map((pillar) => (
                  <div key={pillar} className="flex flex-col gap-1.5">
                    <div className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                      {PILLAR_ICON[pillar]}
                      {PILLAR_LABEL[pillar] ?? pillar}
                    </div>
                    <ul className="flex flex-col gap-1.5">
                      {planItems
                        .filter((i) => i.category === pillar)
                        .map((item, i) => (
                          <li
                            key={`${item.id}-${i}`}
                            className="flex items-center gap-2 rounded-xl border border-border bg-muted/10 px-3 py-2"
                          >
                            <span className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">
                              {item.name}
                            </span>
                            <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                              +{item.promotedPoints ?? item.points} pts
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Total: <span className="font-semibold text-foreground tabular-nums">{totalPoints} points</span>
                </p>
              </div>
            ) : (
              !planStatus && (
                <EmptyState
                  icon={<FileText />}
                  title="No plan submitted yet"
                />
              )
            )}
          </TabPanel>

          <TabPanel value="plans" className="flex flex-col gap-3">
            {histLoading ? (
              <LoadingRow label="Loading plan history…" />
            ) : planHistory.length === 0 ? (
              <EmptyState
                icon={<History />}
                title="No plan history yet"
                description="Submitted quarterly plans will appear here."
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {planHistory.map((entry: PlanHistoryEntry) => {
                  const isExpanded = expandedHistoryQuarter === entry.quarter;
                  const StatusIcon =
                    entry.status === 'approved'
                      ? CheckCircle2
                      : entry.status === 'rejected'
                        ? XCircle
                        : Clock;
                  const statusTone =
                    entry.status === 'approved'
                      ? 'text-green-600 dark:text-green-400'
                      : entry.status === 'rejected'
                        ? 'text-destructive'
                        : 'text-amber-600 dark:text-amber-400';

                  return (
                    <li
                      key={entry.quarter}
                      className={cn(
                        'rounded-2xl border bg-card overflow-hidden transition-all duration-200',
                        isExpanded ? 'border-primary/30 shadow-sm' : 'border-border',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedHistoryQuarter(isExpanded ? null : entry.quarter)}
                        className="w-full flex items-center gap-3 p-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
                      >
                        <span className={cn('inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted', statusTone)}>
                          <StatusIcon className="size-4" />
                        </span>

                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-foreground">{entry.quarter}</span>
                            {entry.levelAchieved && (
                              <Badge variant="success" size="sm">
                                <ArrowUpCircle className="size-3" />
                                Level {entry.levelAchieved}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{entry.items.length} items · {entry.totalPoints.toLocaleString()} pts</span>
                            {entry.resolvedAt && (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="size-3" />
                                {formatDate(entry.resolvedAt)}
                              </span>
                            )}
                          </div>
                          {entry.rejectionReason && !isExpanded && (
                            <p className="inline-flex items-center gap-1.5 text-xs text-destructive mt-1">
                              <Info className="size-3" />
                              {entry.rejectionReason}
                            </p>
                          )}
                        </div>

                        {isExpanded ? (
                          <ChevronUp className="size-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="border-t border-border p-3 space-y-3 bg-muted/20">
                          {entry.rejectionReason && (
                            <Alert variant="destructive" icon={<Info className="size-4" />}>
                              {entry.rejectionReason}
                            </Alert>
                          )}
                          <div className="flex flex-col gap-3">
                            {PILLAR_ORDER.filter((p) => entry.items.some((i) => i.category === p)).map((pillar) => (
                              <div key={pillar} className="flex flex-col gap-1.5">
                                <div className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                                  {PILLAR_ICON[pillar]}
                                  {PILLAR_LABEL[pillar] ?? pillar}
                                </div>
                                <ul className="flex flex-col gap-1">
                                  {entry.items
                                    .filter((i) => i.category === pillar)
                                    .map((item, idx) => {
                                      const pts = item.promotedPoints ?? item.points;
                                      return (
                                        <li
                                          key={`${item.id}-${idx}`}
                                          className="flex items-center gap-2 rounded-lg bg-card px-3 py-1.5 border border-border/60"
                                        >
                                          <span className="flex-1 min-w-0 text-sm text-foreground truncate">
                                            {item.name}
                                          </span>
                                          {pts > 0 && (
                                            <span className="text-xs font-semibold tabular-nums text-foreground">
                                              +{pts.toLocaleString()}
                                            </span>
                                          )}
                                        </li>
                                      );
                                    })}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </TabPanel>

          <TabPanel value="summary" className="flex flex-col gap-4">
            {isLoading ? (
              <LoadingRow label="Loading achievements…" />
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  2026 and on
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {summaryStatItems.map(({ icon, iconTint, value, label, clickable }) => (
                    <StatCard
                      key={label}
                      icon={icon}
                      iconTint={iconTint}
                      value={value}
                      label={label}
                      onClick={clickable ? () => setShowCertList((v) => !v) : undefined}
                    />
                  ))}
                </div>

                {showCertList && approvedTechCerts.length > 0 && (
                  <ul className="flex flex-col gap-1.5 rounded-2xl border border-border bg-muted/10 p-3">
                    {approvedTechCerts.map((c) => (
                      <li
                        key={c.key}
                        className="flex items-center gap-3 rounded-xl bg-card px-3 py-2 border border-border/60"
                      >
                        {c.item.image ? (
                          <img
                            src={c.item.image}
                            alt={c.item.name}
                            className="size-8 rounded-lg object-contain bg-muted/30 p-1"
                          />
                        ) : (
                          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground">
                            <Award className="size-4" />
                          </span>
                        )}
                        <span className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">
                          {c.item.name}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {c.quarter ?? 'Historical'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {showCertList && approvedTechCerts.length === 0 && (
                  <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <EyeOff className="size-4" />
                    No certifications recorded.
                  </p>
                )}

                {achievements.length === 0 && !isLoading && (
                  <EmptyState
                    icon={<BarChart3 />}
                    title="No achievements recorded yet"
                  />
                )}
              </>
            )}
          </TabPanel>
        </Tabs>
      </DialogBody>
    </Dialog>
  );
}

/* ── Helpers ────────────────────────────────────────────────────────── */

function progressVariant(actual: number, required: number): 'primary' | 'success' | 'warning' | 'default' {
  if (actual >= required) return 'success';
  if (actual >= required * 0.8) return 'warning';
  return 'default';
}

function progressTone(actual: number, required: number) {
  if (actual >= required) return 'text-green-600 dark:text-green-400';
  if (actual >= required * 0.8) return 'text-amber-600 dark:text-amber-400';
  return 'text-muted-foreground';
}

function RequirementRow({
  label,
  icon,
  actual,
  required,
}: {
  label: string;
  icon?: ReactNode;
  actual: number;
  required: number;
}) {
  return (
    <div className="grid grid-cols-[7rem_1fr_5rem] items-center gap-3">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground [&_svg]:size-3.5 [&_svg]:text-muted-foreground">
        {icon}
        {label}
      </span>
      <ProgressBar
        value={actual}
        max={required}
        size="sm"
        variant={progressVariant(actual, required)}
      />
      <span className={cn('text-xs font-semibold tabular-nums text-right', progressTone(actual, required))}>
        {actual} / {required}
      </span>
    </div>
  );
}

function LoadingRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-card p-12">
      <Circle className="size-5 text-muted-foreground animate-spin" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
