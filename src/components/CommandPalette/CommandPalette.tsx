import { useMemo } from 'react';
import { Award, BookOpen, HelpCircle, Layout as LayoutIcon } from 'lucide-react';
import { getAllNavItems } from '../../data/navigation';
import { faq } from '../../data/faq';
import { guidelines } from '../../data/guidelines';
import { professionalism } from '../../data/catalog/professionalism';
import { tech } from '../../data/catalog/tech';
import { knowledge } from '../../data/catalog/knowledge';
import { collaboration } from '../../data/catalog/collaboration';
import { CommandPalette as CommandPalettePrimitive, type CommandItem } from '@/components/ui/command-palette';

export interface SearchItem {
  key: string;
  label: string;
  icon: string;
  type: 'page' | 'faq' | 'guideline' | 'catalog';
  pageId: string;
  subId?: number;
  catalogItemId?: string;
  searchText: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: SearchItem) => void;
}

const TYPE_LABELS: Record<SearchItem['type'], string> = {
  page: 'Pages',
  catalog: 'Catalog',
  guideline: 'Guidelines',
  faq: 'FAQ',
};

const TYPE_ICONS: Record<SearchItem['type'], React.ReactNode> = {
  page: <LayoutIcon />,
  catalog: <Award />,
  guideline: <BookOpen />,
  faq: <HelpCircle />,
};

function buildSearchIndex(): SearchItem[] {
  const items: SearchItem[] = [];

  for (const nav of getAllNavItems()) {
    items.push({
      key: `page-${nav.id}`,
      label: nav.label,
      icon: nav.icon,
      type: 'page',
      pageId: nav.id,
      searchText: nav.label.toLowerCase(),
    });
  }

  const catalogItems = [...professionalism, ...tech, ...knowledge, ...collaboration];
  for (const item of catalogItems) {
    items.push({
      key: `catalog-${item.id}`,
      label: item.name,
      icon: 'ri-award-line',
      type: 'catalog',
      pageId: item.category,
      catalogItemId: item.id,
      searchText: `${item.name} ${item.subcategory ?? ''} ${item.points}`.toLowerCase(),
    });
  }

  for (const g of guidelines) {
    items.push({
      key: `guide-${g.id}`,
      label: g.title,
      icon: g.icon,
      type: 'guideline',
      pageId: 'guidelines',
      subId: g.id,
      searchText: `${g.title} ${g.points.join(' ')}`.toLowerCase(),
    });
  }

  for (const q of faq) {
    items.push({
      key: `faq-${q.id}`,
      label: q.question,
      icon: 'ri-questionnaire-line',
      type: 'faq',
      pageId: 'faq',
      subId: q.id,
      searchText: `${q.question} ${q.answer}`.toLowerCase(),
    });
  }

  return items;
}

export default function CommandPalette({ isOpen, onClose, onSelect }: CommandPaletteProps) {
  const allItems = useMemo(() => buildSearchIndex(), []);

  // Map SearchItems to CommandItems for the new primitive.
  // When a query is empty the temp primitive shows ALL items — that's a difference from the
  // legacy palette which showed only "page" items when empty. To preserve UX, we still pass
  // every item but rely on the user typing to narrow.
  const commandItems = useMemo<CommandItem[]>(
    () =>
      allItems.map((item) => ({
        id: item.key,
        label: item.label,
        icon: TYPE_ICONS[item.type],
        description:
          item.type === 'catalog' || item.type === 'page' ? undefined : TYPE_LABELS[item.type],
        group: TYPE_LABELS[item.type],
        onSelect: () => onSelect(item),
      })),
    [allItems, onSelect],
  );

  return (
    <CommandPalettePrimitive
      items={commandItems}
      open={isOpen}
      onClose={onClose}
      placeholder="Search pages, catalog, guidelines, FAQ…"
    />
  );
}
