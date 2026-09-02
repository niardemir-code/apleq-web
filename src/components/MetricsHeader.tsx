import React from 'react';
import { Subscription, getMemberPlatformInfo, getMemberContributionAmount } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { 
  TrendingUp, 
  PiggyBank, 
  ArrowDown, 
  ArrowUp, 
  Layers, 
  Users,
  AlertCircle
} from 'lucide-react';

interface MetricsHeaderProps {
  subscriptions: Subscription[];
  onFilterPending?: () => void;
}

export const MetricsHeader: React.FC<MetricsHeaderProps> = ({
  subscriptions,
  onFilterPending,
}) => {
  const { convertToEur } = useCurrency();

  let totalMonthlyCost = 0;
  let totalContributed = 0;
  let totalMembersCount = 0;
  let pendingPaymentsCount = 0;
  let pendingAmount = 0;

  subscriptions.forEach((sub) => {
    // Monthly equivalent cost in EUR
    const periodMonths = sub.billingPeriod === 'YEARLY' ? 12 : sub.billingPeriod === 'SEMI_ANNUAL' ? 6 : sub.billingPeriod === 'QUARTERLY' ? 3 : 1;
    const costInEur = convertToEur(sub.cost, sub.currency || 'EUR');
    const myCostMonthly = costInEur / periodMonths;
    totalMonthlyCost += myCostMonthly;

    (sub.members || []).forEach((member) => {
      totalMembersCount += 1;
      const mInfo = getMemberPlatformInfo(sub, member);
      const memberAmount = getMemberContributionAmount(sub, member);
      const mPeriodMonths = mInfo.period === 'YEARLY' ? 12 : mInfo.period === 'SEMI_ANNUAL' ? 6 : mInfo.period === 'QUARTERLY' ? 3 : 1;
      const memberAmountInEur = convertToEur(memberAmount, mInfo.currency || 'EUR') / mPeriodMonths;
      totalContributed += memberAmountInEur;

      if (member.isPendingPayment) {
        pendingPaymentsCount += 1;
        pendingAmount += memberAmountInEur;
      }
    });
  });

  const netBalance = totalContributed - totalMonthlyCost;
  const isProfit = netBalance > 0.001;

  return (
    <section className="mb-4" id="financial-summary-card">
      {/* Alert if pending payments exist */}
      {pendingPaymentsCount > 0 && onFilterPending && (
        <div className="mb-2.5 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-2 text-amber-700 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 animate-pulse" />
            <span className="text-xs font-medium">
              Hay <strong>{pendingPaymentsCount} pago(s) pendiente(s)</strong> por cobrar ({pendingAmount.toFixed(2)} €)
            </span>
          </div>
          <button
            onClick={onFilterPending}
            type="button"
            className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-800 dark:text-amber-200 transition-colors cursor-pointer"
          >
            Ver pendientes
          </button>
        </div>
      )}

      {/* Compact 2-Row Financial Summary */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border shadow-md">
        {/* Top Row: Ganancia Neta, Te cuesta a ti, Te aportan */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 items-stretch">
          {/* 1: Ganancia / Balance Neto */}
          <div className={`p-3 rounded-xl border flex items-center gap-3 ${
            isProfit 
              ? 'bg-emerald-500/10 border-emerald-500/30' 
              : 'bg-blue-500/10 border-blue-500/30'
          }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isProfit 
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                : 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
            }`}>
              {isProfit ? <TrendingUp className="w-5 h-5" /> : <PiggyBank className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block leading-tight truncate">
                {isProfit ? 'Ganancia Neta' : 'Balance Neto'}
              </span>
              <div className={`text-base sm:text-lg font-black tracking-tight leading-tight mt-0.5 truncate ${
                isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
              }`}>
                {netBalance > 0.001 ? `+${netBalance.toFixed(2)}` : netBalance.toFixed(2)}{' '}
                <span className="text-xs font-semibold opacity-75">€/mes</span>
              </div>
            </div>
          </div>

          {/* 2: Te cuesta a ti */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 flex items-center justify-center shrink-0">
              <ArrowDown className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block leading-tight truncate">
                Te cuesta a ti
              </span>
              <div className="text-base sm:text-lg font-bold text-foreground mt-0.5 leading-tight truncate">
                {totalMonthlyCost.toFixed(2)}{' '}
                <span className="text-xs font-normal text-muted-foreground">€/mes</span>
              </div>
            </div>
          </div>

          {/* 3: Te aportan */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center justify-center shrink-0">
              <ArrowUp className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block leading-tight truncate">
                Te aportan
              </span>
              <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 leading-tight truncate">
                +{totalContributed.toFixed(2)}{' '}
                <span className="text-xs font-normal text-muted-foreground">€/mes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Suscripciones & Miembros activos */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mt-2.5 pt-2.5 border-t border-border">
          <div className="px-3.5 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center sm:justify-start gap-2">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
              {subscriptions.length} {subscriptions.length === 1 ? 'Suscripción' : 'Suscripciones'}
            </span>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center sm:justify-start gap-2">
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {totalMembersCount} {totalMembersCount === 1 ? 'Miembro activo' : 'Miembros activos'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
