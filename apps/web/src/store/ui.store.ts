import { create } from "zustand";
import { ReferralFilterParams } from "@referrals/shared";
import { AlertColor } from "@mui/material";

interface UiState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  referralFilters: ReferralFilterParams;
  setReferralFilters: (filters: Partial<ReferralFilterParams>) => void;
  resetReferralFilters: () => void;

  toast: {
    open: boolean;
    message: string;
    severity: AlertColor;
  };
  showToast: (message: string, severity?: AlertColor) => void;
  closeToast: () => void;
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
      referralFilters: { ...s.referralFilters, ...filters },
    })),
  resetReferralFilters: () => set({ referralFilters: DEFAULT_FILTERS }),
  toast: { open: false, message: "", severity: "info" },
  showToast: (message, severity = "info") =>
    set({ toast: { open: true, message, severity } }),
  closeToast: () => set((s) => ({ toast: { ...s.toast, open: false } })),
}));

export default useUiStore