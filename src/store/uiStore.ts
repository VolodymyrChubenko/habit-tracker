import { create } from 'zustand';

// Ephemeral UI state — not persisted. Lets the global BottomNav and any page
// open the same "add challenge" sheet without prop-drilling through <Outlet />.
interface UIState {
  addSheetOpen: boolean;
  openAddSheet: () => void;
  closeAddSheet: () => void;
}

export const useUIStore = create<UIState>(set => ({
  addSheetOpen: false,
  openAddSheet: () => set({ addSheetOpen: true }),
  closeAddSheet: () => set({ addSheetOpen: false }),
}));
