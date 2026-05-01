import { useState } from 'react';
import {
  Medal,
  User,
  UserCircle,
  ArrowRight,
  Link as LinkIcon,
  FileText,
  StickyNote,
  Paperclip,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  CheckCheck,
  Info,
  ListChecks,
} from 'lucide-react';
import type { LevelUpRequest, ProofEntry } from '../../data/types';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

export interface LevelUpHistoryRow {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  role: 'employee' | 'team_leader' | 'admin';
  levelFrom: number | null;
  levelTo: number;
  date: string;
  quarter: string | null;
}

interface LevelUpsTabProps {
  requests: LevelUpRequest[];
  isLoading: boolean;
  adminUid?: string;
  isAdmin: boolean;
  allLevelHistory?: LevelUpHistoryRow[];
  approvedRequests?: LevelUpRequest[];
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

function levelTint(level: number): 'default' | 'primary' | 'warning' | 'success' {
  if (level <= 3) return 'default';
  if (level <= 6) return 'primary';
  return 'success';
}

function ProofEntries({ proofs }: { proofs: ProofEntry[] }) {
  return (
    <ul className="flex flex-col gap-1.5 mt-2 pl-7">
      {proofs.map((p) => (
        <li key={p.id} className="text-xs">
          {p.type === 'url' && p.url && (
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              <LinkIcon className="size-3.5" />
              <span className="break-all">{p.url}</span>
            </a>
          )}
          {p.type === 'file' && p.fileUrl && (
            <a
              href={p.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              <FileText className="size-3.5" />
              <span>{p.fileName ?? 'Download file'}</span>
            </a>
          )}
          {p.type === 'note' && p.note && (
            <span className="inline-flex items-start gap-1.5 text-muted-foreground">
              <StickyNote className="size-3.5 shrink-0 mt-0.5" />
              {p.note}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function PlanItemsList({
  req,
  expandedProofKey,
  onToggleProof,
}: {
  req: LevelUpRequest;
  expandedProofKey: string | null;
  onToggleProof: (key: string) => void;
}) {
  const proofs = req.proofEntries ?? {};
  return (
    <ul className="flex flex-col gap-1.5">
      {req.planItems.map((item, idx) => {
        const itemKey = item.planItemKey ?? `${item.id}-${idx}`;
        const done = req.completedItemKeys.includes(itemKey);
        const itemProofs = proofs[itemKey] ?? [];
        const proofKey = `${req.id}-${itemKey}`;
        const proofExpanded = expandedProofKey === proofKey;
        return (
          <li
            key={itemKey}
            className={cn(
              'flex flex-col gap-1.5 rounded-xl border px-3 py-2',
              done ? 'border-green-600/30 bg-green-600/5' : 'border-border bg-muted/20',
            )}
          >
            <div className="flex items-center gap-2">
              {done ? (
                <CheckCircle2 className="size-4 text-green-600 dark:text-green-400 shrink-0" />
              ) : (
                <Clock className="size-4 text-muted-foreground shrink-0" />
              )}
              <span className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">
                {item.name}
              </span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                {item.promotedPoints ?? item.points} pts
              </span>
              {itemProofs.length > 0 && (
                <button
                  type="button"
                  onClick={() => onToggleProof(proofKey)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-lg px-2 h-7 text-xs font-medium transition-colors',
                    proofExpanded
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/40 text-muted-foreground hover:bg-muted',
                  )}
                >
                  <Paperclip className="size-3" />
                  {itemProofs.length}
                  {proofExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                </button>
              )}
            </div>
            {proofExpanded && <ProofEntries proofs={itemProofs} />}
          </li>
        );
      })}
    </ul>
  );
}

export function LevelUpsTab({
  requests,
  isLoading,
  isAdmin,
  allLevelHistory,
  approvedRequests = [],
}: LevelUpsTabProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [expandedProofKey, setExpandedProofKey] = useState<string | null>(null);

  const toggleExpand = (key: string) =>
    setExpandedKey((prev) => (prev === key ? null : key));
  const toggleProof = (key: string) =>
    setExpandedProofKey((prev) => (prev === key ? null : key));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-card p-12">
        <div className="size-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Loading level-up history…</p>
      </div>
    );
  }

  // ── Admin view ────────────────────────────────────────────────────────────
  if (isAdmin && allLevelHistory !== undefined) {
    const filtered = allLevelHistory.filter((row) => row.quarter !== null);
    if (filtered.length === 0) {
      return (
        <EmptyState
          icon={<Medal />}
          title="No level-ups yet"
          description="Approved level-ups across all teams will appear here."
        />
      );
    }

    return (
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Medal className="size-4 text-muted-foreground" /> Level-Up History
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            All approved level-ups across every team, newest first.
          </p>
        </div>

        <ul className="flex flex-col gap-2">
          {filtered.map((row, idx) => {
            const rowKey = `${row.uid}-${row.date}-${idx}`;
            const isExpanded = expandedKey === rowKey;
            const matchedReq = row.quarter
              ? approvedRequests.find((r) => r.userId === row.uid && r.quarter === row.quarter)
              : undefined;

            return (
              <li
                key={rowKey}
                className={cn(
                  'rounded-2xl border bg-card overflow-hidden transition-all duration-200',
                  isExpanded ? 'border-primary/30 shadow-sm' : 'border-border',
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(rowKey)}
                  className="w-full flex items-center gap-3 p-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
                >
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary overflow-hidden [&_svg]:size-4">
                    {row.photoURL ? (
                      <img
                        src={row.photoURL}
                        alt={row.displayName}
                        referrerPolicy="no-referrer"
                        className="size-full object-cover"
                      />
                    ) : row.role === 'team_leader' ? (
                      <UserCircle />
                    ) : (
                      <User />
                    )}
                  </span>

                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground truncate">
                      {row.displayName}
                      {row.role === 'team_leader' && (
                        <Badge variant="primary" size="sm">TL</Badge>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">{row.email}</span>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    {row.levelFrom !== null ? (
                      <>
                        <Badge variant={levelTint(row.levelFrom)} size="sm">{row.levelFrom}</Badge>
                        <ArrowRight className="size-3 text-muted-foreground" />
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Initial</span>
                    )}
                    <Badge variant={levelTint(row.levelTo)} size="sm">{row.levelTo}</Badge>
                  </div>

                  <div className="hidden md:flex flex-col items-end shrink-0 text-xs">
                    {row.quarter && (
                      <span className="font-semibold text-foreground tabular-nums">{row.quarter}</span>
                    )}
                    <span className="text-muted-foreground">{formatDate(row.date)}</span>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="size-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-border p-3 space-y-3 bg-muted/20">
                    {matchedReq ? (
                      <>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span className="inline-flex items-center gap-1.5">
                            <ListChecks className="size-3.5" />
                            {matchedReq.completedItemKeys.length}/{matchedReq.planItems.length} items completed
                          </span>
                          {matchedReq.teamLeaderName && (
                            <span className="inline-flex items-center gap-1.5">
                              <UserCircle className="size-3.5" />
                              Recommended by {matchedReq.teamLeaderName}
                            </span>
                          )}
                        </div>
                        <PlanItemsList req={matchedReq} expandedProofKey={expandedProofKey} onToggleProof={toggleProof} />
                      </>
                    ) : (
                      <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <Info className="size-4" />
                        {row.quarter
                          ? 'Plan details not available for this entry.'
                          : 'Initial level assignment — no plan associated.'}
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  // ── TL view ───────────────────────────────────────────────────────────────
  if (requests.length === 0) {
    return (
      <EmptyState
        icon={<Medal />}
        title="No level-up history yet"
        description="Level-ups you've recommended will appear here once processed."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Medal className="size-4 text-muted-foreground" /> Level-Up History
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Level-up recommendations you submitted and their admin decision.
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {requests.map((req) => {
          const isExpanded = expandedKey === req.id;
          const StatusIcon =
            req.status === 'approved'
              ? CheckCircle2
              : req.status === 'rejected'
                ? XCircle
                : Clock;
          const statusVariant: 'success' | 'destructive' | 'warning' =
            req.status === 'approved'
              ? 'success'
              : req.status === 'rejected'
                ? 'destructive'
                : 'warning';
          const statusLabel =
            req.status === 'approved' ? 'Approved' : req.status === 'rejected' ? 'Rejected' : 'Pending';

          return (
            <li
              key={req.id}
              className={cn(
                'rounded-2xl border bg-card overflow-hidden transition-all duration-200',
                isExpanded ? 'border-primary/30 shadow-sm' : 'border-border',
              )}
            >
              <button
                type="button"
                onClick={() => toggleExpand(req.id)}
                className="w-full flex items-center gap-3 p-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
              >
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary overflow-hidden">
                  {req.userPhotoURL ? (
                    <img
                      src={req.userPhotoURL}
                      alt={req.userDisplayName}
                      referrerPolicy="no-referrer"
                      className="size-full object-cover"
                    />
                  ) : (
                    <User className="size-4" />
                  )}
                </span>

                <div className="flex-1 min-w-0 flex flex-col">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {req.userDisplayName}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">{req.userEmail}</span>
                </div>

                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  <Badge variant={levelTint(req.levelFrom)} size="sm">{req.levelFrom}</Badge>
                  <ArrowRight className="size-3 text-muted-foreground" />
                  <Badge variant={levelTint(req.levelTo)} size="sm">{req.levelTo}</Badge>
                </div>

                <div className="hidden md:flex flex-col items-end shrink-0 text-xs">
                  <span className="font-semibold text-foreground tabular-nums">{req.quarter}</span>
                  <Badge variant={statusVariant} size="sm">
                    <StatusIcon className="size-3" /> {statusLabel}
                  </Badge>
                </div>

                {isExpanded ? (
                  <ChevronUp className="size-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-border p-3 space-y-3 bg-muted/20">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      Recommended {formatDate(req.requestedAt)}
                    </span>
                    {req.resolvedAt && (
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCheck className="size-3.5" />
                        {req.status === 'approved' ? 'Approved' : 'Rejected'} {formatDate(req.resolvedAt)}
                      </span>
                    )}
                  </div>

                  {req.rejectionReason && (
                    <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-foreground">
                      <Info className="size-4 text-destructive shrink-0 mt-0.5" />
                      {req.rejectionReason}
                    </div>
                  )}

                  {req.planItems && req.planItems.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <ListChecks className="size-3.5" />
                        Completed items
                        <Badge variant="secondary" size="sm">
                          {req.completedItemKeys.length}/{req.planItems.length}
                        </Badge>
                      </div>
                      <PlanItemsList req={req} expandedProofKey={expandedProofKey} onToggleProof={toggleProof} />
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
