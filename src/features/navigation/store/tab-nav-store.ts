import { create } from 'zustand';

import { type TabDirection } from '@/features/navigation/lib/tab-direction';

interface TabNavState {
  /** Direction of the last tab switch, read by TabTransition on focus. */
  direction: TabDirection;
  setDirection: (direction: TabDirection) => void;
}

export const useTabNavStore = create<TabNavState>((set) => ({
  direction: 'forward',
  setDirection: (direction) => set({ direction }),
}));
