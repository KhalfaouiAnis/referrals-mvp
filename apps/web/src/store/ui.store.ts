import { create } from "zustand";
import { ReferralFilterParams } from "@referrals/shared";

interface UiState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  referralFilters: ReferralFilterParams;
  setReferralFilters: (filters: Partial<ReferralFilterParams>) => void;
  resetReferralFilters: () => void;

  advanceStatusModal: { open: boolean; referralId: string | null };
  openAdvanceStatusModal: (referralId: string) => void;
  closeAdvanceStatusModal: () => void;
}

const DEFAULT_FILTERS: ReferralFilterParams = {
  page: 1,
  limit: 25,
  sortBy: "createdAt",
  sortOrder: "DESC",
};

export const useUiStore = create<UiState>()((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  referralFilters: DEFAULT_FILTERS,
  setReferralFilters: (filters) =>
    set((s) => ({
      referralFilters: { ...s.referralFilters, ...filters, page: 1 },
    })),
  resetReferralFilters: () => set({ referralFilters: DEFAULT_FILTERS }),

  advanceStatusModal: { open: false, referralId: null },
  openAdvanceStatusModal: (referralId) =>
    set({ advanceStatusModal: { open: true, referralId } }),
  closeAdvanceStatusModal: () =>
    set({ advanceStatusModal: { open: false, referralId: null } }),
}));
