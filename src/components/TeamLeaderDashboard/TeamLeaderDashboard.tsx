import { useState, useMemo } from 'react';
import { Users, UserCircle, Clock, Medal, Settings, AlertCircle, RotateCw, ShieldCheck } from 'lucide-react';
import { useTeamMembers } from '../../hooks/useTeamMembers';
import { useLevelUpRequests } from '../../hooks/useLevelUpRequests';
import { PendingApprovalsTab } from './PendingApprovalsTab';
import { MyTeamTab } from './MyTeamTab';
import { LevelUpsTab, type LevelUpHistoryRow } from './LevelUpsTab';
import { QuarterSettingsTab } from './QuarterSettingsTab';
import type { UserDocument } from '../../data/types';
import { StatCard } from '@/components/composed/stat-card';
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TeamLeaderDashboardProps {
  userId: string;
  userDisplayName?: string;
  userEmail?: string;
  isAdmin?: boolean;
}

type TabId = 'pending' | 'team' | 'levelups' | 'settings';

export function TeamLeaderDashboard({
  userId,
  userDisplayName = '',
  userEmail = '',
  isAdmin = false,
}: TeamLeaderDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('team');
  const { teamMembers, teamLeaders, isLoading, error } = useTeamMembers(userId, isAdmin);
  const { requests: levelUpRequests, isLoading: levelUpsLoading } = useLevelUpRequests(userId, isAdmin);
  const pendingLevelUps = levelUpRequests.filter((r) => r.status === 'pending');

  const pendingMembers = isAdmin
    ? teamLeaders.filter((tl) => tl.plan?.planStatus === 'pending')
    : ([
        ...teamMembers.filter((m) => m.approvalStatus === 'pending'),
        ...teamMembers.filter((m) => m.approvalStatus === 'approved' && m.plan?.planStatus === 'pending'),
        ...teamMembers.filter((m) => m.approvalStatus === 'approved' && m.plan?.completionStatus === 'pending_review'),
      ] as (UserDocument & { uid: string })[]);
  const approvedMembers = teamMembers.filter((m) => m.approvalStatus === 'approved') as (UserDocument & { uid: string })[];
  const teamsCount = new Set(approvedMembers.map((m) => m.teamLeaderId).filter(Boolean)).size;

  const allLevelHistory = useMemo<LevelUpHistoryRow[] | undefined>(() => {
    if (!isAdmin) return undefined;
    const allUsers = [
      ...approvedMembers.map((u) => ({ ...u, role: 'employee' as const })),
      ...teamLeaders.map((u) => ({ ...u, role: 'team_leader' as const })),
    ];
    const rows: LevelUpHistoryRow[] = [];
    for (const user of allUsers) {
      const history = user.levelHistory ?? [];
      history.forEach((entry, idx) => {
        rows.push({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          role: user.role,
          levelFrom: idx > 0 ? history[idx - 1].level : null,
          levelTo: entry.level,
          date: entry.date,
          quarter: entry.quarter,
        });
      });
    }
    return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [isAdmin, approvedMembers, teamLeaders]);

  const pendingCount = isAdmin ? pendingLevelUps.length : pendingMembers.length;

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary [&_svg]:size-5">
            {isAdmin ? <ShieldCheck /> : <Users />}
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {isAdmin ? 'Admin Dashboard' : 'Team Dashboard'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? 'Manage all employees and approvals across all teams'
                : 'Manage your team members and approvals'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {isAdmin ? (
            <>
              <StatCard icon={<UserCircle />} iconTint="primary" value={teamsCount} label="Teams" />
              <StatCard icon={<Users />} iconTint="success" value={approvedMembers.length} label="Employees" />
              <StatCard icon={<Users />} iconTint="muted" value={teamsCount + approvedMembers.length} label="Total Members" />
            </>
          ) : (
            <StatCard icon={<Users />} iconTint="primary" value={approvedMembers.length} label="Team Members" />
          )}
          <StatCard
            icon={<Clock />}
            iconTint={pendingCount > 0 ? 'warning' : 'muted'}
            value={pendingCount}
            label="Pending Approvals"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="team"
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabId)}
      >
        <TabList className="flex-wrap">
          <Tab value="team">
            <Users className="size-3.5 mr-1" />
            {isAdmin ? 'All Teams' : 'My Team'}
            {(isAdmin ? teamsCount : approvedMembers.length) > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
                ({isAdmin ? teamsCount : approvedMembers.length})
              </span>
            )}
          </Tab>
          <Tab value="pending">
            <Clock className="size-3.5 mr-1" />
            Pending Approvals
            {pendingCount > 0 && (
              <Badge variant="destructive" size="sm" className="ml-1.5">
                {pendingCount}
              </Badge>
            )}
          </Tab>
          <Tab value="levelups">
            <Medal className="size-3.5 mr-1" />
            Level Ups
            {!isAdmin && pendingLevelUps.length > 0 && (
              <Badge variant="destructive" size="sm" className="ml-1.5">
                {pendingLevelUps.length}
              </Badge>
            )}
          </Tab>
          {isAdmin && (
            <Tab value="settings">
              <Settings className="size-3.5 mr-1" />
              Settings
            </Tab>
          )}
        </TabList>

        {/* Content */}
        {isLoading ? (
          <div className="mt-4 flex items-center justify-center gap-3 rounded-2xl border border-border bg-card p-12">
            <div className="size-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">Loading team members…</p>
          </div>
        ) : error ? (
          <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-8">
            <AlertCircle className="size-6 text-destructive" />
            <p className="text-sm text-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RotateCw className="size-3.5" /> Retry
            </Button>
          </div>
        ) : (
          <>
            <TabPanel value="pending">
              <PendingApprovalsTab
                pendingMembers={pendingMembers}
                teamLeaderId={userId}
                teamLeaderName={userDisplayName}
                teamLeaderEmail={userEmail}
                pendingLevelUps={isAdmin ? pendingLevelUps : undefined}
                adminUid={isAdmin ? userId : undefined}
              />
            </TabPanel>
            <TabPanel value="team">
              <MyTeamTab
                approvedMembers={approvedMembers}
                isAdmin={isAdmin}
                teamLeaders={teamLeaders}
              />
            </TabPanel>
            <TabPanel value="levelups">
              <LevelUpsTab
                requests={isAdmin ? [] : levelUpRequests}
                isLoading={levelUpsLoading}
                adminUid={isAdmin ? userId : undefined}
                isAdmin={isAdmin}
                allLevelHistory={allLevelHistory}
                approvedRequests={isAdmin ? levelUpRequests.filter((r) => r.status === 'approved') : undefined}
              />
            </TabPanel>
            {isAdmin && (
              <TabPanel value="settings">
                <QuarterSettingsTab />
              </TabPanel>
            )}
          </>
        )}
      </Tabs>
    </div>
  );
}
