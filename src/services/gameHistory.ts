import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../Firebase/firebase';

export type GameResult = 'win' | 'loss';

export interface GameHistoryEntry {
  id?: string;
  playedAt: string;
  opponentEmail: string;
  opponentDisplayName: string;
  result: GameResult;
  myColor: 'white' | 'black';
  roomId?: string;
  /** How the game ended (optional for older saved rows). */
  endReason?: string;
}

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  return new Date();
}

export async function saveGameHistory(uid: string, entry: Omit<GameHistoryEntry, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'users', uid, 'gameHistory'), {
    opponentEmail: entry.opponentEmail,
    opponentDisplayName: entry.opponentDisplayName || '',
    result: entry.result,
    myColor: entry.myColor,
    roomId: entry.roomId ?? null,
    endReason: entry.endReason ?? null,
    playedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function fetchGameHistory(uid: string, max = 50): Promise<GameHistoryEntry[]> {
  const q = query(
    collection(db, 'users', uid, 'gameHistory'),
    orderBy('playedAt', 'desc'),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      opponentEmail: String(data.opponentEmail ?? ''),
      opponentDisplayName: String(data.opponentDisplayName ?? ''),
      result: data.result === 'loss' ? 'loss' : 'win',
      myColor: data.myColor === 'black' ? 'black' : 'white',
      roomId: data.roomId ?? undefined,
      endReason: data.endReason != null ? String(data.endReason) : undefined,
      playedAt: toDate(data.playedAt).toISOString(),
    };
  });
}
