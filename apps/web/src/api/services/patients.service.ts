import { api } from "../client";
import { PaginatedResult } from "@referrals/shared";

export interface PatientSearchResult {
  id: string;
  mrn: string;
  fullName: string;
  dateOfBirth: string;
  insurancePlan: string | null;
  phone: string | null;
  email: string | null;
}

export const patientsService = {
  search: (
    query: string,
    limit = 10,
  ): Promise<PaginatedResult<PatientSearchResult>> =>
    api.get("/api/v1/patients", { search: query, limit }),

  getById: (id: string): Promise<PatientSearchResult> =>
    api.get(`/api/v1/patients/${id}`),
};
