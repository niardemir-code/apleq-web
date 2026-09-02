import React, { useState } from 'react';
import { AppNotification } from '../utils/notifications';
import { Subscription, Member } from '../types';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  ExternalLink, 
  MessageSquare, 
  CheckCircle2, 
  Sparkles,
  Layers,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { generateMemberReminderText, getWhatsAppShareUrl } from '../utils/reminder';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  subscriptions: Subscription[];
  onMarkAllAsRead: () => void;
  onToggleRead: (notifId: string) => void;
  onOpenMemberDetail: (subscription: Subscription, memberId: string) => void;
  onMarkMemberPaid: (subscriptionId: string, memberId: string) => void;
  ownerName?: string;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  subscriptions,
  onMarkAllAsRead,
  onToggleRead,
  onOpenMemberDetail,
  onMarkMemberPaid,
  ownerName,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const displayedNotifications = filterMode === 'unread' 
    ? notifications.filter((n) => !n.isRead) 
    : notifications;

  const handleCopyReminder = (notif: AppNotification) => {
    const sub = subscriptions.find((s) => String(s.id) === String(notif.subscriptionId));
    if (!sub) return;
    const member = (sub.members || []).find((m) => String(m.id) === String(notif.memberId));
    if (!member) return;

    const text = generateMemberReminderText(sub, member, ownerName);
    navigator.clipboard.writeText(text);
    setCopiedId(notif.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenWhatsApp = (notif: AppNotification) => {
    const sub = subscriptions.find((s) => String(s.id) === String(notif.subscriptionId));
    if (!sub) return;
    const member = (sub.members || []).find((m) => String(m.id) === String(notif.memberId));
    if (!member) return;

    const text = generateMemberReminderText(sub, member, ownerName);
    const url = getWhatsAppShareUrl(member.memberContact || member.contact || '', text);
    window.open(url, '_blank');
  };

  const handleGoToMember = (notif: AppNotification) => {
    const sub = subscriptions.find((s) => String(s.id) === String(notif.subscriptionId));
    if (!sub) return;
    onOpenMemberDetail(sub, notif.memberId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div 
        id="modal-notifications-window"
        className="relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col transition-colors duration-200"
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-border bg-muted/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-foreground tracking-tight">
                  Centro de Notificaciones y Alarmas
                </h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs">
                    {unreadCount} sin leer
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Avisos de próximos cobros, alarmas configuradas y cuotas pendientes.
              </p>
            </div>
          </div>

          <button
            id="btn-close-notifs-modal"
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar & Quick Actions */}
        <div className="px-6 py-3 border-b border-border bg-muted/10 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border">
            <button
              id="btn-filter-notifs-all"
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-card text-foreground shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              id="btn-filter-notifs-unread"
              type="button"
              onClick={() => setFilterMode('unread')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterMode === 'unread'
                  ? 'bg-card text-foreground shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Pendientes de leer</span>
              {unreadCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              id="btn-mark-all-notifs-read"
              type="button"
              onClick={onMarkAllAsRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-800/60 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Marcar todas como leídas</span>
            </button>
          )}
        </div>

        {/* Notifications Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
          {displayedNotifications.length === 0 ? (
            <div className="text-center py-14 px-4 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 mx-auto flex items-center justify-center border border-blue-500/20">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-foreground">
                {filterMode === 'unread' 
                  ? '¡No tienes notificaciones pendientes de leer!' 
                  : 'Sin alarmas ni pagos pendientes'}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {filterMode === 'unread'
                  ? 'Has revisado todas las alertas de cobro. Puedes ver el historial completo pulsando en "Todas".'
                  : 'Todas las cuotas de tus co-suscriptores están al día o fuera de su periodo de antelación.'}
              </p>
            </div>
          ) : (
            displayedNotifications.map((notif) => {
              const isOverdue = notif.status === 'overdue';
              const isToday = notif.status === 'today';
              const isUnread = !notif.isRead;

              return (
                <div
                  key={notif.id}
                  id={`notif-card-${notif.id}`}
                  className={`relative p-4 rounded-2xl border transition-all duration-200 ${
                    isUnread
                      ? 'bg-blue-500/5 dark:bg-blue-950/30 border-blue-500/40 shadow-sm ring-1 ring-blue-500/20'
                      : 'bg-card border-border/80 opacity-85 hover:opacity-100 hover:border-border'
                  }`}
                >
                  {/* Unread Accent Pill */}
                  {isUnread && (
                    <div className="absolute -top-2.5 left-4 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-black tracking-wider uppercase shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                      Pendiente de leer
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pt-1">
                    {/* Main Notif Details */}
                    <div className="flex items-start gap-3">
                      {/* Subscription Icon / Badge */}
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: notif.subscriptionColor || '#1285FA' }}
                      >
                        {notif.subscriptionName.charAt(0).toUpperCase()}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-extrabold text-foreground">
                            {notif.memberName}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                            {notif.subscriptionName}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            {notif.sharingPlatform}
                          </span>
                        </div>

                        {/* Status / Urgency info */}
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                              isOverdue
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                : isToday
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                            }`}
                          >
                            {isOverdue ? (
                              <AlertTriangle className="w-3 h-3" />
                            ) : isToday ? (
                              <Clock className="w-3 h-3" />
                            ) : (
                              <Bell className="w-3 h-3" />
                            )}
                            <span>{notif.dueDateText}</span>
                          </span>

                          {notif.nextPaymentDate && (
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                              <Calendar className="w-3 h-3 text-muted-foreground/70" />
                              {notif.nextPaymentDate}
                            </span>
                          )}

                          {notif.alarmConfigText && (
                            <span className="text-[10px] text-muted-foreground/80 italic">
                              · {notif.alarmConfigText}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Amount & Mark read toggle */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1">
                      <div className="text-right">
                        <div className="text-sm font-black text-foreground">
                          {notif.amount.toFixed(2)} {notif.currencySymbol}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          cuota a recibir
                        </div>
                      </div>

                      <button
                        id={`btn-toggle-read-${notif.id}`}
                        type="button"
                        onClick={() => onToggleRead(notif.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isUnread
                            ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-500/10'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                        title={isUnread ? 'Marcar como leída' : 'Marcar como no leída'}
                      >
                        {isUnread ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-3.5 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* WhatsApp Reminder CTA */}
                      <button
                        id={`btn-notif-whatsapp-${notif.id}`}
                        type="button"
                        onClick={() => handleOpenWhatsApp(notif)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                        title="Enviar recordatorio por WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Avisar por WhatsApp</span>
                      </button>

                      {/* Copy message CTA */}
                      <button
                        id={`btn-notif-copy-${notif.id}`}
                        type="button"
                        onClick={() => handleCopyReminder(notif)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-[11px] font-semibold border border-border transition-colors cursor-pointer"
                        title="Copiar texto de recordatorio"
                      >
                        <span>{copiedId === notif.id ? '¡Copiado! ✅' : 'Copiar texto'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Mark as paid button */}
                      <button
                        id={`btn-notif-paid-${notif.id}`}
                        type="button"
                        onClick={() => onMarkMemberPaid(notif.subscriptionId, notif.memberId)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                        title="Marcar cuota como pagada"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Marcar pagado</span>
                      </button>

                      {/* Open Member Detail */}
                      <button
                        id={`btn-notif-view-${notif.id}`}
                        type="button"
                        onClick={() => handleGoToMember(notif)}
                        className="p-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground hover:text-blue-500 border border-border transition-colors cursor-pointer"
                        title="Ver ficha del miembro"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Summary */}
        <div className="px-6 py-3.5 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Las alarmas se calculan en base a la fecha de próximo cobro y antelación configurada.</span>
          </div>
          <button
            id="btn-footer-close-notifs"
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold border border-border transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
