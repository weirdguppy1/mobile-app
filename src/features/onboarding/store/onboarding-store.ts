import { create } from 'zustand';

interface OnboardingState {
  index: number;
  setIndex: (index: number) => void;
  /** True while the completion celebration plays (suppresses the auto-redirect). */
  celebrating: boolean;
  setCelebrating: (celebrating: boolean) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  index: 0,
  setIndex: (index) => set({ index }),
  celebrating: false,
  setCelebrating: (celebrating) => set({ celebrating }),
}));
