import { useMemo } from 'react';
import {
  ShoppingCart,
  BarChart2,
  FileEdit,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  FlaskConical,
  Disc,
  Megaphone,
  LayoutGrid,
  Sparkles,
  Gift,
  Trophy,
  Rocket,
  ShieldCheck,
  Computer,
  Heart,
  Edit3,
  Route,
  Award,
  ArrowRight,
  Star,
  AlertTriangle,
} from 'lucide-react';
import { useAchievements } from '../../hooks/useAchievements';
import { useCurrentQuarter, useQuarterConfig } from '../../contexts/QuarterContext';
import { professionalism } from '../../data/catalog/professionalism';
import { tech } from '../../data/catalog/tech';
import { knowledge } from '../../data/catalog/knowledge';
import { collaboration } from '../../data/catalog/collaboration';
import { levels, MANDATORY_ITEM_IDS } from '../../data/levels';
import { portalNews } from '../../data/portalNews';
import type { UserDocument, CatalogItem, PlanStatus, Achievement } from '../../data/types';
import { HeroBanner } from '@/components/composed/hero-banner';
import { StatCard } from '@/components/composed/stat-card';
import { NewsCard, type NewsType } from '@/components/composed/news-card';
import { SectionHeader } from '@/components/composed/section-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface HomePageProps {
  user: AuthUser | null;
  profile: UserDocument | null;
  cartItems: CatalogItem[];
  cartTotalPoints: number;
  planStatus?: PlanStatus;
  isSimulatorMode: boolean;
  useRealPlan: boolean;
  carryOverPoints: number;
  onNavigate: (id: string, label: string) => void;
}

// ── Module-level constants ────────────────────────────────────────────────────

const ALL_PROMOTED = [
  ...tech.filter((i) => i.promoted),
  ...knowledge.filter((i) => i.promoted),
  ...collaboration.filter((i) => i.promoted),
];

const PILLAR_REQS = { tech: 50, 'knowledge-unlock': 20, collaboration: 30 } as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getDaysRemainingInQuarter(quarter: string): number {
  const parts = quarter.split('-');
  const q = parseInt(parts[0].slice(1));
  const year = parseInt(parts[1]);
  const end = new Date(year, q * 3, 0);
  return Math.max(0, Math.ceil((end.getTime() - new Date().getTime()) / 86400000));
}

function getGreeting(name: string | null | undefined): string {
  const hour = new Date().getHours();
  const first = name?.split(' ')[0] ?? 'there';
  if (hour < 12) return `Good morning, ${first}`;
  if (hour < 17) return `Good afternoon, ${first}`;
  return `Good evening, ${first}`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

const PILLAR_CFG: Record<string, { Icon: React.ComponentType<{ className?: string }>; tint: string; label: string }> = {
  tech: { Icon: Computer, tint: 'bg-primary/10 text-primary', label: 'Tech' },
  professionalism: { Icon: ShieldCheck, tint: 'bg-green-600/10 text-green-600 dark:bg-green-500/15 dark:text-green-400', label: 'Professionalism' },
  'knowledge-unlock': { Icon: Edit3, tint: 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400', label: 'Knowledge Unlock' },
  collaboration: { Icon: Heart, tint: 'bg-pink-500/10 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400', label: 'Collaboration' },
  roadmaps: { Icon: Route, tint: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400', label: 'Roadmaps' },
};

const NEWS_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  promotion: Gift,
  deadline: AlertTriangle,
  reminder: Clock,
  announcement: Sparkles,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomePage({
  user,
  profile,
  cartItems,
  cartTotalPoints,
  planStatus,
  isSimulatorMode,
  useRealPlan,
  onNavigate,
}: HomePageProps) {
  const { achievements, isLoading: achLoading } = useAchievements(user?.email ?? null);
  const currentQuarter = useCurrentQuarter();
  const { isFrozen } = useQuarterConfig();

  const activeNews = useMemo(
    () => portalNews.filter((n) => !n.quarter || n.quarter === currentQuarter),
    [currentQuarter],
  );
  const daysRemaining = getDaysRemainingInQuarter(currentQuarter);
  const currentLevel = profile?.currentLevel ?? null;
  const nextLevelDef = currentLevel != null ? levels.find((l) => l.id === currentLevel + 1) : levels[0];

  // ── Cart breakdown ────────────────────────────────────────────────────────

  const cartItemIds = useMemo(() => new Set(cartItems.map((i) => i.id)), [cartItems]);

  const cartPointsByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of cartItems) {
      const pts = item.promotedPoints ?? item.points;
      map[item.category] = (map[item.category] ?? 0) + pts;
    }
    return map;
  }, [cartItems]);

  const cartByCategory = useMemo(() => {
    const map: Record<string, CatalogItem[]> = {};
    for (const item of cartItems) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    }
    return map;
  }, [cartItems]);

  const requiredInCart = useMemo(
    () => MANDATORY_ITEM_IDS.filter((id) => cartItemIds.has(id)),
    [cartItemIds],
  );

  // ── Points / level bank ───────────────────────────────────────────────────

  const totalApprovedPoints = useMemo(() => {
    const histPts = (profile?.achieved?.items ?? [])
      .filter((a) => a.status === 'approved')
      .reduce((s, a) => s + (a.item.promotedPoints ?? a.item.points), 0);
    const qPts = achievements
      .filter((a: Achievement) => a.status === 'approved')
      .reduce((s: number, a: Achievement) => s + (a.item.promotedPoints ?? a.item.points), 0);
    return histPts + qPts + (profile?.preSystemPoints ?? 0);
  }, [profile?.achieved?.items, profile?.preSystemPoints, achievements]);

  const consumedPoints = useMemo(() => {
    if (currentLevel == null) return 0;
    return levels.filter((l) => l.id <= currentLevel).reduce((s, l) => s + l.points, 0);
  }, [currentLevel]);

  const bankedPoints = Math.max(0, totalApprovedPoints - consumedPoints);
  const progressToNext = nextLevelDef
    ? Math.min(100, Math.round((bankedPoints / nextLevelDef.points) * 100))
    : currentLevel === 10
      ? 100
      : 0;

  // ── Recent achievements ───────────────────────────────────────────────────

  const recentAchievements = useMemo(() => {
    const hist = (profile?.achieved?.items ?? []).map((a, i) => ({
      key: `h-${a.itemId}-${i}`,
      item: a.item,
      status: a.status as string,
      date: a.completionDate,
      quarter: null as string | null,
    }));
    const qAch = achievements.map((a: Achievement) => ({
      key: a.id,
      item: a.item,
      status: a.status as string,
      date: a.completionDate,
      quarter: a.quarter ?? null,
    }));
    return [...qAch, ...hist]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4);
  }, [profile?.achieved?.items, achievements]);

  // ── Pillar points ─────────────────────────────────────────────────────────

  const techPts = cartPointsByCategory['tech'] ?? 0;
  const knowledgePts = cartPointsByCategory['knowledge-unlock'] ?? 0;
  const collabPts = cartPointsByCategory['collaboration'] ?? 0;

  // ── Identity bits ─────────────────────────────────────────────────────────

  const role = profile?.role ?? 'employee';
  const approvalStatus = profile?.approvalStatus;
  const displayName = profile?.displayName ?? user?.displayName;
  const photoURL = profile?.photoURL ?? user?.photoURL;

  // ── Plan status visual ────────────────────────────────────────────────────

  const planStatusTint: 'primary' | 'success' | 'warning' | 'destructive' | 'muted' =
    planStatus === 'approved'
      ? 'success'
      : planStatus === 'rejected'
        ? 'destructive'
        : planStatus === 'pending'
          ? 'warning'
          : 'muted';

  const PlanStatusIcon =
    planStatus === 'approved'
      ? CheckCircle2
      : planStatus === 'rejected'
        ? XCircle
        : planStatus === 'pending'
          ? Clock
          : FileEdit;

  const planStatusLabel = useRealPlan
    ? planStatus === 'approved'
      ? 'Approved'
      : planStatus === 'rejected'
        ? 'Rejected'
        : planStatus === 'pending'
          ? 'Under Review'
          : 'Draft'
    : 'Simulator';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 h-full overflow-y-auto">
      {/* ── Hero ── */}
      <HeroBanner
        avatar={
          <div className="flex size-14 sm:size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary overflow-hidden">
            {photoURL ? (
              <img src={photoURL} alt={displayName ?? ''} className="size-full object-cover" />
            ) : (
              <span className="text-xl font-bold">{getInitials(displayName)}</span>
            )}
          </div>
        }
        eyebrow={user ? getGreeting(displayName) : 'Welcome to DCR 2.0'}
        title={displayName ?? 'Development Career Roadmap'}
        tags={
          <>
            {currentLevel != null && (
              <Badge variant="primary" size="sm">
                <BarChart2 className="size-3" /> Level {currentLevel}
              </Badge>
            )}
            {role === 'team_leader' && (
              <Badge variant="secondary" size="sm">
                Team Leader
              </Badge>
            )}
            {role === 'admin' && (
              <Badge variant="secondary" size="sm">
                Admin
              </Badge>
            )}
            {approvalStatus === 'approved' && (
              <Badge variant="success" size="sm">
                <CheckCircle2 className="size-3" /> Active
              </Badge>
            )}
            {approvalStatus === 'pending' && (
              <Badge variant="warning" size="sm">
                <Clock className="size-3" /> Pending Approval
              </Badge>
            )}
          </>
        }
        trailing={
          <>
            <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 sm:min-w-[180px]">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Current Quarter
              </p>
              <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                {currentQuarter}
              </p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                {isFrozen ? (
                  <>
                    <Lock className="size-3.5" /> Quarter locked
                  </>
                ) : (
                  <>
                    <Clock className="size-3.5" /> {daysRemaining}d remaining
                  </>
                )}
              </p>
            </div>
            <Badge variant={isSimulatorMode ? 'secondary' : 'success'} size="md">
              {isSimulatorMode ? <FlaskConical className="size-3" /> : <Disc className="size-3" />}
              {isSimulatorMode ? 'Simulator' : 'Real Plan'}
            </Badge>
          </>
        }
      />

      {/* ── Top Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          icon={<ShoppingCart />}
          iconTint="primary"
          value={cartTotalPoints.toLocaleString()}
          label="Points in plan"
          sub={`${cartItems.length} item${cartItems.length !== 1 ? 's' : ''} added`}
          onClick={() => onNavigate('simulator', 'Plan')}
        />
        <StatCard
          icon={<BarChart2 />}
          iconTint="success"
          value={currentLevel != null ? `Level ${currentLevel}` : '—'}
          label="Current level"
          sub={
            nextLevelDef
              ? `${bankedPoints.toLocaleString()} / ${nextLevelDef.points.toLocaleString()} pts → L${nextLevelDef.id}`
              : currentLevel === 10
                ? 'Maximum level reached!'
                : user
                  ? 'Set up profile to track'
                  : 'Sign in to track'
          }
          progress={nextLevelDef ? progressToNext : undefined}
          onClick={() => onNavigate('my-profile', 'My Profile')}
        />
        <StatCard
          icon={<PlanStatusIcon />}
          iconTint={planStatusTint}
          value={planStatusLabel}
          label="Plan status"
          sub={useRealPlan ? currentQuarter : 'Switch to Real Plan to submit'}
          onClick={() => onNavigate('simulator', 'Plan')}
        />
      </div>

      {/* ── Program Updates / News ── */}
      {activeNews.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeader
            icon={<Megaphone />}
            title="Program Updates"
            action={
              <Button variant="ghost" size="sm" onClick={() => onNavigate('guidelines', 'Guidelines')}>
                Full guidelines
                <ArrowRight className="size-3.5" />
              </Button>
            }
          />
          <div className="flex gap-3 overflow-x-auto -mx-1 px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {activeNews.map((item) => {
              const Icon = NEWS_ICON[item.type] ?? Sparkles;
              return (
                <div key={item.id} className="shrink-0 w-[18rem]">
                  <NewsCard
                    icon={<Icon />}
                    title={item.title}
                    body={item.body}
                    type={item.type as NewsType}
                    isNew={item.isNew}
                    linkLabel={item.link?.label}
                    onLinkClick={
                      item.link
                        ? () => onNavigate(item.link!.navId, item.link!.navLabel)
                        : undefined
                    }
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Pillars Section ── */}
      {user && (
        <section className="flex flex-col gap-3">
          <SectionHeader icon={<LayoutGrid />} title="Pillars This Quarter" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Professionalism — checklist */}
            <PillarCard
              category="professionalism"
              onClick={() => onNavigate('professionalism', 'Professionalism')}
              right={
                <Badge
                  variant={
                    requiredInCart.length === MANDATORY_ITEM_IDS.length
                      ? 'success'
                      : requiredInCart.length > 0
                        ? 'warning'
                        : 'default'
                  }
                  size="sm"
                >
                  {requiredInCart.length}/{MANDATORY_ITEM_IDS.length}
                </Badge>
              }
              sub="Required items"
            >
              <div className="flex flex-col gap-1.5">
                {professionalism
                  .filter((i) => MANDATORY_ITEM_IDS.includes(i.id))
                  .map((item) => {
                    const checked = cartItemIds.has(item.id);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 text-xs"
                      >
                        {checked ? (
                          <CheckCircle2 className="size-3.5 text-green-600 dark:text-green-400 shrink-0" />
                        ) : (
                          <span className="size-3.5 rounded-full border border-border shrink-0" />
                        )}
                        <span
                          className={cn(
                            'truncate',
                            checked ? 'text-foreground' : 'text-muted-foreground',
                          )}
                        >
                          {item.name}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </PillarCard>

            {/* Tech */}
            <PillarCard
              category="tech"
              onClick={() => onNavigate('tech', 'Tech')}
              right={
                <Badge
                  variant={
                    techPts >= PILLAR_REQS.tech
                      ? 'success'
                      : techPts > 0
                        ? 'warning'
                        : 'default'
                  }
                  size="sm"
                >
                  {techPts} pts
                </Badge>
              }
              sub={`Min. ${PILLAR_REQS.tech} pts`}
            >
              <PillarProgress
                value={techPts}
                max={PILLAR_REQS.tech}
                metLabel="Min. met ✓"
                missingLabel={`${PILLAR_REQS.tech - techPts} more pts needed`}
              />
              {(cartByCategory['tech']?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {(cartByCategory['tech'] ?? []).slice(0, 3).map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 h-6 text-[0.65rem] font-medium text-muted-foreground"
                    >
                      {item.image && <img src={item.image} alt="" className="size-3 object-contain" />}
                      {item.name.replace(/^(AWS|GCP|HashiCorp|Kubernetes)\s+Certified\s*/i, '').slice(0, 18)}
                    </span>
                  ))}
                  {(cartByCategory['tech']?.length ?? 0) > 3 && (
                    <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 h-6 text-[0.65rem] font-semibold">
                      +{(cartByCategory['tech']?.length ?? 0) - 3}
                    </span>
                  )}
                </div>
              )}
            </PillarCard>

            {/* Knowledge Unlock */}
            <PillarCard
              category="knowledge-unlock"
              onClick={() => onNavigate('knowledge-unlock', 'Knowledge Unlock')}
              right={
                <Badge
                  variant={
                    knowledgePts >= PILLAR_REQS['knowledge-unlock']
                      ? 'success'
                      : knowledgePts > 0
                        ? 'warning'
                        : 'default'
                  }
                  size="sm"
                >
                  {knowledgePts} pts
                </Badge>
              }
              sub={`Min. ${PILLAR_REQS['knowledge-unlock']} pts`}
            >
              <PillarProgress
                value={knowledgePts}
                max={PILLAR_REQS['knowledge-unlock']}
                metLabel="Min. met ✓"
                missingLabel={`${PILLAR_REQS['knowledge-unlock'] - knowledgePts} more pts needed`}
              />
            </PillarCard>

            {/* Collaboration */}
            <PillarCard
              category="collaboration"
              onClick={() => onNavigate('collaboration', 'Collaboration')}
              right={
                <Badge
                  variant={
                    collabPts >= PILLAR_REQS.collaboration
                      ? 'success'
                      : collabPts > 0
                        ? 'warning'
                        : 'default'
                  }
                  size="sm"
                >
                  {collabPts} pts
                </Badge>
              }
              sub={`Min. ${PILLAR_REQS.collaboration} pts`}
            >
              <PillarProgress
                value={collabPts}
                max={PILLAR_REQS.collaboration}
                metLabel="Min. met ✓"
                missingLabel={`${PILLAR_REQS.collaboration - collabPts} more pts needed`}
              />
            </PillarCard>
          </div>
        </section>
      )}

      {/* ── Featured This Quarter ── */}
      {ALL_PROMOTED.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeader
            icon={<Sparkles />}
            title="Featured This Quarter"
            subtitle="These items carry bonus points this quarter — great choices for your plan."
            action={
              <Badge variant="warning" size="md">
                <Gift className="size-3" /> Bonus Points
              </Badge>
            }
          />
          <div className="flex gap-3 overflow-x-auto -mx-1 px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,black_calc(100%-3rem),transparent)]">
            {ALL_PROMOTED.map((item) => {
              const basePts = item.points;
              const bonusPts = item.promotedPoints ?? item.points;
              const inCart = cartItemIds.has(item.id);
              const navId =
                item.category === 'knowledge-unlock'
                  ? 'knowledge-unlock'
                  : item.category === 'collaboration'
                    ? 'collaboration'
                    : 'tech';
              const navLabel =
                item.category === 'knowledge-unlock'
                  ? 'Knowledge Unlock'
                  : item.category === 'collaboration'
                    ? 'Collaboration'
                    : 'Tech';
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(navId, navLabel)}
                  className={cn(
                    'group/featured shrink-0 w-[15rem] flex flex-col gap-2 rounded-2xl border bg-card text-left p-3 shadow-sm transition-all duration-200',
                    'hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30',
                    'outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                    inCart && 'border-primary/30 bg-primary/5',
                  )}
                >
                  <div className="relative flex h-24 items-center justify-center rounded-xl bg-gradient-to-br from-muted to-muted/40 ring-1 ring-inset ring-border/40">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full max-w-full object-contain p-2" />
                    ) : (
                      <Award className="size-8 text-muted-foreground" />
                    )}
                    {inCart && (
                      <span className="absolute right-2 top-2 inline-flex size-6 items-center justify-center rounded-full bg-green-600/15 text-green-600">
                        <CheckCircle2 className="size-4" />
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {item.name}
                    </span>
                    {item.subcategory && (
                      <span className="text-xs text-muted-foreground truncate">
                        {item.subcategory}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-baseline gap-1 tabular-nums">
                      {bonusPts !== basePts && (
                        <span className="text-xs text-muted-foreground line-through">
                          {basePts}
                        </span>
                      )}
                      <span className="text-sm font-semibold text-primary">{bonusPts}</span>
                      <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                        pts
                      </span>
                    </div>
                    <ArrowRight className="size-3.5 text-muted-foreground transition-transform duration-150 group-hover/featured:translate-x-0.5" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Recent Activity ── */}
      <section className="flex flex-col gap-3">
        <SectionHeader
          icon={<Trophy />}
          title="Recent Achievements"
          action={
            user && (
              <Button variant="ghost" size="sm" onClick={() => onNavigate('my-profile', 'My Profile')}>
                View all <ArrowRight className="size-3.5" />
              </Button>
            )
          }
        />
        {!user ? (
          <EmptyState
            title="Sign in to see your achievements"
            description="Your personal zone will show progress, plan, and earned items."
          />
        ) : achLoading ? (
          <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Loading...
          </div>
        ) : recentAchievements.length === 0 ? (
          <EmptyState
            icon={<Trophy />}
            title="No achievements yet"
            description="Complete items in your plan to earn them."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {recentAchievements.map(({ key, item, status, date, quarter }) => {
              const pts = item.promotedPoints ?? item.points;
              const pillar = PILLAR_CFG[item.category];
              const PillarIcon = pillar?.Icon ?? Star;
              const statusVariant: 'success' | 'destructive' | 'warning' | 'default' =
                status === 'approved'
                  ? 'success'
                  : status === 'rejected'
                    ? 'destructive'
                    : status === 'submitted'
                      ? 'warning'
                      : 'default';
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
                >
                  <span
                    className={cn(
                      'inline-flex size-10 shrink-0 items-center justify-center rounded-xl overflow-hidden [&_svg]:size-4',
                      pillar?.tint ?? 'bg-muted text-muted-foreground',
                    )}
                  >
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="size-full object-contain p-1" />
                    ) : (
                      <PillarIcon />
                    )}
                  </span>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className="text-sm font-medium text-foreground truncate">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {quarter && <span>{quarter}</span>}
                      <span>{fmtDate(date)}</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {pts > 0 && (
                      <span className="text-sm font-semibold text-foreground tabular-nums">
                        +{pts}
                      </span>
                    )}
                    <Badge variant={statusVariant} size="sm">
                      {status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Guest CTA ── */}
      {!user && (
        <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-5 sm:p-6 flex items-center gap-4 sm:gap-6">
          <span className="hidden sm:inline-flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shrink-0 [&_svg]:size-6">
            <Rocket />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">
              Ready to accelerate your career?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in with your Develeap account to track your quarterly progress, build a real plan, and earn certifications.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

/* ── Inline pillar card helper ───────────────────────────────── */

function PillarCard({
  category,
  onClick,
  right,
  sub,
  children,
}: {
  category: keyof typeof PILLAR_CFG;
  onClick: () => void;
  right: React.ReactNode;
  sub: string;
  children: React.ReactNode;
}) {
  const cfg = PILLAR_CFG[category];
  const Icon = cfg.Icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="flex items-center gap-3">
        <span className={cn('inline-flex size-10 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5', cfg.tint)}>
          <Icon />
        </span>
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-foreground">{cfg.label}</span>
          <span className="text-xs text-muted-foreground">{sub}</span>
        </div>
        <div className="shrink-0">{right}</div>
      </div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </button>
  );
}

function PillarProgress({
  value,
  max,
  metLabel,
  missingLabel,
}: {
  value: number;
  max: number;
  metLabel: string;
  missingLabel: string;
}) {
  const met = value >= max;
  return (
    <div className="flex flex-col gap-1.5">
      <ProgressBar
        value={value}
        max={max}
        size="sm"
        variant={met ? 'success' : 'primary'}
      />
      <span
        className={cn(
          'text-[0.65rem] font-medium uppercase tracking-wider',
          met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground',
        )}
      >
        {met ? metLabel : missingLabel}
      </span>
    </div>
  );
}
