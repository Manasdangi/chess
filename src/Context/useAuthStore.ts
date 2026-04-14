import { create } from 'zustand';
import type { GameHistoryEntry } from '../services/gameHistory';

export type { GameHistoryEntry };

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  userHistory: GameHistoryEntry[];
}

interface AuthStore {
  isLoggedIn: boolean;
  user: AuthUser | null;
  setLoggedIn: (value: boolean) => void;
  setUser: (user: AuthUser | null) => void;
  setGameHistory: (history: GameHistoryEntry[]) => void;
  addGameHistoryEntry: (entry: GameHistoryEntry) => void;
  logout: () => void;
}

function serializeUser(user: AuthUser) {
  return {
    ...user,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
  };
}

function persistAuthStore(isLoggedIn: boolean, user: AuthUser | null) {
  const payload = {
    isLoggedIn,
    user: user ? serializeUser(user) : null,
  };
  localStorage.setItem('auth-store', JSON.stringify(payload));
}

function hydrateUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== 'object') return null;
  const u = raw as Record<string, unknown>;
  if (typeof u.uid !== 'string') return null;
  const rawHistory = Array.isArray(u.userHistory) ? u.userHistory : [];
  const userHistory: GameHistoryEntry[] = rawHistory.map((e: Record<string, unknown>) => ({
    id: typeof e.id === 'string' ? e.id : undefined,
    playedAt:
      typeof e.playedAt === 'string'
        ? e.playedAt
        : new Date(String(e.playedAt ?? Date.now())).toISOString(),
    opponentEmail: String(e.opponentEmail ?? ''),
    opponentDisplayName: String(e.opponentDisplayName ?? ''),
    result: e.result === 'loss' ? 'loss' : 'win',
    myColor: e.myColor === 'black' ? 'black' : 'white',
    roomId: typeof e.roomId === 'string' ? e.roomId : undefined,
    endReason: typeof e.endReason === 'string' ? e.endReason : undefined,
  }));
  return {
    uid: u.uid,
    email: (u.email as string) ?? null,
    displayName: (u.displayName as string) ?? null,
    photoURL: (u.photoURL as string) ?? null,
    createdAt: new Date(u.createdAt as string),
    userHistory,
  };
}

const storedState = localStorage.getItem('auth-store');
const parsedState = storedState ? JSON.parse(storedState) : null;

const useAuthStore = create<AuthStore>(set => ({
  isLoggedIn: parsedState?.isLoggedIn || false,
  user: parsedState?.user ? hydrateUser(parsedState.user) : null,
  setLoggedIn: value =>
    set(state => {
      const newState = { ...state, isLoggedIn: value };
      persistAuthStore(value, state.user);
      return newState;
    }),
  setUser: user =>
    set(state => {
      persistAuthStore(state.isLoggedIn, user);
      return { user };
    }),
  setGameHistory: history =>
    set(state => {
      if (!state.user) return state;
      const nextUser = { ...state.user, userHistory: history };
      persistAuthStore(state.isLoggedIn, nextUser);
      return { user: nextUser };
    }),
  addGameHistoryEntry: entry =>
    set(state => {
      if (!state.user) return state;
      const nextUser = { ...state.user, userHistory: [entry, ...state.user.userHistory] };
      persistAuthStore(state.isLoggedIn, nextUser);
      return { user: nextUser };
    }),
  logout: () =>
    set(() => {
      const newState = { isLoggedIn: false, user: null };
      persistAuthStore(false, null);
      return newState;
    }),
}));

export default useAuthStore;
