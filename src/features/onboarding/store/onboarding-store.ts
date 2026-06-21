import { create } from 'zustand';

interface OnboardingState {
  index: number;
  setIndex: (index: number) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  index: 0,
  setIndex: (index) => set({ index }),
}));
