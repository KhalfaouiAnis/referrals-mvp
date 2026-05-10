import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { patientsService } from "../services/patients.service";
import { referralKeys } from "./useReferrals";
import {
  referralsService,
  CreateReferralDto,
} from "../services/referrals.service";

export function usePatientSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: ["patients", "search", query],
    queryFn: () => patientsService.search(query),
    enabled: enabled && query.length >= 2,
    staleTime: 60_000,
  });
}

export function useCreateReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateReferralDto) => referralsService.create(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: referralKeys.lists() });
    },
  });
}
