import React from 'react';
import { Plus, Filter } from 'lucide-react';
import { SplitzyLogo } from './SplitzyLogo';

interface EmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
  onNewSubscription: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  hasFilters,
  onClearFilters,
  onNewSubscription,
}) => {
  if (hasFilters) {
    return (
      <div className="py-16 px-4 text-center rounded-2xl bg-card border border-border shadow-xl max-w-lg mx-auto my-8">
        <div className="w-14 h-14 rounded-2xl bg-muted border border-border text-muted-foreground flex items-center justify-center mx-auto mb-4">
          <Filter className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-foreground">
          No hay suscripciones que coincidan
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          Prueba a cambiar los términos de búsqueda o limpiar los filtros activos.
        </p>
        <button
          onClick={onClearFilters}
          type="button"
          className="mt-5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-lg shadow-blue-600/25 cursor-pointer"
        >
          Limpiar todos los filtros
        </button>
      </div>
    );
  }

  return (
    <div className="py-12 px-6 text-center rounded-2xl bg-card border border-border shadow-xl max-w-2xl mx-auto my-6">
      <div className="relative inline-block mb-4">
        <SplitzyLogo size={68} />
      </div>

      <h2 className="text-xl font-bold text-foreground tracking-tight">
        Empieza a optimizar tus suscripciones compartidas
      </h2>
      <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
        Añade los servicios que compartes en <span className="font-semibold text-foreground">Together Price, Sharesub, Sharingful, Spliiit, Gamsgo</span> o con familia y amigos para sincronizar costes y cobros mensuales.
      </p>

      {/* Quick Add CTA */}
      <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
        <button
          id="btn-empty-new-sub"
          onClick={onNewSubscription}
          type="button"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Crear Primera Suscripción</span>
        </button>
      </div>
    </div>
  );
};

