import { useState, useMemo } from 'react';
import {
  User,
  Trophy,
  Award,
  Newspaper,
  FileText,
  Eye,
  EyeOff,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ArrowUpRight,
  Briefcase,
  Computer,
  Edit3,
  Heart,
  Route,
  Star,
  ArrowRight,
  Route as JourneyIcon,
  BarChart3,
} from 'lucide-react';
import { useAchievements } from '../../hooks/useAchievements';
import { usePlanHistory } from '../../hooks/usePlanHistory';
import { useCurrentQuarter } from '../../contexts/QuarterContext';
import type {
  UserDocument,
  CatalogItem,
  AchievedItem,
  Achievement,
  AppNotification,
  PlanHistoryEntry,
  LevelHistoryEntry,
  PlanStatus,
} from '../../data/types';
import { ProfileHeader } from '@/components/composed/profile-header';
import { NotificationsSection } from '@/components/composed/notifications-section';
import { AchievementCard } from '@/components/composed/achievement-card';
import { ActivityFeed, type TimelineItemProps } from '@/components/composed/activity-feed';
import { SectionHeader } from '@/components/composed/section-header';
import { StatCard } from '@/components/composed/stat-card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface ProfilePageProps {
  profile: UserDocument | null;
  user: AuthUser | null;
  planStatus?: PlanStatus;
  planItems?: CatalogItem[];
  planTotalPoints?: number;
  planSelectedLevelId?: number | null;
  planSubmittedAt?: string;
  planRejectionReason?: string;
  planCarryOverPoints?: number;
  planCarryOverLabel?: string;
  notifications?: AppNotification[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onNavigate?: (id: string) => void;
}

const PILLAR_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  tech: Computer,
  professionalism: Briefcase,
  'knowledge-unlock': Edit3,
  collaboration: Heart,
  roadmaps: Route,
};

interface GalleryEntry {
  key: string;
  item: CatalogItem;
  status: string;
  completionDate: string;
  proofLink: string;
  quarter: string | null;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatMonthYear(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
}

function getQuartersBetween(startQuarter: string, endQuarter: string): string[] {
  const parseQ = (q: string) => {
    const [qPart, year] = q.split('-');
    return { q: parseInt(qPart.slice(1)), y: parseInt(year) };
  };
  const start = parseQ(startQuarter);
  const end = parseQ(endQuarter);
  const result: string[] = [];
  let { q, y } = start;
  while (y < end.y || (y === end.y && q <= end.q)) {
    result.push(`Q${q}-${y}`);
    q++;
    if (q > 4) {
      q = 1;
      y++;
    }
  }
  return result;
}

interface PlanDisplayRow {
  quarter: string;
  isCurrent: boolean;
  status: PlanStatus | 'draft' | 'none';
  items: CatalogItem[];
  completedItemKeys: string[];
  totalPoints: number;
  selectedLevelId: number | null;
  levelAchieved: number | null;
  submittedAt?: string;
  rejectionReason?: string;
  resolvedAt?: string;
  noData: boolean;
}

export default function ProfilePage({
  profile,
  user,
  planStatus,
  planItems,
  planTotalPoints,
  planSelectedLevelId,
  planSubmittedAt,
  planRejectionReason,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onNavigate,
}: ProfilePageProps) {
  const currentQuarter = useCurrentQuarter();
  const { achievements, isLoading: achLoading } = useAchievements(user?.email ?? null);
  const { planHistory, isLoading: histLoading } = usePlanHistory(user?.email ?? null);
  const [expandedQuarter, setExpandedQuarter] = useState<string | null>(null);
  const [showCertList, setShowCertList] = useState(false);

  const techCertEntries = useMemo<GalleryEntry[]>(() => {
    const histItems: AchievedItem[] = profile?.achieved?.items ?? [];
    const fromH: GalleryEntry[] = histItems
      .filter((a) => a.status === 'approved' && a.item.category === 'tech')
      .map((a, i) => ({
        key: `hist-${a.itemId}-${i}`,
        item: a.item,
        status: a.status,
        completionDate: a.completionDate,
        proofLink: a.proofLink,
        quarter: null,
      }));
    const fromQ: GalleryEntry[] = achievements
      .filter((a: Achievement) => a.status === 'approved' && a.item.category === 'tech')
      .map((a: Achievement) => ({
        key: a.id,
        item: a.item,
        status: a.status,
        completionDate: a.completionDate,
        proofLink: a.proofLink,
        quarter: a.quarter,
      }));
    return [...fromQ, ...fromH].sort(
      (a, b) => new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime(),
    );
  }, [profile?.achieved?.items, achievements]);

  const yearStats = useMemo(() => {
    const year2026 = achievements.filter(
      (a: Achievement) =>
        a.status === 'approved' && a.quarter && parseInt(a.quarter.split('-')[1]) >= 2026,
    );
    return {
      points: year2026.reduce(
        (sum: number, a: Achievement) => sum + (a.item.promotedPoints ?? a.item.points),
        0,
      ),
      certs: techCertEntries.length,
      magazineArticles: year2026.filter((a: Achievement) => a.item.id === 'ku-article-magazine').length,
      externalArticles: year2026.filter((a: Achievement) => a.item.id === 'ku-article-external').length,
      reviewer: year2026.filter((a: Achievement) => a.item.id === 'col-peer-reviewer').length,
      reviewee: year2026.filter((a: Achievement) => a.item.id === 'col-peer-reviewee').length,
    };
  }, [achievements, techCertEntries]);

  const quarterlyHistoryList = useMemo<PlanDisplayRow[]>(() => {
    const currentQ = currentQuarter;
    const startQ = 'Q1-2026';
    const parseQ = (q: string) => {
      const [qPart, year] = q.split('-');
      return parseInt(year) * 10 + parseInt(qPart.slice(1));
    };
    if (parseQ(currentQ) < parseQ(startQ)) return [];

    const allQuarters = getQuartersBetween(startQ, currentQ).reverse();
    const historyMap = new Map(planHistory.map((e: PlanHistoryEntry) => [e.quarter, e]));

    return allQuarters.map((q): PlanDisplayRow => {
      const isCurrent = q === currentQ;

      if (isCurrent) {
        const hasPlanItems = planStatus !== undefined && (planItems?.length ?? 0) > 0;
        if (!hasPlanItems) {
          return {
            quarter: q,
            isCurrent: true,
            status: 'none',
            items: [],
            completedItemKeys: [],
            totalPoints: 0,
            selectedLevelId: null,
            levelAchieved: null,
            noData: true,
          };
        }
        return {
          quarter: q,
          isCurrent: true,
          status: (planStatus ?? 'draft') as PlanDisplayRow['status'],
          items: planItems ?? [],
          completedItemKeys: profile?.plan?.completedItemKeys ?? [],
          totalPoints: planTotalPoints ?? 0,
          selectedLevelId: planSelectedLevelId ?? null,
          levelAchieved: profile?.plan?.levelAchievedOnApproval ?? null,
          submittedAt: planSubmittedAt,
          rejectionReason: planRejectionReason,
          noData: false,
        };
      }

      const entry = historyMap.get(q);
      if (!entry) {
        return {
          quarter: q,
          isCurrent: false,
          status: 'none',
          items: [],
          completedItemKeys: [],
          totalPoints: 0,
          selectedLevelId: null,
          levelAchieved: null,
          noData: true,
        };
      }
      return {
        quarter: q,
        isCurrent: false,
        status: entry.status,
        items: entry.items,
        completedItemKeys: entry.completedItemKeys ?? [],
        totalPoints: entry.totalPoints,
        selectedLevelId: entry.selectedLevelId ?? null,
        levelAchieved: entry.levelAchieved ?? null,
        submittedAt: entry.submittedAt,
        rejectionReason: entry.rejectionReason,
        resolvedAt: entry.resolvedAt,
        noData: false,
      };
    });
  }, [
    currentQuarter,
    planHistory,
    planStatus,
    planItems,
    planTotalPoints,
    planSelectedLevelId,
    planSubmittedAt,
    planRejectionReason,
    profile?.plan,
  ]);

  // ── Guard: not signed in ──
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <EmptyState
          icon={<User />}
          title="Sign in to view your profile"
          description="Your personal zone shows your progress, plan, and achievements."
        />
      </div>
    );
  }

  const role = profile?.role ?? 'employee';
  const roleBadge =
    role === 'admin' ? (
      <Badge variant="primary" size="md">
        Admin
      </Badge>
    ) : role === 'team_leader' ? (
      <Badge variant="primary" size="md">
        Team Leader
      </Badge>
    ) : (
      <Badge variant="secondary" size="md">
        Employee
      </Badge>
    );

  const yearStatItems = [
    { Icon: Trophy, value: yearStats.points.toLocaleString(), label: 'Points earned', tint: 'primary' as const },
    { Icon: Award, value: String(yearStats.certs), label: 'Certifications', tint: 'success' as const, isCerts: true },
    { Icon: Newspaper, value: String(yearStats.magazineArticles), label: 'Magazine articles', tint: 'warning' as const },
    { Icon: FileText, value: String(yearStats.externalArticles), label: 'External articles', tint: 'muted' as const },
    { Icon: Eye, value: String(yearStats.reviewer), label: 'Code reviews done', tint: 'primary' as const },
    { Icon: EyeOff, value: String(yearStats.reviewee), label: 'Reviews received', tint: 'muted' as const },
  ];

  // Career journey timeline
  const levelEntries: LevelHistoryEntry[] = profile?.levelHistory ?? [];
  const joinDate = profile?.joinedCompanyAt ?? profile?.createdAt;
  const timelineItems: TimelineItemProps[] = [];
  if (joinDate) {
    timelineItems.push({
      marker: <CheckCircle2 />,
      tone: 'success',
      title: 'Joined Develeap',
      date: formatMonthYear(joinDate),
    });
  }
  [...levelEntries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((entry) => {
      timelineItems.push({
        marker: <span className="text-xs font-bold">{entry.level}</span>,
        tone: 'primary',
        title: `Level ${entry.level}`,
        subtitle: entry.quarter ?? undefined,
        date: formatMonthYear(entry.date),
      });
    });
  timelineItems.push({
    marker: <Clock />,
    tone: 'muted',
    title: 'Today',
    date: formatMonthYear(new Date().toISOString()),
  });

  // Plan status badge
  const planStatusVariant =
    planStatus === 'approved'
      ? 'success'
      : planStatus === 'rejected'
        ? 'destructive'
        : planStatus === 'pending'
          ? 'warning'
          : 'default';
  const planStatusLabel =
    planStatus === 'approved'
      ? 'Approved'
      : planStatus === 'rejected'
        ? 'Rejected'
        : planStatus === 'pending'
          ? 'Pending'
          : 'Draft';

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 h-full overflow-y-auto">
      {/* ── Profile Header ── */}
      <ProfileHeader
        avatar={
          <div className="flex size-16 sm:size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary overflow-hidden">
            {profile?.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.displayName}
                className="size-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold">
                {getInitials(profile?.displayName ?? user.displayName)}
              </span>
            )}
          </div>
        }
        name={profile?.displayName ?? user.displayName ?? 'Unknown'}
        email={profile?.email ?? user.email ?? undefined}
        badges={roleBadge}
        meta={
          role === 'employee' && profile?.teamLeaderName ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="text-muted-foreground">TL:</span>
              <span className="font-semibold text-foreground">{profile.teamLeaderName}</span>
            </span>
          ) : undefined
        }
        trailing={
          <div className="flex flex-col items-center justify-center rounded-2xl bg-primary/10 text-primary px-6 py-3">
            <span className="text-3xl font-bold tracking-tight tabular-nums">
              {profile?.currentLevel ?? '—'}
            </span>
            <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-primary/80">
              Level
            </span>
          </div>
        }
      />

      {/* ── Certification Badges Strip ── */}
      {!achLoading && techCertEntries.length > 0 && (
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {techCertEntries.map((entry) => (
            <div
              key={entry.key}
              title={entry.item.name}
              className="shrink-0 inline-flex size-16 items-center justify-center rounded-2xl border border-border bg-card overflow-hidden p-2"
            >
              {entry.item.image ? (
                <img
                  src={entry.item.image}
                  alt={entry.item.name}
                  className="size-full object-contain"
                />
              ) : (
                <Award className="size-6 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Current Plan Status ── */}
      {planStatus !== undefined && (() => {
        const currentLevel = profile?.currentLevel ?? null;
        const targetLevelId =
          planSelectedLevelId != null && planSelectedLevelId > 0
            ? planSelectedLevelId
            : currentLevel != null
              ? currentLevel + 1
              : null;
        const itemCount = planItems?.length ?? 0;
        const planPts = planTotalPoints ?? 0;

        return (
          <div
            className={cn(
              'flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-200',
              onNavigate && 'cursor-pointer hover:border-primary/30 hover:shadow-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
            )}
            role={onNavigate ? 'button' : undefined}
            tabIndex={onNavigate ? 0 : undefined}
            onClick={onNavigate ? () => onNavigate('simulator') : undefined}
            onKeyDown={
              onNavigate
                ? (e) => e.key === 'Enter' && onNavigate('simulator')
                : undefined
            }
          >
            <Calendar className="size-5 text-muted-foreground shrink-0" />
            <span className="font-semibold text-foreground tabular-nums">
              {currentQuarter}
            </span>
            <span className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
              <span>
                {itemCount} item{itemCount !== 1 ? 's' : ''} · {planPts.toLocaleString()} pts
              </span>
              {targetLevelId != null && (
                <>
                  <ArrowRight className="size-3.5" />
                  <span>Level {targetLevelId}</span>
                </>
              )}
            </span>
            <Badge variant={planStatusVariant} size="md" className="ml-auto">
              {planStatusLabel}
            </Badge>
            {onNavigate && (
              <ArrowUpRight className="size-4 text-muted-foreground shrink-0" />
            )}
          </div>
        );
      })()}

      {planStatus === 'rejected' && planRejectionReason && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">{planRejectionReason}</p>
        </div>
      )}

      {/* ── Notifications ── */}
      {notifications && onMarkNotificationRead && onMarkAllNotificationsRead && (
        <NotificationsSection
          notifications={notifications}
          onMarkRead={onMarkNotificationRead}
          onMarkAllRead={onMarkAllNotificationsRead}
        />
      )}

      {/* ── 2026 Stats Summary ── */}
      <section className="flex flex-col gap-3">
        <SectionHeader
          icon={<BarChart3 />}
          title="Summary"
          subtitle="2026 and on"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {yearStatItems.map(({ Icon, value, label, tint, isCerts }) => (
            <StatCard
              key={label}
              icon={<Icon />}
              iconTint={tint}
              value={value}
              label={label}
              onClick={isCerts ? () => setShowCertList((v) => !v) : undefined}
              sub={isCerts ? (showCertList ? 'Hide list' : 'View list') : undefined}
            />
          ))}
        </div>
        {showCertList && techCertEntries.length > 0 && (
          <div className="flex flex-col gap-2">
            {techCertEntries.map((entry) => (
              <AchievementCard
                key={entry.key}
                image={entry.item.image}
                icon={<Award />}
                title={entry.item.name}
                subtitle={entry.item.subcategory ?? undefined}
                quarter={entry.quarter ?? 'Historical'}
                date={formatDate(entry.completionDate)}
                hideStatus
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Career Journey ── */}
      {(joinDate || levelEntries.length > 0) && (
        <section className="flex flex-col gap-3">
          <SectionHeader icon={<JourneyIcon />} title="Career Journey" />
          <div className="rounded-2xl border border-border bg-card p-5">
            <ActivityFeed items={timelineItems} />
          </div>
        </section>
      )}

      {/* ── Quarterly Plan History ── */}
      <section className="flex flex-col gap-3">
        <SectionHeader
          icon={<History />}
          title="Quarterly History"
          subtitle="Plan history from Q1 2026 onwards. Current quarter plan is managed in the Plan page."
          action={
            quarterlyHistoryList.length > 0 ? (
              <Badge variant="secondary" size="md">
                {quarterlyHistoryList.length}
              </Badge>
            ) : undefined
          }
        />
        {histLoading ? (
          <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Loading history…
          </div>
        ) : quarterlyHistoryList.length === 0 ? (
          <EmptyState
            icon={<Calendar />}
            title="No completed quarters yet"
            description="History will appear here at the end of Q1 2026."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {quarterlyHistoryList.map((row) => (
              <QuarterHistoryRow
                key={row.quarter}
                row={row}
                isExpanded={expandedQuarter === row.quarter}
                onToggle={() =>
                  setExpandedQuarter(expandedQuarter === row.quarter ? null : row.quarter)
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ── Quarter history row ────────────────────────────────────── */

function QuarterHistoryRow({
  row,
  isExpanded,
  onToggle,
}: {
  row: PlanDisplayRow;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  if (row.noData) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-3">
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-3.5">
          <Calendar />
        </span>
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {row.quarter}
        </span>
        <span className="text-xs text-muted-foreground">No plan submitted</span>
      </div>
    );
  }

  const StatusIcon =
    row.status === 'approved'
      ? CheckCircle2
      : row.status === 'rejected'
        ? XCircle
        : Clock;
  const statusTint =
    row.status === 'approved'
      ? 'bg-green-600/15 text-green-600 dark:text-green-400'
      : row.status === 'rejected'
        ? 'bg-destructive/15 text-destructive'
        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400';

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 text-left transition-colors duration-150 hover:bg-accent outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
      >
        <span
          className={cn(
            'inline-flex size-8 items-center justify-center rounded-full [&_svg]:size-4',
            statusTint,
          )}
        >
          <StatusIcon />
        </span>
        <span className="font-semibold text-foreground tabular-nums">
          {row.quarter}
        </span>
        {row.levelAchieved && (
          <Badge variant="primary" size="sm">
            <ArrowRight className="size-3" /> Level {row.levelAchieved}
          </Badge>
        )}
        <span className="text-xs text-muted-foreground">
          {row.items.length} items · {row.totalPoints.toLocaleString()} pts
        </span>
        {row.resolvedAt && (
          <span className="ml-auto text-xs text-muted-foreground">
            {formatDate(row.resolvedAt)}
          </span>
        )}
        {isExpanded ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>
      {row.rejectionReason && !isExpanded && (
        <div className="flex items-start gap-2 px-3 pb-3 text-xs text-destructive">
          <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
          {row.rejectionReason}
        </div>
      )}
      {isExpanded && (
        <div className="border-t border-border p-3 space-y-2">
          {row.rejectionReason && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-foreground">
              <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
              {row.rejectionReason}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            {row.items.map((item, i) => {
              const pts = item.promotedPoints ?? item.points;
              const PIcon = PILLAR_ICON[item.category] ?? Star;
              return (
                <div
                  key={`${item.id}-${i}`}
                  className="flex items-center gap-3 rounded-xl bg-muted/30 px-3 py-2"
                >
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-card overflow-hidden [&_svg]:size-4 [&_svg]:text-muted-foreground">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="size-full object-contain p-0.5"
                      />
                    ) : (
                      <PIcon />
                    )}
                  </span>
                  <span className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">
                    {item.name}
                  </span>
                  {pts > 0 && (
                    <span className="text-sm font-semibold text-foreground tabular-nums">
                      +{pts.toLocaleString()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
