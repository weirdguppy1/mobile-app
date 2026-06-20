import { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

interface AuthState {
  session: Session | null;
  /** True once the initial session lookup has resolved — gates the UI to avoid flicker. */
  hydrated: boolean;
  setSession: (session: Session | null) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  hydrated: false,
  setSession: (session) => set({ session }),
  setHydrated: (hydrated) => set({ hydrated }),
}));
