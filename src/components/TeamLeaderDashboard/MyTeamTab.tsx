import { useMemo, useState } from 'react';
import {
  User,
  UserMinus,
  ExternalLink,
  Eye,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
} from 'lucide-react';
import type { UserDocument } from '../../data/types';
import type { TeamLeaderWithUid } from '../../hooks/useTeamMembers';
import { MemberDetailsModal } from './MemberDetailsModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

type MemberWithUid = UserDocument & { uid: string };

interface MyTeamTabProps {
  approvedMembers: MemberWithUid[];
  isAdmin?: boolean;
  teamLeaders?: TeamLeaderWithUid[];
}

const currentQuarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;

export function MyTeamTab({ approvedMembers, isAdmin = false, teamLeaders = [] }: MyTeamTabProps) {
  const [selectedMember, setSelectedMember] = useState<MemberWithUid | null>(null);

  const getPlanChip = (member: MemberWithUid) => {
    const status = member.plan?.planStatus;
    if (!status || status === 'draft') {
      return (
        <Badge variant="default" size="sm">
          <FileText className="size-3" /> No {currentQuarter} plan
        </Badge>
      );
    }
    if (status === 'pending') {
      return (
        <Badge variant="warning" size="sm">
          <Clock className="size-3" /> {currentQuarter} pending
        </Badge>
      );
    }
    if (status === 'approved') {
      return (
        <Badge variant="success" size="sm">
          <CheckCircle2 className="size-3" /> {currentQuarter} approved
        </Badge>
      );
    }
    if (status === 'rejected') {
      return (
        <Badge variant="destructive" size="sm">
          <XCircle className="size-3" /> {currentQuarter} rejected
        </Badge>
      );
    }
    return null;
  };

  const teamGroups = useMemo(() => {
    if (!isAdmin) return null;
    const groups = new Map<string, { leader: TeamLeaderWithUid | null; members: MemberWithUid[] }>();
    for (const member of approvedMembers) {
      const leaderId = member.teamLeaderId || 'unassigned';
      if (!groups.has(leaderId)) {
        const leader = teamLeaders.find((tl) => tl.uid === leaderId) || null;
        groups.set(leaderId, { leader, members: [] });
      }
      groups.get(leaderId)!.members.push(member);
    }
    return Array.from(groups.entries()).sort(([idA, a], [idB, b]) => {
      if (idA === 'unassigned') return 1;
      if (idB === 'unassigned') return -1;
      const nameA = a.leader?.displayName || '';
      const nameB = b.leader?.displayName || '';
      return nameA.localeCompare(nameB);
    });
  }, [isAdmin, approvedMembers, teamLeaders]);

  if (approvedMembers.length === 0) {
    return (
      <EmptyState
        icon={<Users />}
        title="No team members yet"
        description="Approved team members will appear here."
      />
    );
  }

  const renderMemberCard = (member: MemberWithUid) => (
    <div
      key={member.uid}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary overflow-hidden">
          {member.photoURL ? (
            <img
              src={member.photoURL}
              alt={member.displayName}
              referrerPolicy="no-referrer"
              className="size-full object-cover"
            />
          ) : (
            <User className="size-5" />
          )}
        </span>
        <div className="flex flex-col items-center justify-center rounded-xl bg-primary/10 text-primary px-3 py-1.5 shrink-0">
          <span className="text-base font-bold leading-tight tabular-nums">
            {member.currentLevel ?? '?'}
          </span>
          <span className="text-[0.55rem] font-semibold uppercase tracking-wider text-primary/80 leading-tight">
            Level
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-foreground truncate">{member.displayName}</h3>
        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
        <div className="mt-1">{getPlanChip(member)}</div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() => setSelectedMember(member)}
      >
        <Eye className="size-3.5" /> View Details
      </Button>
    </div>
  );

  if (isAdmin && teamGroups) {
    return (
      <>
        {selectedMember && (
          <MemberDetailsModal member={selectedMember} onClose={() => setSelectedMember(null)} />
        )}
        <div className="flex flex-col gap-6">
          {teamGroups.map(([leaderId, { leader, members }]) => (
            <div key={leaderId} className="flex flex-col gap-3">
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3">
                {leader ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedMember(leader)}
                      title="View team leader details"
                      className={cn(
                        'inline-flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary overflow-hidden',
                        'transition-all duration-200 hover:scale-105 outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                      )}
                    >
                      {leader.photoURL ? (
                        <img
                          src={leader.photoURL}
                          alt={leader.displayName}
                          referrerPolicy="no-referrer"
                          className="size-full object-cover"
                        />
                      ) : (
                        <User className="size-4" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => setSelectedMember(leader)}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      >
                        {leader.displayName}'s Team
                        <ExternalLink className="size-3" />
                      </button>
                      <p className="text-xs text-muted-foreground truncate">{leader.email}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <UserMinus className="size-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground">Unassigned</h3>
                      <p className="text-xs text-muted-foreground">
                        Employees without a team leader
                      </p>
                    </div>
                  </>
                )}
                <Badge variant="secondary" size="sm">
                  {members.length} member{members.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {members.map(renderMemberCard)}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      {selectedMember && (
        <MemberDetailsModal member={selectedMember} onClose={() => setSelectedMember(null)} />
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {approvedMembers.map(renderMemberCard)}
      </div>
    </>
  );
}
