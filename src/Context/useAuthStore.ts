import { create } from 'zustand';

export interface HistoryEntry {
  timestamp: Date;
  gameId: string;
  chosenColor: string;
  opponentEmail: string;
  result: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  userHistory: HistoryEntry[];
}

interface AuthStore {
  isLoggedIn: boolean;
  user: AuthUser | null;
  setLoggedIn: (value: boolean) => void;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

// Read from localStorage once
const storedState = localStorage.getItem('auth-store');
const parsedState = storedState ? JSON.parse(storedState) : null;

const useAuthStore = create<AuthStore>(set => ({
  isLoggedIn: parsedState?.isLoggedIn || false,
  user: parsedState?.user || null,
  history: [], // we don't persist history
  setLoggedIn: value =>
    set(state => {
      const newState = { ...state, isLoggedIn: value };
      localStorage.setItem('auth-store', JSON.stringify({ isLoggedIn: value, user: state.user }));
      return newState;
    }),
  setUser: user => set({ user }),
  logout: () =>
    set(() => {
      const newState = { isLoggedIn: false, user: null };
      localStorage.setItem('auth-store', JSON.stringify(newState));
      return { ...newState, history: [] };
    }),
}));

export default useAuthStore;
