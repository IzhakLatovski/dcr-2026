import { useState, useRef, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { useItemComments } from '../../hooks/useItemComments';
import type { AuthUser } from '../../hooks/useAuth';
import { cn } from '@/lib/utils';

interface ItemCommentsProps {
  itemId: string;
  authUser: AuthUser | null;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function AvatarCircle({
  name,
  photo,
  size = 'md',
}: {
  name: string;
  photo: string | null;
  size?: 'sm' | 'md';
}) {
  const sizeClass = size === 'sm' ? 'size-7 text-xs' : 'size-9 text-sm';
  if (photo) {
    return (
      <img
        className={cn('rounded-full object-cover shrink-0', sizeClass)}
        src={photo}
        alt={name}
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-primary/10 text-primary font-semibold shrink-0',
        sizeClass,
      )}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function ItemComments({ itemId, authUser }: ItemCommentsProps) {
  const { comments, isLoading, addComment, deleteComment } = useItemComments(itemId, authUser);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await addComment(trimmed);
      setText('');
      textareaRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  }, [text, submitting, addComment]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Comments
        </h3>
        {!isLoading && (
          <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-muted text-[0.65rem] font-semibold text-muted-foreground tabular-nums">
            {comments.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading comments…</div>
      ) : comments.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <AvatarCircle name={c.userName} photo={c.userPhoto} />
              <div className="flex-1 min-w-0 rounded-2xl border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {c.userName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(c.createdAt)}
                  </span>
                  {authUser?.email === c.userId && (
                    <button
                      type="button"
                      onClick={() => deleteComment(c.id)}
                      title="Delete comment"
                      className="ml-auto inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                  {c.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {authUser ? (
        <div className="flex gap-3">
          <AvatarCircle name={authUser.displayName} photo={authUser.photoURL} />
          <div className="flex-1 min-w-0 rounded-2xl border border-border bg-card focus-within:border-primary/40 focus-within:ring-3 focus-within:ring-ring/30 transition-all duration-200">
            <textarea
              ref={textareaRef}
              rows={2}
              placeholder="Add a comment… (Ctrl+Enter to post)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-sm text-foreground px-4 pt-3 pb-1 outline-none resize-none placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-end px-2 pb-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!text.trim() || submitting}
                className={cn(
                  'inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 h-8 text-sm font-semibold shadow-sm transition-all duration-200',
                  'hover:bg-primary/90 hover:shadow-md',
                  'outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  'disabled:opacity-50 disabled:pointer-events-none',
                )}
              >
                {submitting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">Sign in to leave a comment.</p>
      )}
    </div>
  );
}
