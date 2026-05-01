import { useState } from 'react';
import { RefreshCw, Users, Plus, Check } from 'lucide-react';
import type { CatalogItem, CertificationItem } from '../../data/types';
import { FormCard } from '@/components/composed/form-card';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SIZE_BONUS: Record<string, number> = {
  '3': 0.08,
  '4': 0.10,
  '5': 0.13,
  '6': 0.17,
  '7+': 0.22,
};

const RESERVIST_BONUS: Record<string, number> = {
  '0': 0,
  '1': 0.05,
  '2+': 0.10,
};

interface ExtraPageProps {
  onAddItem: (item: CatalogItem) => void;
  onToggleItem: (item: CatalogItem) => void;
  isInCart: (id: string) => boolean;
  certItems: CertificationItem[];
}

export default function ExtraPage({ onAddItem, onToggleItem, isInCart, certItems }: ExtraPageProps) {
  const [renewalCertId, setRenewalCertId] = useState('');
  const [circleCertId, setCircleCertId] = useState('');
  const [groupSize, setGroupSize] = useState('');
  const [reservists, setReservists] = useState('0');

  const renewalCert = certItems.find((c) => c.id === renewalCertId) ?? null;
  const renewalPoints = renewalCert ? Math.ceil(renewalCert.points * 0.25) : 0;

  const eligibleCerts = certItems.filter((c) => c.points >= 130);
  const circleCert = eligibleCerts.find((c) => c.id === circleCertId) ?? null;
  const circleBonus =
    circleCert && groupSize
      ? Math.round(
          circleCert.points *
            ((SIZE_BONUS[groupSize] ?? 0) + (RESERVIST_BONUS[reservists] ?? 0)),
        )
      : 0;

  const renewalItemId = renewalCertId ? `extra-renewal-${renewalCertId}` : '';
  const renewalInCart = renewalItemId ? isInCart(renewalItemId) : false;

  const handleToggleRenewal = () => {
    if (!renewalCert) return;
    onToggleItem({
      id: renewalItemId,
      name: `Cert Renewal: ${renewalCert.name}`,
      points: renewalPoints,
      image: renewalCert.image,
      category: 'tech',
      subcategory: 'Certification Renewal',
      description: `25% renewal bonus for ${renewalCert.name} (base: ${renewalCert.points} pts)`,
    });
  };

  const handleAddCircle = () => {
    if (!circleCert || !groupSize || circleBonus <= 0) return;
    if (!isInCart(circleCertId)) {
      onAddItem(circleCert);
    }
    const reservistLabel =
      reservists === '0'
        ? 'no reservists'
        : `${reservists} reservist${reservists === '1' ? '' : 's'}`;
    onAddItem({
      id: `extra-circle-${circleCertId}-${Date.now()}`,
      name: `Cert Circle: ${circleCert.name}`,
      points: circleBonus,
      image: circleCert.image,
      category: 'tech',
      subcategory: 'Certification Circle',
      description: `Group bonus — ${groupSize} people, ${reservistLabel}`,
    });
  };

  const certOptions = certItems.map((c) => ({ value: c.id, label: c.name }));
  const eligibleOptions = eligibleCerts.map((c) => ({ value: c.id, label: c.name }));

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 h-full overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Widget 1: Certification Renewal */}
        <FormCard
          icon={<RefreshCw />}
          iconTint="primary"
          title="Certification renewal"
          description="Renewing a cert earns 25% of its base points"
          footer={
            <Button
              variant="default"
              size="default"
              onClick={handleToggleRenewal}
              disabled={!renewalCert}
            >
              {renewalInCart ? <Check className="size-4" /> : <Plus className="size-4" />}
              {renewalInCart ? 'Added' : 'Add to Plan'}
            </Button>
          }
        >
          <Select
            options={certOptions}
            value={renewalCertId}
            onValueChange={setRenewalCertId}
            placeholder="Select certification..."
          />
          {renewalCert && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
              <div className="flex items-baseline gap-1.5 tabular-nums">
                <span className="text-2xl font-bold text-primary">{renewalPoints}</span>
                <span className="text-sm text-muted-foreground">
                  pts · 25% of {renewalCert.points}
                </span>
              </div>
            </div>
          )}
        </FormCard>

        {/* Widget 2: Certification Circle */}
        <FormCard
          icon={<Users />}
          iconTint="violet"
          title="Certification circle"
          description="Group study bonus — more people means higher bonus points"
          footer={
            <Button
              variant="default"
              size="default"
              onClick={handleAddCircle}
              disabled={!circleCert || !groupSize || circleBonus <= 0}
            >
              <Plus className="size-4" /> Add to Plan
            </Button>
          }
        >
          <Select
            options={eligibleOptions}
            value={circleCertId}
            onValueChange={setCircleCertId}
            placeholder="Select certification (≥130 pts)..."
          />

          <ToggleGroup
            label="Group size"
            options={['3', '4', '5', '6', '7+']}
            value={groupSize}
            onChange={(val) => setGroupSize(groupSize === val ? '' : val)}
            getTitle={(val) => `+${Math.round((SIZE_BONUS[val] ?? 0) * 100)}%`}
          />

          <ToggleGroup
            label="Reservists in group"
            options={['0', '1', '2+']}
            value={reservists}
            onChange={setReservists}
            renderLabel={(val) => (val === '0' ? 'None' : val)}
            getTitle={(val) =>
              val === '0' ? 'No reservist bonus' : `+${Math.round((RESERVIST_BONUS[val] ?? 0) * 100)}%`
            }
          />

          {circleCert && groupSize && (
            <div className="rounded-xl bg-violet-500/5 border border-violet-500/20 px-4 py-3">
              <div className="flex items-baseline gap-1.5 tabular-nums">
                <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                  {circleBonus}
                </span>
                <span className="text-sm text-muted-foreground">
                  pts · +
                  {Math.round(((SIZE_BONUS[groupSize] ?? 0) + (RESERVIST_BONUS[reservists] ?? 0)) * 100)}
                  % of {circleCert.points}
                </span>
              </div>
            </div>
          )}
        </FormCard>
      </div>
    </div>
  );
}

/* ── Inline toggle group ────────────────────────────────────── */

function ToggleGroup({
  label,
  options,
  value,
  onChange,
  renderLabel,
  getTitle,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  renderLabel?: (val: string) => string;
  getTitle?: (val: string) => string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="inline-flex items-center rounded-xl border border-border bg-muted/30 p-0.5">
        {options.map((val) => {
          const active = value === val;
          return (
            <button
              key={val}
              type="button"
              onClick={() => onChange(val)}
              title={getTitle?.(val)}
              className={cn(
                'inline-flex items-center justify-center min-w-9 h-8 px-3 rounded-lg text-xs font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {renderLabel ? renderLabel(val) : val}
            </button>
          );
        })}
      </div>
    </div>
  );
}
