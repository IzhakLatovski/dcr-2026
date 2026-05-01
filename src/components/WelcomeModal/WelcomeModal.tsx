import { useState, useEffect } from 'react';
import { Users, MessageSquare, Send, AlertCircle, Info, RotateCw } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { UserDocument } from '../../data/types';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface WelcomeModalProps {
  onSelectTeamLeader: (teamLeaderId: string, message?: string) => Promise<void>;
}

interface TeamLeader {
  uid: string;
  displayName: string;
  photoURL: string | null;
  email: string;
}

export function WelcomeModal({ onSelectTeamLeader }: WelcomeModalProps) {
  const [teamLeaders, setTeamLeaders] = useState<TeamLeader[]>([]);
  const [selectedTeamLeaderId, setSelectedTeamLeaderId] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamLeaders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'team_leader'));
        const snapshot = await getDocs(q);
        const leaders = snapshot.docs.map((doc) => {
          const data = doc.data() as UserDocument;
          return {
            uid: doc.id,
            displayName: data.displayName,
            photoURL: data.photoURL,
            email: data.email,
          };
        });
        leaders.sort((a, b) => a.displayName.localeCompare(b.displayName));
        setTeamLeaders(leaders);
        setIsLoading(false);
      } catch (err) {
        console.error('[WelcomeModal] Error fetching team leaders:', err);
        setError('Failed to load team leaders. Please refresh the page.');
        setIsLoading(false);
      }
    };
    fetchTeamLeaders();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamLeaderId) {
      setError('Please select a team leader');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      await onSelectTeamLeader(selectedTeamLeaderId, message || undefined);
    } catch (err) {
      console.error('[WelcomeModal] Error submitting:', err);
      setError('Failed to submit. Please try again.');
      setIsSubmitting(false);
    }
  };

  const teamLeaderOptions = teamLeaders.map((tl) => ({ value: tl.uid, label: tl.displayName }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card text-card-foreground shadow-xl animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-4 text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground [&_svg]:size-6">
            <Users />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome to DCR 2.0!
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs">
            Let's get you started by connecting you with your team leader
          </p>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="size-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">Loading team leaders…</p>
            </div>
          ) : error && teamLeaders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
              <AlertCircle className="size-6 text-destructive" />
              <p className="text-sm text-foreground text-center">{error}</p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <RotateCw className="size-3.5" /> Refresh Page
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Users className="size-3.5" />
                  Who is your team leader?
                  <span className="text-destructive">*</span>
                </label>
                <Select
                  options={teamLeaderOptions}
                  value={selectedTeamLeaderId}
                  onValueChange={(v) => {
                    setSelectedTeamLeaderId(v);
                    setError(null);
                  }}
                  placeholder="Select a team leader…"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="message"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  <MessageSquare className="size-3.5" />
                  Message to team leader (optional)
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 200))}
                  rows={3}
                  maxLength={200}
                  placeholder="Hi! I'm joining the team and looking forward to working with you..."
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all duration-200 focus:border-primary focus:ring-3 focus:ring-ring/30 resize-none"
                />
                <div className="text-right text-xs text-muted-foreground tabular-nums">
                  {message.length}/200
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-foreground">
                  <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="default"
                size="lg"
                disabled={isSubmitting || !selectedTeamLeaderId}
              >
                {isSubmitting ? (
                  <>
                    <div className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Request to Join Team
                  </>
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-3 bg-muted/20 text-center">
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="size-3.5" />
            Your team leader will review and approve your request
          </p>
        </div>
      </div>
    </div>
  );
}
