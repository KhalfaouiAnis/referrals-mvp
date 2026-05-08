export interface PatientSummary {
  id: string;
  mrn: string;
  fullName: string;
  dateOfBirth: string;
  insurancePlan: string | null;
  insuranceMemberId: string | null;
}
