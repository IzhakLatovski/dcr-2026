import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock as ClockIcon,
  LogOut,
  Moon,
  Search,
  Sun,
  UserStar,
  XCircle,
} from 'lucide-react';
import { navigation } from '../../data/navigation';
import type { AuthUser } from '../../hooks/useAuth';
import type { AppNotification, UserDocument, UserRole } from '../../data/types';
import { MainMenu, type MainMenuSection } from '@/components/composed/main-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeId: string;
  onNavigate: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  cartTotalItems?: number;
  cartTotalPoints?: number;
  user: AuthUser | null;
  userProfile: UserDocument | null;
  teamLeaderName: string | null;
  isSimulatorMode?: boolean;
  onToggleMode?: () => void;
  userRole?: UserRole | null;
  pendingTeamCount?: number;
  notifications: AppNotification[];
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenPalette: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export default function Sidebar({
  activeId,
  onNavigate,
  isOpen,
  onClose,
  collapsed,
  onToggleCollapse,
  cartTotalItems = 0,
  user,
  userProfile,
  teamLeaderName,
  isSimulatorMode,
  onToggleMode,
  userRole,
  pendingTeamCount = 0,
  notifications,
  theme,
  onToggleTheme,
  onOpenPalette,
  onSignIn,
  onSignOut,
}: SidebarProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;
  const handleSelect = (id: string) => {
    onNavigate(id);
    onClose();
  };

  // Build MainMenu sections from DCR navigation, applying role filters + dynamic labels + badges.
  const sections: MainMenuSection[] = useMemo(() => {
    const filtered = navigation.filter((section) => {
      if (section.title === 'Team') {
        return userRole === 'team_leader' || userRole === 'admin';
      }
      if (section.title === 'Admin') {
        return userRole === 'admin';
      }
      return true;
    });

    return filtered.map<MainMenuSection>((section) => ({
      label: section.title,
      items: section.items?.map((item) => ({
        id: item.id,
        icon: <i className={item.icon} />,
        label:
          item.id === 'simulator' && !isSimulatorMode
            ? 'Plan'
            : item.id === 'team-dashboard' && userRole === 'admin'
              ? 'All Teams'
              : item.label,
        badge:
          item.id === 'simulator' && cartTotalItems > 0
            ? cartTotalItems
            : item.id === 'team-dashboard' && pendingTeamCount > 0
              ? pendingTeamCount
              : item.id === 'my-profile' && unreadCount > 0
                ? unreadCount
                : undefined,
      })),
      subSections: section.subsections?.map((sub) => ({
        label: sub.title,
        items: sub.items.map((item) => ({
          id: item.id,
          icon: <i className={item.icon} />,
          label: item.label,
        })),
      })),
    }));
  }, [userRole, isSimulatorMode, cartTotalItems, pendingTeamCount, unreadCount]);

  const header = (
    <div className="flex flex-col gap-3 w-full">
      {/* Logo */}
      <button
        type="button"
        onClick={() => {
          onNavigate('home');
          onClose();
        }}
        className={cn(
          'group/logo inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring',
          collapsed && 'justify-center w-full',
        )}
      >
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-[0.65rem] font-bold tracking-tight shadow-sm ring-1 ring-primary/30 transition-transform duration-200 group-hover/logo:scale-[1.04]"
        >
          DCR
        </span>
        {!collapsed && (
          <span className="flex flex-col items-start leading-none">
            <span className="text-[0.95rem] font-semibold tracking-tight text-foreground">
              Develeap
            </span>
            <span className="mt-1 text-[0.6rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Career Roadmap
            </span>
          </span>
        )}
        <span className="sr-only">DCR — Develeap Career Roadmap</span>
      </button>

      {/* Search */}
      <button
        type="button"
        onClick={onOpenPalette}
        title={collapsed ? 'Search ⌘K' : undefined}
        aria-label="Search"
        className={cn(
          'mt-3 inline-flex items-center gap-2 rounded-xl border border-border bg-muted/30 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring',
          collapsed
            ? 'size-9 justify-center self-center'
            : 'w-full pl-3 pr-1.5 h-9',
        )}
      >
        <Search className="size-4 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">Search</span>
            <kbd className="inline-flex items-center rounded-md border border-border bg-card px-1.5 py-0.5 text-[0.6rem] font-mono text-muted-foreground">
              ⌘K
            </kbd>
          </>
        )}
      </button>

      {/* Mode toggle */}
      {user && !collapsed && onToggleMode && (
        <div
          role="tablist"
          aria-label="Plan mode"
          className="inline-flex items-center rounded-xl border border-border bg-muted/30 p-0.5 w-full"
        >
          <button
            type="button"
            role="tab"
            aria-selected={isSimulatorMode}
            onClick={() => isSimulatorMode || onToggleMode()}
            className={cn(
              'flex-1 inline-flex items-center justify-center rounded-lg h-7 text-[0.65rem] font-semibold uppercase tracking-wider transition-all duration-150',
              isSimulatorMode
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Simulator
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isSimulatorMode}
            onClick={() => !isSimulatorMode || onToggleMode()}
            className={cn(
              'flex-1 inline-flex items-center justify-center rounded-lg h-7 text-[0.65rem] font-semibold uppercase tracking-wider transition-all duration-150',
              !isSimulatorMode
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Real Plan
          </button>
        </div>
      )}
    </div>
  );

  const footer = (
    <div className="flex flex-col gap-1.5 w-full">
      <SidebarUser
        user={user}
        userProfile={userProfile}
        teamLeaderName={teamLeaderName}
        unreadCount={unreadCount}
        collapsed={collapsed}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
      />
      <div className="flex justify-center w-full mt-1 pt-2 border-t border-border/60">
        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="inline-flex items-center justify-center rounded-full size-7 text-muted-foreground/70 bg-muted/40 hover:bg-muted hover:text-foreground transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen p-2 transition-transform duration-300 lg:static lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      <MainMenu
        sections={sections}
        activeId={activeId}
        onSelect={handleSelect}
        collapsed={collapsed}
        header={header}
        footer={footer}
        className="h-full shadow-sm"
      />
    </aside>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface SidebarUserProps {
  user: AuthUser | null;
  userProfile: UserDocument | null;
  teamLeaderName: string | null;
  unreadCount: number;
  collapsed: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

function SidebarUser({
  user,
  userProfile,
  teamLeaderName,
  unreadCount,
  collapsed,
  theme,
  onToggleTheme,
  onSignIn,
  onSignOut,
}: SidebarUserProps) {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setImgError(false);
  }, [user]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!user) {
    const themeLabel = `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`;
    return (
      <div className={cn('flex items-center gap-2', collapsed && 'flex-col')}>
        <Button
          variant="outline"
          size="sm"
          onClick={onSignIn}
          className={cn('flex-1', collapsed && 'w-full px-0 justify-center')}
          title={collapsed ? 'Sign in' : undefined}
        >
          <i className="ri-google-fill" />
          {!collapsed && <span>Sign in</span>}
        </Button>
        <button
          type="button"
          onClick={onToggleTheme}
          title={themeLabel}
          aria-label={themeLabel}
          className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
        >
          {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </button>
      </div>
    );
  }

  const role = userProfile?.role;
  const approval = userProfile?.approvalStatus;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={user.email}
        className={cn(
          'group/user inline-flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-muted',
          collapsed && 'justify-center px-0',
        )}
      >
        <span className="relative inline-flex size-9 items-center justify-center rounded-full overflow-hidden bg-primary/10 text-primary shrink-0">
          {user.photoURL && !imgError ? (
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="size-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-sm font-semibold">{getInitials(user.displayName)}</span>
          )}
          {unreadCount > 0 && (
            <span
              aria-label={`${unreadCount} unread notifications`}
              className="absolute -top-0.5 -right-0.5 inline-flex min-w-4 h-4 items-center justify-center rounded-full bg-destructive px-1 text-[0.6rem] font-bold leading-none text-white ring-2 ring-sidebar"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </span>
        {!collapsed && (
          <span className="flex flex-col items-start min-w-0 flex-1">
            <span className="text-sm font-semibold text-foreground truncate w-full text-left">
              {user.displayName}
            </span>
            <span className="text-xs text-muted-foreground truncate w-full text-left">
              {user.email}
            </span>
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Account"
          className="absolute bottom-full mb-2 left-0 w-72 rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-150"
        >
          {/* Identity */}
          <div className="px-4 py-3">
            <p className="text-sm font-semibold text-foreground truncate">{user.displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            {(role === 'team_leader' ||
              (role === 'employee' && approval === 'approved' && teamLeaderName) ||
              (role === 'employee' && approval === 'pending') ||
              (role === 'employee' && approval === 'rejected')) && (
              <div className="mt-2 flex flex-col gap-1.5">
                {role === 'team_leader' && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <UserStar className="size-3.5" /> Team Leader
                  </span>
                )}
                {role === 'employee' && approval === 'approved' && teamLeaderName && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <UserStar className="size-3.5" />
                    Reports to <strong className="text-foreground">{teamLeaderName}</strong>
                  </span>
                )}
                {role === 'employee' && approval === 'pending' && (
                  <Badge variant="warning" size="sm" className="self-start">
                    <ClockIcon className="size-3" /> Awaiting approval
                  </Badge>
                )}
                {role === 'employee' && approval === 'rejected' && (
                  <Badge variant="destructive" size="sm" className="self-start">
                    <XCircle className="size-3" /> Approval rejected
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="w-full flex items-center gap-2 border-t border-border px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          >
            {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
            Switch to {theme === 'light' ? 'dark' : 'light'} mode
          </button>

          {/* Sign out */}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="w-full flex items-center gap-2 border-t border-border px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
