import { Subscription } from '../types';

interface ParticipatingListProps {
  groups: Subscription[];
  currentUid: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ParticipatingList({ groups, selectedId, onSelect }: ParticipatingListProps) {
  if (!groups || groups.length === 0) return null;

  return (
    <div className="mt-4 bg-card border border-border rounded-3xl p-3">
      <div className="flex items-center gap-2 px-2 py-2">
        <h2 className="text-sm font-black text-foreground">Participo en</h2>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          {groups.length}
        </span>
      </div>
      <div className="space-y-1.5 mt-1">
        {groups.map((group) => {
          const isSelected = selectedId != null && String(group.id) === String(selectedId);
          const title = group.platformName || group.name || 'Grupo';
          return (
            <button
              key={String(group.id)}
              type="button"
              onClick={() => onSelect(String(group.id))}
              className={`w-full text-left flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-emerald-500/10 border-emerald-500/50'
                  : 'bg-transparent border-transparent hover:bg-muted/50'
              }`}
            >
              <span className="text-sm font-bold text-foreground truncate">{title}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                Cliente
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
