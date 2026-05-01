import { useState, useRef } from 'react';
import {
  Paperclip,
  Lock,
  Link as LinkIcon,
  FileText,
  Image as ImageIcon,
  Upload,
  UploadCloud,
  Check,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { ProofEntry, ProofType } from '../../data/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProofPanelProps {
  itemId: string;
  itemName: string;
  proofs: ProofEntry[];
  isReadOnly: boolean;
  isUploading: boolean;
  onAddUrl: (url: string) => Promise<void>;
  onAddNote: (note: string) => Promise<void>;
  onAddFile: (file: File) => Promise<void>;
  onDelete: (proofId: string) => Promise<void>;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = 'image/*,application/pdf,text/plain';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ProofIcon({ proof }: { proof: ProofEntry }) {
  if (proof.type === 'url') return <LinkIcon className="size-4" />;
  if (proof.type === 'note') return <FileText className="size-4" />;
  if (proof.fileMimeType?.startsWith('image/')) return <ImageIcon className="size-4" />;
  return <Paperclip className="size-4" />;
}

interface ProofEntryRowProps {
  proof: ProofEntry;
  onDelete: (id: string) => Promise<void>;
  isReadOnly: boolean;
}

function ProofEntryRow({ proof, onDelete, isReadOnly }: ProofEntryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(true);
    try {
      await onDelete(proof.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <li className="flex items-start gap-2.5 rounded-xl border border-border bg-card px-3 py-2">
      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground mt-0.5">
        <ProofIcon proof={proof} />
      </span>
      <div className="flex-1 min-w-0 text-sm text-foreground">
        {proof.type === 'url' && proof.url && (
          <a
            href={proof.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline break-all"
            title={proof.url}
          >
            {proof.url}
          </a>
        )}
        {proof.type === 'note' && proof.note && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? 'Click to collapse' : 'Click to expand'}
            className={cn(
              'text-left text-foreground/90 leading-relaxed whitespace-pre-wrap',
              !expanded && 'line-clamp-2',
            )}
          >
            {proof.note}
          </button>
        )}
        {proof.type === 'file' && (
          <div className="flex items-center gap-2 flex-wrap">
            {proof.fileUrl ? (
              <a
                href={proof.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate"
              >
                {proof.fileName}
              </a>
            ) : (
              <span className="truncate">{proof.fileName}</span>
            )}
            {proof.fileSizeBytes != null && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatBytes(proof.fileSizeBytes)}
              </span>
            )}
          </div>
        )}
      </div>
      {!isReadOnly && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          title="Remove attachment"
          aria-label="Remove attachment"
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
        >
          {deleting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
        </button>
      )}
    </li>
  );
}

export function ProofPanel({
  itemName,
  proofs,
  isReadOnly,
  isUploading,
  onAddUrl,
  onAddNote,
  onAddFile,
  onDelete,
}: ProofPanelProps) {
  const [activeTab, setActiveTab] = useState<ProofType>('url');
  const [urlInput, setUrlInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddUrl = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
    } catch {
      setInputError('Please enter a valid URL (must start with https:// or http://)');
      return;
    }
    setInputError(null);
    setIsAdding(true);
    try {
      await onAddUrl(trimmed);
      setUrlInput('');
    } catch {
      setInputError('Failed to save URL. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddNote = async () => {
    const trimmed = noteInput.trim();
    if (!trimmed) return;
    setInputError(null);
    setIsAdding(true);
    try {
      await onAddNote(trimmed);
      setNoteInput('');
    } catch {
      setInputError('Failed to save note. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setInputError('File too large. Maximum size is 5 MB.');
      return;
    }
    setInputError(null);
    try {
      await onAddFile(file);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to upload file.';
      setInputError(msg);
    }
  };

  return (
    <div
      className="rounded-2xl border border-border bg-muted/20 p-3 space-y-3"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Paperclip className="size-3.5" />
          Attachments
        </span>
        <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">
          {itemName}
        </span>
        {isReadOnly && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 h-5 text-[0.65rem] font-medium text-muted-foreground">
            <Lock className="size-3" /> Locked
          </span>
        )}
      </div>

      {/* List */}
      {proofs.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {proofs.map((proof) => (
            <ProofEntryRow
              key={proof.id}
              proof={proof}
              onDelete={onDelete}
              isReadOnly={isReadOnly}
            />
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground italic px-1">
          {isReadOnly
            ? 'No attachments.'
            : 'No attachments yet. Add a link, write a note, or upload a file.'}
        </p>
      )}

      {/* Add section */}
      {!isReadOnly && (
        <div className="space-y-2">
          {/* Tab strip */}
          <div
            role="tablist"
            className="inline-flex items-center gap-1 rounded-lg bg-muted p-0.5"
          >
            {(
              [
                { id: 'url' as ProofType, label: 'Add Link', Icon: LinkIcon },
                { id: 'note' as ProofType, label: 'Write Note', Icon: FileText },
                { id: 'file' as ProofType, label: 'Upload File', Icon: UploadCloud },
              ]
            ).map(({ id, label, Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setActiveTab(id);
                    setInputError(null);
                  }}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-2.5 h-7 text-xs font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Form area */}
          <div className="space-y-2">
            {activeTab === 'url' && (
              <div className="flex gap-2 flex-wrap">
                <input
                  type="url"
                  placeholder="https://credly.com/badges/..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                  disabled={isAdding}
                  className="flex-1 min-w-0 rounded-lg border border-border bg-card px-3 h-9 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-ring/30 disabled:opacity-50"
                />
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAddUrl}
                  disabled={isAdding || !urlInput.trim()}
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Check className="size-3.5" /> Add Link
                    </>
                  )}
                </Button>
              </div>
            )}

            {activeTab === 'note' && (
              <div className="flex flex-col gap-2">
                <textarea
                  placeholder="Describe your completion, e.g. 'Finished Q1 billable hours, see timesheet...'"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  disabled={isAdding}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-ring/30 resize-none disabled:opacity-50"
                />
                <div className="flex items-center justify-end gap-2">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {noteInput.length}/1000
                  </span>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleAddNote}
                    disabled={isAdding || !noteInput.trim()}
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" /> Saving…
                      </>
                    ) : (
                      <>
                        <Check className="size-3.5" /> Save Note
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'file' && (
              <div className="flex flex-col items-start gap-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={handleFileChange}
                  className="hidden"
                  aria-hidden="true"
                />
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Uploading…
                    </>
                  ) : (
                    <>
                      <Upload className="size-4" /> Choose File to Upload
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Images, PDFs, or text files · max 5 MB
                </p>
              </div>
            )}

            {inputError && (
              <p className="inline-flex items-start gap-1.5 text-xs text-destructive">
                <AlertCircle className="size-3.5 shrink-0 mt-0.5" /> {inputError}
              </p>
            )}
          </div>
        </div>
      )}

      {isReadOnly && (
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground italic">
          <Lock className="size-3.5" /> Attachments are locked while your plan is pending review.
        </p>
      )}
    </div>
  );
}
