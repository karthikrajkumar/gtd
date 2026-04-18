import { create } from 'zustand';
import type { SessionInfo } from '../types/session.js';

interface SessionStore {
  session: SessionInfo | null;
  isCreating: boolean;
  error: string | null;

  setSession: (session: SessionInfo) => void;
  setCreating: (creating: boolean) => void;
  setError: (error: string | null) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  session: null,
  isCreating: false,
  error: null,

  setSession: (session) => set({ session, isCreating: false, error: null }),
  setCreating: (isCreating) => set({ isCreating }),
  setError: (error) => set({ error, isCreating: false }),
  clearSession: () => set({ session: null }),
}));
