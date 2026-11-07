import { useEffect, useRef, useState } from 'react';
import { X, Send, ArrowLeft, MoreVertical, Flag, Ban } from 'lucide-react';
import { ChatMessage } from '../services/subscriptionService';
import { ReportReason, REPORT_REASONS } from '../services/moderationService';
import { t } from '../i18n';

interface ChatWindowProps {
  subscriptionName: string;
  otherPersonName: string;
  currentUid: string;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onClose: () => void;
  onBack?: () => void;
  isBlocked: boolean;
  onBlock: () => void;
  onUnblock: () => void;
  onReport: (reason: ReportReason, comment: string) => Promise<void>;
}

export function ChatWindow({
  subscriptionName,
  otherPersonName,
  currentUid,
  messages,
  onSend,
  onClose,
  onBack,
  isBlocked,
  onBlock,
  onUnblock,
  onReport,
}: ChatWindowProps) {
  const [text, setText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('harassment');
  const [comment, setComment] = useState('');
  const [reportStatus, setReportStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Si la persona está bloqueada, sus mensajes no se muestran.
  const visibleMessages = isBlocked ? messages.filter((m) => m.senderId === currentUid) : messages;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages.length]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isBlocked) return;
    onSend(trimmed);
    setText('');
  };

  const handleBlockClick = () => {
    setMenuOpen(false);
    if (window.confirm(t('ch.blockConfirm'))) onBlock();
  };

  const openReport = () => {
    setMenuOpen(false);
    setReason('harassment');
    setComment('');
    setReportStatus('idle');
    setReportOpen(true);
  };

  const submitReport = async () => {
    setReportStatus('sending');
    try {
      await onReport(reason, comment.trim());
      setReportStatus('done');
    } catch (e) {
      console.error('Error al enviar la denuncia', e);
      setReportStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md h-[80vh] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            {onBack && (
              <button type="button" onClick={onBack} className="p-1.5 rounded-lg hover:bg-muted cursor-pointer shrink-0" title={t('ch.back')}>
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <div className="min-w-0">
              <p className="text-sm font-black text-foreground truncate">{otherPersonName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{subscriptionName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-muted cursor-pointer"
              title={t('ch.menu')}
              aria-label={t('ch.menu')}
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted cursor-pointer">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 min-w-[170px] bg-card border border-border rounded-xl shadow-xl py-1">
                  <button
                    type="button"
                    onClick={openReport}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted cursor-pointer"
                  >
                    <Flag className="w-4 h-4" /> {t('ch.report')}
                  </button>
                  {isBlocked ? (
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onUnblock(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted cursor-pointer"
                    >
                      <Ban className="w-4 h-4" /> {t('ch.unblock')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleBlockClick}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-muted cursor-pointer"
                    >
                      <Ban className="w-4 h-4" /> {t('ch.block')}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
          {visibleMessages.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center mt-8">
              {isBlocked ? t('ch.blockedNotice') : t('ch.empty')}
            </p>
          ) : (
            visibleMessages.map((msg) => {
              const isMine = msg.senderId === currentUid;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${
                      isMine
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-muted text-foreground rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {isBlocked ? (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">{t('ch.blockedNotice')}</p>
            <button
              type="button"
              onClick={onUnblock}
              className="shrink-0 px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted cursor-pointer"
            >
              {t('ch.unblock')}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-3 border-t border-border">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              placeholder={t('ch.placeholder')}
              className="flex-1 bg-muted/60 text-foreground px-4 py-2.5 rounded-2xl border border-border text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!text.trim()}
              className="p-2.5 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}

        {reportOpen && (
          <div className="absolute inset-0 z-30 bg-card flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <p className="text-sm font-black text-foreground">{t('ch.reportTitle')}</p>
              <button type="button" onClick={() => setReportOpen(false)} className="p-1.5 rounded-lg hover:bg-muted cursor-pointer">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {reportStatus === 'done' ? (
                <p className="text-sm text-foreground">{t('ch.reportThanks')}</p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">{t('ch.reportIntro')}</p>
                  <div className="space-y-1.5">
                    {REPORT_REASONS.map((r) => (
                      <label key={r} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                        <input type="radio" name="report-reason" checked={reason === r} onChange={() => setReason(r)} />
                        {t(`rp.${r}`)}
                      </label>
                    ))}
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={500}
                    rows={4}
                    placeholder={t('ch.reportComment')}
                    className="w-full bg-muted/60 text-foreground px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-blue-500"
                  />
                  {reportStatus === 'error' && (
                    <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{t('ch.reportError')}</p>
                  )}
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
              {reportStatus === 'done' ? (
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold cursor-pointer"
                >
                  {t('ch.reportClose')}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-muted cursor-pointer"
                  >
                    {t('ch.reportCancel')}
                  </button>
                  <button
                    type="button"
                    onClick={submitReport}
                    disabled={reportStatus === 'sending'}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-bold cursor-pointer"
                  >
                    {t('ch.reportSend')}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
