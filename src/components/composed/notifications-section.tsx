import { useMemo, useState } from 'react';
import {
  Bell,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  CircleX,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type { AppNotification, NotificationType } from '../../data/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NotificationsSectionProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  /** Default expand state. Defaults to expanded when there are unread notifications, collapsed otherwise. */
  defaultExpanded?: boolean;
}

export function NotificationsSection({
  notifications,
  onMarkRead,
  onMarkAllRead,
  defaultExpanded,
}: NotificationsSectionProps) {
  const sorted = useMemo(
    () => [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [notifications],
  );
  const unreadCount = sorted.filter((n) => !n.read).length;

  const [expanded, setExpanded] = useState<boolean>(
    defaultExpanded ?? unreadCount > 0,
  );

  const grouped = useMemo(() => {
    const groups: Record<'today' | 'yesterday' | 'earlier', AppNotification[]> = {
      today: [],
      yesterday: [],
      earlier: [],
    };
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    for (const n of sorted) {
      const t = new Date(n.createdAt).getTime();
      if (t >= startOfToday) groups.today.push(n);
      else if (t >= startOfYesterday) groups.yesterday.push(n);
      else groups.earlier.push(n);
    }
    return groups;
  }, [sorted]);

  return (
    <section className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-accent/40 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
          <Bell className="size-4.5" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" size="sm">
                {unreadCount} new
              </Badge>
            )}
          </span>
          <span className="block text-xs text-muted-foreground mt-0.5">
            {sorted.length === 0
              ? 'No notifications yet'
              : unreadCount === 0
                ? 'All caught up'
                : `${sorted.length} total`}
          </span>
        </span>
        {expanded ? (
          <ChevronUp className="size-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border">
          {sorted.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">
              Level-up reviews and team-leader actions will appear here.
            </p>
          ) : (
            <>
              {unreadCount > 0 && (
                <div className="flex items-center justify-end px-4 py-2 border-b border-border">
                  <Button variant="outline" size="sm" onClick={onMarkAllRead}>
                    <CheckCheck className="size-4" />
                    Mark all read
                  </Button>
                </div>
              )}
              <div className="max-h-[420px] overflow-y-auto px-4 py-3 flex flex-col gap-4">
                {grouped.today.length > 0 && (
                  <NotificationGroup
                    label="Today"
                    items={grouped.today}
                    onMarkRead={onMarkRead}
                  />
                )}
                {grouped.yesterday.length > 0 && (
                  <NotificationGroup
                    label="Yesterday"
                    items={grouped.yesterday}
                    onMarkRead={onMarkRead}
                  />
                )}
                {grouped.earlier.length > 0 && (
                  <NotificationGroup
                    label="Earlier"
                    items={grouped.earlier}
                    onMarkRead={onMarkRead}
                  />
                )}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function NotificationGroup({
  label,
  items,
  onMarkRead,
}: {
  label: string;
  items: AppNotification[];
  onMarkRead: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground px-1">
        {label}
      </h4>
      <ul className="flex flex-col gap-2">
        {items.map((n) => (
          <li key={n.id}>
            <NotificationCard notification={n} onMarkRead={onMarkRead} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function NotificationCard({
  notification,
  onMarkRead,
}: {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
}) {
  const { tint, Icon } = visualForType(notification.type);
  const isUnread = !notification.read;

  return (
    <button
      type="button"
      onClick={() => {
        if (isUnread) onMarkRead(notification.id);
      }}
      className={cn(
        'group/notif w-full text-left flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isUnread
          ? 'border-primary/30 bg-primary/5 hover:bg-primary/10'
          : 'border-border bg-background hover:bg-accent/40',
      )}
    >
      <span
        className={cn(
          'inline-flex size-8 shrink-0 items-center justify-center rounded-lg',
          tint,
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              'text-sm leading-snug',
              isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground',
            )}
          >
            {notification.title}
          </span>
          <time
            dateTime={notification.createdAt}
            className="text-[0.65rem] tabular-nums text-muted-foreground/80 shrink-0 mt-0.5"
          >
            {formatRelativeTime(notification.createdAt)}
          </time>
        </div>
        <p
          className={cn(
            'text-xs leading-snug mt-0.5',
            isUnread ? 'text-foreground/90' : 'text-muted-foreground',
          )}
        >
          {notification.message}
        </p>
      </div>
      {isUnread && (
        <span
          aria-hidden
          className="size-2 rounded-full bg-primary shrink-0 self-center"
        />
      )}
    </button>
  );
}

function visualForType(type: NotificationType): { tint: string; Icon: typeof Sparkles } {
  switch (type) {
    case 'level_up_approved':
      return {
        tint: 'bg-green-600/15 text-green-600 dark:bg-green-500/20 dark:text-green-400',
        Icon: TrendingUp,
      };
    case 'level_up_rejected':
      return {
        tint: 'bg-destructive/15 text-destructive',
        Icon: CircleX,
      };
    case 'level_up_recommended':
      return {
        tint: 'bg-primary/15 text-primary',
        Icon: Sparkles,
      };
    default:
      return {
        tint: 'bg-muted text-muted-foreground',
        Icon: Sparkles,
      };
  }
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (diffSec < 60) return 'just now';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return new Date(iso).toLocaleDateString();
}
