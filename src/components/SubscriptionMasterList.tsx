import React from 'react';
import { Subscription, FilterOptions, Category } from '../types';
import { PlatformIconBadge } from '../utils/icons';
import { 
  Plus, 
  Search, 
  X, 
  ChevronRight, 
  ArrowDownAZ, 
  Clock, 
  Calendar, 
  Filter
} from 'lucide-react';

interface SubscriptionMasterListProps {
  subscriptions: Subscription[];
  selectedSubscriptionId: string | null;
  onSelectSubscription: (subId: string) => void;
  filters: FilterOptions;
  onChangeFilters: (filters: FilterOptions) => void;
  onNewSubscription: () => void;
  totalCount: number;
}

const CATEGORIES: { id: Category | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'Todas las categorías' },
  { id: 'STREAMING', label: 'Streaming' },
  { id: 'MUSIC', label: 'Música' },
  { id: 'GAMING', label: 'Gaming' },
  { id: 'AI_TOOLS', label: 'IA y Productividad' },
  { id: 'CLOUD', label: 'Almacenamiento' },
  { id: 'SOFTWARE', label: 'Software' },
  { id: 'FITNESS', label: 'Salud y Fitness' },
  { id: 'EDUCATION', label: 'Educación' },
  { id: 'NEWS', label: 'Prensa y Noticias' },
  { id: 'OTHER', label: 'Otros' },
];

export const SubscriptionMasterList: React.FC<SubscriptionMasterListProps> = ({
  subscriptions,
  selectedSubscriptionId,
  onSelectSubscription,
  filters,
  onChangeFilters,
  onNewSubscription,
  totalCount,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeFilters({ ...filters, search: e.target.value });
  };

  const clearSearch = () => {
    onChangeFilters({ ...filters, search: '' });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeFilters({ ...filters, category: e.target.value as any });
  };

  const setSortBy = (sort: FilterOptions['sortBy']) => {
    onChangeFilters({ ...filters, sortBy: sort });
  };

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-3xl overflow-hidden shadow-lg transition-colors">
      {/* Top Header */}
      <div className="p-4 border-b border-border bg-muted/40">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground tracking-tight">
              Suscripciones
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-blue-500/10 text-blue-500 border border-blue-500/20">
              {subscriptions.length}
            </span>
          </div>

          <button
            id="btn-sidebar-add-sub"
            onClick={onNewSubscription}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            id="input-sidebar-search"
            type="text"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Filtrar por nombre..."
            className="w-full pl-10 pr-8 py-2 rounded-xl bg-background border border-border text-foreground placeholder-muted-foreground text-xs font-medium focus:outline-none focus:border-blue-500 transition-colors"
          />
          {filters.search && (
            <button
              onClick={clearSearch}
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-1 p-1 bg-background rounded-xl border border-border">
          <button
            id="btn-sort-name"
            onClick={() => setSortBy('name')}
            type="button"
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              filters.sortBy === 'name' || filters.sortBy === 'name_desc'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title="Ordenar alfabéticamente (A-Z)"
          >
            <ArrowDownAZ className="w-3.5 h-3.5" />
            <span>A-Z</span>
          </button>

          <button
            id="btn-sort-recent"
            onClick={() => setSortBy('recent')}
            type="button"
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              filters.sortBy === 'recent'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title="Ordenar por más recientes"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Recientes</span>
          </button>

          <button
            id="btn-sort-renewal"
            onClick={() => setSortBy('renewal')}
            type="button"
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              filters.sortBy === 'renewal' || filters.sortBy === 'default'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title="Ordenar por día de cobro"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Día cobro</span>
          </button>
        </div>

        {/* Optional Category filter select */}
        <div className="mt-2.5 relative">
          <select
            id="select-sidebar-category"
            value={filters.category}
            onChange={handleCategoryChange}
            className="w-full appearance-none pl-3 pr-7 py-1.5 rounded-lg bg-background border border-border text-foreground text-[11px] font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id} className="bg-card text-foreground">
                {c.label}
              </option>
            ))}
          </select>
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Subscription List (One below another) */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 divide-y divide-transparent">
        {subscriptions.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <p className="text-xs font-semibold text-muted-foreground">
              No se encontraron suscripciones
            </p>
            {filters.search && (
              <button
                onClick={clearSearch}
                type="button"
                className="mt-2 text-xs font-bold text-blue-500 hover:underline cursor-pointer"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          subscriptions.map((sub) => {
            const isSelected = selectedSubscriptionId != null && String(sub.id) === String(selectedSubscriptionId);
            const displayName = sub.platformName || sub.name || 'Suscripción';
            const iconColor = sub.iconColorHex || sub.color || '#1285FA';
            const membersCount = (sub.members || []).length;

            return (
              <button
                key={sub.id}
                id={`btn-select-sub-${sub.id}`}
                onClick={() => onSelectSubscription(sub.id)}
                type="button"
                className={`w-full text-left p-3 rounded-2xl transition-all duration-150 flex items-center justify-between gap-3 group relative overflow-hidden cursor-pointer ${
                  isSelected
                    ? 'bg-blue-500/15 border border-blue-500/50 shadow-md ring-1 ring-blue-500/20'
                    : 'bg-muted/40 border border-border hover:bg-muted/80'
                }`}
              >
                {/* Active indicator bar */}
                {isSelected && (
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
                    style={{ backgroundColor: iconColor }}
                  />
                )}

                <div className="flex items-center gap-3 min-w-0">
                  <PlatformIconBadge
                    key={`list-icon-${sub.id}-${sub.customImageUri || ''}-${sub.iconType || ''}`}
                    platformName={displayName}
                    iconType={sub.iconType}
                    iconKey={sub.iconKey}
                    customImageUri={sub.customImageUri}
                    customImageBase64={sub.customImageBase64}
                    iconColorHex={iconColor}
                    sizeClass="w-9 h-9"
                    iconSizeClass="w-4.5 h-4.5"
                    roundedClass="rounded-xl"
                  />

                  <div className="min-w-0">
                    <p className={`text-sm font-bold truncate transition-colors ${
                      isSelected ? 'text-foreground font-extrabold' : 'text-foreground group-hover:text-foreground'
                    }`}>
                      {displayName}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-medium truncate">
                      {sub.category || 'Streaming'} · {membersCount} miembro{membersCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <ChevronRight className={`w-4 h-4 transition-transform ${
                    isSelected ? 'text-blue-500 translate-x-0.5' : 'text-muted-foreground group-hover:text-foreground'
                  }`} />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
