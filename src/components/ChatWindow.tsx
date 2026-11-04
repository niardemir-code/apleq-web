import { useEffect, useRef, useState } from 'react';
import { X, Send, ArrowLeft } from 'lucide-react';
import { ChatMessage } from '../services/subscriptionService';
import { t } from '../i18n';

interface ChatWindowProps {
  subscriptionName: string;
  otherPersonName: string;
  currentUid: string;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onClose: () => void;
  onBack?: () => void;
}

export function ChatWindow({ subscriptionName, otherPersonName, currentUid, messages, onSend, onClose, onBack }: ChatWindowProps) {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md h-[80vh] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden"
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
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted cursor-pointer shrink-0">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
          {messages.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center mt-8">
              {t('ch.empty')}
            </p>
          ) : (
            messages.map((msg) => {
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
      </div>
    </div>
  );
}
