import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { ReferralFilterParams } from "@referrals/shared";
import { referralsService, BulkActionDto } from "../services/referrals.service";

export const referralKeys = {
  all: ["referrals"] as const,
  lists: () => [...referralKeys.all, "list"] as const,
  list: (filters: ReferralFilterParams) =>
    [...referralKeys.lists(), filters] as const,
  details: () => [...referralKeys.all, "detail"] as const,
  detail: (id: string) => [...referralKeys.details(), id] as const,
};

export function useReferrals(filters: ReferralFilterParams) {
  return useQuery({
    queryKey: referralKeys.list(filters),
    queryFn: () => referralsService.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useBulkAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: BulkActionDto) => referralsService.bulkAction(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: referralKeys.lists() });
    },
  });
}

export function useExportReferrals() {
  return useMutation({
    mutationFn: (filters: ReferralFilterParams) =>
      referralsService.export(filters),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `referrals-export-${Date.now()}.csv`;
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });
}
