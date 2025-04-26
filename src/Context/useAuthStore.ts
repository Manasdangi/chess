import { create } from 'zustand';

export interface HistoryEntry {
  action: string;
  time: Date;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthStore {
  isLoggedIn: boolean;
  user: AuthUser | null;
  history: HistoryEntry[];

  setLoggedIn: (value: boolean) => void;
  setUser: (user: AuthUser | null) => void;
  addToHistory: (entry: HistoryEntry) => void;
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
      // only update login status and user when login changes
      localStorage.setItem('auth-store', JSON.stringify({ isLoggedIn: value, user: state.user }));
      return newState;
    }),

  setUser: user => set({ user }), // No need to save on every user update

  addToHistory: entry => set(state => ({ history: [...state.history, entry] })), // No localStorage update here

  logout: () =>
    set(() => {
      const newState = { isLoggedIn: false, user: null };
      localStorage.setItem('auth-store', JSON.stringify(newState));
      return { ...newState, history: [] };
    }),
}));

export default useAuthStore;
