import { useState } from 'react';
import {
  Subscription,
  getMemberPlatformInfo,
  getMemberContributionAmount,
  resolveMemberNextPaymentDate,
} from '../types';
import { leaveGroupCall } from '../lib/firebase';
import { MessageCircle, ChevronRight } from 'lucide-react';
import { t, tp } from '../i18n';

interface ClientGroupDetailViewProps {
  group: Subscription | null;
  currentUid: string;
  onBackToList?: () => void;
  isMobile?: boolean;
  alarmPref?: { enabled: boolean; leadDays: number };
  onSaveAlarmPref?: (groupId: string, enabled: boolean, leadDays: number) => void;
  unreadChatIdsForClient?: Set<string>;
  onOpenChat?: (chatId: string, subscriptionName: string, otherPersonName: string) => void;
}

function formatDateDMY(iso: string): string {
  if (!iso) return '';
  const parts = String(iso).split('T')[0].split('-');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return iso;
}

export function ClientGroupDetailView({ 
  group, 
  currentUid, 
  onBackToList, 
  isMobile,
  alarmPref,
  onSaveAlarmPref,
  unreadChatIdsForClient = new Set(),
  onOpenChat
}: ClientGroupDetailViewProps) {
  const [isConfirmingLeave, setIsConfirmingLeave] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  if (!group) {
    return (
      <div className="bg-card border border-border rounded-3xl p-10 text-center">
        <p className="text-sm font-semibold text-muted-foreground">
          {t('cg.pick')}
        </p>
      </div>
    );
  }

  const myMember = (group.members || []).find((m) => m.linkedUid === currentUid);
  const title = group.platformName || group.name || 'Grupo';
  const platform = myMember ? (getMemberPlatformInfo(group, myMember)?.name || '') : '';
  const amount = myMember ? getMemberContributionAmount(group, myMember) : 0;
  const nextPayment = formatDateDMY(myMember ? resolveMemberNextPaymentDate(group, myMember) : '');
  const isPaid = myMember ? !myMember.isPendingPayment : false;

  const handleConfirmLeave = async () => {
    setIsLeaving(true);
    setLeaveError(null);
    try {
      await leaveGroupCall(String(group.id));
      setIsConfirmingLeave(false);
      if (onBackToList) onBackToList();
    } catch (e: any) {
      setLeaveError(e?.message || t('cg.leaveErr'));
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-5 sm:p-6">
      {isMobile && onBackToList && (
        <button type="button" onClick={onBackToList} className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-3 cursor-pointer">
          {t('cg.back')}
        </button>
      )}
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="text-xl font-black text-foreground truncate">{title}</h2>
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
          {t('cg.client')}
        </span>
      </div>

      <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2.5">
        {group.showMainUserToMembers && group.mainUserName && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('cg.holder')}</span>
            <span className="font-bold text-foreground text-right">{group.mainUserName}</span>
          </div>
        )}
        {platform && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('cg.platform')}</span>
            <span className="font-bold text-foreground text-right">{platform}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('cg.yourShare')}</span>
          <span className="font-black text-foreground text-right">{amount.toFixed(2)} €</span>
        </div>
        {nextPayment && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('cg.nextPayment')}</span>
            <span className="font-bold text-foreground text-right">{nextPayment}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('cg.payStatus')}</span>
          <span className={`font-bold text-right ${isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {isPaid ? t('cg.paid') : t('cg.pending')}
          </span>
        </div>
      </div>

      <div className="mt-3 p-3 rounded-2xl bg-muted/40 border border-border">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-foreground">{t('cg.yourAlarm')}</p>
          <div
            onClick={() => {
              if (!onSaveAlarmPref) return;
              const current = alarmPref || { enabled: true, leadDays: 3 };
              onSaveAlarmPref(String(group.id), !current.enabled, current.leadDays);
            }}
            className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors shrink-0 cursor-pointer ${
              (alarmPref?.enabled ?? true) ? 'bg-blue-500 justify-end' : 'bg-muted-foreground/30 justify-start'
            }`}
          >
            <div className="bg-white w-5 h-5 rounded-full shadow-md transform transition-transform" />
          </div>
        </div>
        {(alarmPref?.enabled ?? true) ? (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] text-muted-foreground">{t('cg.notifyMe')}</span>
            <button
              type="button"
              onClick={() => {
                if (!onSaveAlarmPref) return;
                const current = alarmPref || { enabled: true, leadDays: 3 };
                onSaveAlarmPref(String(group.id), current.enabled, Math.max(1, current.leadDays - 1));
              }}
              className="w-6 h-6 flex items-center justify-center rounded-lg bg-muted hover:bg-muted/70 text-foreground text-sm font-bold cursor-pointer"
            >
              −
            </button>
            <span className="text-xs font-bold text-foreground min-w-[52px] text-center">
              {alarmPref?.leadDays ?? 3} {tp('cg.daysUnit', alarmPref?.leadDays ?? 3)}
            </span>
            <button
              type="button"
              onClick={() => {
                if (!onSaveAlarmPref) return;
                const current = alarmPref || { enabled: true, leadDays: 3 };
                onSaveAlarmPref(String(group.id), current.enabled, Math.min(30, current.leadDays + 1));
              }}
              className="w-6 h-6 flex items-center justify-center rounded-lg bg-muted hover:bg-muted/70 text-foreground text-sm font-bold cursor-pointer"
            >
              +
            </button>
            <span className="text-[11px] text-muted-foreground">{t('cg.before')}</span>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground mt-1">{t('cg.noAlerts')}</p>
        )}
      </div>

      {group && (() => {
        const chatId = `${group.userId}_${group.id}_${currentUid}`;
        const hasUnread = unreadChatIdsForClient.has(chatId);
        const subscriptionName = group.platformName || group.name || t('nf.subscription');
        return (
          <button
            type="button"
            onClick={() => onOpenChat && onOpenChat(chatId, subscriptionName, 'El gestor')}
            className={`mt-3 w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-colors cursor-pointer ${
              hasUnread
                ? 'bg-blue-500/10 border-blue-500/50'
                : 'bg-muted/40 border-border hover:bg-muted/70'
            }`}
          >
            <div className="relative shrink-0">
              <MessageCircle className={`w-5 h-5 ${hasUnread ? 'text-blue-500' : 'text-muted-foreground'}`} />
              {hasUnread && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-600 border-2 border-card" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground">{t('cg.chatWith')}</p>
              <p className={`text-[11px] mt-0.5 ${hasUnread ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-muted-foreground'}`}>
                {hasUnread ? t('cg.newMsg') : t('cg.tapChat')}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        );
      })()}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => { setLeaveError(null); setIsConfirmingLeave(true); }}
          className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
        >
          {t('cg.leave')}
        </button>
      </div>

      {isConfirmingLeave && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => { if (!isLeaving) setIsConfirmingLeave(false); }}
        >
          <div
            className="w-full max-w-sm bg-card border border-border rounded-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-black text-foreground mb-2">{t('cg.leaveQ', { title })}</h2>
            <p className="text-xs text-muted-foreground">
              {t('cg.leaveText')}
            </p>
            {leaveError && (
              <p className="text-xs mt-3 font-bold text-rose-600 dark:text-rose-400">
                {leaveError}
              </p>
            )}
            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => setIsConfirmingLeave(false)}
                disabled={isLeaving}
                className="flex-1 py-3 rounded-2xl bg-muted/60 hover:bg-muted border border-border text-sm font-bold text-foreground transition-colors cursor-pointer disabled:opacity-50"
              >
                {t('cg.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmLeave}
                disabled={isLeaving}
                className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-sm font-bold text-white transition-colors cursor-pointer"
              >
                {isLeaving ? t('cg.leaving') : t('cg.leaveBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
