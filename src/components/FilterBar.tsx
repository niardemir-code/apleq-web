import React from 'react';
import { FilterOptions, Category, SharingPlatform, SUBSCRIPTION_CATEGORIES } from '../types';
import { useSharingPlatforms } from '../context/SharingPlatformsContext';
import { 
  Search, 
  X, 
  SlidersHorizontal, 
  ArrowUpDown,
  Filter,
  CheckCircle,
  Clock,
  UserPlus
} from 'lucide-react';

interface FilterBarProps {
  filters: FilterOptions;
  onChangeFilters: (newFilters: FilterOptions) => void;
  totalCount: number;
  filteredCount: number;
}

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'ALL', label: 'Todas las categorías' },
  { id: 'Streaming', label: '🎬 Streaming' },
  { id: 'Música', label: '🎵 Música' },
  { id: 'Productividad', label: '⚡ Productividad' },
  { id: 'Gaming', label: '🎮 Gaming' },
  { id: 'Educación', label: '📚 Educación' },
  { id: 'Salud', label: '❤️ Salud' },
  { id: 'Estilo de vida', label: '🌿 Estilo de vida' },
  { id: 'Seguridad', label: '🛡️ Seguridad' },
  { id: 'Finanzas', label: '💳 Finanzas' },
  { id: 'General', label: '📦 General' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChangeFilters,
  totalCount,
  filteredCount,
}) => {
  const { platforms } = useSharingPlatforms();
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeFilters({ ...filters, search: e.target.value });
  };

  const clearSearch = () => {
    onChangeFilters({ ...filters, search: '' });
  };

  const handleCategoryChange = (cat: string) => {
    onChangeFilters({ ...filters, category: cat });
  };

  const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeFilters({ ...filters, platform: e.target.value });
  };

  const handleStatusChange = (status: string) => {
    onChangeFilters({ ...filters, paymentStatus: status });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeFilters({ ...filters, sortBy: e.target.value as any });
  };

  const hasActiveFilters = 
    filters.search !== '' || 
    filters.category !== 'ALL' || 
    filters.platform !== 'ALL' || 
    filters.paymentStatus !== 'ALL';

  const resetAllFilters = () => {
    onChangeFilters({
      search: '',
      category: 'ALL',
      platform: 'ALL',
      paymentStatus: 'ALL',
      sortBy: 'renewal',
    });
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Top Search and Main Selects */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="input-search-subscriptions"
            type="text"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Buscar suscripciones por nombre, plan, miembro, plataforma..."
            className="w-full pl-11 pr-9 py-2.5 rounded-full bg-slate-900/50 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors shadow-xs"
          />
          {filters.search && (
            <button
              onClick={clearSearch}
              type="button"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-500 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {/* Platform select */}
          <div className="relative min-w-[160px]">
            <select
              id="select-filter-platform"
              value={filters.platform}
              onChange={handlePlatformChange}
              className="w-full appearance-none pl-4 pr-8 py-2.5 rounded-full bg-slate-900/60 border border-slate-800 text-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-xs cursor-pointer"
            >
              <option value="ALL" className="bg-[#0f0f0f] text-slate-200">Cualquier plataforma</option>
              {platforms.map((p) => (
                <option key={p.id} value={p.name} className="bg-[#0f0f0f] text-slate-200">
                  {p.name}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>

          {/* Sort By */}
          <div className="relative min-w-[170px]">
            <select
              id="select-sort-by"
              value={filters.sortBy}
              onChange={handleSortChange}
              className="w-full appearance-none pl-4 pr-8 py-2.5 rounded-full bg-slate-900/60 border border-slate-800 text-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-xs cursor-pointer"
            >
              <option value="renewal" className="bg-[#0f0f0f] text-slate-200">📅 Próxima renovación</option>
              <option value="cost_desc" className="bg-[#0f0f0f] text-slate-200">💰 Mayor coste</option>
              <option value="cost_asc" className="bg-[#0f0f0f] text-slate-200">💵 Menor coste</option>
              <option value="savings_desc" className="bg-[#0f0f0f] text-slate-200">✨ Mayor ahorro</option>
              <option value="name" className="bg-[#0f0f0f] text-slate-200">🔤 Nombre (A-Z)</option>
            </select>
            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              type="button"
              className="whitespace-nowrap px-3.5 py-2 text-xs font-bold text-rose-400 hover:bg-rose-950/40 rounded-full transition-colors border border-rose-900/30"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Category Pills & Status Quick Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Category Pills Scrollable */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map((cat) => {
            const isActive = filters.category === cat.id;
            return (
              <button
                key={cat.id}
                id={`pill-cat-${cat.id}`}
                onClick={() => handleCategoryChange(cat.id)}
                type="button"
                className={`whitespace-nowrap text-xs font-medium px-3.5 py-1.5 rounded-full transition-all duration-150 border ${
                  isActive
                    ? 'bg-slate-800 text-white border-slate-700 shadow-xs'
                    : 'bg-slate-900/50 text-slate-400 border-slate-800/80 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Quick Status Filters */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={() => handleStatusChange(filters.paymentStatus === 'has_pending' ? 'ALL' : 'has_pending')}
            type="button"
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              filters.paymentStatus === 'has_pending'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Pendientes</span>
          </button>

          <button
            onClick={() => handleStatusChange(filters.paymentStatus === 'all_paid' ? 'ALL' : 'all_paid')}
            type="button"
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              filters.paymentStatus === 'all_paid'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span>Al día</span>
          </button>

          <span className="text-xs text-slate-500 pl-1 font-medium">
            ({filteredCount} de {totalCount})
          </span>
        </div>
      </div>
    </div>
  );
};
