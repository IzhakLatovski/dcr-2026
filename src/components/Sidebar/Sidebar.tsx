import { useMemo } from 'react';
import { Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { navigation } from '../../data/navigation';
import type { AuthUser } from '../../hooks/useAuth';
import type { UserRole } from '../../data/types';
import { MainMenu, type MainMenuSection } from '@/components/composed/main-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeId: string;
  onNavigate: (id: string, label: string) => void;
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  cartTotalItems?: number;
  cartTotalPoints?: number;
  user: AuthUser | null;
  isSimulatorMode?: boolean;
  onToggleMode?: () => void;
  userRole?: UserRole | null;
  pendingTeamCount?: number;
  unreadNotifications?: number;
  onNotificationsClick?: () => void;
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
  isSimulatorMode,
  onToggleMode,
  userRole,
  pendingTeamCount = 0,
  unreadNotifications = 0,
  onNotificationsClick,
}: SidebarProps) {
  const handleSelect = (id: string) => {
    const flat = [
      ...navigation.flatMap((s) => s.items ?? []),
      ...navigation.flatMap((s) => (s.subsections ?? []).flatMap((sub) => sub.items)),
    ];
    const item = flat.find((i) => i.id === id);
    if (!item) return;
    const label =
      id === 'simulator' && !isSimulatorMode
        ? 'Plan'
        : id === 'team-dashboard' && userRole === 'admin'
          ? 'All Teams'
          : item.label;
    onNavigate(id, label);
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
  }, [userRole, isSimulatorMode, cartTotalItems, pendingTeamCount]);

  const header = (
    <div className="flex flex-col gap-2 w-full">
      {/* Logo */}
      <button
        type="button"
        onClick={() => {
          onNavigate('home', 'Welcome to DCR 2.0');
          onClose();
        }}
        className={cn(
          'inline-flex items-center text-lg font-bold tracking-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring rounded',
          collapsed && 'justify-center w-full',
        )}
      >
        <span>DCR</span>
        {!collapsed && <span className="text-muted-foreground"> 2.0</span>}
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
      {user && onNotificationsClick && (
        <button
          type="button"
          onClick={onNotificationsClick}
          title="Notifications"
          className={cn(
            'group/notif relative inline-flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring',
            collapsed && 'justify-center px-2',
          )}
        >
          <Bell className="size-4 shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Notifications</span>}
          {unreadNotifications > 0 && (
            <Badge variant="destructive" size="sm" className={cn(collapsed && 'absolute -top-0.5 -right-0.5')}>
              {unreadNotifications}
            </Badge>
          )}
        </button>
      )}
      <button
        type="button"
        onClick={onToggleCollapse}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="inline-flex items-center justify-center rounded-lg size-9 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {collapsed ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
      </button>
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
