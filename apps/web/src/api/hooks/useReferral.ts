import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ReferralPriority, ReferralStatus } from "@referrals/shared";
import { referralsService, AddNoteDto } from "../services/referrals.service";
import { referralKeys } from "./useReferrals";

export function useReferral(id: string) {
  return useQuery({
    queryKey: referralKeys.detail(id),
    queryFn: () => referralsService.getById(id),
    enabled: Boolean(id),
  });
}

function useInvalidateReferral(id: string) {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: referralKeys.detail(id) });
    void qc.invalidateQueries({ queryKey: referralKeys.lists() });
  };
}

export function useAdvanceStatus(referralId: string) {
  const invalidate = useInvalidateReferral(referralId);
  return useMutation({
    mutationFn: (opts: { targetStatus: ReferralStatus; reason?: string }) =>
      referralsService.advanceStatus(referralId, opts),
    onSuccess: invalidate,
  });
}

export function useUpdatePriority(referralId: string) {
  const invalidate = useInvalidateReferral(referralId);
  return useMutation({
    mutationFn: (priority: ReferralPriority) =>
      referralsService.updatePriority(referralId, priority),
    onSuccess: invalidate,
  });
}

export function useReassignSpecialist(referralId: string) {
  const invalidate = useInvalidateReferral(referralId);
  return useMutation({
    mutationFn: (specialistId: string) =>
      referralsService.reassignSpecialist(referralId, specialistId),
    onSuccess: invalidate,
  });
}

export function useAddNote(referralId: string) {
  const invalidate = useInvalidateReferral(referralId);
  return useMutation({
    mutationFn: (dto: AddNoteDto) => referralsService.addNote(referralId, dto),
    onSuccess: invalidate,
  });
}

export function useUploadDocument(referralId: string) {
  const invalidate = useInvalidateReferral(referralId);
  return useMutation({
    mutationFn: ({
      file,
      label,
      onProgress,
    }: {
      file: File;
      label?: string;
      onProgress?: (pct: number) => void;
    }) => referralsService.uploadDocument(referralId, file, label, onProgress),
    onSuccess: invalidate,
  });
}

export function useDeleteDocument(referralId: string) {
  const invalidate = useInvalidateReferral(referralId);
  return useMutation({
    mutationFn: (documentId: string) =>
      referralsService.deleteDocument(referralId, documentId),
    onSuccess: invalidate,
  });
}
