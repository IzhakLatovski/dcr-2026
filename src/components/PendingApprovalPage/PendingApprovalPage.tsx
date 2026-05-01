import { useState, useEffect } from 'react';
import {
  Clock,
  User,
  ShieldCheck,
  Calendar,
  Mail,
  Lightbulb,
  Check,
  Gamepad2,
  UserCog,
  LogOut,
  Info,
  AlertCircle,
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import type { UserDocument } from '../../data/types';
import { Button } from '@/components/ui/button';

interface PendingApprovalPageProps {
  teamLeaderId: string;
  requestDate: string;
  onChangeTeamLeader: () => void;
  onUseSimulator: () => void;
}

export function PendingApprovalPage({
  teamLeaderId,
  requestDate,
  onChangeTeamLeader,
  onUseSimulator,
}: PendingApprovalPageProps) {
  const [teamLeader, setTeamLeader] = useState<UserDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeamLeader = async () => {
      try {
        setIsLoading(true);
        const teamLeaderRef = doc(db, 'users', teamLeaderId);
        const teamLeaderDoc = await getDoc(teamLeaderRef);
        if (teamLeaderDoc.exists()) {
          setTeamLeader(teamLeaderDoc.data() as UserDocument);
        }
        setIsLoading(false);
      } catch (err) {
        console.error('[PendingApprovalPage] Error:', err);
        setIsLoading(false);
      }
    };
    fetchTeamLeader();
  }, [teamLeaderId]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('[PendingApprovalPage] Sign out error:', err);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-2xl rounded-3xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
        {/* Status icon header */}
        <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-4 text-center">
          <div className="relative">
            <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 [&_svg]:size-7">
              <Clock />
            </span>
            <span className="absolute inset-0 rounded-2xl bg-amber-500/20 animate-ping" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Approval Pending
          </h1>
          <p className="text-sm text-muted-foreground">
            Your request to join a team is being reviewed
          </p>
        </div>

        <div className="flex flex-col gap-4 px-6 pb-6">
          {/* Team leader info */}
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-muted/30 p-6">
              <div className="size-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">Loading team leader information…</p>
            </div>
          ) : teamLeader ? (
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-muted/30 p-4">
              <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary overflow-hidden [&_svg]:size-5">
                {teamLeader.photoURL ? (
                  <img
                    src={teamLeader.photoURL}
                    alt={teamLeader.displayName}
                    referrerPolicy="no-referrer"
                    className="size-full object-cover"
                  />
                ) : (
                  <User />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-foreground truncate">
                  {teamLeader.displayName}
                </h3>
                <p className="text-sm text-muted-foreground truncate">{teamLeader.email}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  <ShieldCheck className="size-3.5" /> Team Leader
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-foreground">
              <AlertCircle className="size-4 text-destructive shrink-0" />
              Could not load team leader information
            </div>
          )}

          {/* Request info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
              <Calendar className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Request sent
                </p>
                <p className="text-sm font-semibold text-foreground">{formatDate(requestDate)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
              <Mail className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </p>
                <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400">
                  <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                  Waiting for approval
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="flex flex-col gap-3 rounded-2xl bg-primary/5 border border-primary/20 p-4">
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <Lightbulb className="size-4 text-primary" />
              What happens next?
            </h3>
            <ul className="flex flex-col gap-2 text-sm text-foreground/90">
              {[
                "Your team leader will review your submitted level and certifications",
                "Once approved, you'll gain full access to DCR 2.0",
                "You'll be able to track achievements and plan quarterly goals",
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="size-4 text-primary shrink-0 mt-0.5" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* Simulator note */}
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-4">
            <Gamepad2 className="size-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                In the meantime, feel free to explore the <strong>Simulator</strong> and plan your certification path
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onUseSimulator}>
              <Gamepad2 className="size-3.5" /> Try the Simulator
            </Button>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="default" onClick={onChangeTeamLeader}>
              <UserCog className="size-4" /> Change submitted info
            </Button>
            <Button variant="ghost" size="default" onClick={handleSignOut}>
              <LogOut className="size-4" /> Sign Out
            </Button>
          </div>
        </div>

        <div className="border-t border-border px-6 py-3 bg-muted/20">
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="size-3.5" />
            This page will automatically update when your request is approved
          </p>
        </div>
      </div>
    </div>
  );
}
