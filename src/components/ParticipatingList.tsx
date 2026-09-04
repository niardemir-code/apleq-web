import { useState } from 'react';
import { Subscription, getMemberPlatformInfo } from '../types';
import { PlatformIconBadge } from '../utils/icons';
import { ChevronRight, Search } from 'lucide-react';

interface ParticipatingListProps {
  groups: Subscription[];
  currentUid: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ParticipatingList({ groups, currentUid, selectedId, onSelect }: ParticipatingListProps) {
  const [search, setSearch] = useState('');
  if (!groups || groups.length === 0) return null;

  const filtered = groups.filter((g) =>
    (g.platformName || g.name || '').toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="mt-4 bg-card border border-border rounded-3xl p-3">
      <div className="flex items-center gap-2 px-2 py-2">
        <h2 className="text-sm font-black text-foreground">Participo en</h2>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          {groups.length}
        </span>
      </div>

      <div className="relative mb-2 px-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrar por nombre..."
          className="w-full bg-muted/40 border border-border rounded-2xl pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-[11px] text-muted-foreground text-center py-4">No se encontraron grupos</p>
        ) : (
          filtered.map((group) => {
            const isSelected = selectedId != null && String(group.id) === String(selectedId);
            const displayName = group.platformName || group.name || 'Grupo';
            const iconColor = group.iconColorHex || group.color || '#10B981';
            const myMember = (group.members || []).find((m) => m.linkedUid === currentUid);
            const platform = myMember ? (getMemberPlatformInfo(group, myMember)?.name || '') : '';
            return (
              <button
                key={String(group.id)}
                type="button"
                onClick={() => onSelect(String(group.id))}
                className={`w-full text-left p-3 rounded-2xl transition-all duration-150 flex items-center justify-between gap-3 group relative overflow-hidden cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/15 border border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                    : 'bg-muted/40 border border-border hover:bg-muted/80'
                }`}
              >
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full" style={{ backgroundColor: iconColor }} />
                )}
                <div className="flex items-center gap-3 min-w-0">
                  <PlatformIconBadge
                    key={`plist-icon-${group.id}-${group.customImageUri || ''}-${group.iconType || ''}`}
                    platformName={displayName}
                    iconType={group.iconType}
                    iconKey={group.iconKey}
                    customImageUri={group.customImageUri}
                    customImageBase64={group.customImageBase64}
                    iconColorHex={iconColor}
                    sizeClass="w-9 h-9"
                    iconSizeClass="w-4.5 h-4.5"
                    roundedClass="rounded-xl"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
                    <p className="text-[11px] text-muted-foreground font-medium truncate">{platform || 'Cliente'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Cliente</span>
                  <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
