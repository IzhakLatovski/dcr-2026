import { useState, type ReactNode } from 'react';
import { doc, updateDoc, collection, setDoc, addDoc } from 'firebase/firestore';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  ExternalLink,
  Heart,
  ListChecks,
  Lock,
  Medal,
  MonitorSmartphone,
  Paperclip,
  Pencil,
  Route,
  Send,
  Shield,
  StickyNote,
  Trophy,
  UserCircle,
  UserPlus,
  X,
} from 'lucide-react';
import { db } from '../../config/firebase';
import { createNotification } from '../../hooks/useNotifications';
import { HR_EMAIL } from '../../data/hrConfig';
import { levels } from '../../data/levels';
import type { UserDocument, CatalogItem, LevelHistoryEntry, ProofEntry, LevelUpRequest } from '../../data/types';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

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

function getQuarterFromDate(iso: string | undefined | null): string {
  const d = iso ? new Date(iso) : new Date();
  const q = Math.ceil((d.getMonth() + 1) / 3);
  return `Q${q}-${d.getFullYear()}`;
}

function formatDate(isoString: string) {
  try {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
}

interface PendingApprovalsTabProps {
  pendingMembers: (UserDocument & { uid: string })[];
  teamLeaderId: string;
  teamLeaderName: string;
  teamLeaderEmail: string;
  pendingLevelUps?: LevelUpRequest[];
  adminUid?: string;
}

/**
 * Tab showing pending team member requests.
 * Handles two types:
 * - Initial registration: approvalStatus === 'pending' (level + historical achievements)
 * - Quarterly plan: plan.planStatus === 'pending' (approve/reject the plan items)
 */
export function PendingApprovalsTab({
  pendingMembers,
  teamLeaderId,
  teamLeaderName,
  teamLeaderEmail,
  pendingLevelUps = [],
  adminUid,
}: PendingApprovalsTabProps) {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [expandedProofKey, setExpandedProofKey] = useState<string | null>(null);

  const toggleProofs = (key: string) =>
    setExpandedProofKey((prev) => (prev === key ? null : key));

  const isQuarterlyPlan = (member: UserDocument & { uid: string }) =>
    member.approvalStatus === 'approved' && member.plan?.planStatus === 'pending';

  const isCompletionReview = (member: UserDocument & { uid: string }) =>
    member.approvalStatus === 'approved' && member.plan?.completionStatus === 'pending_review';

  const checkPlanRequirements = (items: CatalogItem[], targetLevelId: number, carryOverPoints: number = 0) => {
    const level = levels.find((l) => l.id === targetLevelId);
    if (!level) return null;

    const itemIds = new Set(items.map((i) => i.id));
    const totalPoints = items.reduce((sum, i) => sum + (i.promotedPoints ?? i.points), 0) + carryOverPoints;

    const pillarPoints = { tech: 0, 'knowledge-unlock': 0, collaboration: 0, professionalism: 0 };
    items.forEach((i) => {
      const cat = i.category as keyof typeof pillarPoints;
      if (cat in pillarPoints) pillarPoints[cat] += i.promotedPoints ?? i.points;
    });

    const missingMandatory = level.mandatoryItems.filter((id) => !itemIds.has(id));
    const shortfalls: string[] = [];

    if (totalPoints < level.points)
      shortfalls.push(`Total points: ${totalPoints}/${level.points}`);
    if (missingMandatory.length > 0)
      shortfalls.push(`Missing ${missingMandatory.length} mandatory item${missingMandatory.length !== 1 ? 's' : ''}`);
    if (pillarPoints.tech < level.pillarRequirements.tech)
      shortfalls.push(`Tech: ${pillarPoints.tech}/${level.pillarRequirements.tech} pts`);
    if (pillarPoints['knowledge-unlock'] < level.pillarRequirements['knowledge-unlock'])
      shortfalls.push(`Knowledge: ${pillarPoints['knowledge-unlock']}/${level.pillarRequirements['knowledge-unlock']} pts`);
    if (pillarPoints.collaboration < level.pillarRequirements.collaboration)
      shortfalls.push(`Collaboration: ${pillarPoints.collaboration}/${level.pillarRequirements.collaboration} pts`);

    return { meetsRequirements: shortfalls.length === 0, shortfalls, level };
  };

  const handleApproveLevelUp = async (req: LevelUpRequest) => {
    if (!adminUid) return;
    if (!confirm(`Approve level-up for ${req.userDisplayName}? (Level ${req.levelFrom} → Level ${req.levelTo})`)) return;

    try {
      setProcessingIds((prev) => new Set(prev).add(req.id));
      const now = new Date().toISOString();

      await updateDoc(doc(db, 'levelUpRequests', req.id), {
        status: 'approved',
        resolvedAt: now,
        resolvedBy: adminUid,
      });

      const userRef = doc(db, 'users', req.userId);
      const newLevelEntry: LevelHistoryEntry = { level: req.levelTo, date: now, quarter: req.quarter };

      await updateDoc(userRef, {
        currentLevel: req.levelTo,
        'plan.items': [],
        'plan.carriedItems': [],
        'plan.carriedFromQuarter': null,
        'plan.planStatus': 'draft',
        'plan.planSubmittedAt': null,
        'plan.planApprovedAt': null,
        'plan.planRejectionReason': null,
        'plan.quarter': null,
        'plan.proofEntries': {},
        'plan.completedItemKeys': [],
        'plan.completionStatus': 'level_up_approved',
        'plan.completionSubmittedAt': null,
        'plan.completionRejectionReason': null,
        'plan.levelAchievedOnApproval': req.levelTo,
        'plan.lastUpdated': now,
      });

      const { getDoc } = await import('firebase/firestore');
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const existing = (userSnap.data().levelHistory as LevelHistoryEntry[]) ?? [];
        await updateDoc(userRef, { levelHistory: [...existing, newLevelEntry] });
      }

      const historyRef = doc(collection(userRef, 'planHistory'), req.quarter);
      await updateDoc(historyRef, {
        status: 'approved',
        resolvedAt: now,
        levelAchieved: req.levelTo,
        completedItemKeys: req.completedItemKeys,
      }).catch(() =>
        addDoc(collection(userRef, 'planHistory'), {
          quarter: req.quarter,
          status: 'approved',
          resolvedAt: now,
          levelAchieved: req.levelTo,
          completedItemKeys: req.completedItemKeys,
        })
      );

      await createNotification({
        userId: req.userId,
        type: 'level_up_approved',
        title: 'Level-Up Approved!',
        message: `Congratulations! Your level-up to Level ${req.levelTo} for ${req.quarter} has been approved.`,
        metadata: { levelFrom: req.levelFrom, levelTo: req.levelTo, quarter: req.quarter, requestId: req.id },
      });
      await createNotification({
        userId: req.teamLeaderId,
        type: 'level_up_approved',
        title: 'Level-Up Confirmed',
        message: `Admin approved ${req.userDisplayName}'s level-up to Level ${req.levelTo} (${req.quarter}).`,
        metadata: { levelFrom: req.levelFrom, levelTo: req.levelTo, quarter: req.quarter, employeeName: req.userDisplayName, requestId: req.id },
      });

      const emailBase = { createdAt: now };
      await addDoc(collection(db, 'emailQueue'), {
        ...emailBase,
        to: req.userEmail,
        message: {
          subject: `🎉 DCR Level-Up Approved — You're now Level ${req.levelTo}!`,
          html: `<h2>Congratulations, ${req.userDisplayName}!</h2><p>Your level-up request has been approved by an admin.</p><p><strong>New Level:</strong> Level ${req.levelTo}</p><p><strong>Quarter:</strong> ${req.quarter}</p>`,
        },
      });
      await addDoc(collection(db, 'emailQueue'), {
        ...emailBase,
        to: req.teamLeaderEmail,
        message: {
          subject: `DCR Level-Up Confirmed: ${req.userDisplayName} → Level ${req.levelTo}`,
          html: `<h2>Level-Up Confirmed</h2><p>An admin approved your recommendation for <strong>${req.userDisplayName}</strong>.</p><p><strong>Level:</strong> ${req.levelFrom} → ${req.levelTo}</p><p><strong>Quarter:</strong> ${req.quarter}</p>`,
        },
      });
      if (HR_EMAIL) {
        await addDoc(collection(db, 'emailQueue'), {
          ...emailBase,
          to: HR_EMAIL,
          message: {
            subject: `DCR Level-Up: ${req.userDisplayName} → Level ${req.levelTo}`,
            html: `<h2>DCR Level-Up Approved</h2><p><strong>Employee:</strong> ${req.userDisplayName} (${req.userEmail})</p><p><strong>Level:</strong> ${req.levelFrom} → ${req.levelTo}</p><p><strong>Quarter:</strong> ${req.quarter}</p><p><strong>Team Leader:</strong> ${req.teamLeaderName}</p>`,
          },
        });
      }
    } catch (err) {
      console.error('[PendingApprovalsTab] Error approving level-up:', err);
      alert('Failed to approve level-up. Please try again.');
    } finally {
      setProcessingIds((prev) => { const next = new Set(prev); next.delete(req.id); return next; });
    }
  };

  const handleRejectLevelUp = async (req: LevelUpRequest) => {
    if (!adminUid) return;
    const reason = prompt(`Why are you rejecting ${req.userDisplayName}'s level-up request? (Optional)`);
    if (reason === null) return;
    if (!confirm(`Reject ${req.userDisplayName}'s level-up request?`)) return;

    try {
      setProcessingIds((prev) => new Set(prev).add(req.id));
      const now = new Date().toISOString();
      const rejectionReason = reason || 'No reason provided';

      await updateDoc(doc(db, 'levelUpRequests', req.id), {
        status: 'rejected',
        resolvedAt: now,
        resolvedBy: adminUid,
        rejectionReason,
      });
      await updateDoc(doc(db, 'users', req.userId), {
        'plan.completionStatus': 'level_up_rejected',
        'plan.completionRejectionReason': rejectionReason,
      });
      await createNotification({
        userId: req.userId,
        type: 'level_up_rejected',
        title: 'Level-Up Not Approved',
        message: `Your level-up request for ${req.quarter} was not approved. Reason: ${rejectionReason}`,
        metadata: { levelFrom: req.levelFrom, levelTo: req.levelTo, quarter: req.quarter, requestId: req.id },
      });
      await createNotification({
        userId: req.teamLeaderId,
        type: 'level_up_rejected',
        title: 'Level-Up Rejected',
        message: `Admin rejected ${req.userDisplayName}'s level-up request for ${req.quarter}. Reason: ${rejectionReason}`,
        metadata: { levelFrom: req.levelFrom, levelTo: req.levelTo, quarter: req.quarter, employeeName: req.userDisplayName, requestId: req.id },
      });
    } catch (err) {
      console.error('[PendingApprovalsTab] Error rejecting level-up:', err);
      alert('Failed to reject level-up. Please try again.');
    } finally {
      setProcessingIds((prev) => { const next = new Set(prev); next.delete(req.id); return next; });
    }
  };

  const handleApproveInitial = async (member: UserDocument & { uid: string }) => {
    const level = member.currentLevel ?? 0;

    const memberAchievements = member.achieved?.items ?? [];
    const achievementNote =
      memberAchievements.length > 0
        ? ` and ${memberAchievements.length} historical achievement${memberAchievements.length !== 1 ? 's' : ''}`
        : '';

    if (!confirm(`Approve ${member.displayName} at Level ${level}${achievementNote}?`)) return;

    try {
      setProcessingIds((prev) => new Set(prev).add(member.uid));
      const now = new Date().toISOString();

      const userRef = doc(db, 'users', member.uid);

      const achievedUpdate = memberAchievements.length > 0
        ? {
            'achieved.items': memberAchievements.map((item) => ({ ...item, status: 'approved' })),
            'achieved.lastUpdated': now,
          }
        : {};

      const newLevelEntry: LevelHistoryEntry = { level, date: now, quarter: null };

      await updateDoc(userRef, {
        approvalStatus: 'approved',
        approvedAt: now,
        joinedCompanyAt: now,
        levelHistory: [newLevelEntry],
        ...achievedUpdate,
      });

      console.log('[PendingApprovalsTab] Approved member:', { uid: member.uid, level, achievements: memberAchievements.length });
    } catch (err) {
      console.error('[PendingApprovalsTab] Error approving member:', err);
      alert('Failed to approve member. Please try again.');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(member.uid);
        return next;
      });
    }
  };

  const handleRejectInitial = async (member: UserDocument & { uid: string }) => {
    const reason = prompt(`Why are you rejecting ${member.displayName}? (Optional)`);
    if (reason === null) return;
    if (!confirm(`Reject ${member.displayName}'s request to join your team?`)) return;

    try {
      setProcessingIds((prev) => new Set(prev).add(member.uid));

      const userRef = doc(db, 'users', member.uid);
      await updateDoc(userRef, {
        approvalStatus: 'rejected',
        teamLeaderId: null,
        rejectionReason: reason || 'No reason provided',
      });

      console.log('[PendingApprovalsTab] Rejected member:', { uid: member.uid, reason });
    } catch (err) {
      console.error('[PendingApprovalsTab] Error rejecting member:', err);
      alert('Failed to reject member. Please try again.');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(member.uid);
        return next;
      });
    }
  };

  const handleApprovePlan = async (member: UserDocument & { uid: string }) => {
    const planItems = member.plan?.items ?? [];
    const targetLevel = member.plan?.selectedLevelId;
    if (!confirm(`Approve ${member.displayName}'s quarterly plan (${planItems.length} item${planItems.length !== 1 ? 's' : ''})?`)) return;

    try {
      setProcessingIds((prev) => new Set(prev).add(member.uid));
      const now = new Date().toISOString();
      const quarter = getQuarterFromDate(member.plan?.planSubmittedAt);

      const userRef = doc(db, 'users', member.uid);
      const historyRef = doc(collection(userRef, 'planHistory'), quarter);

      const prevLevel = member.currentLevel ?? 0;
      const levelAchieved = targetLevel && targetLevel > prevLevel ? targetLevel : undefined;
      const newLevelEntry: LevelHistoryEntry | null = levelAchieved
        ? { level: levelAchieved, date: now, quarter }
        : null;

      const userUpdate: Record<string, unknown> = {
        'plan.planStatus': 'approved',
        'plan.planApprovedAt': now,
        'plan.planRejectionReason': null,
        'plan.levelAchievedOnApproval': levelAchieved ?? null,
      };
      if (levelAchieved) {
        userUpdate.currentLevel = levelAchieved;
        userUpdate.levelHistory = [
          ...(member.levelHistory ?? []),
          newLevelEntry,
        ];
      }

      await Promise.all([
        updateDoc(userRef, userUpdate),
        setDoc(historyRef, { status: 'approved', resolvedAt: now, levelAchieved: levelAchieved ?? null }, { merge: true }),
      ]);

      console.log('[PendingApprovalsTab] Approved quarterly plan:', { uid: member.uid, itemCount: planItems.length, levelAchieved });
    } catch (err) {
      console.error('[PendingApprovalsTab] Error approving plan:', err);
      alert('Failed to approve plan. Please try again.');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(member.uid);
        return next;
      });
    }
  };

  const handleRejectPlan = async (member: UserDocument & { uid: string }) => {
    const reason = prompt(`Why are you rejecting ${member.displayName}'s plan? (Optional)`);
    if (reason === null) return;
    if (!confirm(`Reject ${member.displayName}'s quarterly plan?`)) return;

    try {
      setProcessingIds((prev) => new Set(prev).add(member.uid));
      const now = new Date().toISOString();
      const quarter = getQuarterFromDate(member.plan?.planSubmittedAt);

      const userRef = doc(db, 'users', member.uid);
      const historyRef = doc(collection(userRef, 'planHistory'), quarter);
      const rejectionReason = reason || 'No reason provided';

      await Promise.all([
        updateDoc(userRef, {
          'plan.planStatus': 'rejected',
          'plan.planRejectionReason': rejectionReason,
        }),
        setDoc(historyRef, { status: 'rejected', resolvedAt: now, rejectionReason }, { merge: true }),
      ]);

      console.log('[PendingApprovalsTab] Rejected quarterly plan:', { uid: member.uid, reason });
    } catch (err) {
      console.error('[PendingApprovalsTab] Error rejecting plan:', err);
      alert('Failed to reject plan. Please try again.');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(member.uid);
        return next;
      });
    }
  };

  const handleApproveCompletion = async (member: UserDocument & { uid: string }) => {
    const plan = member.plan;
    const prevLevel = member.currentLevel ?? 0;
    const targetLevel = plan?.selectedLevelId || prevLevel + 1;
    if (targetLevel <= prevLevel) {
      alert('Cannot determine target level for this level-up. Please check the employee\'s plan.');
      return;
    }

    const completedItemKeys = plan?.completedItemKeys ?? [];
    const allPlanItems = plan?.items ?? [];
    const completedItems = allPlanItems.filter((item, idx) =>
      completedItemKeys.includes(item.planItemKey ?? `${item.id}-${idx}`)
    );

    if (!confirm(`Recommend level-up for ${member.displayName}? (Level ${prevLevel} → Level ${targetLevel})\n\nThis will send a final approval request to an admin.\n\n${completedItems.length} of ${allPlanItems.length} plan items marked as completed.`)) return;

    try {
      setProcessingIds((prev) => new Set(prev).add(member.uid));
      const now = new Date().toISOString();
      const quarter = getQuarterFromDate(plan?.completionSubmittedAt ?? plan?.planSubmittedAt);

      const userRef = doc(db, 'users', member.uid);

      await addDoc(collection(db, 'levelUpRequests'), {
        userId: member.uid,
        userDisplayName: member.displayName,
        userEmail: member.email,
        userPhotoURL: member.photoURL ?? null,
        teamLeaderId,
        teamLeaderName,
        teamLeaderEmail,
        levelFrom: prevLevel,
        levelTo: targetLevel,
        quarter,
        completedItemKeys,
        planItems: allPlanItems,
        proofEntries: plan?.proofEntries ?? {},
        status: 'pending',
        requestedAt: now,
      });

      await updateDoc(userRef, {
        'plan.completionStatus': 'admin_pending',
      });

      console.log('[PendingApprovalsTab] Level-up forwarded to admin:', { uid: member.uid, targetLevel });
    } catch (err) {
      console.error('[PendingApprovalsTab] Error recommending level-up:', err);
      alert('Failed to send level-up recommendation. Please try again.');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(member.uid);
        return next;
      });
    }
  };

  const handleRejectCompletion = async (member: UserDocument & { uid: string }) => {
    const reason = prompt(`Why are you rejecting ${member.displayName}'s level-up request? (Optional)`);
    if (reason === null) return;
    if (!confirm(`Reject ${member.displayName}'s level-up review? They will be able to fix and resubmit.`)) return;

    try {
      setProcessingIds((prev) => new Set(prev).add(member.uid));

      const userRef = doc(db, 'users', member.uid);
      await updateDoc(userRef, {
        'plan.completionStatus': 'level_up_rejected',
        'plan.completionRejectionReason': reason || 'No reason provided',
      });

      console.log('[PendingApprovalsTab] Rejected completion review:', { uid: member.uid, reason });
    } catch (err) {
      console.error('[PendingApprovalsTab] Error rejecting completion:', err);
      alert('Failed to reject level-up review. Please try again.');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(member.uid);
        return next;
      });
    }
  };

  if (pendingMembers.length === 0 && pendingLevelUps.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle2 />}
        title="All caught up!"
        description="No pending approval requests at the moment."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground tracking-tight">
          <Clock className="size-4 text-muted-foreground" />
          Pending Approvals
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {adminUid
            ? 'Review level-up requests recommended by team leaders.'
            : "Review each employee's submitted level and historical certifications, then approve or reject."}
        </p>
      </div>

      {!adminUid && pendingMembers.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {pendingMembers.map((member) => (
            <PendingMemberCard
              key={member.uid}
              member={member}
              isProcessing={processingIds.has(member.uid)}
              isCompletion={isCompletionReview(member)}
              isQuarterly={isQuarterlyPlan(member)}
              expandedProofKey={expandedProofKey}
              onToggleProofs={toggleProofs}
              checkPlanRequirements={checkPlanRequirements}
              onApproveInitial={handleApproveInitial}
              onRejectInitial={handleRejectInitial}
              onApprovePlan={handleApprovePlan}
              onRejectPlan={handleRejectPlan}
              onApproveCompletion={handleApproveCompletion}
              onRejectCompletion={handleRejectCompletion}
            />
          ))}
        </div>
      )}

      {pendingLevelUps.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Medal className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Level-Up Approvals
            </h3>
            <Badge variant="secondary" size="sm">
              {pendingLevelUps.length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {pendingLevelUps.map((req) => (
              <LevelUpApprovalCard
                key={req.id}
                req={req}
                isProcessing={processingIds.has(req.id)}
                expandedProofKey={expandedProofKey}
                onToggleProofs={toggleProofs}
                onApprove={handleApproveLevelUp}
                onReject={handleRejectLevelUp}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Card subcomponents ──────────────────────────────────────────────── */

interface PendingMemberCardProps {
  member: UserDocument & { uid: string };
  isProcessing: boolean;
  isCompletion: boolean;
  isQuarterly: boolean;
  expandedProofKey: string | null;
  onToggleProofs: (key: string) => void;
  checkPlanRequirements: (
    items: CatalogItem[],
    targetLevelId: number,
    carryOverPoints?: number,
  ) => { meetsRequirements: boolean; shortfalls: string[]; level: { id: number; label: string } } | null;
  onApproveInitial: (m: UserDocument & { uid: string }) => void;
  onRejectInitial: (m: UserDocument & { uid: string }) => void;
  onApprovePlan: (m: UserDocument & { uid: string }) => void;
  onRejectPlan: (m: UserDocument & { uid: string }) => void;
  onApproveCompletion: (m: UserDocument & { uid: string }) => void;
  onRejectCompletion: (m: UserDocument & { uid: string }) => void;
}

function PendingMemberCard({
  member,
  isProcessing,
  isCompletion,
  isQuarterly,
  expandedProofKey,
  onToggleProofs,
  checkPlanRequirements,
  onApproveInitial,
  onRejectInitial,
  onApprovePlan,
  onRejectPlan,
  onApproveCompletion,
  onRejectCompletion,
}: PendingMemberCardProps) {
  if (isCompletion) {
    return (
      <CompletionReviewCard
        member={member}
        isProcessing={isProcessing}
        expandedProofKey={expandedProofKey}
        onToggleProofs={onToggleProofs}
        checkPlanRequirements={checkPlanRequirements}
        onApprove={onApproveCompletion}
        onReject={onRejectCompletion}
      />
    );
  }
  if (isQuarterly) {
    return (
      <QuarterlyPlanCard
        member={member}
        isProcessing={isProcessing}
        expandedProofKey={expandedProofKey}
        onToggleProofs={onToggleProofs}
        checkPlanRequirements={checkPlanRequirements}
        onApprove={onApprovePlan}
        onReject={onRejectPlan}
      />
    );
  }
  return (
    <InitialRegistrationCard
      member={member}
      isProcessing={isProcessing}
      onApprove={onApproveInitial}
      onReject={onRejectInitial}
    />
  );
}

function MemberCardHeader({
  member,
  badge,
  date,
  dateLabel = 'Submitted',
}: {
  member: UserDocument & { uid: string };
  badge: ReactNode;
  date?: string;
  dateLabel?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Avatar src={member.photoURL} name={member.displayName} size="lg" />
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-semibold text-foreground">{member.displayName}</h3>
          {badge}
        </div>
        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
        {date && (
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="size-3.5" />
            {dateLabel} {formatDate(date)}
          </p>
        )}
      </div>
    </div>
  );
}

function ApprovalCardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      {children}
    </div>
  );
}

function SubmissionLabel({ icon, children, count }: { icon: ReactNode; children: ReactNode; count?: number }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground [&_svg]:size-3.5">
      {icon}
      <span>{children}</span>
      {count != null && (
        <Badge variant="secondary" size="sm">
          {count}
        </Badge>
      )}
    </div>
  );
}

function LevelArrowBadge({ from, to }: { from: number | null | undefined; to: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5">
      {from != null && (
        <>
          <Badge variant="default" size="sm">{from}</Badge>
          <ArrowRight className="size-3.5 text-muted-foreground" />
        </>
      )}
      <Badge variant="primary" size="sm">Level {to}</Badge>
    </div>
  );
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
              className="inline-flex items-center gap-1.5 text-primary hover:underline break-all"
            >
              <ExternalLink className="size-3.5 shrink-0" />
              <span>{p.url}</span>
            </a>
          )}
          {p.type === 'file' && p.fileUrl && (
            <a
              href={p.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              <Paperclip className="size-3.5" />
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

interface PillarItemRowProps {
  itemKey: string;
  name: string;
  points: number;
  done?: boolean | null;
  proofs?: ProofEntry[];
  proofKey?: string;
  expandedProofKey: string | null;
  onToggleProofs: (key: string) => void;
}

function PillarItemRow({
  itemKey,
  name,
  points,
  done,
  proofs = [],
  proofKey,
  expandedProofKey,
  onToggleProofs,
}: PillarItemRowProps) {
  const proofExpanded = proofKey != null && expandedProofKey === proofKey;
  const showStatusIcon = done != null;
  return (
    <li
      key={itemKey}
      className={cn(
        'flex flex-col gap-1.5 rounded-xl border px-3 py-2 transition-colors',
        done === true && 'border-green-600/30 bg-green-600/5',
        done === false && 'border-border bg-muted/20',
        !showStatusIcon && 'border-border bg-muted/10',
      )}
    >
      <div className="flex items-center gap-2">
        {showStatusIcon &&
          (done ? (
            <CheckCircle2 className="size-4 text-green-600 dark:text-green-400 shrink-0" />
          ) : (
            <Circle className="size-4 text-muted-foreground shrink-0" />
          ))}
        <span className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">{name}</span>
        <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">{points} pts</span>
        {proofs.length > 0 && proofKey && (
          <button
            type="button"
            onClick={() => onToggleProofs(proofKey)}
            className={cn(
              'inline-flex items-center gap-1 rounded-lg px-2 h-7 text-xs font-medium transition-colors',
              proofExpanded
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/40 text-muted-foreground hover:bg-muted',
            )}
            aria-label={proofExpanded ? 'Hide attachments' : 'View attachments'}
          >
            <Paperclip className="size-3" />
            {proofs.length}
            {proofExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
        )}
      </div>
      {proofExpanded && <ProofEntries proofs={proofs} />}
    </li>
  );
}

interface PillarGroupedItemsProps {
  items: { item: CatalogItem; itemKey: string; done?: boolean | null }[];
  proofEntries?: Record<string, ProofEntry[]>;
  proofKeyPrefix: string;
  expandedProofKey: string | null;
  onToggleProofs: (key: string) => void;
}

function PillarGroupedItems({
  items,
  proofEntries = {},
  proofKeyPrefix,
  expandedProofKey,
  onToggleProofs,
}: PillarGroupedItemsProps) {
  return (
    <div className="flex flex-col gap-3">
      {PILLAR_ORDER.filter((p) => items.some(({ item }) => item.category === p)).map((pillar) => (
        <div key={pillar} className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {PILLAR_ICON[pillar]}
            {PILLAR_LABEL[pillar] ?? pillar}
          </div>
          <ul className="flex flex-col gap-1.5">
            {items
              .filter(({ item }) => item.category === pillar)
              .map(({ item, itemKey, done }) => {
                const proofs = proofEntries[itemKey] ?? [];
                const proofKey = `${proofKeyPrefix}-${itemKey}`;
                return (
                  <PillarItemRow
                    key={itemKey}
                    itemKey={itemKey}
                    name={item.name}
                    points={item.promotedPoints ?? item.points}
                    done={done}
                    proofs={proofs}
                    proofKey={proofKey}
                    expandedProofKey={expandedProofKey}
                    onToggleProofs={onToggleProofs}
                  />
                );
              })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function RequirementsWarning({
  shortfalls,
  title,
}: {
  shortfalls: string[];
  title: string;
}) {
  return (
    <Alert variant="warning" icon={<AlertTriangle className="size-4" />} title={title}>
      <ul className="mt-1 list-disc pl-4 space-y-0.5">
        {shortfalls.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </Alert>
  );
}

function ApprovalActions({
  approveLabel,
  approveIcon,
  rejectLabel = 'Reject',
  rejectIcon,
  isProcessing,
  onApprove,
  onReject,
}: {
  approveLabel: ReactNode;
  approveIcon: ReactNode;
  rejectLabel?: ReactNode;
  rejectIcon?: ReactNode;
  isProcessing: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <Button onClick={onApprove} disabled={isProcessing}>
        {isProcessing ? (
          <>
            <span className="size-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
            Processing…
          </>
        ) : (
          <>
            {approveIcon}
            {approveLabel}
          </>
        )}
      </Button>
      <Button variant="destructive" onClick={onReject} disabled={isProcessing}>
        {rejectIcon ?? <X />}
        {rejectLabel}
      </Button>
    </div>
  );
}

/* ── Card variants ───────────────────────────────────────────────────── */

function InitialRegistrationCard({
  member,
  isProcessing,
  onApprove,
  onReject,
}: {
  member: UserDocument & { uid: string };
  isProcessing: boolean;
  onApprove: (m: UserDocument & { uid: string }) => void;
  onReject: (m: UserDocument & { uid: string }) => void;
}) {
  const memberAchievements = member.achieved?.items ?? [];

  return (
    <ApprovalCardShell>
      <MemberCardHeader
        member={member}
        badge={
          <Badge variant="primary" size="sm">
            <UserPlus className="size-3" /> Initial Registration
          </Badge>
        }
        date={member.createdAt}
        dateLabel="Requested"
      />

      <div className="flex flex-col gap-2">
        <SubmissionLabel icon={<UserCircle />}>Self-reported level</SubmissionLabel>
        <div>
          <Badge variant="primary" size="lg">Level {member.currentLevel ?? 0}</Badge>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <SubmissionLabel
          icon={<Trophy />}
          count={memberAchievements.length > 0 ? memberAchievements.length : undefined}
        >
          Historical certifications
        </SubmissionLabel>
        {memberAchievements.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {memberAchievements.map((a) => (
              <li
                key={a.itemId}
                className="flex flex-col gap-1 rounded-xl border border-border bg-muted/10 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">
                    {a.item.name}
                  </span>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                    {a.item.points} pts
                  </span>
                </div>
                {(a.completionDate || a.proofLink) && (
                  <div className="flex items-center gap-3 pl-0 text-xs text-muted-foreground">
                    {a.completionDate && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3" />
                        {formatDate(a.completionDate)}
                      </span>
                    )}
                    {a.proofLink && (
                      <a
                        href={a.proofLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="size-3" />
                        Attachment
                      </a>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground italic">None submitted</p>
        )}
      </div>

      <ApprovalActions
        approveLabel={`Approve Level ${member.currentLevel ?? 0}`}
        approveIcon={<Check />}
        isProcessing={isProcessing}
        onApprove={() => onApprove(member)}
        onReject={() => onReject(member)}
      />
    </ApprovalCardShell>
  );
}

function QuarterlyPlanCard({
  member,
  isProcessing,
  expandedProofKey,
  onToggleProofs,
  checkPlanRequirements,
  onApprove,
  onReject,
}: {
  member: UserDocument & { uid: string };
  isProcessing: boolean;
  expandedProofKey: string | null;
  onToggleProofs: (key: string) => void;
  checkPlanRequirements: PendingMemberCardProps['checkPlanRequirements'];
  onApprove: (m: UserDocument & { uid: string }) => void;
  onReject: (m: UserDocument & { uid: string }) => void;
}) {
  const planItems = member.plan?.items ?? [];
  const planItemsWithKeys = planItems.map((item, idx) => ({
    item,
    itemKey: item.planItemKey ?? `${item.id}-${idx}`,
  }));
  const planCarriedItems = member.plan?.carriedItems ?? [];
  const planCarryOverPoints = member.plan?.carryOverPoints ?? 0;
  const allPlanItems = [...planCarriedItems, ...planItems];
  const totalPlanPoints =
    allPlanItems.reduce((sum, item) => sum + (item.promotedPoints ?? item.points), 0) + planCarryOverPoints;
  const targetLevel = member.currentLevel != null ? member.currentLevel + 1 : null;
  const reqCheck = targetLevel ? checkPlanRequirements(allPlanItems, targetLevel, planCarryOverPoints) : null;
  const newItemsTotal = planItems.reduce((s, i) => s + (i.promotedPoints ?? i.points), 0);

  return (
    <ApprovalCardShell>
      <MemberCardHeader
        member={member}
        badge={
          <Badge variant="secondary" size="sm">
            <Calendar className="size-3" /> Quarterly Plan
          </Badge>
        }
        date={member.plan?.planSubmittedAt}
      />

      <div className="flex flex-col gap-2">
        <SubmissionLabel icon={<UserCircle />}>Target level</SubmissionLabel>
        {targetLevel != null ? (
          <div>
            <LevelArrowBadge from={member.currentLevel} to={targetLevel} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Not set</p>
        )}
      </div>

      {planCarriedItems.length > 0 && (
        <div className="flex flex-col gap-2">
          <SubmissionLabel icon={<Lock />} count={planCarriedItems.length}>
            Carried from {member.plan?.carriedFromQuarter ?? 'previous quarter'}
          </SubmissionLabel>
          <ul className="flex flex-col gap-1.5">
            {planCarriedItems.map((item) => (
              <PillarItemRow
                key={item.id}
                itemKey={item.id}
                name={item.name}
                points={item.promotedPoints ?? item.points}
                done={true}
                expandedProofKey={null}
                onToggleProofs={() => undefined}
              />
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Carried:{' '}
            <span className="font-semibold text-foreground tabular-nums">
              {planCarriedItems.reduce((s, i) => s + (i.promotedPoints ?? i.points), 0)} pts
            </span>
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <SubmissionLabel
          icon={<ListChecks />}
          count={planItems.length > 0 ? planItems.length : undefined}
        >
          Planned items
        </SubmissionLabel>
        {planItemsWithKeys.length > 0 ? (
          <>
            <PillarGroupedItems
              items={planItemsWithKeys}
              proofEntries={member.plan?.proofEntries}
              proofKeyPrefix={`${member.uid}-plan`}
              expandedProofKey={expandedProofKey}
              onToggleProofs={onToggleProofs}
            />
            <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
              <p>
                {planCarriedItems.length > 0 || planCarryOverPoints > 0 ? 'New items: ' : 'Total: '}
                <span className="font-semibold text-foreground tabular-nums">{newItemsTotal} pts</span>
              </p>
              {planCarryOverPoints > 0 && (
                <p>
                  Previous level points:{' '}
                  <span className="font-semibold text-foreground tabular-nums">{planCarryOverPoints} pts</span>
                </p>
              )}
              {(planCarriedItems.length > 0 || planCarryOverPoints > 0) && (
                <p>
                  Combined total:{' '}
                  <span className="font-semibold text-foreground tabular-nums">{totalPlanPoints} pts</span>
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            {planCarriedItems.length > 0 ? 'No additional items' : 'No items in plan'}
          </p>
        )}
      </div>

      {reqCheck && !reqCheck.meetsRequirements && (
        <RequirementsWarning
          title={`Plan is insufficient for ${reqCheck.level.label}`}
          shortfalls={reqCheck.shortfalls}
        />
      )}

      <ApprovalActions
        approveLabel="Approve Plan"
        approveIcon={<Check />}
        isProcessing={isProcessing}
        onApprove={() => onApprove(member)}
        onReject={() => onReject(member)}
      />
    </ApprovalCardShell>
  );
}

function CompletionReviewCard({
  member,
  isProcessing,
  expandedProofKey,
  onToggleProofs,
  checkPlanRequirements,
  onApprove,
  onReject,
}: {
  member: UserDocument & { uid: string };
  isProcessing: boolean;
  expandedProofKey: string | null;
  onToggleProofs: (key: string) => void;
  checkPlanRequirements: PendingMemberCardProps['checkPlanRequirements'];
  onApprove: (m: UserDocument & { uid: string }) => void;
  onReject: (m: UserDocument & { uid: string }) => void;
}) {
  const plan = member.plan;
  const allPlanItems = plan?.items ?? [];
  const allPlanItemsWithKeys = allPlanItems.map((item, idx) => ({
    item,
    itemKey: item.planItemKey ?? `${item.id}-${idx}`,
  }));
  const completedItemKeys = plan?.completedItemKeys ?? [];
  const completedItems = allPlanItems.filter((item, idx) => {
    const itemKey = item.planItemKey ?? `${item.id}-${idx}`;
    return completedItemKeys.includes(itemKey);
  });
  const planCarryOverPoints = plan?.carryOverPoints ?? 0;
  const completedPts = completedItems.reduce((s, i) => s + (i.promotedPoints ?? i.points), 0);
  const totalCompletedPts = completedPts + planCarryOverPoints;
  const prevLevel = member.currentLevel ?? 0;
  const targetLevel = plan?.selectedLevelId || prevLevel + 1;
  const reqCheck = checkPlanRequirements(completedItems, targetLevel, planCarryOverPoints);
  const itemsWithStatus = allPlanItemsWithKeys.map(({ item, itemKey }) => ({
    item,
    itemKey,
    done: completedItemKeys.includes(itemKey),
  }));

  return (
    <ApprovalCardShell>
      <MemberCardHeader
        member={member}
        badge={
          <Badge variant="warning" size="sm">
            <Medal className="size-3" /> Level-Up Review
          </Badge>
        }
        date={plan?.completionSubmittedAt}
      />

      <div className="flex flex-col gap-2">
        <SubmissionLabel icon={<UserCircle />}>Requesting level-up</SubmissionLabel>
        {targetLevel ? (
          <div>
            <LevelArrowBadge from={prevLevel} to={targetLevel} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Not set</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <SubmissionLabel icon={<CheckCheck />}>
          Completed items
          <Badge variant="secondary" size="sm" className="ml-1">
            {completedItems.length}/{allPlanItems.length}
          </Badge>
        </SubmissionLabel>
        {allPlanItemsWithKeys.length > 0 ? (
          <PillarGroupedItems
            items={itemsWithStatus}
            proofEntries={plan?.proofEntries}
            proofKeyPrefix={member.uid}
            expandedProofKey={expandedProofKey}
            onToggleProofs={onToggleProofs}
          />
        ) : (
          <p className="text-sm text-muted-foreground italic">No items in plan</p>
        )}
        {allPlanItemsWithKeys.length > 0 && (
          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
            <p>
              {planCarryOverPoints > 0 ? 'Completed items: ' : 'Total completed: '}
              <span className="font-semibold text-foreground tabular-nums">{completedPts} pts</span>
            </p>
            {planCarryOverPoints > 0 && (
              <>
                <p>
                  Previous level carry-over:{' '}
                  <span className="font-semibold text-foreground tabular-nums">{planCarryOverPoints} pts</span>
                </p>
                <p>
                  Combined total:{' '}
                  <span className="font-semibold text-foreground tabular-nums">{totalCompletedPts} pts</span>
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {reqCheck && !reqCheck.meetsRequirements && (
        <RequirementsWarning
          title={`Completed items may not meet ${reqCheck.level.label} requirements`}
          shortfalls={reqCheck.shortfalls}
        />
      )}

      <ApprovalActions
        approveLabel="Recommend Level-Up"
        approveIcon={<Send />}
        rejectLabel="Request Revision"
        isProcessing={isProcessing}
        onApprove={() => onApprove(member)}
        onReject={() => onReject(member)}
      />
    </ApprovalCardShell>
  );
}

function LevelUpApprovalCard({
  req,
  isProcessing,
  expandedProofKey,
  onToggleProofs,
  onApprove,
  onReject,
}: {
  req: LevelUpRequest;
  isProcessing: boolean;
  expandedProofKey: string | null;
  onToggleProofs: (key: string) => void;
  onApprove: (req: LevelUpRequest) => void;
  onReject: (req: LevelUpRequest) => void;
}) {
  const itemsWithStatus = (req.planItems ?? []).map((item, idx) => {
    const itemKey = item.planItemKey ?? `${item.id}-${idx}`;
    return {
      item,
      itemKey,
      done: req.completedItemKeys.includes(itemKey),
    };
  });

  return (
    <ApprovalCardShell>
      <div className="flex items-start gap-3">
        <Avatar src={req.userPhotoURL} name={req.userDisplayName} size="lg" />
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-foreground">{req.userDisplayName}</h3>
            <Badge variant="warning" size="sm">
              <Medal className="size-3" /> Level-Up Request
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">{req.userEmail}</p>
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="size-3.5" />
            {req.quarter} · Recommended by {req.teamLeaderName} on {formatDate(req.requestedAt)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <SubmissionLabel icon={<UserCircle />}>Level-up</SubmissionLabel>
        <div>
          <LevelArrowBadge from={req.levelFrom} to={req.levelTo} />
        </div>
      </div>

      {req.planItems && req.planItems.length > 0 && (
        <div className="flex flex-col gap-2">
          <SubmissionLabel icon={<CheckCheck />}>
            Completed items
            <Badge variant="secondary" size="sm" className="ml-1">
              {req.completedItemKeys.length}/{req.planItems.length}
            </Badge>
          </SubmissionLabel>
          <PillarGroupedItems
            items={itemsWithStatus}
            proofEntries={req.proofEntries ?? {}}
            proofKeyPrefix={`lu-${req.id}`}
            expandedProofKey={expandedProofKey}
            onToggleProofs={onToggleProofs}
          />
        </div>
      )}

      <ApprovalActions
        approveLabel="Approve Level-Up"
        approveIcon={<CheckCircle2 />}
        isProcessing={isProcessing}
        onApprove={() => onApprove(req)}
        onReject={() => onReject(req)}
      />
    </ApprovalCardShell>
  );
}
