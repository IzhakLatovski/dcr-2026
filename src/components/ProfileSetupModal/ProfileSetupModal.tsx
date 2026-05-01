import { useState } from 'react';
import {
  UserCog,
  Users,
  BarChart3,
  Coins,
  Trophy,
  Plus,
  Minus,
  Check,
  X,
  FileCheck,
  Upload,
  Info,
  Save,
  Send,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useTeamLeaders } from '../../hooks/useTeamLeaders';
import { uploadAchievementProofFile, ACCEPTED_PROOF_TYPES } from '../../hooks/useAchievements';
import { tech } from '../../data/catalog/tech';
import type { CatalogItem } from '../../data/types';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProfileSetupModalProps {
  onComplete: (data: ProfileSetupData) => Promise<void>;
  onCancel: () => void;
  isTeamLeader?: boolean;
  userId?: string;
}

export interface HistoricalAchievement {
  itemId: string;
  item: CatalogItem;
  completionDate: string;
  proofLink: string;
  notes?: string;
}

export interface ProfileSetupData {
  teamLeaderId?: string;
  teamLeaderName?: string;
  currentLevel: number;
  achievements: HistoricalAchievement[];
  preSystemPoints?: number;
}

export function ProfileSetupModal({
  onComplete,
  onCancel,
  isTeamLeader = false,
  userId,
}: ProfileSetupModalProps) {
  const { teamLeaders, isLoading: loadingLeaders } = useTeamLeaders();
  const [selectedTeamLeaderId, setSelectedTeamLeaderId] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<number>(0);
  const [preSystemPoints, setPreSystemPoints] = useState<number>(0);
  const [achievements, setAchievements] = useState<HistoricalAchievement[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAddAchievement, setShowAddAchievement] = useState(false);
  const [newAchievement, setNewAchievement] = useState({
    itemId: '',
    completionDate: '',
    proofLink: '',
    notes: '',
  });
  const [proofUpload, setProofUpload] = useState<{
    isUploading: boolean;
    fileName?: string;
    filePath?: string;
    error?: string;
  }>({ isUploading: false });

  const allCatalogItems = tech;

  const handleAddAchievement = () => {
    if (!newAchievement.itemId) {
      setError('Please select a certification');
      return;
    }
    const isDuplicate = achievements.some((a) => a.itemId === newAchievement.itemId);
    if (isDuplicate) {
      setError('This certification has already been added');
      return;
    }
    const item = allCatalogItems.find((i) => i.id === newAchievement.itemId);
    if (!item) {
      setError('Invalid item selected');
      return;
    }
    const achievement: HistoricalAchievement = {
      itemId: item.id,
      item,
      completionDate: newAchievement.completionDate,
      proofLink: newAchievement.proofLink,
      notes: newAchievement.notes || undefined,
    };
    setAchievements((prev) => [...prev, achievement]);
    setNewAchievement({ itemId: '', completionDate: '', proofLink: '', notes: '' });
    setShowAddAchievement(false);
    setError(null);
  };

  const handleRemoveAchievement = (index: number) => {
    setAchievements((prev) => prev.filter((_, i) => i !== index));
  };

  const resetAchievementForm = () => {
    setShowAddAchievement(false);
    setNewAchievement({ itemId: '', completionDate: '', proofLink: '', notes: '' });
    setProofUpload({ isUploading: false });
    setError(null);
  };

  const handleProofFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId || !newAchievement.itemId) return;
    setProofUpload({ isUploading: true });
    try {
      const { fileUrl, filePath, fileName } = await uploadAchievementProofFile(
        userId,
        newAchievement.itemId,
        file,
      );
      setNewAchievement((prev) => ({ ...prev, proofLink: fileUrl }));
      setProofUpload({ isUploading: false, fileName, filePath });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setProofUpload({ isUploading: false, error: msg });
    }
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTeamLeader && !selectedTeamLeaderId) {
      setError('Please select a team leader');
      return;
    }
    let finalAchievements = achievements;
    if (showAddAchievement && newAchievement.itemId) {
      const item = allCatalogItems.find((i) => i.id === newAchievement.itemId);
      const isDuplicate = achievements.some((a) => a.itemId === newAchievement.itemId);
      if (item && !isDuplicate) {
        finalAchievements = [
          ...achievements,
          {
            itemId: item.id,
            item,
            completionDate: newAchievement.completionDate,
            proofLink: newAchievement.proofLink,
            notes: newAchievement.notes || undefined,
          },
        ];
      }
    }
    try {
      setIsSubmitting(true);
      setError(null);
      const selectedLeader = teamLeaders.find((tl) => tl.uid === selectedTeamLeaderId);
      await onComplete({
        teamLeaderId: isTeamLeader ? undefined : selectedTeamLeaderId,
        teamLeaderName: isTeamLeader ? undefined : selectedLeader?.displayName,
        currentLevel: selectedLevel,
        achievements: finalAchievements,
        preSystemPoints: preSystemPoints > 0 ? preSystemPoints : undefined,
      });
    } catch (err) {
      console.error('[ProfileSetupModal] Error:', err);
      setError('Failed to submit profile setup');
      setIsSubmitting(false);
    }
  };

  const teamLeaderOptions = teamLeaders.map((tl) => ({
    value: tl.uid,
    label: tl.displayName,
  }));
  const levelOptions = [
    { value: '0', label: 'No level yet' },
    ...Array.from({ length: 10 }, (_, i) => ({
      value: String(i + 1),
      label: `Level ${i + 1}`,
    })),
  ];
  const certOptions = tech
    .filter((item) => !achievements.some((a) => a.itemId === item.id))
    .map((item) => ({ value: item.id, label: `${item.name} (${item.points} pts)` }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card text-card-foreground shadow-xl animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-border">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary [&_svg]:size-5">
            <UserCog />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Setup Your Profile
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isTeamLeader
                ? "Set your level and add any certifications you've already completed"
                : "Setup your profile and add any certifications you've already completed"}
            </p>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-5">
          {/* Team leader (employees only) */}
          {!isTeamLeader && (
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
                placeholder={loadingLeaders ? 'Loading…' : 'Select your team leader…'}
                disabled={isSubmitting || loadingLeaders}
              />
            </div>
          )}

          {/* Current level */}
          <div className="flex flex-col gap-1.5">
            <label className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <BarChart3 className="size-3.5" />
              What is your current level?
              <span className="text-destructive">*</span>
            </label>
            <Select
              options={levelOptions}
              value={String(selectedLevel)}
              onValueChange={(v) => setSelectedLevel(parseInt(v, 10))}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Select your current level in the DCR program
            </p>
          </div>

          {/* Pre-system points */}
          <div className="flex flex-col gap-1.5">
            <label className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Coins className="size-3.5" />
              Extra points from before Q1 2026
              <span className="text-muted-foreground/70 normal-case font-normal">(optional)</span>
            </label>
            <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-muted/30 p-1 self-start">
              <button
                type="button"
                onClick={() => setPreSystemPoints((p) => Math.max(0, p - 1))}
                disabled={isSubmitting || preSystemPoints === 0}
                aria-label="Decrease points"
                className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-card transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                <Minus className="size-4" />
              </button>
              <input
                type="number"
                min={0}
                step={1}
                value={preSystemPoints === 0 ? '' : preSystemPoints}
                placeholder="0"
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setPreSystemPoints(isNaN(v) || v < 0 ? 0 : v);
                }}
                disabled={isSubmitting}
                className="w-16 bg-transparent text-center text-sm font-semibold tabular-nums outline-none"
                aria-label="Extra points"
              />
              <span className="text-xs text-muted-foreground pr-2">pts</span>
              <button
                type="button"
                onClick={() => setPreSystemPoints((p) => p + 1)}
                disabled={isSubmitting}
                aria-label="Increase points"
                className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-card transition-colors disabled:opacity-50"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Surplus points carried over from before the DCR portal launched. These count toward your current plan.
            </p>
          </div>

          {/* Historical achievements */}
          <div className="flex flex-col gap-3">
            <div>
              <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <Trophy className="size-4 text-muted-foreground" />
                Historical Achievements
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Add Tech certifications you've already completed (or skip if none)
              </p>
            </div>

            {achievements.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {achievement.item.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {achievement.item.category} • {achievement.item.points} pts
                        {achievement.completionDate &&
                          ` • Completed ${new Date(achievement.completionDate).toLocaleDateString()}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAchievement(index)}
                      disabled={isSubmitting}
                      title="Remove"
                      className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!showAddAchievement && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => setShowAddAchievement(true)}
                disabled={isSubmitting || achievements.length >= tech.length}
                title={
                  achievements.length >= tech.length
                    ? 'All certifications have been added'
                    : ''
                }
              >
                <Plus className="size-3.5" />
                {achievements.length >= tech.length
                  ? 'All Certifications Added'
                  : 'Add Achievement'}
              </Button>
            )}

            {showAddAchievement && (
              <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/20 p-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Tech Certification *
                  </label>
                  <Select
                    options={certOptions}
                    value={newAchievement.itemId}
                    onValueChange={(v) =>
                      setNewAchievement((prev) => ({ ...prev, itemId: v }))
                    }
                    placeholder="Select certification…"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Completion Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={newAchievement.completionDate}
                    onChange={(e) =>
                      setNewAchievement((prev) => ({
                        ...prev,
                        completionDate: e.target.value,
                      }))
                    }
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-xl border border-border bg-card px-3 h-9 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-ring/30"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Attachment (Optional)
                  </label>
                  {proofUpload.fileName ? (
                    <div className="flex items-center gap-2 rounded-xl border border-green-600/30 bg-green-600/5 px-3 py-2">
                      <FileCheck className="size-4 text-green-600 dark:text-green-400 shrink-0" />
                      <span className="flex-1 text-sm text-foreground truncate">
                        {proofUpload.fileName}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setProofUpload({ isUploading: false });
                          setNewAchievement((prev) => ({ ...prev, proofLink: '' }));
                        }}
                        title="Remove file"
                        className="inline-flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="https://credly.com/..."
                        value={newAchievement.proofLink}
                        onChange={(e) =>
                          setNewAchievement((prev) => ({
                            ...prev,
                            proofLink: e.target.value,
                          }))
                        }
                        disabled={proofUpload.isUploading}
                        className="flex-1 rounded-xl border border-border bg-card px-3 h-9 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-ring/30"
                      />
                      {userId && (
                        <>
                          <span className="text-xs text-muted-foreground">or</span>
                          <label
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 h-9 text-xs font-medium cursor-pointer hover:bg-accent transition-colors',
                              (!newAchievement.itemId || proofUpload.isUploading) &&
                                'opacity-50 pointer-events-none',
                            )}
                          >
                            {proofUpload.isUploading ? (
                              <>
                                <div className="size-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                Uploading…
                              </>
                            ) : (
                              <>
                                <Upload className="size-3.5" /> Upload
                              </>
                            )}
                            <input
                              type="file"
                              accept={ACCEPTED_PROOF_TYPES}
                              className="hidden"
                              disabled={!newAchievement.itemId || proofUpload.isUploading}
                              onChange={handleProofFileChange}
                            />
                          </label>
                        </>
                      )}
                    </div>
                  )}
                  {proofUpload.error && (
                    <span className="text-xs text-destructive">{proofUpload.error}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Notes (Optional)
                  </label>
                  <textarea
                    placeholder="Additional notes..."
                    rows={2}
                    value={newAchievement.notes}
                    onChange={(e) =>
                      setNewAchievement((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-ring/30 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetAchievementForm}
                  >
                    Cancel
                  </Button>
                  <Button type="button" variant="default" size="sm" onClick={handleAddAchievement}>
                    <Check className="size-3.5" /> Add
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Info box */}
          <div className="flex items-start gap-3 rounded-2xl bg-primary/5 border border-primary/20 p-4">
            <Info className="size-4 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-foreground">What happens next?</p>
              <ul className="mt-1 list-disc pl-5 space-y-0.5 text-muted-foreground marker:text-muted-foreground">
                {isTeamLeader ? (
                  <>
                    <li>Your profile and achievements will be saved immediately</li>
                    <li>No approval needed — you're a team leader</li>
                  </>
                ) : (
                  <>
                    <li>Your team leader will review your profile and achievements</li>
                    <li>They will approve or provide feedback</li>
                    <li>Once approved, you'll have full access to Real Plan features</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-foreground">
              <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </form>

        {/* Footer (sticky-ish via flex layout above) */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4 bg-muted/20">
          <Button type="button" variant="outline" size="default" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={handleSubmit}
            disabled={isSubmitting || (!isTeamLeader && !selectedTeamLeaderId)}
          >
            {isSubmitting ? (
              <>
                <div className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                Saving…
              </>
            ) : (
              <>
                {isTeamLeader ? <Save className="size-4" /> : <Send className="size-4" />}
                {isTeamLeader ? 'Save Profile' : 'Submit for Approval'}
                {achievements.length > 0 &&
                  ` (${achievements.length} achievement${achievements.length !== 1 ? 's' : ''})`}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
