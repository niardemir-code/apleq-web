import { Mail, ChevronRight, MessageCircle } from 'lucide-react';
import { Member } from '../types';
import { t, displayMemberName } from '../i18n';

interface ChatListModalProps {
  subscriptionName: string;
  members: Member[];
  currentUid: string;
  groupId: string;
  unreadChatIdsForOwner: Set<string>;
  onMemberClick: (chatId: string, clientUid: string, clientName: string) => void;
  onClose: () => void;
}

export function ChatListModal({
  subscriptionName,
  members,
  currentUid,
  groupId,
  unreadChatIdsForOwner,
  onMemberClick,
  onClose,
}: ChatListModalProps) {
  const linkedMembers = members.filter((m) => !!m.linkedUid);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-card border border-border rounded-3xl p-5 shadow-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-blue-500 shrink-0" />
          <h2 className="text-sm font-black text-foreground truncate">{t('ch.listTitle', { name: subscriptionName })}</h2>
        </div>

        {linkedMembers.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            {t('ch.noLinked')}
          </p>
        ) : (
          <div className="space-y-2 overflow-y-auto">
            {linkedMembers.map((member) => {
              const clientUid = member.linkedUid as string;
              const chatId = `${currentUid}_${groupId}_${clientUid}`;
              const hasUnread = unreadChatIdsForOwner.has(chatId);
              const displayName = displayMemberName(member.memberName) || t('ch.client');
              const initial = displayName.trim().charAt(0).toUpperCase() || '?';

              return (
                <button
                  key={String(member.id)}
                  type="button"
                  onClick={() => onMemberClick(chatId, clientUid, displayName)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-colors cursor-pointer ${
                    hasUnread
                      ? 'bg-blue-500/10 border border-blue-500/40'
                      : 'bg-muted/40 border border-border hover:bg-muted/70'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
                      hasUnread ? 'bg-blue-600' : 'bg-blue-500/50'
                    }`}
                  >
                    {initial}
                  </div>
                  <span className={`flex-1 text-sm truncate ${hasUnread ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}>
                    {displayName}
                  </span>
                  {hasUnread && (
                    <div className="relative shrink-0">
                      <Mail className="w-4.5 h-4.5 text-blue-500" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-600" />
                    </div>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-2.5 rounded-2xl bg-muted/60 hover:bg-muted border border-border text-sm font-bold text-foreground transition-colors cursor-pointer"
        >
          {t('ch.close')}
        </button>
      </div>
    </div>
  );
}
