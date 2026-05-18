import { GridRowId } from "@mui/x-data-grid";
import { api, apiClient } from "../client";
import {
  ReferralFilterParams,
  ReferralStatus,
  ReferralPriority,
} from "@referrals/shared";
import { PaginatedResult } from "@referrals/shared";

// Response shapes

export interface ReferralListItem {
  id: string;
  patientName: string;
  patientId: string;
  specialtyType: string;
  status: ReferralStatus;
  priority: ReferralPriority;
  specialistName: string | null;
  referringProviderName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralDetail extends ReferralListItem {
  clinicalReason: string;
  icd10Codes: string;
  requestedTimeframe: string | null;
  appointmentDate: string | null;
  appointmentLocation: string | null;
  submittedAt: string | null;
  closedAt: string | null;
  specialistReport: string | null;
  patient: {
    id: string;
    mrn: string;
    fullName: string;
    dateOfBirth: string;
    insurancePlan: string | null;
    insurancePlanId: string | null;
    insuranceMemberId: string | null;
    phone: string | null;
    email: string | null;
  };
  specialist: {
    fullName: string;
  };
  referringProvider: {
    fullName: string;
  };
  steps: Array<{
    id: string;
    stepNumber: number;
    stepCode: string;
    label: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETE" | "SKIPPED";
    completedAt: string | null;
    completedBy: { fullName: string } | null;
  }>;
  documents: Array<{
    id: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    label: string | null;
    uploadedBy: { fullName: string };
    createdAt: string;
  }>;
  notes: Array<{
    id: string;
    body: string;
    author: { fullName: string; role: string };
    createdAt: string;
  }>;
  authorizationRequests: Array<{
    id: string;
    status: string;
    authNumber: string | null;
    denialReason: string | null;
    modifications: string | null;
    validFrom: string | null;
    validTo: string | null;
    submittedAt: string | null;
    resolvedAt: string | null;
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    beforeState: Record<string, { status?: string }> | null;
    afterState: Record<string, { status?: string }> | null;
    reason: string | null;
    actor: { fullName: string; role: string };
    createdAt: string;
  }>;
}

export interface CreateReferralDto {
  patientId: string;
  specialtyType: string;
  clinicalReason: string;
  icd10Codes: string;
  priority: ReferralPriority;
  requestedTimeframe?: string;
  specialistId?: string;
}

export interface AdvanceStepDto {
  targetStatus: ReferralStatus;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface AddNoteDto {
  body: string;
}

export interface BulkActionDto {
  referralIds: (string | number)[];
  action: "SET_PRIORITY" | "REASSIGN_SPECIALIST";
  payload: Record<string, unknown>;
}

// Service

export const referralsService = {
  list: async (
    params: ReferralFilterParams,
  ): Promise<PaginatedResult<ReferralDetail>> =>
    api.get<PaginatedResult<ReferralDetail>>("/api/v1/referrals", params),

  getById: (id: string): Promise<ReferralDetail> =>
    api.get(`/api/v1/referrals/${id}`),

  create: (dto: CreateReferralDto): Promise<ReferralDetail> =>
    api.post("/api/v1/referrals", dto),

  advanceStatus: (id: string, dto: AdvanceStepDto): Promise<ReferralDetail> =>
    api.patch(`/api/v1/referrals/${id}/advance`, dto),

  updatePriority: (
    id: string,
    priority: ReferralPriority,
  ): Promise<ReferralDetail> =>
    api.patch(`/api/v1/referrals/${id}`, { priority }),

  reassignSpecialist: (
    id: string,
    specialistId: string,
  ): Promise<ReferralDetail> =>
    api.patch(`/api/v1/referrals/${id}`, { specialistId }),

  addNote: (id: string, dto: AddNoteDto): Promise<void> =>
    api.post(`/api/v1/referrals/${id}/notes`, dto),

  uploadDocument: (
    id: string,
    file: File,
    label?: string,
    onProgress?: (pct: number) => void,
  ): Promise<void> => {
    const form = new FormData();
    form.append("file", file);
    if (label) form.append("label", label);
    return api.upload(`/api/v1/referrals/${id}/documents`, form, onProgress);
  },

  deleteDocument: (referralId: string, documentId: string): Promise<void> =>
    api.delete(`/api/v1/referrals/${referralId}/documents/${documentId}`),

  bulkAction: (dto: BulkActionDto): Promise<{ updated: number }> =>
    api.post("/api/v1/referrals/bulk", dto),

  export: (params: ReferralFilterParams): Promise<Blob> =>
    apiClient
      .get<Blob>("/api/v1/referrals/export", {
        params,
        responseType: "blob",
      })
      .then((r) => r.data),
};
