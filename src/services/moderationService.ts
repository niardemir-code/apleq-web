import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ChatMessage } from './subscriptionService';

export type ReportReason = 'spam' | 'harassment' | 'illegal' | 'impersonation' | 'other';

export const REPORT_REASONS: ReportReason[] = ['spam', 'harassment', 'illegal', 'impersonation', 'other'];

/** Escucha en tiempo real a quién tengo bloqueado. */
export function subscribeToBlockedUids(myUid: string, callback: (uids: Set<string>) => void): () => void {
  return onSnapshot(
    collection(db, 'users', myUid, 'blocks'),
    (snap) => callback(new Set(snap.docs.map((d) => d.id))),
    (err) => console.error('Error escuchando bloqueos', err)
  );
}

export async function blockUser(myUid: string, otherUid: string): Promise<void> {
  await setDoc(doc(db, 'users', myUid, 'blocks', otherUid), {
    blockedUid: otherUid,
    createdAtMs: Date.now(),
  });
}

export async function unblockUser(myUid: string, otherUid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', myUid, 'blocks', otherUid));
}

export interface ReportInput {
  reporterUid: string;
  reportedUid: string;
  chatId: string;
  groupId: string;
  subscriptionName: string;
  reason: ReportReason;
  comment: string;
  messages: ChatMessage[];
}

/** Guarda una denuncia con el contexto (los últimos 10 mensajes de la conversación). */
export async function reportUser(input: ReportInput): Promise<void> {
  await addDoc(collection(db, 'reports'), {
    reporterUid: input.reporterUid,
    reportedUid: input.reportedUid,
    chatId: input.chatId,
    groupId: input.groupId,
    subscriptionName: input.subscriptionName,
    reason: input.reason,
    comment: input.comment.slice(0, 500),
    lastMessages: input.messages.slice(-10).map((m) => ({
      senderId: m.senderId,
      text: m.text.slice(0, 500),
      createdAtMs: m.createdAtMs,
    })),
    createdAtMs: Date.now(),
    createdAt: serverTimestamp(),
    status: 'open',
    platform: 'web',
  });
}
